/**
 * 浏览器侧偏好设置（v0.2）：常驻开关 / 说话方式 / 活动许可 / 选中的模型。
 *
 * 为什么用 localStorage 而不是宿主设置：
 * - 这些都是**外观/交互偏好**，不是会话数据；放浏览器本地，不写会话、不出网；
 * - 宿主侧已经有自己的模型解析链，这里只存"用户帮她挑了哪个模型"，随请求临时带上（provider/model），
 *   不改变会话模型（宿主 route.ts 的实现即如此）。
 *
 * 读不到（隐私模式 / 配额 / SSR）时一律回退到默认值：**常驻 ON、活动许可 ON、说话方式 max、模型跟随当前对话**。
 */

import { Store } from './store'
import type { ConveyMode } from '../shared/protocol'

/** localStorage key（全部以包名为前缀，避免和宿主/别的插件撞车） */
export const SETTINGS_KEYS = {
  resident: 'dsh.convey-assistant.petResident',
  model: 'dsh.convey-assistant.model',
  mode: 'dsh.convey-assistant.mode',
  roam: 'dsh.convey-assistant.roam'
} as const

/** 一次"跟她有关的"全部偏好 */
export interface ConveySettings {
  /** 让 DSH娘 常驻（默认 true：第一次安装就该看见她） */
  readonly resident: boolean
  /** 活动许可：允许她在安全区里乱跑（默认 true） */
  readonly roam: boolean
  /** 说话方式：light=先听我说完；max=猜猜我到底想要什么（默认 max） */
  readonly mode: ConveyMode
  /** 选中的模型：'' = 跟随当前对话；否则 'provider\u0000model' */
  readonly model: string
}

/** 模型选择值的分隔符（用户可见的 label 里不会出现，安全） */
const MODEL_SEPARATOR = '\u0000'

/** localStorage 读取（任何异常都当作"没存过"） */
function readRaw(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** localStorage 写入（隐私模式/配额满时静默失败，不影响本次会话里的选择） */
function writeRaw(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {
    // 隐私模式或配额：这次选择只在内存里生效，不打扰用户
  }
}

/** 读出一份完整偏好（缺省值即默认值） */
export function loadSettings(): ConveySettings {
  const resident = readRaw(SETTINGS_KEYS.resident)
  const roam = readRaw(SETTINGS_KEYS.roam)
  const mode = readRaw(SETTINGS_KEYS.mode)
  const model = readRaw(SETTINGS_KEYS.model)
  return {
    // 没存过 = 第一次安装 = 出现（用户明确关了才算 off）
    resident: resident === null ? true : resident !== 'off',
    roam: roam === null ? true : roam !== 'off',
    mode: mode === 'light' ? 'light' : 'max',
    model: model === null ? '' : model
  }
}

/** 全局偏好 store（组件用 useStore 订阅；非 React 代码直接 getSnapshot） */
export const settingsStore = new Store<ConveySettings>(loadSettings())

/** 合并写入：更新内存 + 落盘（只写变化的那个 key，失败静默） */
export function updateSettings(patch: Partial<ConveySettings>): void {
  const current = settingsStore.getSnapshot()
  const next: ConveySettings = { ...current, ...patch }
  if (next.resident === current.resident
    && next.roam === current.roam
    && next.mode === current.mode
    && next.model === current.model) return
  settingsStore.set(next)
  if (next.resident !== current.resident) writeRaw(SETTINGS_KEYS.resident, next.resident ? 'on' : 'off')
  if (next.roam !== current.roam) writeRaw(SETTINGS_KEYS.roam, next.roam ? 'on' : 'off')
  if (next.mode !== current.mode) writeRaw(SETTINGS_KEYS.mode, next.mode)
  if (next.model !== current.model) writeRaw(SETTINGS_KEYS.model, next.model)
}

/** 把 '<provider>\u0000<model>' 解析成宿主请求里的 provider/model；空值 = 跟随当前对话 */
export function parseModelChoice(value: string): { provider: string; model: string } | undefined {
  if (value === '') return undefined
  const at = value.indexOf(MODEL_SEPARATOR)
  if (at <= 0) return undefined
  const provider = value.slice(0, at)
  const model = value.slice(at + MODEL_SEPARATOR.length)
  if (provider === '' || model === '') return undefined
  return { provider, model }
}

/** 把 provider + model 拼成 select 的 value */
export function formatModelChoice(provider: string, model: string): string {
  return provider + MODEL_SEPARATOR + model
}

/** 当前生效的模型覆盖（给控制器在读【发出请求那一刻】调用，保证"改完立刻生效"） */
export function currentModelOverride(): { provider: string; model: string } | undefined {
  return parseModelChoice(settingsStore.getSnapshot().model)
}

/**
 * 临时 UI 状态（不落盘）：配置面板是否打开。
 * 为什么要单独放一个 store：面板挂在桌宠层（portal 到 body），而打开它的入口有两个——
 * 桌宠本体/气泡（鼠标）和常驻开关旁边的小齿轮（键盘可达）。两边共享同一个开关。
 */
export const petUiStore = new Store<{ panelOpen: boolean }>({ panelOpen: false })

/** 打开配置面板 */
export function openPetPanel(): void {
  petUiStore.set({ panelOpen: true })
}

/** 收起配置面板 */
export function closePetPanel(): void {
  petUiStore.set({ panelOpen: false })
}

/** 切换配置面板 */
export function togglePetPanel(): void {
  petUiStore.set({ panelOpen: !petUiStore.getSnapshot().panelOpen })
}
