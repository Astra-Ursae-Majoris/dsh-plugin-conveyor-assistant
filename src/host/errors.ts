/**
 * 失败文案与 JSON 响应构造 —— 唯一允许出现"面向用户文字"的地方。
 *
 * 硬约束（对应 _research/B-llm-privacy.md §7）：
 *   约束 4「草稿零日志」：本文件所有文案都是常量模板，绝不拼接 req.draft / context /
 *     supplement，也不含任何上游 error.message；唯一插值是 MAX_DRAFT_CHARS 这类公开常量。
 *   约束 3「零额外网络出口」：这里只构造给浏览器的 HTTP 响应，不发任何外部请求。
 *   约束 8「发布说明如实披露」：文案语气按用户规则「专业但有人味」，可以用「~」与颜文字，
 *     不用感叹号、不写客套废话。
 */
import type { ConveyFailure } from '../shared/protocol.js'
import { MAX_DRAFT_CHARS } from '../shared/constants.js'

/** 协议里约定的全部失败码。 */
export type ConveyFailureCode = ConveyFailure['code']

/** 语言桶：宿主侧只有「中文 / 其它」两套文案，够用且不引入 i18n 依赖。 */
type Language = 'zh' | 'en'

/** 按 locale 前缀选语言桶；缺省或非法一律按英文处理。 */
export function languageOf(locale: string | undefined): Language {
  return (locale ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/**
 * 每个失败码一句用户可读的话。
 * 注意：任何一条都不得包含草稿、上下文、补充说明或上游原文。
 */
const MESSAGES: Record<ConveyFailureCode, Record<Language, string>> = {
  'no-model': {
    zh: '还没有可用的模型呢~ 先在输入框下方挑一个再试吧',
    en: 'No model is available yet~ pick one below the composer and try again',
  },
  timeout: {
    zh: '模型这次想得有点久 (｡•́︿•̀｡) 先放它一马，稍后再试一次~',
    en: 'The model took too long this time (｡•́︿•̀｡) let us try again in a moment~',
  },
  aborted: {
    zh: '这次优化停在半路，草稿原样留着呢~',
    en: 'Optimization stopped midway — your draft is untouched~',
  },
  upstream: {
    zh: '模型那头信号不太好 (´･_･｀) 稍后再试一次吧',
    en: 'The model service is not answering well (´･_･｀) please try again shortly',
  },
  'bad-output': {
    zh: '模型没把原话接稳，这次先不写回~ 再试一次可能就好了',
    en: 'The model tripped over your wording, so nothing was written back~ one more try may fix it',
  },
  'too-long': {
    zh: '草稿有 ' + MAX_DRAFT_CHARS + ' 字的上限，先减一点再让我读~',
    en: 'The draft limit is ' + MAX_DRAFT_CHARS + ' characters~ trim it a little and try again',
  },
  'bad-request': {
    zh: '这次请求没对上号，刷新一下页面再试试吧',
    en: 'That request did not line up — refresh the page and try again',
  },
}

/** 取一句失败文案。 */
export function messageFor(code: ConveyFailureCode, locale: string | undefined): string {
  return MESSAGES[code][languageOf(locale)]
}

/** 统一的响应头：禁止缓存、禁止嗅探。 */
const RESPONSE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const

/** 写出一份 JSON 响应（成功与失败共用同一头）。 */
export function sendJson(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: RESPONSE_HEADERS })
}

/**
 * 写出一份失败响应。
 * @param code 协议失败码
 * @param locale 请求里的 locale（用于挑语言桶；未知时按英文）
 * @param status HTTP 状态码：业务失败一律 200，传输层失败才用 4xx
 */
export function sendFailure(code: ConveyFailureCode, locale: string | undefined, status = 200): Response {
  return sendJson({ ok: false, code, message: messageFor(code, locale) } satisfies ConveyFailure, status)
}
