/**
 * 每个会话一个的改写控制器（C 报告 §7 的 per-session controller 做法）。
 *
 * 职责边界：
 * - 管状态机：idle → loading → ready → applied / error；
 * - 管网络：一次只允许一个在途请求；关闭卡片 / 切档 / 切会话 / 卸载都会 abort；
 * - 管草稿快照与写回前自检（占位符、命令芯片）；**不碰 React，也不碰 DOM**；
 * - 真正调用 `setDraft` 的是组件：只有组件手里有 `inputActions` 与实时 `useInput`。
 *
 * 隐私：错误只带 code（由组件翻译成文案），草稿内容永不进 message / console / 日志。
 */

import { MAX_DRAFT_CHARS, TIMEOUT_MS } from '../shared/constants'
import type { ConveyMode, ConveyRequest } from '../shared/protocol'
import { buildTemplate, CaptureError, rebuild, validateTokens } from './placeholders'
import { requestRewrite, type TransportFailure } from './transport'
import { Store } from './store'
import type { DraftCapture, DraftReferenceLike, InputStateLike, OccurrenceLike } from './types'

/** 卡片能展示的错误（值是文案 key，由组件翻译） */
export type CardErrorCode =
  | 'error.empty'
  | 'error.tooLongClient'
  | 'error.placeholder'
  | 'error.command'
  | 'error.no-model'
  | 'error.timeout'
  | 'error.upstream'
  | 'error.bad-output'
  | 'error.too-long'
  | 'error.bad-request'
  | 'error.host-missing'
  | 'error.network'
  | 'error.auth'
  | 'error.unknown'

/** 一次请求的可重试参数 */
export interface RetrySpec {
  readonly mode: ConveyMode
  readonly capture: DraftCapture
  readonly supplement: string
}

/** 卡片状态机 */
export type CardState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading'; readonly mode: ConveyMode; readonly capture: DraftCapture; readonly supplement: string }
  | {
    readonly kind: 'ready'
    readonly mode: ConveyMode
    readonly capture: DraftCapture
    readonly model: string
    /** 模型原始输出（含 ⟦Rn⟧） */
    readonly resultText: string
    /** 用户可编辑的正文（含 ⟦Rn⟧） */
    readonly editedText: string
    readonly questions: readonly string[]
    readonly supplement: string
    /** 写回前发现草稿已被改过：需要用户明确选一次 */
    readonly conflict: boolean
  }
  | { readonly kind: 'applied'; readonly degraded: boolean; readonly capture: DraftCapture }
  | { readonly kind: 'error'; readonly code: CardErrorCode; readonly retry?: RetrySpec }

const IDLE: CardState = { kind: 'idle' }

/** 写回计划：ok 时给出可交给 setDraft 的内容 */
export type WriteBackPlan =
  | {
    readonly ok: true
    readonly text: string
    readonly references: readonly DraftReferenceLike[]
    readonly command?: { readonly token: string }
  }
  | { readonly ok: false; readonly code: CardErrorCode }

/** 把 `InputState` 收窄成一次改写要用的快照（不合格抛 CaptureError，由调用方翻译成文案） */
export function captureFrom(state: InputStateLike): DraftCapture {
  if (state.draft.trim() === '') throw new CaptureError('empty')
  if (state.draft.length > MAX_DRAFT_CHARS) throw new CaptureError('too-long')
  return {
    draft: state.draft,
    draftRev: state.draftRev,
    refs: state.occurrences,
    ...(state.claim === undefined ? {} : { claimToken: state.claim.token }),
  }
}

/** CaptureError → 文案 key */
export function codeForCapture(error: CaptureError): CardErrorCode {
  if (error.code === 'empty') return 'error.empty'
  if (error.code === 'too-long') return 'error.tooLongClient'
  if (error.code === 'inconsistent-refs') return 'error.placeholder'
  return 'error.command'
}

/**
 * 传输层失败 → 文案 key。
 * 宿主口径：业务失败在 200 里（走 ConveyFailure.code）；这里处理的是"请求根本没成行"的几种。
 */
function codeForTransport(failure: TransportFailure): CardErrorCode {
  if (failure.kind === 'host-missing') return 'error.host-missing'
  if (failure.kind === 'network') return 'error.network'
  if (failure.kind === 'bad-shape') return 'error.bad-output'
  if (failure.status === 413) return 'error.too-long'
  if (failure.status === 401 || failure.status === 403) return 'error.auth'
  return 'error.bad-request'
}

