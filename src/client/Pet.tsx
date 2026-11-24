/**
 * 追问区的小桌面宠物 —— **像素风 sprite** 版（24×24 字符网格 + 调色板）。
 *
 * 为什么用像素网格而不是矢量 chibi：
 * - 低分辨率下"圆滚滚的蓝身 + 头顶蕾丝小发带 + 蓝蝴蝶结 + 白肚皮小鱼 + 腮红"这几个特征反而更好认；
 * - 一个网格 = 数据，两帧眨眼 = 眼睛压成 1px，维护成本远低于一堆贝塞尔曲线；
 * - 渲染是**每种颜色一条 path**（不是 500 个 rect），DOM 只有几个节点，不会拖慢输入框。
 *
 * 形象来源：只按文字特征手绘，**不引用、不复刻、不内嵌**任何用户参考图；没有任何外部请求。
 *
 * 无障碍：插画 aria-hidden、不可 Tab 聚焦；气泡是 aria-live 区域；点击宠物只是彩蛋。
 */

import * as React from 'react'
import { pickLine } from './copy'

/**
 * 宠物的表情：
 * - idle：睁眼待机
 * - thinking：改写请求进行中（头顶两颗像素点跳动）
 * - asking：卡片里有追问
 * - happy：被点了一下（300ms 眯眼弹跳）
 * - alert：鼠标一动就被"抓包"定格（睁眼 + 头顶一个像素感叹号）
 */
export type PetMood = 'idle' | 'thinking' | 'asking' | 'happy' | 'alert'

/** 点击宠物时随机抽一句的本地招呼语（**不调模型**，纯暖场） */
export const PET_GREETINGS: readonly string[] = [
  '噗噜噗噜~ 我在这儿，先把想说的话写成草稿，我帮你翻译成 Agent 听得懂的样子',
  '唔，这句我大概懂了 (๑•̀ㅂ•́)و 要不要我读一遍你的真实意图',
  '别急着发嘛，我帮你瞅一眼有没有会被误读的地方~',
  '草稿我读过了，有几处想跟你确认一下呢',
  '写不动的时候可以先随便写，剩下的交给我整理~'
]

/** 调色板：网格里每个字符对应一种颜色（'.' = 透明） */
const PALETTE: Readonly<Record<string, string>> = {
  h: '#3b4fa8', // 鱼身深蓝
  H: '#5570cf', // 头顶受光
  w: '#f7f9ff', // 蕾丝发带 / 白肚皮
  b: '#3aa0e8', // 蝴蝶结 / 尾巴 / 肚皮上的小鱼
  s: '#ffe6d5', // 皮肤（备用）
  e: '#1b2a52', // 眼睛（深色）
  k: '#1b2a52', // 深色（备用）
  r: '#ff9aa8', // 腮红
  m: '#c4553f' // 嘴
}

/**
 * 24×24 像素网格（每行必须 24 个字符）。
 * 形象：**圆滚滚的大肥鱼** —— 藏青蓝鱼身 + 头顶白色蕾丝小发带 + 蓝蝴蝶结
 *       + 白肚皮（肚皮上有条小小的鱼）+ 腮红 + 小嘴；尾巴单独一组做摆尾动画。
 * 眼睛**不画进网格**，由组件用 path 绘制，这样才能做眨眼/眯眼两帧。
 */
const SPRITE: readonly string[] = [
  '........................',
  '........................',
  '...........bb...........',
  '.........bbbbbb.........',
  '.........bbwwbb.........',
  '......w..w..w..w..w.....',
  '.....hHHHHHHHHHHHHh.....',
  '....hhHhHhHhHhHhHhHh....',
  '...hhhhhhhhhhhhhhhhhh...',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhrrhhhhhhhhhhhhrrhh..',
  '..hhhhhhhhhmmhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhwwwwwwwwwwwwhhhh..',
  '...hhhwwwwwwwbwwwwhhh...',
  '....hhhwwwbbbwwwwhhh....',
  '.....hhhwwwbwwwwhhh.....',
  '........wwwwwwww........',
  '........................',
  '........................',
  '........................'
]

