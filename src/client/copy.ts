/**
 * 文案池 —— 让用户每次看到的提示都不一样，不要像复读机。
 *
 * 三个场景各一个池子：
 *   hover    ：鼠标停在大肥鱼身上时，气泡里那句话
 *   greeting ：点她一下时，她自己嘟囔的一句招呼
 *   loading  ：点 ✨ 开始改写、她还在读草稿时显示的等待话术
 *
 * 规则：
 *   · 每次调用随机取一条，并且**不会和上一次重复**（池子里只剩两句时才允许重复）；
 *   · 中文走 zh 池，其它语言走 en 池；
 *   · 语气活泼俏皮，多用颜文字；不要感叹号、不要客服腔。
 */

/** 三个文案场景 */
export type CopyKind = 'hover' | 'greeting' | 'loading'

const POOLS: Record<CopyKind, { readonly zh: readonly string[]; readonly en: readonly string[] }> = {
  hover: {
    zh: [
      '主人，你要配置一下我吗？ (๑•̀ㅂ•́)و✧',
      '诶？点我呀~ 我这儿藏了个小面板 (´・ω・)',
      '要调什么嘛，我一直蹲在这儿呢 (・ω・)',
      '唔…是想给我换个脑子吗~ (๑•́ ₃ •̀๑)',
      '戳戳~ 我有反应哦 ヽ(•‿•)ノ',
      '我在我在！想让我怎么干活呀 (｡･ω･｡)',
      '别光看着我嘛，点一下试试~ (￣▽￣)',
      '有悄悄话要跟我说吗？(´,,•ω•,,)',
      '戳一下嘛，又不会吃掉你~ (｡•̀ᴗ-)✧',
      '嗯？是来找我玩的吗 (◕‿◕)'
    ],
    en: [
      'Master, would you like to configure me? (๑•̀ㅂ•́)و✧',
      'Oh? Click me~ I hid a little panel in here (´・ω・)',
      'Anything to tune? I have been sitting right here (・ω・)',
      'Hmm… changing my brain? (๑•́ ₃ •̀๑)',
      'Poke poke~ I do react ヽ(•‿•)ノ',
      'I am here! How should I work for you? (｡･ω･｡)',
      'Do not just stare, give it a click~ (￣▽￣)',
      'Something you want to whisper? (´,,•ω•,,)',
      'Go on, poke me, I do not bite~ (｡•̀ᴗ-)✧',
      'Hm? Here to play with me? (◕‿◕)'
    ]
  },
  greeting: {
    zh: [
      '我在呢~ 先随便写，我帮你翻译成 Agent 听得懂的样子 (๑•̀ㅂ•́)و',
      '唔…让我读读你的真实意图 (・ω・) 说不定你自己都还没发现',
      '别急着发嘛，我先帮你瞅一眼有没有会被误读的地方~ (￣▽￣)',
      '草稿我读过啦，有几处想跟你确认一下呢 (｡･ω･｡)',
      '写不动就随便写，反正收拢这些碎话是我的活儿~ ヽ(•‿•)ノ',
      '越随便越好！越随便我越有用武之地 (｡•̀ᴗ-)✧',
      '嗯…这句我会不会理解错呢，让我再看一眼 (´,,•ω•,,)',
      '放心写，我不替你编故事，只替你问清楚 (◕‿◕)',
      '你就当我是个特别爱刨根问底的秘书~ (๑•́ ₃ •̀๑)',
      '嘘——先让我把你这句话嚼碎了再还给 Agent (¬‿¬)'
    ],
    en: [
      'Right here~ write it however you like, I will turn it into something the agent reads correctly (๑•̀ㅂ•́)و',
      'Hmm… let me read what you actually mean (・ω・) you might not even know yet',
      'No rush — let me check for anything that could be misread~ (￣▽￣)',
      'Read it. A couple of spots I would like to confirm with you (｡･ω･｡)',
      'Stuck? Just write something rough — tidying it up is my job~ ヽ(•‿•)ノ',
      'The messier the better! That is where I shine (｡•̀ᴗ-)✧',
      'Hmm… would I misread this one? Let me look again (´,,•ω•,,)',
      'Write freely. I never make things up, I only ask (◕‿◕)',
      'Think of me as a secretary who cannot stop asking why~ (๑•́ ₃ •̀๑)',
      'Shh — let me chew on this sentence before handing it back (¬‿¬)'
    ]
  },
  loading: {
    zh: [
      '正在读你的草稿… (・ω・)',
      '让我先想想你到底想要什么~ (๑•̀ㅂ•́)و',
      '嗯…这句有点绕，我捋一捋 (´・ω・)',
      '稍等稍等，我在拆你的意思呢 ヽ(•‿•)ノ',
      '检查有没有会被 Agent 理解错的地方… (￣▽￣)',
      '先把你的话翻译成人话再说~ (｡•̀ᴗ-)✧',
      '我在读啦，别催我嘛 (・ω・)',
      '这段话有好几层意思，我分开理理 (｡･ω･｡)',
      '正在翻箱倒柜找你的真实意图… (´,,•ω•,,)',
      '给我三秒，还你一句 Agent 能听懂的 (◕‿◕)'
    ],
    en: [
      'Reading your draft… (・ω・)',
      'Let me think about what you actually want~ (๑•̀ㅂ•́)و',
      'Hmm… this one is a bit tangled, give me a moment (´・ω・)',
      'Hold on hold on, I am unpacking what you mean ヽ(•‿•)ノ',
      'Checking for anything an agent could misread… (￣▽▽)',
      'Translating it into plain intent first~ (｡•̀ᴗ-)✧',
      'I am reading, do not rush me (・ω・)',
      'A few layers in this one — untangling them (｡･ω･｡)',
      'Digging around for your actual intent… (´,,•ω•,,)',
      'Three seconds, and I will hand back something an agent understands (◕‿◕)'
    ]
  }
}

/** 当前语言读取器：模块级，由 index.tsx 在装配时注入（跟随用户切换语言） */
let readLocale: () => string = () => (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en')

/**
 * 注入语言读取器（插件装配时调用一次）。
 * @param reader 返回当前语言标签的函数
 */
export function setCopyLocale(reader: () => string): void {
  readLocale = reader
}

/** 上一次取到的下标，用来避免连续重复 */
const lastIndex = new Map<CopyKind, number>()

/**
 * 从池子里随机取一句话，避免与上一次相同。
 * @param kind 场景
 * @returns 一条招呼 / 提示 / 等待话术
 */
export function pickLine(kind: CopyKind): string {
  const pool = readLocale().toLowerCase().startsWith('zh') ? POOLS[kind].zh : POOLS[kind].en
  if (pool.length === 0) return ''
  let index = Math.floor(Math.random() * pool.length)
  if (pool.length > 1 && index === lastIndex.get(kind)) index = (index + 1) % pool.length
  lastIndex.set(kind, index)
  return pool[index]
}

/** 调试用：取整池话 */
export function copyPool(kind: CopyKind, locale: string): readonly string[] {
  return locale.toLowerCase().startsWith('zh') ? POOLS[kind].zh : POOLS[kind].en
}
