/**
 * 常驻桌宠层（v0.2）——「让大肥鱼常驻」打开时挂在 `document.body` 上的 fixed 层。
 *
 * 设计要点（对应需求 C/D/E）：
 * - **安全活动区**：左右各留 48px、上方留 96px；下边界 = 输入卡片上沿 - 24px。
 *   卡片位置每次 resize / 页面滚动（capture 监听，容器滚动也算）都重算；取不到卡片就退化成
 *   `innerHeight - 240`。她永远在输入框与发送键上方，任何情况下不覆盖它们。
 * - **游走**：只用 timer + CSS `transition: transform 2s cubic-bezier(.4,0,.2,1)`，没有 rAF 常驻循环。
 * - **鼠标联动**：全局 mousemove（passive）→ 立刻定格（读当前 transform、关掉过渡）+ alert 表情；
 *   鼠标静止 1200ms 后恢复游走。
 * - **重新登场**：本组件只在 resident=on 时挂载，所以每次开关打开都会重新挂载 → 播一次淡入 + 跳两下。
 * - 无障碍：鱼本体 aria-hidden 且不可 Tab 聚焦；气泡是 aria-live 区域；齿轮按钮在开关行里给键盘用户。
 *
 * 性能：一次游走只改两个 state（目标坐标 + 偶发小动作），DOM 只有 sprite 的几个 path。
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { PetAvatar, type PetMood } from './Pet'
import { useStore } from './store'
import {
  closePetPanel,
  loadSettings,
  openPetPanel,
  petUiStore,
  settingsStore,
  updateSettings,
  formatModelChoice,
  parseModelChoice
} from './settings'
import { loadModelOptions } from './models'
import type { ConveyRegistry } from './controller'
import type { ConveyModelOption, ConveyMode } from '../shared/protocol'
import type { Translate } from './locale'

/** sprite 渲染尺寸（与 pet-css 的 .dca-pet-svg 保持一致） */
const PET_SIZE = 96
/** 安全区左右留白 */
const MARGIN_X = 48
/** 安全区上方留白（避开宿主的会话标题栏 / 顶部工具条） */
const MARGIN_TOP = 96
/** 与输入卡片之间保持的距离（下边界 = 卡片上沿 - 这个值） */
const GAP_ABOVE_CARD = 24
/** 取不到输入卡片时的兜底下边界 */
const FALLBACK_BOTTOM_GAP = 240
/** 单段游走时长（与 pet-css.ts 里 .dca-pet-body 的 transition 时长保持一致） */
const WALK_MS = 2000
/** 鼠标静止多久后恢复活动 */
const IDLE_RESUME_MS = 1200
/** 气泡移开后的收起延迟（穿过间隙不闪） */
const HIDE_BUBBLE_MS = 200
/** 重新登场动画时长 */
const ENTER_MS = 950

/** 一张矩形安全区 */
interface PetArea {
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * 计算安全活动区（左/上/右 + 下边界）。
 *
 * 下边界取"所有挡路方块的最小上沿"再减 24px：
 * - `[data-composer-card]`：宿主输入卡片（本体 + 发送键都在里面）；
 * - `[data-dca-card]`：我们自己的意图审阅卡片——它临时出现在输入卡片**上方**，
 *   不把它算进去的话，她会踩着审阅卡片走路。
 * 一个都取不到（还没挂载 / 被滚出视口）时退化成 `innerHeight - 240`。
 */
export function readPetArea(): PetArea {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  let cardTop = Number.POSITIVE_INFINITY
  const blockers = document.querySelectorAll('[data-composer-card], [data-dca-card]')
  for (const node of blockers) {
    if (!(node instanceof HTMLElement)) continue
    const top = node.getBoundingClientRect().top
    // top <= 0 说明这个方块被滚出视口（或还在布局中），这种值不能用
    if (Number.isFinite(top) && top > 0) cardTop = Math.min(cardTop, top)
  }
  if (!Number.isFinite(cardTop)) cardTop = viewportHeight - FALLBACK_BOTTOM_GAP
  const minX = MARGIN_X
  const maxX = Math.max(minX, viewportWidth - MARGIN_X - PET_SIZE)
  const minY = MARGIN_TOP
  const maxY = Math.max(minY, cardTop - GAP_ABOVE_CARD - PET_SIZE)
  return { minX, maxX, minY, maxY }
}

/** 系统是否开了"减少动态效果" */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(query.matches)
    const onChange = (event: MediaQueryListEvent): void => { setReduce(event.matches) }
    query.addEventListener('change', onChange)
    return () => { query.removeEventListener('change', onChange) }
  }, [])
  return reduce
}

