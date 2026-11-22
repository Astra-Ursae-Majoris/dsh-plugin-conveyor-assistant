/**
 * 浏览器半边入口（构建入口：`src/client/index.tsx`，产物 `lib/client.js`）。
 *
 * 装配顺序（与官方客户端插件一致，见 C 报告 §1.4 / §6）：
 * 1. 注册 i18n 字典（zh / en；缺 key 由框架沿 fallback 链回退）；
 * 2. 建 per-session 控制器注册表，并挂到插件 fiber 上（卸载即全部中止）；
 * 3. 用 `ctx.slots.inject(name, cb)` 等槽位被声明后，再 `register` 三个入口
 *    （直接 register 一个还没被声明的槽会抛错）：
 *    · conversation.input.left     —— ✨ 一个按钮
 *    · conversation.input.dock     —— 意图确认卡片（unchanged）
 *    · conversation.composer.dock  —— v0.2「让大肥鱼常驻」开关行 + 桌宠宿主
 *
 * 注意：本文件不 import 任何未安装的客户端包；服务只通过结构类型访问（见 types.ts 顶部说明）。
 */

import type { Context } from '@deepseek-ai/cordis'
import { ConveyButtons, ConveyCard } from './components'
import { ConveyRegistry } from './controller'
import { readRecentContext } from './context'
import { createTranslate, en, NS, zh } from './locale'
import { ConveyDock } from './ResidentDock'
import { currentModelOverride } from './settings'
import type { LocaleFace, SessionsFace, SlotsFace } from './types'

/** 本插件依赖的服务：槽位注册表 + 语言运行时（其余服务按需 get，不强制注入） */
export const inject = ['slots', 'locale']

/** 插件名（诊断用） */
export const name = 'convey-assistant'

/** 槽位注册表 / 语言运行时的结构面 */
interface ConveyServices {
  readonly slots: SlotsFace
  readonly locale: LocaleFace
}

/** 按名字取一个可选服务；不存在或形状不符就是 undefined（绝不抛） */
function readService<T>(ctx: Context, serviceName: string): T | undefined {
  try {
    const getter = (ctx as unknown as { get?: (name: string) => unknown }).get
    if (typeof getter !== 'function') return undefined
    const service = getter.call(ctx, serviceName)
    return service === null || service === undefined ? undefined : (service as T)
  } catch {
    return undefined
  }
}

/**
 * 挂载浏览器半边。
 * @param ctx - 客户端 Cordis 上下文（由模块系统在 `lib/client.js` 工厂里创建）
 */
export function apply(ctx: Context): void {
  const services = ctx as unknown as ConveyServices

  // 1) 文案字典：zh 是主语言，en 是必备的英文基线（两者 key 必须一一对齐）
  ctx.effect(
    () => services.locale.register(NS, { zh, en } as unknown as Record<string, Record<string, string>>) as () => void,
    'convey-assistant: dictionaries',
  )

  // 2) 当前语言：优先宿主语言设置，读不到退回浏览器语言，再退回 en
  const readLocaleTag = (): string => {
    try {
      const snapshot = services.locale.getSnapshot?.()
      const active = snapshot?.active
      if (typeof active === 'string' && active !== '') return active
    } catch {
      // 语言服务读不到不致命，继续往下退
    }
    if (typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language !== '') return navigator.language
    return 'en'
  }
  const t = createTranslate(readLocaleTag)

  // 3) per-session 控制器注册表；会话服务是可选的（只用于取"上一轮对话"做 context）
  const sessions = readService<SessionsFace>(ctx, 'sessions')
  // 第三个参数是"用户临时挑的模型"：每次发请求时现读，所以面板里改完下一次就生效
  const forge = new ConveyRegistry(
    readLocaleTag,
    (sessionId, draft) => readRecentContext(sessions, sessionId, draft),
    () => currentModelOverride(),
  )
  ctx.effect(() => () => { forge.dispose() }, 'convey-assistant: per-session controllers')

  // 4) 两个槽位入口：等槽位被声明后再注册（迟到的槽也能装上）
  const face = (): Record<string, unknown> => ({ forge, t })
  services.slots.inject('conversation.input.left', () => services.slots.register({
    name: 'conversation.input.left',
    id: 'convey-assistant.buttons',
    order: 10,
    inject: face,
  }, ConveyButtons))

  services.slots.inject('conversation.input.dock', () => services.slots.register({
    name: 'conversation.input.dock',
    id: 'convey-assistant.card',
    order: 10,
    inject: face,
  }, ConveyCard))

  // v0.2：输入卡片**下方**的常驻开关行（同时是桌宠的挂载点）
  services.slots.inject('conversation.composer.dock', () => services.slots.register({
    name: 'conversation.composer.dock',
    id: 'convey-assistant.resident',
    order: 20,
    inject: face,
  }, ConveyDock))
}