/** 芯片 → 写回用引用（只保留契约字段，丢掉运行时 occurrenceId） */
function toReferences(refs: readonly OccurrenceLike[]): DraftReferenceLike[] {
  return refs.map((occurrence) => ({
    source: occurrence.source,
    ref: occurrence.ref,
    offset: occurrence.offset,
    length: occurrence.length,
    label: occurrence.label,
    ...(occurrence.appearance === undefined ? {} : { appearance: occurrence.appearance }),
    clipboardText: occurrence.clipboardText,
    ...(occurrence.invalid === undefined ? {} : { invalid: occurrence.invalid }),
  }))
}

/**
 * 命令芯片只有在文本仍以它开头时才能带回去。
 * 为什么要卡这一条：`setDraft` 收到 `command.token` 后会按 token 长度把行首替换成芯片，
 * 若改写把 `/goal` 挪走或删掉，硬带回去会切掉正文前 N 个字符。
 */
function commandOf(capture: DraftCapture, text: string): { readonly token: string } | undefined {
  const token = capture.claimToken
  if (token === undefined) return undefined
  const spelling = token.trimEnd()
  if (spelling === '') return undefined
  return text.startsWith(spelling) ? { token } : undefined
}

/**
 * 计算"把模型结果写回草稿"要做的事。
 * 三重校验：占位符个数/顺序 → 回填并重算偏移 → 命令芯片仍在行首。
 */
export function planWriteBack(capture: DraftCapture, editedText: string): WriteBackPlan {
  const validation = validateTokens(editedText, capture.refs.length)
  if (!validation.ok) return { ok: false, code: 'error.placeholder' }
  const rebuilt = rebuild(editedText, capture.refs)
  const command = commandOf(capture, rebuilt.text)
  if (capture.claimToken !== undefined && command === undefined) return { ok: false, code: 'error.command' }
  return {
    ok: true,
    text: rebuilt.text,
    references: rebuilt.references,
    ...(command === undefined ? {} : { command }),
  }
}

/** 计算"撤销写回"要做的事：把捕获时的快照原样放回 */
export function planRestore(capture: DraftCapture): WriteBackPlan {
  const command = commandOf(capture, capture.draft)
  return {
    ok: true,
    text: capture.draft,
    references: toReferences(capture.refs),
    ...(command === undefined ? {} : { command }),
  }
}

/** 单会话控制器 */
export class SessionController {
  readonly store = new Store<CardState>(IDLE)
  /** 当前会话 id（由注册表写入） */
  sessionId = ''
  /** 由注册表注入：读当前语言 */
  localeReader: () => string = () => 'en'
  /** 由注册表注入：读最近一条用户消息（可选 context） */
  contextReader: (sessionId: string, draft: string) => string | undefined = () => undefined
  /** 由注册表注入：读"用户临时挑的模型"（undefined = 跟随当前对话；只影响这一次改写） */
  modelPicker: () => { provider: string; model: string } | undefined = () => undefined
  /** 由注册表注入：改写是否在跑（桌面宠物据此切"思考脸"） */
  onBusy: ((busy: boolean) => void) | undefined = undefined

  /** 当前是否有一发在途请求（对外只通过 onBusy 报告一次进入/离开） */
  private busy = false
  private abortController: AbortController | undefined
  private abortReason: 'user' | 'timeout' | 'superseded' | undefined
  private requestSeq = 0
  private holders = 0
  private disposed = false

  /** 组件挂载计数（两个槽位共享同一个控制器） */
  retain(): void {
    this.holders += 1
  }

  /** 组件卸载：计数归零时中止在途请求并回到 idle（applied 保留一帧用于撤销入口） */
  release(): void {
    this.holders = Math.max(0, this.holders - 1)
    if (this.holders > 0) return
    this.abort('user')
    if (this.store.getSnapshot().kind !== 'applied') this.store.set(IDLE)
  }

  /** 插件卸载 */
  dispose(): void {
    this.disposed = true
    this.abort('user')
    this.holders = 0
    this.store.set(IDLE)
  }

  /** 放弃 / 关闭卡片 */
  discard(): void {
    this.abort('user')
    this.store.set(IDLE)
  }

  /** 写回前发现草稿已变：让用户明确选一次（不硬覆盖） */
  flagConflict(): void {
    const state = this.store.getSnapshot()
    if (state.kind !== 'ready' || state.conflict) return
    this.store.set({ ...state, conflict: true })
  }