/** 气泡/面板贴在她旁边：按她的当前 x 选左右，贴边时自动翻面 */
function besidePet(pos: { x: number; y: number }, width: number, heightGuess: number): {
  left: number
  top: number
  /** 尾巴朝哪边（left = 气泡在鱼的右边，尾巴指向左） */
  tail: 'left' | 'right'
} {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const fitsRight = pos.x + PET_SIZE + 12 + width <= viewportWidth - 8
  const left = fitsRight
    ? pos.x + PET_SIZE + 12
    : Math.max(8, pos.x - 12 - width)
  const top = clamp(pos.y - 8, 8, Math.max(8, viewportHeight - heightGuess - 8))
  return { left, top, tail: fitsRight ? 'left' : 'right' }
}

/** 挂载容器：创建一个 body 下的 fixed 层并 portal 进去；全局只允许一只（多 composer 时先挂载者胜出） */
let claimedHost: HTMLElement | null = null

/** 桌宠出口：只在 resident=on 时由常驻开关行渲染 */
export function PetOverlay({ t, forge }: { readonly t: Translate; readonly forge: ConveyRegistry }): React.ReactElement | null {
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    if (claimedHost !== null) return undefined
    const element = document.createElement('div')
    element.setAttribute('data-dca-pet-root', '')
    element.className = 'dca-pet-root-layer'
    document.body.appendChild(element)
    claimedHost = element
    setHost(element)
    return () => {
      if (claimedHost === element) claimedHost = null
      element.remove()
      setHost(null)
    }
  }, [])
  if (host === null) return null
  return createPortal(<PetLayer t={t} forge={forge} />, host)
}