/** 身后的鱼尾巴：单独一个动画组（摆尾），不进静态网格 */
const TAIL: readonly (readonly [number, number])[] = [
  [20, 15],
  [21, 14],
  [22, 13],
  [22, 15],
  [21, 16],
  [20, 16]
]

/** 两只眼睛的左上角（2×2 像素）；眨眼时压成 1 像素高 */
const EYES: readonly (readonly [number, number])[] = [
  [5, 11],
  [17, 11]
]

/** 把一组像素格子合并成一条 path（指令 M x y h1 v1 h-1 z） */
function cellsToPath(cells: Iterable<readonly [number, number]>): string {
  let d = ''
  for (const [x, y] of cells) d += 'M' + String(x) + ' ' + String(y) + 'h1v1h-1z'
  return d
}

/** 按颜色合并整张网格，得到"每种颜色一条 path" */
function paintByColor(rows: readonly string[]): readonly { readonly color: string; readonly d: string }[] {
  const buckets = new Map<string, Array<readonly [number, number]>>()
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const char = row.charAt(x)
      if (char === '.') continue
      const color = PALETTE[char]
      if (color === undefined) continue
      const bucket = buckets.get(color)
      if (bucket === undefined) buckets.set(color, [[x, y]])
      else bucket.push([x, y])
    }
  })
  const painted: Array<{ color: string; d: string }> = []
  for (const [color, cells] of buckets) painted.push({ color, d: cellsToPath(cells) })
  return painted
}

/** 静态网格按颜色合并一次即可（模块级常量，不随渲染重算） */
const BODY = paintByColor(SPRITE)
const TAIL_PATH = cellsToPath(TAIL)
const EYE_COLOR = PALETTE['e'] ?? '#2f6fd0'

/** 两帧眨眼：随机 2.4–5s 闭一次，闭 140ms。prefers-reduced-motion 或没有 window 时保持睁眼。 */
function useBlink(enabled: boolean): boolean {
  const [closed, setClosed] = React.useState(false)
  React.useEffect(() => {
    if (!enabled) {
      setClosed(false)
      return undefined
    }
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let stopped = false
    let closeTimer = 0
    let openTimer = 0
    const schedule = (): void => {
      const wait = 2400 + Math.random() * 2600
      closeTimer = window.setTimeout(() => {
        if (stopped) return
        setClosed(true)
        openTimer = window.setTimeout(() => {
          if (stopped) return
          setClosed(false)
          schedule()
        }, 140)
      }, wait)
    }
    schedule()
    return () => {
      stopped = true
      window.clearTimeout(closeTimer)
      window.clearTimeout(openTimer)
    }
  }, [enabled])
  return closed
}

/** 插画本体（纯装饰，aria-hidden；每种颜色一条 path） */
export function PetAvatar({ mood, closed = false }: { readonly mood: PetMood; readonly closed?: boolean }): React.ReactElement {
  const squint = closed || mood === 'happy'
  const eyePath = EYES.map(([x, y]) => squint
    ? 'M' + String(x) + ' ' + String(y + 1) + 'h2v1h-2z'
    : 'M' + String(x) + ' ' + String(y) + 'h2v2h-2z').join('')
  // 睁眼时左上角一颗高光，眨眼/开心时不画
  const eyeShine = squint
    ? ''
    : EYES.map(([x, y]) => 'M' + String(x) + ' ' + String(y) + 'h1v1h-1z').join('')

  return (
    <svg
      className="dca-pet-svg"
      viewBox="0 0 24 24"
      width={96}
      height={96}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g className={'dca-pet-bob' + (mood === 'happy' ? ' dca-pet-happy' : '')}>
        {BODY.map((layer) => (
          <path key={layer.color} d={layer.d} fill={layer.color} />
        ))}
        {/* 鱼尾巴：独立摆动 */}
        <g className="dca-pet-tail">
          <path d={TAIL_PATH} fill={PALETTE['b']} />
        </g>
        {/* 眼睛：睁开 2×2 + 高光 / 眨眼与开心 2×1 */}
        <path d={eyePath} fill={EYE_COLOR} />
        {eyeShine !== '' && <path d={eyeShine} fill={PALETTE['w']} />}
      </g>
      {/* thinking：头顶两颗像素点跳动 */}
      {mood === 'thinking' && (
        <g fill={PALETTE['b']}>
          <rect className="dca-pet-think-dot" x={16} y={3} width={1} height={1} />
          <rect className="dca-pet-think-dot" x={18} y={2} width={1} height={1} />
          <rect className="dca-pet-think-dot" x={20} y={4} width={1} height={1} />
        </g>
      )}
      {/* alert：鼠标一动她就"定格 + 冒个小感叹号"，像被抓到偷跑 */}
      {mood === 'alert' && (
        <g fill={PALETTE['b']}>
          <rect x={18} y={2} width={1} height={2} />
          <rect x={18} y={5} width={1} height={1} />
        </g>
      )}
    </svg>
  )
}

