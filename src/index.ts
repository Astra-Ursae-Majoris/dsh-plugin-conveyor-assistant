/**
 * dsh-convey-assistant —— 宿主半边入口（构建产物：lib/index.js，ESM）。
 *
 * 模型："把输入框草稿编译成 AI Agent 不会误读的版本"。浏览器半边只在同一个受认证
 * 路由上 POST 一次；模型调用发生在宿主，浏览器永远不直连模型端点。
 *
 * 硬约束 → 代码位置（复核用；行号会漂移，所以用锚点）：
 *   · 只走受认证精确 Fetch 路由（webServer.register 不认证） → host/route.ts#registerRoute
 *   · 双保险 Host/Origin + Cookie 认证           → host/route.ts#handleRequest 第 1 步
 *   · 请求校验：method/content-type/64KB/mode/draft 上限（不截断） → host/validate.ts
 *   · 模型解析三级链 + 显式配置 + 显式失败 no-model → host/model.ts#resolveRoute
 *   · 一次性 LLM 调用：无工具/无历史/无 sessionId、maxTokens、推理最低档、总超时、客户端取消 → host/complete.ts#callModel
 *   · 输出硬校验：JSON 抽取、questions ≤3 且 ≤200 字、⟦Rn⟧ 数量+顺序一致 → host/output.ts#parseModelOutput
 *   · 错误映射只回稳定 code + 一句用户文案，绝不回传草稿或上游原文 → host/errors.ts
 *   · 不写会话事件、不写日志、不产生额外网络出口 → 全链路均无对应调用（见各文件头注释）
 *
 * 对宿主服务的依赖：
 *   · llm（必需）         —— 唯一的模型出口，鉴权由适配器内部的 credential 解析完成
 *   · connection（必需）  —— /api 受认证传输；精确 Fetch 路由只有 owner Peer 能到达
 *   · sessions / agents / agentDefaultModel（可选）—— 只用于读"用户当前选的模型"
 */
import type { Context } from '@deepseek-ai/cordis'
import { normalizeConfig, registerRoute, type ConveyPluginConfig } from './host/route.js'

/** 插件名：与 package.json 的 name 一致，也是 Cordis loader 里的条目标识。 */
export const name = 'dsh-convey-assistant'

/**
 * 必需的宿主服务。
 * sessions/agents/agentDefaultModel 故意不写进 inject：它们只是模型解析的降级来源，
 * 缺席时路由应继续可用（退回到显式配置或 no-model），而不是整个插件不激活。
 */
export const inject = ['llm', 'connection']

/**
 * Cordis 插件入口。
 * @param ctx 宿主上下文
 * @param config cordis.patch.yml 的 config 段（可选：provider/model 强制指定）
 */
export function apply(ctx: Context, config?: ConveyPluginConfig): void {
  registerRoute(ctx, normalizeConfig(config))
}