/** 桌宠本体 + 气泡 + 面板 */
function PetLayer({ t, forge }: { readonly t: Translate; readonly forge: ConveyRegistry }): React.ReactElement {
  const settings = useStore(settingsStore)
  const busy = useStore(forge.busy)
  const ui = useStore(petUiStore)
  const reduceMotion = useReducedMotion()

  const [area, setArea] = React.useState<PetArea>(() => readPetArea())
  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    const initial = readPetArea()
    return { x: initial.maxX, y: initial.maxY }
  })
  const [frozen, setFrozen] = React.useState(false)
  const [entering, setEntering] = React.useState(true)
  const [action, setAction] = React.useState<'hop' | 'sway' | null>(null)
  const [hover, setHover] = React.useState(false)

  const petRef = React.useRef<HTMLDivElement>(null)
  const areaRef = React.useRef(area)
  areaRef.current = area
  const hideTimer = React.useRef(0)
  const freezeRef = React.useRef<() => void>(() => undefined)
  /** 已经定格时忽略后续 mousemove：否则每移动 1px 都要读一次 computed style + 重渲染 */
  const frozenRef = React.useRef(false)

  // 1) 安全区重算：resize + 任何滚动（capture 才能收到容器内滚动）+ DOM 变动（防抖）
  React.useEffect(() => {
    let pending = 0
    const update = (): void => {
      const next = readPetArea()
      setArea(previous => (previous.minX === next.minX
        && previous.maxX === next.maxX
        && previous.minY === next.minY
        && previous.maxY === next.maxY ? previous : next))
      setPos(current => {
        const x = clamp(current.x, next.minX, next.maxX)
        const y = clamp(current.y, next.minY, next.maxY)
        return x === current.x && y === current.y ? current : { x, y }
      })
    }
    // 流式回复会高频改 DOM：这里必须防抖，否则每次 token 都要量一遍布局
    const schedule = (): void => {
      if (pending !== 0) return
      pending = window.setTimeout(() => {
        pending = 0
        update()
      }, 300)
    }
    update()
    const observer = typeof MutationObserver === 'function'
      ? new MutationObserver(() => { schedule() })
      : null
    observer?.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      observer?.disconnect()
      if (pending !== 0) window.clearTimeout(pending)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [])

  // 2) 重新登场：淡入 + 跳两下（每次打开常驻都会重新挂载一次）
  React.useEffect(() => {
    const timer = window.setTimeout(() => { setEntering(false) }, ENTER_MS)
    return () => { window.clearTimeout(timer) }
  }, [])

  // 3) 鼠标一动：当场定格（读当前 transform 写回坐标，同时关掉过渡）
  const freeze = (): void => {
    if (frozenRef.current) return
    const element = petRef.current
    if (element === null) return
    const matrix = /matrix\(([^)]+)\)/u.exec(window.getComputedStyle(element).transform)
    let x = pos.x
    let y = pos.y
    if (matrix !== null) {
      const parts = matrix[1].split(',').map(part => Number(part.trim()))
      const tx = parts[4]
      const ty = parts[5]
      if (typeof tx === 'number' && Number.isFinite(tx)) x = tx
      if (typeof ty === 'number' && Number.isFinite(ty)) y = ty
    }
    frozenRef.current = true
    setFrozen(true)
    setPos({ x, y })
  }
  freezeRef.current = freeze

  React.useEffect(() => {
    let resumeTimer = 0
    const onMove = (): void => {
      freezeRef.current()
      if (resumeTimer !== 0) window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        resumeTimer = 0
        frozenRef.current = false
        setFrozen(false)
      }, IDLE_RESUME_MS)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (resumeTimer !== 0) window.clearTimeout(resumeTimer)
    }
  }, [])

  // 4) 游走：定时器 + CSS transition；定格/面板打开/关掉活动许可/减少动态时全部停
  React.useEffect(() => {
    if (reduceMotion || !settings.roam || frozen || ui.panelOpen || hover) return undefined
    let stopped = false
    let walkTimer = 0
    let actionTimer = 0
    let clearTimer = 0

    const step = (): void => {
      if (stopped) return
      const current = areaRef.current
      const x = current.minX + Math.random() * (current.maxX - current.minX)
      const y = current.minY + Math.random() * (current.maxY - current.minY)
      setPos({ x: Math.round(x), y: Math.round(y) })
      // 走到之后做个小动作（跳一下 / 晃两下）
      actionTimer = window.setTimeout(() => {
        if (stopped) return
        const next = Math.random() < 0.6 ? 'hop' : 'sway'
        setAction(next)
        clearTimer = window.setTimeout(() => { if (!stopped) setAction(null) }, next === 'hop' ? 1100 : 720)
      }, WALK_MS + 80)
      // 到达后先歇一会儿再决定下一步：走得慢、歇得久，别像抽帧一样乱窜
        walkTimer = window.setTimeout(step, WALK_MS + 2400 + Math.random() * 2400)
    }
    walkTimer = window.setTimeout(step, 800)
    return () => {
      stopped = true
      window.clearTimeout(walkTimer)
      window.clearTimeout(actionTimer)
      window.clearTimeout(clearTimer)
      setAction(null)
    }
  }, [reduceMotion, settings.roam, frozen, ui.panelOpen, hover])

  // 5) 气泡：进/出延迟收起；打开面板时不显示
  const cancelHide = (): void => {
    if (hideTimer.current !== 0) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = 0
    }
  }
  React.useEffect(() => () => { cancelHide() }, [])

  const onPointerEnter = (): void => {
    cancelHide()
    setHover(true)
  }
  const onPointerLeave = (): void => {
    cancelHide()
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = 0
      setHover(false)
    }, HIDE_BUBBLE_MS)
  }

  // 表情优先级：在改写（thinking）> 鼠标悬停问配置（asking）> 被鼠标抓包定格（alert）> 待机
  const mood: PetMood = busy > 0
    ? 'thinking'
    : hover && !ui.panelOpen
      ? 'asking'
      : frozen ? 'alert' : 'idle'

  const showBubble = hover && !ui.panelOpen
  const bubbleStyle = besidePet(pos, 232, 110)
  const panelStyle = besidePet(pos, 300, 420)

  const enterClass = entering ? ' dca-pet-body--enter' : ''
  const frozenClass = frozen ? ' dca-pet-body--frozen' : ''
  const actionClass = action === 'hop' ? ' dca-pet-hop' : action === 'sway' ? ' dca-pet-sway-once' : ''

  // 用 HTMLElement 泛型：同一个处理函数既要挂在 div（鱼本体）上，也要挂在气泡的 button 上
  const onPetClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    setHover(false)
    openPetPanel()
  }

  const onPetMouseDown = (event: React.MouseEvent<HTMLElement>): void => {
    // 绝不抢输入框焦点
    event.preventDefault()
  }

  return (
    <>
      <div
        ref={petRef}
        className={'dca-pet-body' + frozenClass + enterClass + actionClass}
        style={{ transform: 'translate3d(' + String(pos.x) + 'px, ' + String(pos.y) + 'px, 0)' }}
        onClick={onPetClick}
        onMouseDown={onPetMouseDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        aria-hidden="true"
      >
        <div className="dca-pet-breath">
          <PetAvatar mood={mood} />
        </div>
      </div>

      {showBubble && (
        <div
          className={'dca-pet-float-bubble' + (bubbleStyle.tail === 'left' ? ' dca-pet-float-bubble--tl' : ' dca-pet-float-bubble--tr')}
          style={{ left: bubbleStyle.left, top: bubbleStyle.top }}
          role="status"
          aria-live="polite"
          onPointerEnter={cancelHide}
          onPointerLeave={onPointerLeave}
        >
          <button type="button" className="dca-pet-bubble-hit" onMouseDown={onPetMouseDown} onClick={onPetClick}>
            {t('pet.hover')}
          </button>
        </div>
      )}

      {ui.panelOpen && (
        <PetSettingsPanel
          t={t}
          style={{ left: panelStyle.left, top: panelStyle.top }}
          anchor={pos}
          onClose={closePetPanel}
        />
      )}
    </>
  )
}

