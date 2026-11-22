/**
 * 模型目录 —— 给卡片里的"选模型"下拉用。
 *
 * 只读、无副作用、无缓存写入：
 *   · 走 ctx.llm.listProviders() 拿已注册路由，再逐个 listModels(provider) 拿目录；
 *   · 任何一个 provider 目录抛错/为空都不影响其它 provider；
 *   · 全部为空时返回空数组，前端会降级成只有"跟随当前对话"一项。
 *
 * 隐私：这里只读"有哪些模型"，不读任何会话内容，也不发网络请求（目录来自适配器内存）。
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-llm'
import type { ConveyModelOption } from '../shared/protocol.js'

/** 列出一个模型下拉项的上限，避免自定义端点公布海量目录时把浏览器撑爆 */
const MAX_OPTIONS = 200

/**
 * 汇总所有 provider 公布的模型目录。
 * @param ctx 宿主上下文（inject 已保证 llm 存在）
 * @returns 扁平化的可选模型列表（provider 注册序 + 适配器偏好序）
 */
export async function listModelOptions(ctx: Context): Promise<ConveyModelOption[]> {
  let providers: readonly { id: string; name: string }[]
  try {
    providers = ctx.llm.listProviders()
  } catch {
    return []
  }

  const options: ConveyModelOption[] = []
  for (const provider of providers) {
    if (options.length >= MAX_OPTIONS) break
    let models: readonly { id: string; name?: string; description?: string }[]
    try {
      models = await ctx.llm.listModels(provider.id)
    } catch {
      // 某个 provider 的目录不可用（未登录、适配器没实现 listModels）就跳过它
      continue
    }
    for (const model of models) {
      if (options.length >= MAX_OPTIONS) break
      if (typeof model.id !== 'string' || model.id === '') continue
      options.push({
        provider: provider.id,
        providerLabel: provider.name,
        model: model.id,
        label: typeof model.name === 'string' && model.name !== '' ? model.name : model.id,
        ...(typeof model.description === 'string' && model.description !== '' ? { description: model.description } : {}),
      })
    }
  }
  return options
}
