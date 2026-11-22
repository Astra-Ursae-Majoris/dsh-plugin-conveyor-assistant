/**
 * 客户端文案（zh / en）。
 *
 * 说明 / why this file exists:
 * - 官方插件把 UI 文案放在 `src/client/locales.ts` 并通过 `ctx.locale.register(NS, {...})` 注册（见 C 报告 §6.1）；
 *   缺 key 时框架沿 fallback 链回退，最后原样返回 key —— 所以 zh / en 必须一一对齐。
 * - 这里同时导出自己实现的 `translate()`：组件拿到的是「绑定了 NS 的 t」，不依赖框架合成的 t 座位，
 *   从而避免 locale face 未安装时渲染直接报错。
 */

/** 文案命名空间（与包名一致，便于日志排查） */
export const NS = 'convey-assistant'

/** 中文（基线语言之一） */
export const zh = {
  'btn.convey': '让娘把草稿翻一遍',
  'btn.convey.aria': '把草稿交给 DSH娘 改写',

  'switch.resident': '让 DSH娘 常驻',
  'switch.configure': '配置娘',
  'switch.aria': '常驻开关',

  'pet.hover': '主人，你要配置一下我吗？',
  'pet.bubble.aria': 'DSH娘 想跟你说句话',

  'panel.aria': 'DSH娘 的配置',
  'panel.title': '娘的小设置~',
  'panel.close': '收起设置',
  'panel.model': '用哪个脑袋',
  'panel.model.follow': '跟随当前对话',
  'panel.model.loading': '正在翻她的模型抽屉…',
  'panel.model.empty': '她只认得"跟随当前对话"这一项，先这样用着吧~',
  'panel.model.hint': '只影响这次改写，不会改变会话模型~',
  'panel.model.missing': '（你原先挑的那个模型，现在不在目录里了）',
  'panel.mode': '说话方式',
  'panel.mode.light': '先听我说完',
  'panel.mode.light.desc': '只把我打的字整理成列点，一个词都不换',
  'panel.mode.max': '猜猜我到底想要什么',
  'panel.mode.max.desc': '读懂我的意思，再用 Agent 不会误会的说法重写一遍',
  'panel.roam': '活动许可',
  'panel.roam.on': '你可以放松了，到处跑跑吧~',
  'panel.roam.off': '呆住，不准动',
  'panel.note': '这次改写只用你选的模型，不会改变会话模型~',

  'card.aria': '意图确认卡片',
  'card.title': '先确认一下意图~',
  'card.model': '模型：{model}',
  'card.close': '关闭卡片',
  'card.mode.label': '改写档位',
  'card.mode.light': '轻 · 列点',
  'card.mode.max': '重 · 意图',

  'card.original': '原文',
  'card.original.hint': '你刚才写下的草稿',
  'card.result': '改写结果',
  'card.result.hint': '可以直接在这里改字，改完再确认写回',
  'card.result.aria': '改写结果，可编辑',
  'card.placeholderBroken': '引用占位符被改坏了：{tokens}。把它们恢复成原样才能写回~',

  'card.loading': '正在读你的草稿…',
  'card.loading.hint': '只把这一段草稿发给模型，不会写进会话记录',
  'card.questions': '我想了一下，这个要求好像不太明确呢~',
  'card.questions.hint': '把答案写在这里，我带上重新编译一次（不用逐条回答）',
  'card.supplement.placeholder': '比如：那个脚本指的是 tools/run_hhg.mjs',

  'action.apply': '确认写回',
  'action.recompile': '重新编译',
  'action.discard': '放弃',
  'action.retry': '重试',
  'action.undo': '撤销写回',

  'state.applied': '已写回草稿，发送键还在你手里~',
  'state.applied.degraded': '已写回草稿。这次引用芯片退化成了普通文本，发出去之前检查一下 @ 路径~',
  'state.undoDone': '已还原成改写前的草稿',

  'conflict.title': '草稿在编译期间变过了',
  'conflict.body': '再覆盖就可能吞掉你刚打的字。你说了算：',
  'conflict.overwrite': '仍然写回（覆盖当前草稿）',
  'conflict.recompile': '用最新草稿重新编译',

  'error.title': '这次没编译成',
  'error.no-model': '没找到可用的模型，先在设置里选一个模型再试试~',
  'error.timeout': '模型太久没回话，已经帮你停下来了，可以再试一次~',
  'error.aborted': '已取消',
  'error.upstream': '模型那边出错了，换个时间再试试~',
  'error.bad-output': '模型的回复没法解析成结构化结果，再试一次通常就好~',
  'error.too-long': '草稿太长了，这一次先不处理~',
  'error.bad-request': '请求没被接受（插件版本可能对不上）~',
  'error.host-missing': '宿主半边没加载：请确认插件已完整安装并刷新页面~',
  'error.network': '连不上宿主半边，检查一下页面是否还在运行~',
  'error.empty': '草稿是空的，先写点什么吧~',
  'error.tooLongClient': '草稿超过 {max} 个字符，这一次先不处理~',
  'error.placeholder': '改写结果里的引用占位符对不上，为了不弄丢你的 @ 引用，这次不写回~',
  'error.command': '草稿开头的命令芯片（/xxx）在改写里走丢了，为了不让命令失效，这次不写回~',
  'error.auth': '这次请求没有通过宿主侧的会话校验，刷新一下页面再试试~',
  'error.unknown': '遇到了没预料到的问题，可以再试一次~'
} as const