  /** 用户选择"用最新草稿重新编译"前清掉冲突标记 */
  clearConflict(): void {
    const state = this.store.getSnapshot()
    if (state.kind !== 'ready' || !state.conflict) return
    this.store.set({ ...state, conflict: false })
  }

  /** 用户改结果文本 */
  edit(editedText: string): void {
    const state = this.store.getSnapshot()
    if (state.kind !== 'ready') return
    this.store.set({ ...state, editedText })
  }

  /** 用户改补充说明 */
  editSupplement(supplement: string): void {
    const state = this.store.getSnapshot()
    if (state.kind !== 'ready') return
    this.store.set({ ...state, supplement })
  }

  /** 按钮触发：从一份实时草稿开始编译 */
  start(mode: ConveyMode, state: InputStateLike): void {
    let capture: DraftCapture
    try {
      capture = captureFrom(state)
    } catch (error) {
      this.store.set({
        kind: 'error',
        code: error instanceof CaptureError ? codeForCapture(error) : 'error.unknown',
      })
      return
    }
    this.run(mode, capture, '')
  }

  /** 从已有快照重跑（切档 / 重新编译 / 冲突后用新快照重跑） */
  recompile(mode: ConveyMode, capture: DraftCapture, supplement: string): void {
    this.run(mode, capture, supplement)
  }

  /** 写回成功 */
  markApplied(degraded: boolean, capture: DraftCapture): void {
    this.store.set({ kind: 'applied', degraded, capture })
  }

  /** 撤销写回成功 */
  markRestored(): void {
    this.store.set(IDLE)
  }

  /** 读用户临时挑的模型（异常一律当"跟随当前对话"） */
  private pickModel(): { provider: string; model: string } | undefined {
    try {
      const picked = this.modelPicker()
      if (picked === undefined) return undefined
      if (picked.provider === '' || picked.model === '') return undefined
      return { provider: picked.provider, model: picked.model }
    } catch {
      return undefined
    }
  }

  /** 进入"在跑"状态（幂等：并发/重入只报一次） */
  private beginBusy(): void {
    if (this.busy) return
    this.busy = true
    try {
      this.onBusy?.(true)
    } catch {
      // 订阅方（宠物动画）出错不能影响请求本身
    }
  }

  /** 离开"在跑"状态（幂等） */
  private endBusy(): void {
    if (!this.busy) return
    this.busy = false
    try {
      this.onBusy?.(false)
    } catch {
      // 同上
    }
  }

  /** 请求主流程 */
  private run(mode: ConveyMode, capture: DraftCapture, supplement: string): void {
    if (this.disposed) return
    this.abort('superseded')
    const seq = ++this.requestSeq
    this.store.set({ kind: 'loading', mode, capture, supplement })
    this.beginBusy()

    // 先建模板（可能抛 CaptureError），再发请求
    let template: string
    try {
      template = buildTemplate(capture.draft, capture.refs).template
    } catch (error) {
      // 投影自相矛盾属于"草稿状态坏了"，重试同一个快照没有意义：不给 retry
      this.store.set({
        kind: 'error',
        code: error instanceof CaptureError ? codeForCapture(error) : 'error.unknown',
      })
      this.endBusy()
      return
    }

    const controller = new AbortController()
    this.abortController = controller
    this.abortReason = undefined

    // 超时：到点 abort，并把原因记成 timeout（与用户取消区分）
    const timer = window.setTimeout(() => {
      if (this.requestSeq !== seq) return
      this.abortReason = 'timeout'
      controller.abort()
    }, TIMEOUT_MS)

    const context = this.readContext(capture.draft)
    const request: ConveyRequest = {
      draft: template,
      mode,
      locale: this.readLocale(),
      ...(context === undefined ? {} : { context }),
      ...(supplement.trim() === '' ? {} : { supplement }),
      // 只传会话 id：宿主用它解析"这个会话里用户选的模型"，不读任何会话内容
      ...(this.sessionId === '' ? {} : { sessionId: this.sessionId }),
      // 用户在配置面板里临时挑的模型：只覆盖这一次改写，不改变会话模型
      ...(this.pickModel() ?? {}),
    }

    void requestRewrite(request, controller.signal).then((result) => {
      window.clearTimeout(timer)
      // 被新请求接管 / 已卸载：busy 的归属已经交给接手的人，这里不能收尾
      if (this.requestSeq !== seq || this.disposed) return
      this.abortController = undefined
      this.endBusy()
      const reason = this.abortReason
      this.abortReason = undefined

      if (reason === 'timeout') {
        this.store.set({ kind: 'error', code: 'error.timeout', retry: { mode, capture, supplement } })
        return
      }
      if (reason === 'user' || reason === 'superseded' || controller.signal.aborted) {
        // superseded：已经有新请求接管状态，这里什么都不做
        if (reason !== 'superseded') this.store.set(IDLE)
        return
      }
      if (!result.ok) {
        this.store.set({ kind: 'error', code: codeForTransport(result.failure), retry: { mode, capture, supplement } })
        return
      }
      const response = result.response
      if (response.ok === false) {
        if (response.code === 'aborted') {
          this.store.set(IDLE)
          return
        }
        const code = (`error.${response.code}`) as CardErrorCode
        this.store.set({ kind: 'error', code, retry: { mode, capture, supplement } })
        return
      }
      this.store.set({
        kind: 'ready',
        mode: response.mode,
        capture,
        model: response.model,
        resultText: response.text,
        editedText: normalizeResult(response.text),
        questions: response.questions,
        supplement,
        conflict: false,
      })
    })
  }

