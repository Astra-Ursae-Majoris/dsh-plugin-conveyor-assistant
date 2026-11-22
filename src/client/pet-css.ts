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

/* ═══════════════════════════════════════════════════════════════════════
   v0.2：常驻开关行 / 桌宠 fixed 层 / 悬停气泡 / 配置面板
   （class 前缀仍然是 dca-pet-；主题色走 --dsw-alias-*）
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 常驻开关行（composer.dock 里的一行紧凑控件） ────────────────────── */
.dca-pet-dock {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 2px 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #7c8497);
}
.dca-pet-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 6px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.08));
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}
.dca-pet-switch:hover {
  border-color: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  color: var(--dsw-alias-label-secondary, #4a5266);
}
.dca-pet-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-button-info-fill, #3aa0e8);
  outline-offset: 1px;
}
.dca-pet-switch-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #7c8497);
  opacity: 0.45;
  transition: background 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}
.dca-pet-switch--on {
  color: var(--dsw-alias-label-secondary, #4a5266);
}
.dca-pet-switch--on .dca-pet-switch-dot {
  background: #3aa0e8;
  opacity: 1;
  box-shadow: 0 0 0 3px rgba(58, 160, 232, 0.16);
}
.dca-pet-gear {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 12px;
  line-height: 1;
  padding: 3px 4px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;
}
.dca-pet-gear:hover { opacity: 1; background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.dca-pet-gear:focus-visible { outline: 2px solid var(--dsw-alias-button-info-fill, #3aa0e8); outline-offset: 1px; }

/* ── 桌宠 fixed 层（portal 到 body；容器不吃指针，只有本体吃） ────────── */
.dca-pet-root-layer {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}
.dca-pet-body {
  position: fixed;
  left: 0;
  top: 0;
  width: 96px;
  height: 96px;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 1.2s cubic-bezier(.4, 0, .2, 1);
  will-change: transform;
  filter: drop-shadow(0 4px 8px rgba(20, 30, 70, 0.16));
}
.dca-pet-body--frozen { transition: none; }
.dca-pet-breath { display: block; width: 96px; height: 96px; animation: dca-pet-breath 3.6s ease-in-out infinite; }
.dca-pet-breath--still { animation: none; }

@keyframes dca-pet-breath {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.012); opacity: 0.97; }
}

/* 重新登场：淡入 + 小跳两下。
   用独立属性 translate/scale 而不是 transform，避免覆盖外层的 translate3d(x,y) 定位。 */
.dca-pet-body--enter { animation: dca-pet-enter 950ms cubic-bezier(.22, .9, .3, 1) 1; }
@keyframes dca-pet-enter {
  0% { opacity: 0; scale: 0.86; translate: 0 40px; }
  30% { opacity: 1; scale: 1; translate: 0 0; }
  45% { translate: 0 -7px; }
  60% { translate: 0 0; }
  75% { translate: 0 -4px; }
  90%, 100% { opacity: 1; scale: 1; translate: 0 0; }
}

/* 到达后的小动作（都用不碰 transform 的属性，避免和游走定位打架） */
.dca-pet-hop { animation: dca-pet-hop 520ms steps(2, end) 2; }
@keyframes dca-pet-hop {
  0%, 100% { margin-top: 0; }
  50% { margin-top: -4px; }
}
.dca-pet-sway-once { animation: dca-pet-sway-once 700ms ease-in-out 1; }
@keyframes dca-pet-sway-once {
  0%, 100% { rotate: 0deg; }
  30% { rotate: -3deg; }
  70% { rotate: 3deg; }
}

/* ── 悬停气泡（fixed，贴在她旁边，尾巴指向她） ──────────────────────── */
.dca-pet-float-bubble {
  position: fixed;
  max-width: 232px;
  padding: 8px 11px;
  border-radius: 12px;
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2430);
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  box-shadow: 0 6px 18px rgba(20, 30, 70, 0.14);
  font-size: 13px;
  line-height: 1.55;
  pointer-events: auto;
  z-index: 41;
  animation: dca-pet-bubble-in 140ms ease-out 1;
}
@keyframes dca-pet-bubble-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.dca-pet-float-bubble::before {
  content: '';
  position: absolute;
  top: 24px;
  width: 0;
  height: 0;
  border: 7px solid transparent;
}
.dca-pet-float-bubble--tl::before { left: -13px; border-right-color: var(--dsw-alias-bg-base, #ffffff); }
.dca-pet-float-bubble--tr::before { right: -13px; border-left-color: var(--dsw-alias-bg-base, #ffffff); }
.dca-pet-bubble-hit {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

/* ── 配置面板（popover，非 modal：不抢焦点、不锁滚动） ──────────────── */
.dca-pet-panel {
  position: fixed;
  width: 300px;
  max-height: min(72vh, 460px);
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2430);
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  box-shadow: 0 12px 32px rgba(20, 30, 70, 0.18);
  font-size: 13px;
  line-height: 1.55;
  pointer-events: auto;
  z-index: 42;
  animation: dca-pet-bubble-in 160ms ease-out 1;
}
.dca-pet-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.dca-pet-panel-title { font-weight: 600; font-size: 13px; }
.dca-pet-panel-close {
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #7c8497);
  font: inherit;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
}
.dca-pet-panel-close:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.dca-pet-panel-label {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--dsw-alias-label-tertiary, #7c8497);
  margin: 10px 0 4px;
}
.dca-pet-panel-hint {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #7c8497);
  margin-top: 3px;
}
.dca-pet-select {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2430);
  font: inherit;
  font-size: 12px;
}
.dca-pet-select:focus-visible { outline: 2px solid var(--dsw-alias-button-info-fill, #3aa0e8); outline-offset: 1px; }
.dca-pet-modes { display: flex; flex-direction: column; gap: 6px; }
.dca-pet-mode {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.08));
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;
}
.dca-pet-mode:hover { border-color: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14)); }
.dca-pet-mode--on {
  border-color: #3aa0e8;
  background: rgba(58, 160, 232, 0.08);
}
.dca-pet-mode:focus-visible { outline: 2px solid var(--dsw-alias-button-info-fill, #3aa0e8); outline-offset: 1px; }
.dca-pet-mode-title { font-weight: 600; font-size: 12px; }
.dca-pet-mode-desc { font-size: 11px; color: var(--dsw-alias-label-tertiary, #7c8497); }
.dca-pet-roam {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 6px 9px;
  border-radius: 10px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.dca-pet-roam--on { border-style: solid; border-color: #3aa0e8; background: rgba(58, 160, 232, 0.06); }
.dca-pet-roam:focus-visible { outline: 2px solid var(--dsw-alias-button-info-fill, #3aa0e8); outline-offset: 1px; }
.dca-pet-roam-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #7c8497);
  opacity: 0.5;
  flex: 0 0 auto;
}
.dca-pet-roam--on .dca-pet-roam-dot { background: #3aa0e8; opacity: 1; }
.dca-pet-roam-text { flex: 1 1 auto; }
.dca-pet-panel-note {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.08));
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #7c8497);
}

/* v0.2 的减少动态效果：桌宠停在原地只呼吸（呼吸是纯 opacity/1% 缩放，不引起位移） */
@media (prefers-reduced-motion: reduce) {
  .dca-pet-body { transition: none; }
  .dca-pet-body--enter,
  .dca-pet-hop,
  .dca-pet-sway-once,
  .dca-pet-float-bubble,
  .dca-pet-panel {
    animation: none;
  }
  /* 注意：这里**不**关掉 .dca-pet-breath —— v0.2 的口径是"减少动态时她停在原地只呼吸"，
     呼吸只有 1.2% 的缩放与轻微透明度变化，不产生位移，不属于前庭刺激。 */
}

`