/** 英文（基线语言之二；key 必须与 zh 完全一致） */
export const en: Record<keyof typeof zh, string> = {
  'btn.convey': 'Let her read your draft',
  'btn.convey.aria': 'Hand the draft to the DSH girl for a rewrite',

  'switch.resident': 'Keep the DSH girl around',
  'switch.configure': 'Configure her',
  'switch.aria': 'Resident switch',

  'pet.hover': 'Master, would you like to configure me~',
  'pet.bubble.aria': 'The DSH girl has something to say',

  'panel.aria': 'DSH girl settings',
  'panel.title': 'Her little settings~',
  'panel.close': 'Close settings',
  'panel.model': 'Which brain she uses',
  'panel.model.follow': 'Follow this conversation',
  'panel.model.loading': 'Rummaging through her model drawer…',
  'panel.model.empty': 'She only knows "follow this conversation" for now~',
  'panel.model.hint': 'Only affects this rewrite; the conversation model stays the same~',
  'panel.model.missing': '(the model you picked is no longer listed)',
  'panel.mode': 'How she talks',
  'panel.mode.light': 'Let me finish first',
  'panel.mode.light.desc': 'Just tidies my words into bullets, not a single word changed',
  'panel.mode.max': 'Guess what I actually want',
  'panel.mode.max.desc': 'Reads my intent, then rewrites it so an agent cannot misread it',
  'panel.roam': 'Permission to move',
  'panel.roam.on': 'You may relax and wander around~',
  'panel.roam.off': 'Freeze. Do not move.',
  'panel.note': 'This rewrite only uses the model you picked; your conversation model stays the same~',

  'card.aria': 'Intent confirmation card',
  'card.title': 'Let me confirm the intent~',
  'card.model': 'Model: {model}',
  'card.close': 'Close the card',
  'card.mode.label': 'Rewrite depth',
  'card.mode.light': 'Light · bullets',
  'card.mode.max': 'Deep · intent',

  'card.original': 'Original',
  'card.original.hint': 'The draft you just wrote',
  'card.result': 'Rewritten',
  'card.result.hint': 'Edit the text right here if you want, then confirm',
  'card.result.aria': 'Rewritten draft, editable',
  'card.placeholderBroken': 'Reference placeholders were altered: {tokens}. Restore them to write back~',

  'card.loading': 'Reading your draft…',
  'card.loading.hint': 'Only this draft goes to the model; nothing is written to the session log',
  'card.questions': 'I paused on something that is not clear yet~',
  'card.questions.hint': 'Answer here and I will recompile with it (no need to answer each one)',
  'card.supplement.placeholder': 'e.g. that script means tools/run_hhg.mjs',

  'action.apply': 'Write back',
  'action.recompile': 'Recompile',
  'action.discard': 'Discard',
  'action.retry': 'Retry',
  'action.undo': 'Undo write-back',

  'state.applied': 'Written back. The send button is still yours~',
  'state.applied.degraded': 'Written back. Reference chips degraded to plain text this time — check the @ paths before sending~',
  'state.undoDone': 'Restored the draft from before the rewrite',

  'conflict.title': 'The draft changed while compiling',
  'conflict.body': 'Overwriting now could swallow what you just typed. Your call:',
  'conflict.overwrite': 'Write back anyway (replace the draft)',
  'conflict.recompile': 'Recompile from the latest draft',

  'error.title': 'That compile did not land',
  'error.no-model': 'No usable model found. Pick one in settings and try again~',
  'error.timeout': 'The model stayed quiet too long, so it was stopped. Try again~',
  'error.aborted': 'Cancelled',
  'error.upstream': 'The model side failed. Try again a bit later~',
  'error.bad-output': 'The reply could not be parsed into a structured result. One more try usually works~',
  'error.too-long': 'The draft is too long for one pass~',
  'error.bad-request': 'The request was not accepted (the plugin versions may not match)~',
  'error.host-missing': 'The host half is not loaded. Check the install and refresh the page~',
  'error.network': 'Cannot reach the host half. Check that the page is still running~',
  'error.empty': 'The draft is empty — write something first~',
  'error.tooLongClient': 'The draft is over {max} characters, so this pass is skipped~',
  'error.placeholder': 'Reference placeholders do not line up in the result. Nothing was written back so your @ references stay intact~',
  'error.command': 'The leading command chip (/xxx) disappeared in the rewrite. Nothing was written back so the command still works~',
  'error.auth': 'The host rejected this request at the session check. Refresh the page and try again~',
  'error.unknown': 'Hit something unexpected. Try once more~'
}

/** 翻译函数签名（参数用 {name} 插值，与官方 t 一致） */
export type Translate = (key: keyof typeof zh, params?: Readonly<Record<string, string | number>>) => string

/** 把字典 + 当前语言解析成一个 t；缺 key 依次回退到 en、再回退到 key 本身 */
export function createTranslate(activeLocale: () => string): Translate {
  return (key, params) => {
    const locale = activeLocale()
    const dict = locale.toLowerCase().startsWith('zh') ? zh : en
    const template = dict[key] ?? en[key] ?? String(key)
    if (params === undefined) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match)
  }
}
