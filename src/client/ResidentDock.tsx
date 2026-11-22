/**
 * 常驻开关行（v0.2）：挂在 `conversation.composer.dock`（输入卡片**下方**的整宽 list 槽）。
 *
 * 一行紧凑控件：`[●] 让 DSH娘 常驻` + （常驻时）一个"配置娘"的小齿轮。
 * 开关状态存 localStorage（`settings.ts`），默认 ON。
 *
 * 桌宠本体（PetOverlay）由这里挂载：它只在 resident=on 时存在，所以每次"关掉→再打开"
 * 都是一次重新挂载 → 重新登场动画自然会播。
 */

import * as React from 'react'
import { PET_CSS } from './pet-css'
import { PetOverlay } from './PetOverlay'
import { closePetPanel, openPetPanel, settingsStore, updateSettings } from './settings'
import { useStore } from './store'
import type { ConveySlotProps } from './components'

/**
 * 同一个页面里可能同时挂着两个 composer（主对话 + 右侧栏子代理对话），
 * 而 `conversation.composer.dock` 会在这两处各渲染一次。常驻开关与桌宠**只该有一份**：
 * 用模块级标记让先挂载的那个实例当宿主，后挂载的直接渲染 null。
 * （先挂载者通常是主对话；若它被卸载，开关行会跟着消失，直到再次挂载——已知且可接受。）
 */
let dockClaimed = false

/** 常驻开关 + 桌宠宿主（挂在 conversation.composer.dock） */
export function ConveyDock(props: ConveySlotProps): React.ReactElement | null {
  const { t, forge } = props
  const settings = useStore(settingsStore)
  const [primary, setPrimary] = React.useState(false)

  React.useEffect(() => {
    if (dockClaimed) return undefined
    dockClaimed = true
    setPrimary(true)
    return () => {
      dockClaimed = false
      setPrimary(false)
    }
  }, [])

  if (!primary) return null

  const toggleResident = (): void => {
    const next = !settings.resident
    updateSettings({ resident: next })
    // 关掉常驻时顺手收起配置面板，否则下次打开她会带着旧面板一起"重新登场"
    if (!next) closePetPanel()
  }

  return (
    <div className="dca-pet-dock">
      <style>{PET_CSS}</style>
      <button
        type="button"
        role="switch"
        aria-checked={settings.resident}
        aria-label={t('switch.resident')}
        className={'dca-pet-switch' + (settings.resident ? ' dca-pet-switch--on' : '')}
        onMouseDown={(event) => { event.preventDefault() }}
        onClick={toggleResident}
      >
        <span className="dca-pet-switch-dot" aria-hidden="true" />
        <span className="dca-pet-switch-text">{t('switch.resident')}</span>
      </button>
      {settings.resident && (
        <button
          type="button"
          className="dca-pet-gear"
          aria-label={t('switch.configure')}
          title={t('switch.configure')}
          onMouseDown={(event) => { event.preventDefault() }}
          onClick={() => { openPetPanel() }}
        >
          <span aria-hidden="true">⚙</span>
        </button>
      )}
      {settings.resident && <PetOverlay t={t} forge={forge} />}
    </div>
  )
}
