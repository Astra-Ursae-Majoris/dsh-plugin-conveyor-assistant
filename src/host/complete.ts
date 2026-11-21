/**
 * 单次 LLM 补全 —— 本插件唯一的出网点，也是隐私承诺的兑现处。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §7）：
 *   约束 1「模型 I/O 只经 ctx.llm」：不建自己的 fetch、不读凭据、不碰环境变量；
 *     鉴权由适配器内部的 credential 解析完成。
 *   约束 2「不写会话事件、不传 sessionId」：GenerateOptions 里没有 sessionId，
 *     本文件也从不调用 session.append / appendPluginRecord。
 *   约束 3「零额外网络出口」：除这一次 prepared.stream 外没有任何请求。
 *   约束 7「能力与预算显式化」：maxTokens = MAX_OUTPUT_TOKENS（显式收窄，避免适配器
 *     物化 256000 的默认值）、reasoningEffort 取模型支持的最低档（DeepSeek 即 off）、
 *     总预算 TIMEOUT_MS 用本地 AbortController 兜住，客户端断开也会立刻取消。
 *   约束 4「草稿零日志」：本文件不写任何 logger/console，也不把上游 error.message
 *     放进返回值；所有失败只回稳定状态码。
 */
import type { Context } from '@deepseek-ai/cordis'
import type {
  FinishReason,
  GenerateOptions,
  LlmCallControls,
  LlmResolvedModelInfo,
  PreparedLlmCall,
  RequestUserInput,
} from '@deepseek-ai/dsh-llm'
import { MAX_OUTPUT_TOKENS, TIMEOUT_MS } from '../shared/constants.js'
import { buildSystemPrompt, buildUserMessage } from '../shared/prompts.js'
import type { ConveyRequestBody } from './validate.js'
import type { ResolvedRoute } from './model.js'

/** 一次补全的终局：成功给文本，失败给稳定状态（由 route.ts 映射为协议失败码）。 */
export type CallOutcome =
  | { status: 'ok'; text: string }
  | { status: 'timeout' }
  | { status: 'aborted' }
  | { status: 'upstream' }
  | { status: 'bad-output' }
  | { status: 'no-model' }

/** 一次性调用的总预算，期间同时把客户端断开与超时融进同一个 signal。 */
interface Deadline {
  readonly signal: AbortSignal
  /** 是否由本插件自己的计时器触发（用来区分 timeout 与客户端取消）。 */
  readonly expired: () => boolean
  /** 清掉计时器与监听；用 finally 保证只清一次。 */
  readonly dispose: () => void
}

/** 建立「客户端 signal ∪ 本地超时」的融合 signal。 */
function startDeadline(clientSignal: AbortSignal, timeoutMs: number): Deadline {
  const controller = new AbortController()
  let expired = false
  const forward = (): void => {
    controller.abort(clientSignal.reason)
  }
  if (clientSignal.aborted) forward()
  else clientSignal.addEventListener('abort', forward, { once: true })
  const timer = setTimeout(() => {
    expired = true
    controller.abort(new Error('convey-assistant: model call budget exhausted'))
  }, timeoutMs)
  return {
    signal: controller.signal,
    expired: () => expired,
    dispose: () => {
      clearTimeout(timer)
      clientSignal.removeEventListener('abort', forward)
    },
  }
}

/** 选模型支持的最低推理档：优先明确的 off，否则最弱的一档（efforts 按由弱到强排列）。 */
function lowestEffort(info: Readonly<LlmResolvedModelInfo>): LlmCallControls['reasoningEffort'] | undefined {
  const efforts = info.reasoning?.efforts ?? []
  const off = efforts.find(effort => String(effort.id) === 'off')
  return (off ?? efforts[0])?.id
}