  /** 主动中止：用户取消 / 关闭卡片 / 切档 / 卸载 */
  private abort(reason: 'user' | 'timeout' | 'superseded'): void {
    const controller = this.abortController
    this.abortReason = reason
    // superseded：新的 run() 立刻接管 busy，这里不收尾，否则宠物的"思考脸"会闪一下
    if (reason !== 'superseded') this.endBusy()
    if (controller === undefined) return
    this.abortController = undefined
    controller.abort()
  }

  /** 当前语言的 BCP-47 标签 */
  private readLocale(): string {
    try {
      const active = this.localeReader()
      if (typeof active === 'string' && active !== '') return active
    } catch {
      // 读不到就退回浏览器语言，不写日志
    }
    if (typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language !== '') return navigator.language
    return 'en'
  }

  /** 可选 context：拿不到就不传，绝不伪造 */
  private readContext(draft: string): string | undefined {
    try {
      const context = this.contextReader(this.sessionId, draft)
      if (context === undefined || context.trim() === '') return undefined
      return context
    } catch {
      return undefined
    }
  }
}

/** 模型输出归一：换行统一成 LF，去掉尾部空白（不 trim 头部，避免破坏缩进） */
function normalizeResult(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gmu, '').replace(/\s+$/u, '')
}

/** 会话 → 控制器 的注册表（插件生命周期内唯一实例） */
export class ConveyRegistry {
  /** 正在改写的会话数（>0 = 桌宠切"思考脸"；0 = 回到 idle） */
  readonly busy = new Store(0)

  private readonly controllers = new Map<string, SessionController>()
  private disposed = false
  private readonly modelPicker: () => { provider: string; model: string } | undefined

  constructor(
    private readonly localeReader: () => string,
    private readonly contextReader: (sessionId: string, draft: string) => string | undefined,
    modelPicker: () => { provider: string; model: string } | undefined = () => undefined,
  ) {
    this.modelPicker = modelPicker
  }

  /** 组件挂载：取控制器并持有一份引用 */
  retain(sessionId: string): SessionController {
    const controller = this.controllers.get(sessionId) ?? this.create(sessionId)
    controller.retain()
    return controller
  }

  /** 渲染期取（不增加持有计数） */
  for(sessionId: string): SessionController {
    return this.controllers.get(sessionId) ?? this.create(sessionId)
  }

  /** 组件卸载：释放一份持有 */
  release(sessionId: string): void {
    this.controllers.get(sessionId)?.release()
  }

  /** 插件卸载：全部中止并清空 */
  dispose(): void {
    this.disposed = true
    for (const controller of this.controllers.values()) controller.dispose()
    this.controllers.clear()
  }

  private create(sessionId: string): SessionController {
    const controller = new SessionController()
    controller.sessionId = sessionId
    controller.localeReader = () => this.localeReader()
    controller.contextReader = (id, draft) => this.contextReader(id, draft)
    controller.modelPicker = () => this.modelPicker()
    // busy 是跨会话的计数：宠物在任何一个会话里思考都算"她正在忙"
    controller.onBusy = (busy) => {
      this.busy.set(Math.max(0, this.busy.getSnapshot() + (busy ? 1 : -1)))
    }
    if (!this.disposed) this.controllers.set(sessionId, controller)
    return controller
  }
}
