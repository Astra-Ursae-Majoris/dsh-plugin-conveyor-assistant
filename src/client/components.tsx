/**
 * 浏览器半边的两个 UI 入口：
 * - `ConveyButtons`  → 槽 `conversation.input.left`：工具行左侧两个紧凑按钮（✨ 轻 / 🪄 重）
 * - `ConveyCard`     → 槽 `conversation.input.dock`：输入卡片上方的整宽意图确认卡片
 *
 * 槽位与 props 依据 C 报告 §1（`conversation.input.left`: list/session；`conversation.input.dock`:
 * list/session，owner props 为 InputZone），组件只消费**标准 props** 里的 `useInput`/`inputActions`，
 * 不碰 Lexical editor、不 import 未安装的客户端包。
 */

import * as React from 'react'
import {
  Button,
  SegmentedControl,
  StateDot,
  TextShimmer,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { PetQuestionRow, type PetMood } from './Pet'
import { PET_CSS } from './pet-css'
import {
  planRestore,
  planWriteBack,
  type CardErrorCode,
  type CardState,
  type ConveyRegistry,
  type SessionController,
} from './controller'
import { validateTokens } from './placeholders'
import { Store, useStore } from './store'
import { MAX_DRAFT_CHARS } from '../shared/constants'
import type { ConveyMode } from '../shared/protocol'
import type { Translate } from './locale'
import type { DraftCapture, InputStateLike, SessionSlotProps } from './types'

/** 槽位 inject 注入进来的业务面 */
export interface ConveyInjected {
  readonly forge: ConveyRegistry
  readonly t: Translate
}

/** 槽位组件完整 props：框架标准 props + 我们注入的业务面 */
export type ConveySlotProps = SessionSlotProps & ConveyInjected

/** 没有会话时的空输入态（保证 hooks 调用顺序恒定） */
const EMPTY_INPUT: InputStateLike = { draft: '', draftRev: 0, occurrences: [], phase: 'plain' }
/** 没有控制器时挂一个空 store，同样是"hooks 顺序恒定"的需要 */
const IDLE_STORE = new Store<CardState>({ kind: 'idle' })

/** 兜底 hook：session 作用域的槽位一定会给真 useInput，这里只是形状上的安全垫 */
function useEmptyInput<T>(selector: (state: InputStateLike) => T): T {
  return selector(EMPTY_INPUT)
}

/** 点按钮不要把光标从编辑框里夺走 */
const keepFocus = (event: React.MouseEvent): void => {
  event.preventDefault()
}

/** 取（必要时创建）本会话控制器；sessionId 缺失时返回 undefined */
function useController(props: ConveySlotProps): SessionController | undefined {
  const { forge, sessionId } = props
  return React.useMemo(() => (sessionId === undefined ? undefined : forge.for(sessionId)), [forge, sessionId])
}

/** 会话作用域内保持控制器存活：挂载 +1，卸载 -1 */
function useRetain(props: ConveySlotProps): void {
  const { forge, sessionId } = props
  React.useEffect(() => {
    if (sessionId === undefined) return undefined
    const controller = forge.retain(sessionId)
    void controller
    return () => { forge.release(sessionId) }
  }, [forge, sessionId])
}

// ── 工具行按钮 ──────────────────────────────────────────────────────────────

/** 两个档位按钮（挂在 conversation.input.left） */
export function ConveyButtons(props: ConveySlotProps): React.ReactElement {
  const { forge, t, inputActions } = props
  const useInput = props.useInput ?? useEmptyInput
  const state = useInput((value) => value)
  const controller = useController(props)
  const card = useStore(controller?.store ?? IDLE_STORE)
  useRetain(props)

  const compiling = card.kind === 'loading'
  const locked = inputActions === undefined || state.phase !== 'plain' || state.draft.trim() === '' || compiling
  const start = (mode: ConveyMode): void => {
    if (locked || controller === undefined) return
    controller.start(mode, state)
  }
  void forge

  return (
    <span style={styles.buttonGroup}>
      <Tooltip label={t('btn.light')} side="top" portal>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('btn.light.aria')}
          disabled={locked}
          onMouseDown={keepFocus}
          onClick={() => { start('light') }}
        >
          <span aria-hidden="true">✨</span>
        </Button>
      </Tooltip>
      <Tooltip label={t('btn.max')} side="top" portal>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('btn.max.aria')}
          disabled={locked}
          onMouseDown={keepFocus}
          onClick={() => { start('max') }}
        >
          <span aria-hidden="true">🪄</span>
        </Button>
      </Tooltip>
    </span>
  )
}

