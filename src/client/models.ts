/**
 * 模型目录（只读路由 `MODELS_PATH`，POST 一次）。
 *
 * 约定：
 * - 打开配置面板时才拉，拉完缓存到本次会话内存里（不落 localStorage，避免"目录过期"的鬼故事）；
 * - 任何失败（404 / 非 JSON / 形状不对 / 超时）都静默降级成空数组，面板只显示"跟随当前对话"；
 * - 这里只读"有哪些模型"，不读任何会话内容。
 */

import { MODELS_PATH } from '../shared/constants'
import type { ConveyModelOption } from '../shared/protocol'

/** 一次目录请求的超时（目录是本地内存汇总，正常几十毫秒；给 6s 足够宽） */
const MODELS_TIMEOUT_MS = 6000

/** 本次页面会话内的目录缓存（成功拉取后才写） */
let cached: readonly ConveyModelOption[] | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 把未知 JSON 收窄成选项数组；形状不对返回 undefined */
function parseOptions(value: unknown): readonly ConveyModelOption[] | undefined {
  if (!isRecord(value)) return undefined
  if (value['ok'] !== true) return undefined
  const raw = value['options']
  if (!Array.isArray(raw)) return undefined
  const options: ConveyModelOption[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const provider = item['provider']
    const providerLabel = item['providerLabel']
    const model = item['model']
    const label = item['label']
    if (typeof provider !== 'string' || provider === '') continue
    if (typeof model !== 'string' || model === '') continue
    options.push({
      provider,
      providerLabel: typeof providerLabel === 'string' && providerLabel !== '' ? providerLabel : provider,
      model,
      label: typeof label === 'string' && label !== '' ? label : model,
      ...(typeof item['description'] === 'string' && item['description'] !== ''
        ? { description: item['description'] }
        : {})
    })
  }
  return options
}

/**
 * 拉一次模型目录（POST，受认证路由）。
 * @param options.force - true 时忽略缓存重新拉（用户重新打开面板想看到新模型）
 * @returns 选项数组；任何失败都是空数组
 */
export async function loadModelOptions(options: { force?: boolean } = {}): Promise<readonly ConveyModelOption[]> {
  if (cached !== undefined && options.force !== true) return cached
  const controller = new AbortController()
  const timer = window.setTimeout(() => { controller.abort() }, MODELS_TIMEOUT_MS)
  try {
    const response = await fetch(MODELS_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal
    })
    if (!response.ok) return []
    const parsed = parseOptions(await response.json() as unknown)
    if (parsed === undefined) return []
    cached = parsed
    return parsed
  } catch {
    // 404（宿主半边没装）/ 断网 / 超时：都降级成"只有跟随当前对话"
    return []
  } finally {
    window.clearTimeout(timer)
  }
}

/** 测试/重新挂载时清掉缓存 */
export function resetModelOptionsCache(): void {
  cached = undefined
}