/** 配置面板（popover，非 modal：不抢焦点、不锁滚动） */
function PetSettingsPanel({ t, style, onClose }: {
  readonly t: Translate
  readonly style: React.CSSProperties
  readonly anchor: { x: number; y: number }
  readonly onClose: () => void
}): React.ReactElement {
  const settings = useStore(settingsStore)
  const [options, setOptions] = React.useState<readonly ConveyModelOption[]>([])
  const [loadingModels, setLoadingModels] = React.useState(true)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // 打开时拉一次模型目录（失败静默：只剩"跟随当前对话"）
  React.useEffect(() => {
    let cancelled = false
    setLoadingModels(true)
    void loadModelOptions({ force: true }).then((list) => {
      if (cancelled) return
      setOptions(list)
      setLoadingModels(false)
    })
    return () => { cancelled = true }
  }, [])

  // Esc 收起 + 点面板外面收起（都不动焦点）
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) === true) return
      // 点桌宠本体由它自己的 click 处理（会重新打开面板），这里只处理"真正的外面"
      const petBody = document.querySelector('.dca-pet-body')
      if (petBody !== null && petBody.contains(target)) return
      // 开关行上的齿轮自己会重新打开面板，别在这里抢先关掉
      if (target instanceof Element && target.closest('.dca-pet-gear') !== null) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [onClose])

  const selected = settings.model
  const selectedKnown = options.some(option => formatModelChoice(option.provider, option.model) === selected)
  const modeOptions: readonly { value: ConveyMode; title: string; description: string }[] = [
    { value: 'light', title: t('panel.mode.light'), description: t('panel.mode.light.desc') },
    { value: 'max', title: t('panel.mode.max'), description: t('panel.mode.max.desc') }
  ]

  return (
    <div className="dca-pet-panel" style={style} ref={panelRef} role="group" aria-label={t('panel.aria')}>
      <div className="dca-pet-panel-head">
        <span className="dca-pet-panel-title">{t('panel.title')}</span>
        <button type="button" className="dca-pet-panel-close" aria-label={t('panel.close')} onClick={onClose}>
          ✕
        </button>
      </div>

      <label className="dca-pet-panel-label" htmlFor="dca-pet-model">{t('panel.model')}</label>
      <select
        id="dca-pet-model"
        className="dca-pet-select"
        value={selected === '' ? '' : selected}
        onChange={(event) => { updateSettings({ model: event.target.value }) }}
      >
        <option value="">{t('panel.model.follow')}</option>
        {!selectedKnown && selected !== '' && (
          <option value={selected}>{t('panel.model.missing')}</option>
        )}
        {options.map((option) => {
          const value = formatModelChoice(option.provider, option.model)
          return (
            <option key={value} value={value}>
              {option.providerLabel + ' · ' + option.label}
            </option>
          )
        })}
      </select>
      {loadingModels && <div className="dca-pet-panel-hint">{t('panel.model.loading')}</div>}
      {!loadingModels && options.length === 0 && (
        <div className="dca-pet-panel-hint">{t('panel.model.empty')}</div>
      )}
      {options.length > 0 && parseModelChoice(selected) === undefined && (
        <div className="dca-pet-panel-hint">{t('panel.model.hint')}</div>
      )}

      <div className="dca-pet-panel-label">{t('panel.mode')}</div>
      <div className="dca-pet-modes" role="radiogroup" aria-label={t('panel.mode')}>
        {modeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={settings.mode === option.value}
            className={'dca-pet-mode' + (settings.mode === option.value ? ' dca-pet-mode--on' : '')}
            onClick={() => { updateSettings({ mode: option.value }) }}
          >
            <span className="dca-pet-mode-title">{option.title}</span>
            <span className="dca-pet-mode-desc">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="dca-pet-panel-label">{t('panel.roam')}</div>
      <button
        type="button"
        role="switch"
        aria-checked={settings.roam}
        className={'dca-pet-roam' + (settings.roam ? ' dca-pet-roam--on' : '')}
        onClick={() => { updateSettings({ roam: !settings.roam }) }}
      >
        <span className="dca-pet-roam-dot" aria-hidden="true" />
        <span className="dca-pet-roam-text">{settings.roam ? t('panel.roam.on') : t('panel.roam.off')}</span>
      </button>

      <div className="dca-pet-panel-note">{t('panel.note')}</div>
    </div>
  )
}

/** 供常驻开关行使用：把默认偏好读出（首次渲染 SSR 安全） */
export function readResidentDefault(): boolean {
  return loadSettings().resident
}
