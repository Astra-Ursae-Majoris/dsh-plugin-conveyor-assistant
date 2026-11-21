/**
 * 浏览器半边用到的**结构化类型**。
 *
 * 为什么不用官方 `.d.ts` 里的类型：
 * - 本仓库只装了 `dsh-client-ui-conversation` / `dsh-client-locale` / `dsh-client-ui-primitives` 三个客户端包；
 *   它们声明的槽位类型会继续 import `dsh-client-ui-slots`、`dsh-client-ui-session`、`dsh-client-store` 等
 *   本仓库没有安装的包（这些包在运行时的 DSH 里由平台模块表提供）。直接 import 它们会让本仓库的 tsc 解析失败。
 * - 因此这里按 **C 报告已核对的运行时形状** 声明最小接口：字段名、坐标系、语义与 0.2.2-rc.5 源码一致
 *   （`dsh-client-ui-conversation/src/client/contract/input.ts:305-293`、`contract/draft-editor.ts:125-144`）。
 * - 好处：编译期零外部依赖，运行期按真值工作；所有跨界调用都经过这里的单一出入口。
 */

/** 结构性引用芯片（对应官方 `Occurrence`，去掉 occurrenceId 之外的运行时身份） */
export interface OccurrenceLike {
  /** 稳定的 occurrence 身份（官方字段名保留，写回时丢弃） */
  readonly occurrenceId?: number
  /** 拥有者 source 名（序列化路由键） */
  readonly source: string
  readonly ref: string
  /** 在 clipboard 投影里的偏移 */
  readonly offset: number
  readonly length: number
  readonly label: string
  readonly appearance?: 'session' | 'file' | 'folder'
  /** 持久化 / clipboard 投影（例如 @src/a.ts） */
  readonly clipboardText: string
  readonly invalid?: boolean
}

/** 行首 `/` 命令芯片的 claim 快照 */
export interface ClaimLike {
  readonly name: string
  readonly token: string
  readonly hint?: string
  readonly attachments?: boolean
}

/** `InputState` 的只读投影（官方 contract/input.ts:305-326） */
export interface InputStateLike {
  readonly draft: string
  readonly draftRev: number
  readonly occurrences: readonly OccurrenceLike[]
  readonly claim?: ClaimLike | undefined
  /** 'plain' | 'adjudicating' | 'claimed' | 'submitting' | 'sending' */
  readonly phase: string
}

/** 官方 `DraftReference`：Occurrence 去掉运行时身份 */
export interface DraftReferenceLike {
  readonly source: string
  readonly ref: string
  readonly offset: number
  readonly length: number
  readonly label: string
  readonly appearance?: 'session' | 'file' | 'folder'
  readonly clipboardText: string
  readonly invalid?: boolean
}

/**
 * 官方 `DraftSnapshot`。
 * 注意：**类型上说只接受 string**，对象形态是运行时能力（C 报告 §3.2 P2）；本插件会做必填字段最小化后再传。
 */
export interface DraftSnapshotLike {
  readonly text: string
  readonly references: readonly DraftReferenceLike[]
  readonly command?: { readonly token: string }
}

/** 公共输入动作面（官方 `InputActions` 的子集） */
export interface InputActionsLike {
  /** 契约类型是 string；运行时可传 DraftSnapshotLike（需调用方 as unknown） */
  setDraft(text: string): void
  persistDraft?(): void
}

/** 框架注入的选择器 hook（官方 `SnapshotSelectorHook<InputState>` 的最小形状） */
export type UseInputHook = <T>(selector: (state: InputStateLike) => T) => T

/** 会话作用域槽位组件收到的公共 props（官方标准 props 的子集） */
export interface SessionSlotProps {
  readonly sessionId?: string | undefined
  readonly useInput?: UseInputHook | undefined
  readonly inputActions?: InputActionsLike | undefined
}

/** 一次改写的输入快照：读草稿那一刻的全部信息，写回时用它做并发校验 */
export interface DraftCapture {
  readonly draft: string
  readonly draftRev: number
  readonly refs: readonly OccurrenceLike[]
  readonly claimToken?: string | undefined
}

/** `ctx.slots` 的最小面（官方 SlotRegistry: register / inject） */
export interface SlotsFace {
  register(options: {
    readonly name: string
    readonly id?: string
    readonly order?: number
    readonly inject?: () => Record<string, unknown>
  }, component: unknown): () => void
  inject(name: string, callback: () => () => void): () => void
}

/** `ctx.locale` 的最小面（官方 LocaleRuntime: register / bind / getSnapshot） */
export interface LocaleFace {
  register(ns: string, dicts: Record<string, Record<string, string>>): () => void
  bind(ns: string): (key: string, params?: Record<string, string | number>) => string
  getSnapshot?(): { readonly active?: string } | undefined
}

/** 宿主侧会话服务的最小面（只读取「最近一条用户消息」用，拿不到就返回 undefined） */
export interface SessionsFace {
  binding?(sessionId: string): {
    readonly eventSource?: { getSnapshot?(): unknown } | undefined
  } | undefined
}
