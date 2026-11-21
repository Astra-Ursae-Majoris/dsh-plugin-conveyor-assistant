/**
 * 桌面宠物（像素风 sprite 版）的样式表：一段 CSS 字符串。
 *
 * 注入方式：意图卡片每次渲染一个 `<style>{PET_CSS}</style>`，React 持有生命周期，卸载即移除。
 *
 * 约定：
 * - 所有 class 前缀 `dca-pet-`，避免与宿主样式互相污染；
 * - 主题相关颜色走 `--dsw-alias-*`（气泡、输入框、描边）；sprite 自身配色固定（它是插画）；
 * - 像素感：sprite 用 `image-rendering: pixelated`，动画尽量 `steps(...)`，像逐帧手绘；
 * - 全部动画集中在文件末尾，并统一在 `prefers-reduced-motion: reduce` 下关闭。
 */

/** 宠物与气泡的完整样式（含 keyframes） */
export const PET_CSS = `
.dca-pet-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 4px;
}
.dca-pet-left {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 0;
}
.dca-pet-right {
  flex: 1 1 auto;
  min-width: 0;
}
.dca-pet-stage {
  position: relative;
  flex: 0 0 auto;
  width: 96px;
  height: 100px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.dca-pet-stage:focus { outline: none; }
.dca-pet-svg {
  display: block;
  width: 96px;
  height: 96px;
  overflow: visible;
  image-rendering: pixelated;
  -ms-interpolation-mode: nearest-neighbor;
}
.dca-pet-bubble {
  position: relative;
  max-width: 320px;
  padding: 9px 12px;
  border-radius: 12px;
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2430);
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  line-height: 1.6;
  --dca-pet-bubble-bg: var(--dsw-alias-bg-base, #ffffff);
  --dca-pet-bubble-border: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
}
.dca-pet-bubble::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 18px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-right-color: var(--dca-pet-bubble-bg);
}
.dca-pet-bubble::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 17px;
  width: 0;
  height: 0;
  border: 7px solid transparent;
  border-right-color: var(--dca-pet-bubble-border);
  z-index: -1;
}
.dca-pet-bubble-title {
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #1f2430);
  margin-bottom: 2px;
}
.dca-pet-question {
  margin: 2px 0;
  color: var(--dsw-alias-label-secondary, #4a5266);
  word-break: break-word;
}
.dca-pet-dots {
  display: inline-flex;
  gap: 3px;
  align-items: flex-end;
  height: 12px;
}
.dca-pet-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #7c8497);
  animation: dca-pet-dot 1.15s ease-in-out infinite;
}
.dca-pet-dot:nth-child(2) { animation-delay: 0.16s; }
.dca-pet-dot:nth-child(3) { animation-delay: 0.32s; }
.dca-pet-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 64px;
  resize: vertical;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2430);
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
}
.dca-pet-textarea:focus {
  outline: none;
  border-color: var(--dsw-alias-button-info-fill, #3aa0e8);
  box-shadow: 0 0 0 2px rgba(58, 160, 232, 0.18);
}
.dca-pet-textarea::placeholder { color: var(--dsw-alias-label-tertiary, #7c8497); }

/* 窄屏：宠物与气泡在上，输入框在下 */
@media (max-width: 560px) {
  .dca-pet-row { flex-direction: column; }
  .dca-pet-left { width: 100%; align-items: flex-start; }
  .dca-pet-bubble { max-width: none; flex: 1 1 auto; }
  .dca-pet-bubble::before, .dca-pet-bubble::after { display: none; }
}

/* ── sprite 动画（逐帧感：用 steps 而不是平滑曲线） ─────────────────── */
.dca-pet-bob { animation: dca-pet-bob 1.6s steps(2, end) infinite; }
.dca-pet-tail { animation: dca-pet-tail 2.4s steps(2, end) infinite; transform-box: fill-box; transform-origin: 0% 100%; }
.dca-pet-happy { animation: dca-pet-happy 300ms steps(2, end) 1; transform-box: fill-box; transform-origin: 50% 100%; }
.dca-pet-think-dot { animation: dca-pet-think 900ms steps(2, end) infinite; }
.dca-pet-think-dot:nth-child(2) { animation-delay: 0.14s; }
.dca-pet-think-dot:nth-child(3) { animation-delay: 0.28s; }

@keyframes dca-pet-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes dca-pet-tail {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes dca-pet-happy {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.03); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes dca-pet-think {
  0%, 100% { opacity: 0.25; transform: translateY(1px); }
  50% { opacity: 1; transform: translateY(-1px); }
}
@keyframes dca-pet-dot {
  0%, 100% { opacity: 0.25; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-2px); }
}

/* 尊重系统的"减少动态效果"：全部动画关闭，只留静态像素帧 */
@media (prefers-reduced-motion: reduce) {
  .dca-pet-bob,
  .dca-pet-tail,
  .dca-pet-happy,
  .dca-pet-think-dot,
  .dca-pet-dot {
    animation: none;
  }
}
`