// ── 意图确认卡片 ────────────────────────────────────────────────────────────

/** 结构化写回后的自检记录：一次写入只校验一次 */
interface PendingVerify {
  readonly expectedText: string
  readonly expectedRefs: number
}

/** 整宽卡片（挂在 conversation.input.dock） */
export function ConveyCard(props: ConveySlotProps): React.ReactElement | null {
  const { t, inputActions } = props
  const useInput = props.useInput ?? useEmptyInput
  const state = useInput((value) => value)
  const controller = useController(props)
  const card = useStore(controller?.store ?? IDLE_STORE)
  useRetain(props)

  const [planError, setPlanError] = React.useState<CardErrorCode | null>(null)
  const pendingVerify = React.useRef<PendingVerify | null>(null)

  // 结果可编辑时，占位符完整性实时校验（不合格就禁用"确认写回"）
  const edited = card.kind === 'ready' ? card.editedText : ''
  const refCount = card.kind === 'ready' ? card.capture.refs.length : 0
  const validation = React.useMemo(() => validateTokens(edited, refCount), [edited, refCount])

  // 结构化写回之后的自检：芯片数量或正文对不上 → 说明运行时能力不成立，用纯文本补救并标记降级
  React.useEffect(() => {
    const pending = pendingVerify.current
    if (pending === null || card.kind !== 'applied' || inputActions === undefined) return
    pendingVerify.current = null
    if (state.draft === pending.expectedText && state.occurrences.length === pending.expectedRefs) return
    inputActions.setDraft(pending.expectedText)
    controller?.markApplied(true, card.capture)
  }, [state, card, controller, inputActions])

  /** 写一个"计划"到草稿：先试结构化，失败或降级则退回纯文本 */
  const commit = (plan: ReturnType<typeof planWriteBack>, capture: DraftCapture): void => {
    if (inputActions === undefined || !plan.ok) return
    if (plan.references.length === 0) {
      inputActions.setDraft(plan.text)
      controller?.markApplied(false, capture)
      return
    }
    const snapshot = {
      text: plan.text,
      references: plan.references,
      ...(plan.command === undefined ? {} : { command: plan.command }),
    }
    pendingVerify.current = { expectedText: plan.text, expectedRefs: plan.references.length }
    try {
      // C 报告 §3.2 P2：契约类型只收 string，运行时接受 DraftSnapshot；能力由上面那次自检确认
      ;(inputActions.setDraft as unknown as (value: unknown) => void)(snapshot)
    } catch {
      pendingVerify.current = null
      inputActions.setDraft(plan.text)
      controller?.markApplied(true, capture)
      return
    }
    controller?.markApplied(false, capture)
  }

  /** 确认写回；overwrite=false 时先校验草稿版本，变了就让用户选 */
  const apply = (overwrite: boolean): void => {
    if (card.kind !== 'ready' || inputActions === undefined) return
    // 正在提交（sending/submitting/adjudicating）时编辑器是只读的，写回会和在途提交打架
    if (state.phase !== 'plain') return
    const plan = planWriteBack(card.capture, card.editedText)
    if (!plan.ok) {
      setPlanError(plan.code)
      return
    }
    if (!overwrite && state.draftRev !== card.capture.draftRev) {
      controller?.flagConflict()
      return
    }
    setPlanError(null)
    commit(plan, card.capture)
  }

  /** 撤销写回：把捕获时的草稿原样放回去（不依赖编辑器 undo 栈，见 C 报告风险 R3） */
  const undo = (capture: DraftCapture): void => {
    commit(planRestore(capture), capture)
    // 撤销不参与"结构化写回自检"，别把一次性的 pendingVerify 留给下一次写回
    pendingVerify.current = null
    controller?.markRestored()
  }

  if (controller === undefined || card.kind === 'idle') return null

  const close = (): void => {
    setPlanError(null)
    controller.discard()
  }

  const header = (title: React.ReactNode, tone: 'plain' | 'done' | 'error' | 'ongoing'): React.ReactElement => (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        {tone === 'ongoing' && <StateDot state="ongoing" />}
        {tone === 'done' && <StateDot state="done" />}
        {tone === 'error' && <StateDot state="error" />}
        <span style={styles.title}>{title}</span>
      </div>
      <Button size="sm" variant="ghost" aria-label={t('card.close')} onMouseDown={keepFocus} onClick={close}>
        <span aria-hidden="true">✕</span>
      </Button>
    </div>
  )

  if (card.kind === 'loading') {
    return (
      <div style={styles.card} data-dca-card="loading">
        <style>{PET_CSS}</style>
        {header(<TextShimmer active>{t('card.loading')}</TextShimmer>, 'ongoing')}
        <PetQuestionRow
          mood={'thinking' satisfies PetMood}
          title={t('card.loading')}
          questions={[]}
          thinkingLabel={t('card.loading.hint')}
          bubbleLabel={t('card.aria')}
        >
          <span />
        </PetQuestionRow>
      </div>
    )
  }

  if (card.kind === 'error') {
    const params = card.code === 'error.tooLongClient' ? { max: String(MAX_DRAFT_CHARS) } : undefined
    return (
      <div style={styles.card} data-dca-card="error">
        <style>{PET_CSS}</style>
        {header(t('error.title'), 'error')}
        <p style={styles.errorText}>{t(card.code, params)}</p>
        <div style={styles.footer}>
          {card.retry !== undefined && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { controller.recompile(card.retry!.mode, card.retry!.capture, card.retry!.supplement) }}
            >
              {t('action.retry')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={close}>{t('action.discard')}</Button>
        </div>
      </div>
    )
  }

  if (card.kind === 'applied') {
    return (
      <div style={styles.card} data-dca-card="applied">
        <style>{PET_CSS}</style>
        {header(card.degraded ? t('state.applied.degraded') : t('state.applied'), 'done')}
        <div style={styles.footer}>
          <Button size="sm" variant="ghost" onMouseDown={keepFocus} onClick={() => { undo(card.capture) }}>
            {t('action.undo')}
          </Button>
          <Button size="sm" variant="outline" onClick={close}>{t('action.discard')}</Button>
        </div>
      </div>
    )
  }

  // ready
  // 三件套齐了才能写回：占位符合法、有写回入口、提交面空闲（phase 双校验的另一半）
  const canApply = validation.ok && inputActions !== undefined && state.phase === 'plain'
  const tokensText = validation.ok ? '' : validation.broken.join(' ')
  return (
    <div style={styles.card} data-dca-card="ready" role="group" aria-label={t('card.aria')}>
      <style>{PET_CSS}</style>
      {header(t('card.title'), 'plain')}

      <div style={styles.metaRow}>
        <SegmentedControl
          id={'dca-convey-mode-' + String(props.sessionId ?? 'none').replace(/[^a-zA-Z0-9_-]/gu, '-')}
          value={card.mode}
          options={[
            { value: 'light' as ConveyMode, label: t('card.mode.light') },
            { value: 'max' as ConveyMode, label: t('card.mode.max') },
          ]}
          onChange={(next) => { setPlanError(null); controller.recompile(next, card.capture, card.supplement) }}
          label={t('card.mode.label')}
        />
        <span style={styles.modelChip} title={card.model}>{t('card.model', { model: card.model })}</span>
      </div>

      <details style={styles.details}>
        <summary style={styles.summary}>{t('card.original')}</summary>
        <pre style={styles.pre}>{card.capture.draft}</pre>
      </details>

      <div style={styles.resultBlock}>
        <div style={styles.label}>{t('card.result')}</div>
        <textarea
          className="dca-pet-textarea"
          value={card.editedText}
          rows={6}
          aria-label={t('card.result.aria')}
          onChange={(event) => { setPlanError(null); controller.edit(event.target.value) }}
          onMouseDown={(event) => { event.stopPropagation() }}
        />
        <div style={styles.hint}>{t('card.result.hint')}</div>
        {!validation.ok && (
          <div style={styles.errorText}>{t('card.placeholderBroken', { tokens: tokensText })}</div>
        )}
      </div>

      {card.questions.length > 0 && (
        <PetQuestionRow
          mood={'asking' satisfies PetMood}
          title={t('card.questions')}
          questions={card.questions}
          thinkingLabel={t('card.loading')}
          bubbleLabel={t('card.aria')}
        >
          <textarea
            className="dca-pet-textarea"
            value={card.supplement}
            rows={3}
            placeholder={t('card.supplement.placeholder')}
            aria-label={t('card.questions.hint')}
            onChange={(event) => { controller.editSupplement(event.target.value) }}
          />
          <div style={styles.hint}>{t('card.questions.hint')}</div>
        </PetQuestionRow>
      )}

      {card.conflict && (
        <div style={styles.conflict}>
          <div style={styles.conflictTitle}>{t('conflict.title')}</div>
          <div style={styles.hint}>{t('conflict.body')}</div>
          <div style={styles.footer}>
            <Button size="sm" variant="outline" onMouseDown={keepFocus} onClick={() => { apply(true) }}>
              {t('conflict.overwrite')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { controller.clearConflict(); controller.start(card.mode, state) }}
            >
              {t('conflict.recompile')}
            </Button>
          </div>
        </div>
      )}

      {planError !== null && <div style={styles.errorText}>{t(planError)}</div>}

      <div style={styles.footer}>
        <Button
          size="sm"
          variant="primary"
          disabled={!canApply || card.conflict}
          onMouseDown={keepFocus}
          onClick={() => { apply(false) }}
        >
          {t('action.apply')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onMouseDown={keepFocus}
          onClick={() => { setPlanError(null); controller.recompile(card.mode, card.capture, card.supplement) }}
        >
          {t('action.recompile')}
        </Button>
        <Button size="sm" variant="ghost" onClick={close}>{t('action.discard')}</Button>
      </div>
    </div>
  )
}

// ── 内联样式（全部走 --dsw-alias-* token，暗色/亮色都能看） ───────────────────

const styles: Record<string, React.CSSProperties> = {
  buttonGroup: { display: 'inline-flex', alignItems: 'center', gap: 2 },
  card: {
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 8,
    padding: '10px 12px 12px',
    borderRadius: 12,
    border: '1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.14))',
    background: 'var(--dsw-alias-bg-base, #ffffff)',
    color: 'var(--dsw-alias-label-primary, #1f2430)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  headerLeft: { display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 },
  title: { fontWeight: 600, color: 'var(--dsw-alias-label-primary, #1f2430)' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  modelChip: {
    maxWidth: 240,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 12,
    color: 'var(--dsw-alias-label-tertiary, #7c8497)',
  },
  details: {
    marginBottom: 8,
    border: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.08))',
    borderRadius: 8,
    padding: '4px 8px',
    background: 'var(--dsw-alias-bg-base, #ffffff)',
  },
  summary: { cursor: 'pointer', color: 'var(--dsw-alias-label-secondary, #4a5266)', fontSize: 12 },
  pre: {
    margin: '6px 0 2px',
    maxHeight: 180,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: 'var(--dsw-alias-label-secondary, #4a5266)',
  },
  resultBlock: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-secondary, #4a5266)' },
  hint: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary, #7c8497)' },
  errorText: { fontSize: 12, color: 'var(--dsw-alias-state-error-primary, #d64545)', marginTop: 2 },
  conflict: {
    marginTop: 8,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px dashed var(--dsw-alias-state-business-primary, #3aa0e8)',
    background: 'transparent',
  },
  conflictTitle: { fontWeight: 600, marginBottom: 2 },
  footer: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 },
}