/** 把一次异常归类成稳定状态；不读取、不转述 error.message。 */
function classify(error: unknown, deadline: Deadline, clientSignal: AbortSignal): CallOutcome {
  if (deadline.expired()) return { status: 'timeout' }
  if (clientSignal.aborted) return { status: 'aborted' }
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined
  if (code === 'NO_ADAPTER') return { status: 'no-model' }
  return { status: 'upstream' }
}

/** 非 stop 的 finish 原因映射成失败状态；stop 返回 undefined，让调用方继续取文本。 */
function failureOfFinish(
  reason: FinishReason,
  deadline: Deadline,
  clientSignal: AbortSignal,
): Exclude<CallOutcome, { status: 'ok' }> | undefined {
  switch (reason.kind) {
    case 'stop':
      return undefined
    case 'max-tokens':
      return { status: 'bad-output' }
    case 'tool-calls':
      return { status: 'bad-output' }
    case 'aborted':
      if (deadline.expired()) return { status: 'timeout' }
      if (clientSignal.aborted) return { status: 'aborted' }
      return { status: 'upstream' }
    case 'error':
      return { status: 'upstream' }
  }
}

/**
 * 发起这一次无工具、无历史、无 sessionId 的补全。
 * @param ctx 宿主上下文（ctx.llm 已由 inject 保证）
 * @param route 解析好的 provider/model
 * @param request 已校验的请求（draft/mode/context/supplement）
 * @param clientSignal Connection 桥接传入的请求 signal：浏览器断开即 abort
 */
export async function callModel(
  ctx: Context,
  route: ResolvedRoute,
  request: ConveyRequestBody,
  clientSignal: AbortSignal,
): Promise<CallOutcome> {
  if (clientSignal.aborted) return { status: 'aborted' }
  const deadline = startDeadline(clientSignal, TIMEOUT_MS)
  try {
    let prepared: PreparedLlmCall
    try {
      // 「无工具」= 不传 tools；maxTokens 显式收窄；推理档在 configure 里按能力选。
      prepared = await ctx.llm.prepareCall(
        { provider: route.provider, model: route.model, maxTokens: MAX_OUTPUT_TOKENS },
        deadline.signal,
        (controls, model) => {
          const effort = lowestEffort(model)
          return effort === undefined ? { ...controls } : { ...controls, reasoningEffort: effort }
        },
      )
    } catch (error) {
      return classify(error, deadline, clientSignal)
    }

    const messages: RequestUserInput[] = [
      { role: 'user', content: [{ type: 'text', text: buildUserMessage(request) }] },
    ]
    // 手搓的一次性请求：不带 sessionId（约束 2），不带 tools（「无工具」）。
    const options: GenerateOptions = {
      ...prepared.config,
      system: buildSystemPrompt(request.mode),
      messages,
      signal: deadline.signal,
    }

    const parts: string[] = []
    let finish: FinishReason | undefined
    try {
      for await (const chunk of prepared.stream(options)) {
        switch (chunk.type) {
          case 'text-delta':
            parts.push(chunk.text)
            break
          case 'finish':
            finish = chunk.reason
            break
          case 'usage':
            break
          case 'block-start':
            // 只要文本块；模型若吐出工具/思考块，说明这次输出不可信。
            if (chunk.blockType !== 'text') return { status: 'bad-output' }
            break
          case 'block-end':
            if (chunk.block.type !== 'text') return { status: 'bad-output' }
            break
          case 'reasoning-delta':
          case 'tool-call-delta':
            return { status: 'bad-output' }
        }
      }
    } catch (error) {
      return classify(error, deadline, clientSignal)
    }

    if (deadline.expired()) return { status: 'timeout' }
    if (clientSignal.aborted) return { status: 'aborted' }
    if (finish === undefined) return { status: 'upstream' }

    const failure = failureOfFinish(finish, deadline, clientSignal)
    if (failure !== undefined) return failure

    const text = parts.join('')
    if (text.trim() === '') return { status: 'bad-output' }
    return { status: 'ok', text }
  } finally {
    deadline.dispose()
  }
}
