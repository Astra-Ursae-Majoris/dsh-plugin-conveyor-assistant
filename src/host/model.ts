/**
 * 模型解析 —— 永远用「用户自己选的模型」，不硬编码、不静默换 provider。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §7 与 §Q2）：
 *   约束 6「模型解析三级链 + 显式覆盖，失败即报错」：
 *     显式配置 → ctx.agents.get(id)?.model.current() → session.requestHeader()?.config
 *     → ctx.agentDefaultModel.currentSelection() → 返回 undefined（route.ts 回 no-model）。
 *     绝不在解析失败时"挑第一个 provider"——那会把草稿发给用户没选的端点。
 *   约束 1「模型 I/O 只经 ctx.llm」：本文件只读服务，不发任何网络请求、不碰凭据。
 *
 * 依赖都是 optional（sessions / agents / agentDefaultModel 在部分组合里可能缺席），
 * 所以统一走 ctx.get(name) 的结构化读取，每一步都允许缺席并继续往下一级退。
 */
import type { Context } from '@deepseek-ai/cordis'

/** 一次调用使用的精确路由。故意不展开 reasoningEffort：本插件固定选最低推理档（见 complete.ts）。 */
export interface ResolvedRoute {
  provider: string
  model: string
}

/** 插件显式配置（优先级最高，用于"锁定某个端点"的自定义部署）。 */
export interface RouteOverride {
  provider?: string
  model?: string
}

/* ── 只读结构 ─────────────────────────────────────────────────────────────
 * 这些服务来自宿主其它包（dsh-agent / dsh-session / dsh-agent-default-model）。
 * 本插件不把它们写进源码依赖：只按"真相的形状"读取 provider/model 两个字段，
 * 宿主升级时只要这两个字段还在，读取路径就不会碎。
 */
interface SelectionLike {
  readonly provider?: unknown
  readonly model?: unknown
}

interface AgentModelLike {
  current?(): SelectionLike | undefined
}

interface AgentLike {
  readonly model?: AgentModelLike
}

interface AgentsLike {
  get?(id: string): AgentLike | undefined
}

interface HeaderLike {
  readonly config?: SelectionLike
}

interface SessionLike {
  requestHeader?(): HeaderLike | undefined
}

interface SessionsLike {
  get?(id: string): SessionLike | undefined
}

interface DefaultModelLike {
  currentSelection?(): SelectionLike | undefined
}

/** 判断一个值是否是「非空 provider + 非空 model」。 */
function asRoute(value: unknown): ResolvedRoute | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as { provider?: unknown; model?: unknown }
  const provider = typeof candidate.provider === 'string' ? candidate.provider.trim() : ''
  const model = typeof candidate.model === 'string' ? candidate.model.trim() : ''
  if (provider === '' || model === '') return undefined
  return { provider, model }
}

/** 安全地读一次服务并执行读取（任何异常都视为"这一级没有答案"）。 */
function attempt(read: () => unknown): ResolvedRoute | undefined {
  try {
    return asRoute(read())
  } catch {
    return undefined
  }
}

/**
 * 按优先级解析本次改写使用的模型路由。
 * @param ctx 宿主上下文（需要 llm 已注入；其它服务按需读取）
 * @param sessionId 客户端带来的会话标识（可选；没有它就退到全局默认）
 * @param override 插件显式配置（provider+model 同时存在时优先级最高）
 * @returns 精确路由，或 undefined（由调用方映射为 no-model）
 */
export function resolveRoute(
  ctx: Context,
  sessionId: string | undefined,
  override: RouteOverride,
): ResolvedRoute | undefined {
  // 1) 显式配置：两个字段都齐全才算数（normalizeConfig 已在加载期保证这一点）。
  if (override.provider !== undefined && override.model !== undefined) {
    return { provider: override.provider, model: override.model }
  }

  if (sessionId !== undefined) {
    // 2) 该会话当前生效的选择：pending > lastUsed > Agent 创建时的 options。
    const agents = ctx.get('agents') as AgentsLike | undefined
    const fromAgent = attempt(() => agents?.get?.(sessionId)?.model?.current?.())
    if (fromAgent !== undefined) return fromAgent

    // 3) 会话最后一次真实请求使用过的路由（历史会话/已恢复会话没有 live agent 时）。
    const sessions = ctx.get('sessions') as SessionsLike | undefined
    const fromHeader = attempt(() => sessions?.get?.(sessionId)?.requestHeader?.()?.config)
    if (fromHeader !== undefined) return fromHeader
  }

  // 4) 全局默认：profile 里 agent-default-model 的当前值（也是 Models 页保存的选择）。
  const defaults = ctx.get('agentDefaultModel') as DefaultModelLike | undefined
  const fromDefault = attempt(() => defaults?.currentSelection?.())
  if (fromDefault !== undefined) return fromDefault

  // 5) 明确失败。绝不"挑第一个 provider"——见文件头约束 6。
  return undefined
}
