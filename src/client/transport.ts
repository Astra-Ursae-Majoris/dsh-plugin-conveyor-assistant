/**
 * 浏览器 → 宿主 的唯一出口（受认证的同源路由）。
 *
 * 设计约束（见 C 报告 §6.4 与 HANDOVER §1.4）：
 * - 只打一个地址 `ROUTE_PATH`，浏览器不与模型端点直连，也不读任何密钥；
 * - 失败只回**类别**，绝不把响应体 / 草稿 / 上游原话塞进错误文本；
 * - 宿主口径（宿主 route.ts 文件头，0.1.0 已定）：**业务结果一律 HTTP 200**，
 *   `{ok:true,...}` 或 `{ok:false,code,message}` 都在 200 里；
 *   只有 415/413/400/405/401/403 是传输层失败，404 表示路由没注册（宿主半边没加载）。
 */

import { ROUTE_PATH } from '../shared/constants'
import type { ConveyRequest, ConveyResponse } from '../shared/protocol'

/** 传输层失败（与协议层 `ConveyFailure` 区分开，便于给不同文案） */
export type TransportFailure =
  /** 404：宿主半边没加载 / 路由没注册 */
  | { readonly kind: 'host-missing'; readonly status: number }
  /** fetch 本身失败（断网、页面被卸载、被 abort） */
  | { readonly kind: 'network' }
  /** 200 但 body 不是协议形状：宿主实现与客户端版本对不上 */
  | { readonly kind: 'bad-shape'; readonly status: number }
  /** 4xx 传输层拒绝（413/415/400/405/401/403） */
  | { readonly kind: 'http'; readonly status: number }

/** 结果判别 */
export type TransportResult =
  | { readonly ok: true; readonly response: ConveyResponse }
  | { readonly ok: false; readonly failure: TransportFailure }

/** 只接受协议里列出的 code，避免宿主升级后回传未知结构被我们瞎解释 */
const FAILURE_CODES = ['no-model', 'timeout', 'aborted', 'upstream', 'bad-output', 'too-long', 'bad-request'] as const

/** 系统会返回"业务外"状态的 HTTP 码（其余非 200 一律按传输失败处理） */
function isTransportStatus(status: number): boolean {
  return status === 415 || status === 413 || status === 400 || status === 405 || status === 401 || status === 403
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 把未知 JSON 收窄成 ConveyResponse；形状不对就返回 undefined */
function parseResponse(value: unknown): ConveyResponse | undefined {
  if (!isRecord(value)) return undefined
  if (value['ok'] === true) {
    if (typeof value['text'] !== 'string' || value['text'].trim() === '') return undefined
    if (value['mode'] !== 'light' && value['mode'] !== 'max') return undefined
    if (typeof value['model'] !== 'string') return undefined
    const questions = Array.isArray(value['questions'])
      ? value['questions'].filter((item): item is string => typeof item === 'string' && item.trim() !== '').slice(0, 3)
      : []
    return { ok: true, mode: value['mode'], text: value['text'], questions, model: value['model'] }
  }
  if (value['ok'] === false) {
    const code = FAILURE_CODES.find(candidate => candidate === value['code']) ?? 'upstream'
    const message = typeof value['message'] === 'string' ? value['message'] : ''
    return { ok: false, code, message }
  }
  return undefined
}

/**
 * 发一次改写请求。
 * @param request - 协议请求体（草稿里只有 ⟦Rn⟧ 占位符 + 会话 id，没有其它会话内容）
 * @param signal - 取消信号（关闭卡片 / 切档 / 卸载 / 超时都会 abort）
 * @returns 判别后的传输结果；调用方负责把失败翻译成文案
 */
export async function requestRewrite(request: ConveyRequest, signal: AbortSignal): Promise<TransportResult> {
  let response: Response
  try {
    response = await fetch(ROUTE_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch {
    // abort 也落到这里；调用方用 signal.aborted 区分"用户取消"和"真的连不上"
    return { ok: false, failure: { kind: 'network' } }
  }

  // 404：路由不存在（宿主半边没装/没加载）
  if (response.status === 404) return { ok: false, failure: { kind: 'host-missing', status: 404 } }

  // 4xx 传输层拒绝：body 仍是同构 JSON，但这里按状态码给更准确的文案
  if (isTransportStatus(response.status)) return { ok: false, failure: { kind: 'http', status: response.status } }

  // 业务结果一律 200（含 {ok:false,...}）；其它状态按传输失败处理
  if (!response.ok) return { ok: false, failure: { kind: 'http', status: response.status } }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, failure: { kind: 'bad-shape', status: response.status } }
  }
  const parsed = parseResponse(body)
  if (parsed === undefined) return { ok: false, failure: { kind: 'bad-shape', status: response.status } }
  return { ok: true, response: parsed }
}
