/** 两个档位：light = 直译式整理；max = 意译式转译（读意图） */
export type ConveyMode = 'light' | 'max'

/** 浏览器 → 宿主 的一次编译请求 */
export interface ConveyRequest {
  /** 草稿正文；其中的引用芯片已替换为 ⟦R0⟧ ⟦R1⟧ … 占位符 */
  draft: string
  mode: ConveyMode
  /** BCP-47 语言标签，用于挑选输出语言与 UI 文案 */
  locale: string
  /** 可选：最近一轮对话的极简摘要，只用于消解代词与省略（不参与改写） */
  context?: string
  /** 可选：用户对上一条追问的补充，重新编译时带上 */
  supplement?: string
  /** 可选：当前会话 id。只用于把「用户在这个会话里选的模型」解析准，不会写入任何会话记录 */
  sessionId?: string
}

/** 成功结果 */
export interface ConveyResult {
  ok: true
  mode: ConveyMode
  /** 写回输入框的正文。必须原样保留所有 ⟦Rn⟧ 占位符 */
  text: string
  /** 面向用户的口语化追问（0–3 条）。空数组 = 没有歧义 */
  questions: string[]
  /** 实际使用的模型标识，卡片上透明展示 */
  model: string
}

/** 失败结果：只回 code + 用户可读的一句话，绝不回传草稿或上游原文 */
export interface ConveyFailure {
  ok: false
  code: 'no-model' | 'timeout' | 'aborted' | 'upstream' | 'bad-output' | 'too-long' | 'bad-request'
  message: string
}

export type ConveyResponse = ConveyResult | ConveyFailure
