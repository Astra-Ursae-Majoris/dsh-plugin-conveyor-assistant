/**
 * 受认证路由 —— 浏览器只会碰这唯一一个地址：POST /api/dsh-convey-assistant/rewrite。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §3.2 / §7 与 C 报告结论 10）：
 *   约束“必须自查鉴权”：ctx.webServer.register 不做任何认证；这里用
 *     ctx.connection.fetch.register 注册（只有 owner Peer 能到达，见 requestRejection 双保险）。
 *   约束 2「不写会话事件」：整个处理链路没有任何 session.append / appendPluginRecord。
 *   约束 3「零额外网络出口」：只做一次 ctx.llm 调用（complete.ts）与一次 JSON 回写。
 *   约束 4「草稿零日志」：本文件不写 logger；失败只回稳定 code。任何异常都被兜底成
 *     upstream，不把 error.message 交给浏览器。
 *   约束 7「预算显式化」：body ≤ 64 KB、draft ≤ MAX_DRAFT_CHARS（不截断）、
 *     单次补全 ≤ TIMEOUT_MS 且随客户端断开取消（request.signal）。
 *
 * HTTP 状态约定（给客户端半边）：
 *   - 业务结果一律 200：{ ok:true, ... } 或 { ok:false, code, message }；
 *     含 no-model / timeout / aborted / upstream / bad-output / too-long / bad-request。
 *   - 只有请求本身不可用才返回 4xx（415 content-type、413 body 过大、400 非 JSON、
 *     405 非 POST、401/403 认证双保险拒绝），body 仍是同构 JSON。
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import { MODELS_PATH, ROUTE_PATH } from '../shared/constants.js'
import type { ConveyModelsResult, ConveyResult } from '../shared/protocol.js'
import { sendFailure, sendJson } from './errors.js'
import { readJsonBody, validateBody } from './validate.js'
import { resolveRoute } from './model.js'
import { callModel } from './complete.js'
import { parseModelOutput } from './output.js'
import { listModelOptions } from './models.js'

/** 插件配置（cordis.patch.yml 的 config 段；也可以被用户 patch 覆盖）。 */
export interface ConveyPluginConfig {
  /** 可选：强制指定 provider（必须与 model 同时提供）。 */
  provider?: unknown
  /** 可选：强制指定 model（必须与 provider 同时提供）。 */
  model?: unknown
}

/** 规范化后的配置：要么两个字段都为空（自动解析），要么两个都有值。 */
export interface NormalizedConfig {
  provider?: string
  model?: string
}

/** 读一个"非空字符串"配置值；其它任何形态都按未设置处理。 */
function configText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * 规范化插件配置。
 * @throws 只给了一个字段时抛错——半截配置如果被静默忽略，用户会以为模型被锁定了。
 */
export function normalizeConfig(config?: ConveyPluginConfig): NormalizedConfig {
  const provider = configText(config?.provider)
  const model = configText(config?.model)
  if (provider === undefined && model === undefined) return {}
  if (provider === undefined || model === undefined) {
    throw new Error('convey-assistant: config.provider and config.model must both be non-empty strings when either is set')
  }
  return { provider, model }
}

/**
 * 注册受认证的精确 Fetch 路由（插件卸载时由 ctx.effect 自动摘除）。
 * @param ctx 宿主上下文（inject 已保证 connection 存在）
 * @param config 规范化后的插件配置
 */
export function registerRoute(ctx: Context, config: NormalizedConfig): void {
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: request => handleRequest(ctx, config, request),
      }),
    'convey-assistant: rewrite route',
  )

  // 只读的模型目录路由：给卡片里的下拉用。走同一个受认证 Fetch 注册表，
  // 因此同样只有 owner 页面能到达；它不读会话、不出网。
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: MODELS_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: request => handleModelsRequest(ctx, request),
      }),
    'convey-assistant: models route',
  )
}

/**
 * 模型目录请求：只认 POST（不用 GET 是为了复用同一套 body 读取与鉴权路径）。
 * @param ctx 宿主上下文
 * @param request Connection 桥接好的 Fetch 请求
 */
async function handleModelsRequest(ctx: Context, request: Request): Promise<Response> {
  let rejection: number | undefined
  try {
    rejection = ctx.connection.requestRejection(request)
  } catch {
    rejection = 403
  }
  if (rejection !== undefined) return sendFailure('bad-request', 'en', rejection)
  if (request.method !== 'POST') return sendFailure('bad-request', 'en', 405)

  const options = await listModelOptions(ctx)
  const payload: ConveyModelsResult = { ok: true, options, current: null }
  return sendJson(payload)
}

/**
 * 一次改写的完整处理流程（顺序即安全顺序：先认证、再校验、再出网）。
 * @param ctx 宿主上下文
 * @param config 规范化后的插件配置
 * @param request Connection 桥接好的 Fetch 请求（body 已按 buffered 读入内存）
 */
async function handleRequest(ctx: Context, config: NormalizedConfig, request: Request): Promise<Response> {
  // 1) 双保险鉴权 + Host/Origin fence。Connection 的 /api 前缀路由已经做过一次；
  //    这里复用同一个判定函数，即使将来注册方式变化也不会裸奔。
  let rejection: number | undefined
  try {
    rejection = ctx.connection.requestRejection(request)
  } catch {
    rejection = 403
  }
  if (rejection !== undefined) return sendFailure('bad-request', 'en', rejection)

  // 2) 只接受 POST（路由声明已限制；仍然显式拦一次，给客户端清晰的状态码）。
  if (request.method !== 'POST') return sendFailure('bad-request', 'en', 405)

  // 3) 读体：content-type、声明长度、流式硬计数（≤ MAX_BODY_BYTES）。
  const body = await readJsonBody(request)
  if (!body.ok) return sendFailure('bad-request', 'en', body.status)

  // 4) 结构校验：draft/mode/locale/context/supplement/sessionId。
  const parsed = validateBody(body.value)
  if (!parsed.ok) return sendFailure(parsed.code, parsed.locale)
  const current = parsed.body

  // 5) 解析"用户自己选的模型"：本次下拉选择 > 会话当前模型 > 全局默认。
  //    解析不到就明确失败，绝不挑第一个 provider。
  const picked = current.provider !== undefined && current.model !== undefined
    ? { provider: current.provider, model: current.model }
    : undefined
  const route = resolveRoute(ctx, current.sessionId, config, picked)
  if (route === undefined) return sendFailure('no-model', current.locale)

  // 6) 唯一一次外发：无工具、无历史、无 sessionId、显式预算。
  const outcome = await callModel(ctx, route, current, request.signal)
  if (outcome.status !== 'ok') return sendFailure(outcome.status, current.locale)

  // 7) 硬校验模型输出（JSON 结构 + 追问 + ⟦Rn⟧ 数量与顺序）。
  const output = parseModelOutput(outcome.text, current.draft)
  if (!output.ok) return sendFailure('bad-output', current.locale)

  const result: ConveyResult = {
    ok: true,
    mode: current.mode,
    text: output.text,
    questions: output.questions,
    model: route.provider + '/' + route.model,
  }
  return sendJson(result)
}
