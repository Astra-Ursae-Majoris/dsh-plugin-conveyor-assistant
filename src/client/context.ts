/**
 * 「最近一条用户消息」的极简摘要（可选 context）。
 *
 * 依据（已核对 0.2.2-rc.5 类型）：
 * - `ctx.sessions.binding(sessionId).eventSource` 是 `ObservableSnapshot<SessionEventWindow>`，
 *   `getSnapshot().entries` 里每项形如 `{ type: 'event', event: SessionEvent }`；
 * - `SessionEvent<'user/message'>.data` 是 `UserMessage`，`content` 是 `ContentBlock[]`，其中 `type:'text'` 的块有 `text`；
 * - `UserMessage.source.kind` 为 `'user'` 表示真人提示词（其它 kind 是系统/注入内容，不取）。
 * 拿不到（老版本、形状变了、历史没开、事件为空）就返回 undefined —— 不伪造，不猜。
 */

import type { SessionsFace } from './types'

/** context 的最大长度（与提示词里"只用它消解代词"的定位匹配） */
const MAX_CONTEXT_CHARS = 500

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** 从一个 user/message 事件的 data 里抽出纯文本；形状不符返回 undefined */
function userMessageText(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const record = data as Record<string, unknown>
  const source = record['source']
  if (typeof source !== 'object' || source === null) return undefined
  if ((source as Record<string, unknown>)['kind'] !== 'user') return undefined
  const content = record['content']
  if (!Array.isArray(content)) return undefined
  const pieces: string[] = []
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    const candidate = block as Record<string, unknown>
    if (candidate['type'] !== 'text') continue
    if (typeof candidate['text'] === 'string' && candidate['text'].trim() !== '') pieces.push(candidate['text'])
  }
  if (pieces.length === 0) return undefined
  const joined = collapse(pieces.join(' '))
  if (joined === '') return undefined
  return joined.length > MAX_CONTEXT_CHARS ? joined.slice(0, MAX_CONTEXT_CHARS) + '…' : joined
}

/** 从事件窗口读出最近一条真人提示词 */
function latestFromEntries(entries: readonly unknown[]): string | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]
    if (typeof entry !== 'object' || entry === null) continue
    const record = entry as Record<string, unknown>
    if (record['type'] !== 'event') continue
    const event = record['event']
    if (typeof event !== 'object' || event === null) continue
    const eventRecord = event as Record<string, unknown>
    if (eventRecord['type'] !== 'user/message') continue
    const text = userMessageText(eventRecord['data'])
    if (text !== undefined) return text
  }
  return undefined
}

/**
 * 读取本轮对话的极简上下文。
 * @param sessions - `ctx.get('sessions')`（拿不到就传 undefined）
 * @param sessionId - 当前会话
 * @param draft - 当前草稿（相同内容不重复当上下文，避免自己提示自己）
 * @returns 截断到 500 字的上一轮真人提示词，或 undefined
 */
export function readRecentContext(sessions: SessionsFace | undefined, sessionId: string | undefined, draft: string): string | undefined {
  if (sessions === undefined || sessionId === undefined) return undefined
  try {
    const binding = sessions.binding?.(sessionId)
    const source = binding?.eventSource
    if (source === undefined || typeof source.getSnapshot !== 'function') return undefined
    const window = source.getSnapshot()
    if (typeof window !== 'object' || window === null) return undefined
    const entries = (window as Record<string, unknown>)['entries']
    if (!Array.isArray(entries) || entries.length === 0) return undefined
    const latest = latestFromEntries(entries)
    if (latest === undefined || latest === collapse(draft)) return undefined
    return latest
  } catch {
    // 任何形状不符都当作"没有上下文"，绝不把异常文本写进日志
    return undefined
  }
}
