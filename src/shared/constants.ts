/** 插件包名 —— 必须与 package.json 的 name 完全一致（client bundle 的 module id 也用它） */
export const PKG = 'dsh-convey-assistant'

/** 宿主侧受认证路由：浏览器半边只与这一个地址通话 */
export const ROUTE_PATH = '/api/dsh-convey-assistant/rewrite'

/** 模型目录路由（只读）：卡片里的下拉用，返回用户可选的模型清单 */
export const MODELS_PATH = '/api/dsh-convey-assistant/models'

/** 草稿上限（字符）。超出直接拒绝，不做截断，避免"改了一半"的语义事故。 */
export const MAX_DRAFT_CHARS = 8000

/** 单次补全的输出上限。DSH 的 LLM 层默认会物化一个很大的值，这里必须显式收窄。 */
export const MAX_OUTPUT_TOKENS = 4096

/** 单次调用总预算（毫秒）。超时立即中止，卡片报错而不是一直转圈。 */
export const TIMEOUT_MS = 45000

/** 占位符格式：芯片在送模型前被替换成 ⟦R0⟧ / ⟦R1⟧ …，回来再按 occurrence 偏移回插。 */
export const REF_TOKEN_RE = /⟦R(\d+)⟧/g