/** 气泡里的等待动画（三个错峰跳动的点，HTML 版） */
function ThinkingDots(): React.ReactElement {
  return (
    <span className="dca-pet-dots" aria-hidden="true">
      <span className="dca-pet-dot" />
      <span className="dca-pet-dot" />
      <span className="dca-pet-dot" />
    </span>
  )
}

/** 追问区的 props */
export interface PetQuestionRowProps {
  /** 当前情绪（thinking = 正在编译；asking = 有追问；idle = 空; happy = 被点了一下） */
  readonly mood: PetMood
  /** 气泡标题行 */
  readonly title: string
  /** 模型给的口语化追问（0–3 条） */
  readonly questions: readonly string[]
  /** "正在想"时的占位文案 */
  readonly thinkingLabel: string
  /** 气泡无障碍标签 */
  readonly bubbleLabel: string
  /** 右侧：输入框与按钮 */
  readonly children: React.ReactNode
}

/**
 * 左侧「小宠物 + 气泡」，右侧「用户输入区」；窄屏（<=560px）改为上下堆叠。
 * 点击宠物：随机换一句本地招呼语 + 一次 happy 表情（300ms），不触发任何网络操作。
 */
export function PetQuestionRow({ mood, title, questions, thinkingLabel, bubbleLabel, children }: PetQuestionRowProps): React.ReactElement {
  const [greeting, setGreeting] = React.useState<string | undefined>(undefined)
  const [happy, setHappy] = React.useState(false)
  const [greetingIndex, setGreetingIndex] = React.useState(0)
  const closed = useBlink(true)

  // happy 只亮 300ms，定时器随组件卸载清掉
  React.useEffect(() => {
    if (!happy) return undefined
    const timer = window.setTimeout(() => { setHappy(false) }, 300)
    return () => { window.clearTimeout(timer) }
  }, [happy])

  const moodNow: PetMood = happy ? 'happy' : mood
  const onPetClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    // 不抢输入框焦点：鼠标点插画不该让用户丢失光标
    event.preventDefault()
    // 从招呼语池里随机取一句（自动避免与上一句重复）
    setGreetingIndex((prev) => prev + 1)
    setGreeting(pickLine('greeting'))
    setHappy(true)
  }

  // 样式由外层卡片注入一次（components.tsx 的 <style>{PET_CSS}</style>），这里只管结构
  return (
    <>
      <div className="dca-pet-row">
        <div className="dca-pet-left">
          <div
            className="dca-pet-stage"
            onClick={onPetClick}
            onMouseDown={(event) => { event.preventDefault() }}
            aria-hidden="true"
          >
            <PetAvatar mood={moodNow} closed={closed} />
          </div>
          <div className="dca-pet-bubble" role="status" aria-live="polite" aria-label={bubbleLabel}>
            {greeting !== undefined ? (
              <div className="dca-pet-bubble-title">{greeting}</div>
            ) : (
              <>
                <div className="dca-pet-bubble-title">
                  {title}
                  {mood === 'thinking' && (
                    <>
                      {' '}
                      <ThinkingDots />
                    </>
                  )}
                </div>
                {questions.map((question, index) => (
                  <p className="dca-pet-question" key={String(index)}>
                    {question}
                  </p>
                ))}
                {questions.length === 0 && mood === 'thinking' && (
                  <p className="dca-pet-question">{thinkingLabel}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="dca-pet-right">{children}</div>
      </div>
    </>
  )
}
