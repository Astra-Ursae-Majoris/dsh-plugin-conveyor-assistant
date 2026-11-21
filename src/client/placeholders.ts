/**
 * 占位符往返（C 报告 §3.3 的落地实现）。
 *
 * 为什么不许直接把整段 draft 交给模型再 setDraft：
 * - `draft` 是 clipboard 投影：每个 @ 引用芯片占一段固定文本（`clipboardText`），
 *   在 `[offset, offset+length)` 上与其逐字相等；芯片的身份（source/ref）只存在于
 *   `occurrences` 里，改写文本一旦挪动位置，芯片就会丢（提交时不再走 owner codec 序列化）。
 * - 所以：把芯片换成 `⟦R0⟧ ⟦R1⟧ …` 送模型 → 校验占位符集合与顺序 → 再按新偏移回插。
 *
 * 三个函数与 C 报告 §三 步骤 2/4/5 一一对应：
 *   buildTemplate()  → 建模板        validateTokens() → 校验
 *   rebuild()        → 回填 + 重算偏移
 */

import { REF_TOKEN_RE } from '../shared/constants'
import type { DraftReferenceLike, OccurrenceLike } from './types'

/** 占位符文本；与 `REF_TOKEN_RE` 的捕获组一一对应 */
export function tokenOf(index: number): string {
  return '⟦R' + String(index) + '⟧'
}

/**
 * 每次新建一个带 /g 的正则。
 * `REF_TOKEN_RE` 是模块级 /g 正则，直接复用会被 `lastIndex` 污染（`exec` 会跳着走）。
 */
function tokenRegex(): RegExp {
  return new RegExp(REF_TOKEN_RE.source, 'g')
}

/** 捕获草稿时的结构性错误（写进卡片文案，不抛给全局） */
export class CaptureError extends Error {
  readonly code: 'empty' | 'too-long' | 'inconsistent-refs' | 'command-lost'

  constructor(code: 'empty' | 'too-long' | 'inconsistent-refs' | 'command-lost') {
    // 消息只写错误类别：草稿内容永远不进 error message / 日志
    super(`capture: ${code}`)
    this.name = 'CaptureError'
    this.code = code
  }
}

/** 模板构建结果 */
export interface Template {
  /** 芯片已替换成 ⟦Rn⟧ 的草稿 */
  readonly template: string
  /** 被替换掉的芯片，顺序即占位符编号 */
  readonly refs: readonly OccurrenceLike[]
}

/**
 * 把草稿切成「文本段 + 芯片」，芯片换成 ⟦Rn⟧。
 * @param draft - `InputState.draft`（clipboard 投影）
 * @param occurrences - `InputState.occurrences`（按 offset 升序、互不重叠）
 * @returns 模板与被替换的芯片列表
 * @throws {CaptureError} 当投影自相矛盾（offset/length/clipboardText 对不上）时 —— 宁可不改，也不猜
 */
export function buildTemplate(draft: string, occurrences: readonly OccurrenceLike[]): Template {
  const sorted = [...occurrences].sort((left, right) => left.offset - right.offset)
  const parts: string[] = []
  const refs: OccurrenceLike[] = []
  let cursor = 0
  for (const occurrence of sorted) {
    const end = occurrence.offset + occurrence.length
    if (occurrence.length <= 0 || occurrence.offset < cursor || end > draft.length) {
      throw new CaptureError('inconsistent-refs')
    }
    if (draft.slice(occurrence.offset, end) !== occurrence.clipboardText) {
      throw new CaptureError('inconsistent-refs')
    }
    parts.push(draft.slice(cursor, occurrence.offset), tokenOf(refs.length))
    refs.push(occurrence)
    cursor = end
  }
  parts.push(draft.slice(cursor))
  return { template: parts.join(''), refs }
}

/** 校验结论：ok 为 false 时 `broken` 给出用户能看懂的那几个占位符 */
export type TokenValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly issue: 'count' | 'order' | 'unknown'; readonly broken: readonly string[] }

/**
 * 校验模型回的文本里的占位符：个数必须等于芯片数、顺序必须是 R0..Rn-1、且不能有残骸。
 * @param text - 模型输出（可能被用户再编辑过，写回前还会再校验一次）
 * @param expected - 期望的占位符个数（= 芯片数）
 */
export function validateTokens(text: string, expected: number): TokenValidation {
  // 先看残骸：去掉合法占位符后还残留 ⟦ / ⟧，说明模型把占位符写坏了（例如 ⟦R0 ⟧ / ⟦R０⟧）
  const residue = text.replace(tokenRegex(), '')
  if (residue.includes('⟦') || residue.includes('⟧')) {
    const fragments = residue.match(/⟦[^⟧]{0,10}⟧?/gu) ?? ['⟦…⟧']
    return { ok: false, issue: 'unknown', broken: fragments.slice(0, 3) }
  }
  const regex = tokenRegex()
  const found: string[] = []
  const ids: number[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    found.push(match[0])
    ids.push(Number(match[1]))
  }
  if (ids.length !== expected) {
    return { ok: false, issue: 'count', broken: expected === 0 ? found : ids.map((_, index) => tokenOf(index)) }
  }
  for (let index = 0; index < ids.length; index += 1) {
    if (ids[index] !== index) return { ok: false, issue: 'order', broken: ids.map(id => tokenOf(id)) }
  }
  return { ok: true }
}

/** 回填结果：可直接喂给 setDraft 的文本 + 重算好偏移的引用表 */
export interface Rebuild {
  readonly text: string
  readonly references: readonly DraftReferenceLike[]
}

/**
 * 把 ⟦Rn⟧ 换回芯片的 clipboardText，并逐个算出新偏移。
 * 前置条件：`validateTokens(text, refs.length).ok === true`（调用方保证）。
 * @param text - 校验通过的模型输出（或用户编辑后的结果）
 * @param refs - `buildTemplate` 返回的芯片列表
 * @throws {CaptureError} 占位符编号越界（说明调用方跳过了校验）
 */
export function rebuild(text: string, refs: readonly OccurrenceLike[]): Rebuild {
  const regex = tokenRegex()
  const parts: string[] = []
  const references: DraftReferenceLike[] = []
  let visible = 0
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const chunk = text.slice(last, match.index)
    parts.push(chunk)
    visible += chunk.length
    const occurrence = refs[Number(match[1])]
    if (occurrence === undefined) throw new CaptureError('inconsistent-refs')
    parts.push(occurrence.clipboardText)
    references.push({
      source: occurrence.source,
      ref: occurrence.ref,
      label: occurrence.label,
      ...(occurrence.appearance === undefined ? {} : { appearance: occurrence.appearance }),
      clipboardText: occurrence.clipboardText,
      offset: visible,
      length: occurrence.clipboardText.length,
      ...(occurrence.invalid === undefined ? {} : { invalid: occurrence.invalid }),
    })
    visible += occurrence.clipboardText.length
    last = match.index + match[0].length
  }
  parts.push(text.slice(last))
  return { text: parts.join(''), references }
}
