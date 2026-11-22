/**
 * 请求解析与校验 —— 任何进模型的文本都必须先从这里过一遍。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §7）：
 *   约束 2「不写会话事件、不传 sessionId 给 LLM」：本文件只读 HTTP 请求体，sessionId 只用于
 *     路由解析模型，绝不进入 LLM 请求（见 complete.ts）。
 *   约束 4「草稿零日志」：解析失败只回稳定的 code，不把请求体片段写进错误消息或日志。
 *   约束 7「能力与预算显式化」：draft 超过 MAX_DRAFT_CHARS 直接拒绝、不截断（too-long）；
 *     请求体上限 64 KB，独立于 Connection 的 300 MiB 桥接上限。
 */
import { MAX_DRAFT_CHARS } from '../shared/constants.js'
import type { ConveyRequest } from '../shared/protocol.js'

/** 整个请求体的字节上限（与 lead 的验收口径一致；Connection 的桥接上限是 300 MiB，不能依赖它）。 */
export const MAX_BODY_BYTES = 64 * 1024

/** 允许的档位，顺序无意义，只用于运行时判定。 */
const MODES = ['light', 'max'] as const

/** BCP-47 的宽松合法性：2–3 字母主标签 + 若干段 1–8 位字母数字。 */
const LOCALE_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/

/** 控制字符（sessionId 用来挡注入/垃圾值；不追求 UUID 严格性，宿主 id 形态可能变化）。 */
const CONTROL_RE = /[\u0000-\u001f\u007f]/

/** 解析成功后的内部请求：协议字段 + 可选 sessionId（C 报告里客户端会带上它做模型解析）。 */
export interface ConveyRequestBody extends ConveyRequest {
  sessionId?: string
}

/** 解析失败的结构化结果；route.ts 负责用 errors.ts 写成响应。 */
export type ParseResult =
  | { ok: true; body: ConveyRequestBody }
  | { ok: false; code: 'bad-request' | 'too-long'; locale: string }

/** 读取请求体的失败原因。 */
export type ReadFailure = 'content-type' | 'body-too-large' | 'body-invalid'

/** 读取并解析 JSON 请求体；先看声明的长度，再流式读取并硬性计数。 */
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 | 415; reason: ReadFailure }> {
  const mediaType = (request.headers.get('content-type') ?? '').split(';', 1)[0] ?? ''
  if (mediaType.trim().toLowerCase() !== 'application/json') {
    return { ok: false, status: 415, reason: 'content-type' }
  }
  const declared = request.headers.get('content-length')
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, reason: 'body-too-large' }
  }
  if (request.body === null) return { ok: false, status: 400, reason: 'body-invalid' }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      total += next.value.byteLength
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined)
        return { ok: false, status: 413, reason: 'body-too-large' }
      }
      chunks.push(next.value)
    }
  } catch {
    return { ok: false, status: 400, reason: 'body-invalid' }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // 已被取消时 releaseLock 可能抛；这里只需要读结果，忽略即可。
    }
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return { ok: false, status: 400, reason: 'body-invalid' }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400, reason: 'body-invalid' }
  }
}

/** 只认「非空字符串且去掉首尾空白后仍非空」。 */
function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/** 取一个宽松合法的 locale；缺失返回 undefined，非法返回 null。 */
function localeOf(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length > 35 || !LOCALE_RE.test(trimmed)) return null
  return trimmed
}

/** 可选的附加上下文：必须是字符串、有长度上限、空串按缺省处理。 */
function optionalText(value: unknown): { ok: true; value: string | undefined } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, value: undefined }
  if (typeof value !== 'string') return { ok: false }
  const trimmed = value.trim()
  if (trimmed === '') return { ok: true, value: undefined }
  if (trimmed.length > MAX_DRAFT_CHARS) return { ok: false }
  return { ok: true, value: trimmed }
}

/** 取可选的 provider/model id：宽松但设长度上限，任何异常形态都按未设置处理。 */
function routeIdOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.length > 128 || CONTROL_RE.test(trimmed)) return undefined
  return trimmed
}

/** 取可选的 sessionId（客户端扩展字段，仅用于模型解析）。 */
function sessionIdOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.length > 128 || CONTROL_RE.test(trimmed)) return undefined
  return trimmed
}

/**
 * 校验请求体结构。
 * @param value JSON.parse 的结果
 * @returns 成功时给出规范化请求；失败时给出协议失败码与（尽量取到的）locale
 */
export function validateBody(value: unknown): ParseResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, code: 'bad-request', locale: 'en' }
  }
  const record = value as Record<string, unknown>

  const locale = localeOf(record.locale)
  const languageHint = typeof locale === 'string' ? locale : typeof record.locale === 'string' ? record.locale : 'en'
  if (locale === null) return { ok: false, code: 'bad-request', locale: languageHint }

  const draft = record.draft
  if (!nonEmptyString(draft)) return { ok: false, code: 'bad-request', locale: languageHint }
  // 不截断：超出上限直接拒绝，避免「改了一半」的语义事故。
  if (draft.length > MAX_DRAFT_CHARS) return { ok: false, code: 'too-long', locale: languageHint }

  const mode = record.mode
  if (typeof mode !== 'string' || !(MODES as readonly string[]).includes(mode)) {
    return { ok: false, code: 'bad-request', locale: languageHint }
  }

  const context = optionalText(record.context)
  if (!context.ok) return { ok: false, code: 'bad-request', locale: languageHint }
  const supplement = optionalText(record.supplement)
  if (!supplement.ok) return { ok: false, code: 'bad-request', locale: languageHint }

  const sessionId = sessionIdOf(record.sessionId)
  // 本次改写临时指定的模型：必须成对出现，只给一个按未指定处理（不抛错，退回自动解析）
  const pickedProvider = routeIdOf(record.provider)
  const pickedModel = routeIdOf(record.model)
  const picked = pickedProvider !== undefined && pickedModel !== undefined
    ? { provider: pickedProvider, model: pickedModel }
    : undefined
  const body: ConveyRequestBody = {
    draft,
    mode: mode as ConveyRequestBody['mode'],
    locale: locale ?? 'en',
    ...(context.value === undefined ? {} : { context: context.value }),
    ...(supplement.value === undefined ? {} : { supplement: supplement.value }),
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(picked === undefined ? {} : { provider: picked.provider, model: picked.model }),
  }
  return { ok: true, body }
}
