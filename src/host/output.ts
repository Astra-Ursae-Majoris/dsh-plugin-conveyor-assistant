/**
 * 模型输出解析与硬校验 —— 这里是"写回输入框"前的最后一道闸门。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §7 与 lead 验收口径）：
 *   约束 4「草稿零日志」：本文件不写日志；解析失败只返回 ok:false，不携带任何原文。
 *   约束 6「占位符是芯片回插的安全阀」：⟦Rn⟧ 的**数量与顺序**必须和草稿完全一致，
 *     任何不一致直接判 bad-output，绝不"尽量修一下"。这是唯一允许拒绝一份"看起来
 *     还不错"的模型输出的理由——因为错误的占位符会让芯片插到错误的位置。
 */
import { REF_TOKEN_RE } from '../shared/constants.js'

/** 单次输出里最多保留几条追问。 */
const MAX_QUESTIONS = 3
/** 单条追问的字数上限（按 code point 计，中文/emoji 都按 1 个字算）。 */
const MAX_QUESTION_CHARS = 200
/** 模型文本的绝对长度上限：4096 输出 token 远低于此，超过说明上游异常，直接拒绝。 */
const MAX_MODEL_TEXT_CHARS = 100_000

/** 解析结果：成功给出写回正文与追问；失败只有 ok:false（不解释为什么，避免泄露内容）。 */
export type ParsedOutput =
  | { ok: true; text: string; questions: string[] }
  | { ok: false }

/** 取出文本里所有 ⟦Rn⟧ 占位符（按出现顺序）。 */
function tokensOf(value: string): string[] {
  const matched = value.match(REF_TOKEN_RE)
  return matched === null ? [] : matched
}

/** 校验 questions 字段：允许缺省（视为 0 条），不允许超过 3 条或单条超长。 */
function questionsOf(value: unknown): string[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value)) return undefined
  const questions: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return undefined
    const trimmed = item.trim()
    if (trimmed === '') continue
    if (Array.from(trimmed).length > MAX_QUESTION_CHARS) return undefined
    questions.push(trimmed)
    if (questions.length > MAX_QUESTIONS) return undefined
  }
  return questions
}

/** 从模型文本里抠出第一个 { 到最后一个 }，容忍 markdown 围栏与前后废话。 */
function jsonObjectOf(modelText: string): unknown {
  const start = modelText.indexOf('{')
  const end = modelText.lastIndexOf('}')
  if (start < 0 || end <= start) return undefined
  try {
    return JSON.parse(modelText.slice(start, end + 1))
  } catch {
    return undefined
  }
}

/**
 * 校验占位符集合：数量一致 + 出现顺序一致 + 没有残留的半截占位符。
 * @param draft 送模型前的草稿（含 ⟦Rn⟧ 模板）
 * @param text 模型返回、即将写回的正文
 */
function placeholdersMatch(draft: string, text: string): boolean {
  const expected = tokensOf(draft)
  const actual = tokensOf(text)
  if (expected.length !== actual.length) return false
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] !== actual[index]) return false
  }
  // 去掉合法占位符后不应残留 ⟦ / ⟧：残留说明模型把某个占位符改坏了。
  const stripped = text.replace(REF_TOKEN_RE, '')
  return !stripped.includes('⟦') && !stripped.includes('⟧')
}

/**
 * 解析并硬校验模型输出。
 * @param modelText 模型返回的原始文本
 * @param draft 送模型前的草稿（用于占位符比对）
 */
export function parseModelOutput(modelText: string, draft: string): ParsedOutput {
  if (modelText.length > MAX_MODEL_TEXT_CHARS) return { ok: false }

  const value = jsonObjectOf(modelText)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false }
  const record = value as Record<string, unknown>

  const text = record.text
  if (typeof text !== 'string') return { ok: false }
  const normalized = text.trim()
  if (normalized === '') return { ok: false }

  const questions = questionsOf(record.questions)
  if (questions === undefined) return { ok: false }

  if (!placeholdersMatch(draft, normalized)) return { ok: false }

  return { ok: true, text: normalized, questions }
}
