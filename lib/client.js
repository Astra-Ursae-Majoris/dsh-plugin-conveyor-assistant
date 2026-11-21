window.__ModuleLoader__.load({ id: 'dsh-convey-assistant', factory: require => {
  var module = { exports: {} }; var exports = module.exports;
  Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/components.tsx
var React2 = __toESM(require("react"), 1);
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/Pet.tsx
var React = __toESM(require("react"), 1);
var PET_GREETINGS = [
  "\u6211\u5728\u5462~ \u5148\u628A\u4F60\u60F3\u8BF4\u7684\u8BDD\u5199\u6210\u8349\u7A3F\uFF0C\u6211\u5E2E\u4F60\u7FFB\u8BD1\u6210 Agent \u542C\u5F97\u61C2\u7684\u6837\u5B50",
  "\u5514\uFF0C\u8FD9\u53E5\u6211\u5927\u6982\u61C2\u4E86 (\u0E51\u2022\u0300\u3142\u2022\u0301)\u0648 \u8981\u4E0D\u8981\u6211\u8BFB\u4E00\u904D\u4F60\u7684\u771F\u5B9E\u610F\u56FE",
  "\u522B\u6025\u7740\u53D1\u561B\uFF0C\u6211\u5E2E\u4F60\u770B\u4E00\u773C\u6709\u6CA1\u6709\u4F1A\u88AB\u8BEF\u8BFB\u7684\u5730\u65B9~",
  "\u8349\u7A3F\u6211\u8BFB\u8FC7\u4E86\uFF0C\u6709\u51E0\u5904\u60F3\u8DDF\u4F60\u786E\u8BA4\u4E00\u4E0B\u5462",
  "\u5199\u4E0D\u52A8\u7684\u65F6\u5019\u53EF\u4EE5\u5148\u968F\u4FBF\u5199\uFF0C\u5269\u4E0B\u7684\u4EA4\u7ED9\u6211\u6574\u7406~"
];
var PALETTE = {
  h: "#3b4fa8",
  // 鲸身深蓝
  H: "#5570cf",
  // 头顶受光
  w: "#f7f9ff",
  // 蕾丝发带 / 白围裙
  b: "#3aa0e8",
  // 蝴蝶结 / 鲸尾 / 围裙上的小蓝鲸
  s: "#ffe6d5",
  // 皮肤（备用）
  e: "#1b2a52",
  // 眼睛（深色）
  k: "#1b2a52",
  // 深色（备用）
  r: "#ff9aa8",
  // 腮红
  m: "#c4553f"
  // 嘴
};
var SPRITE = [
  "........................",
  "........................",
  "...........bb...........",
  ".........bbbbbb.........",
  ".........bbwwbb.........",
  "......w..w..w..w..w.....",
  ".....hHHHHHHHHHHHHh.....",
  "....hhHhHhHhHhHhHhHh....",
  "...hhhhhhhhhhhhhhhhhh...",
  "..hhhhhhhhhhhhhhhhhhhh..",
  "..hhhhhhhhhhhhhhhhhhhh..",
  "..hhhhhhhhhhhhhhhhhhhh..",
  "..hhhhhhhhhhhhhhhhhhhh..",
  "..hhrrhhhhhhhhhhhhrrhh..",
  "..hhhhhhhhhmmhhhhhhhhh..",
  "..hhhhhhhhhhhhhhhhhhhh..",
  "..hhhhwwwwwwwwwwwwhhhh..",
  "...hhhwwwwwwwbwwwwhhh...",
  "....hhhwwwbbbwwwwhhh....",
  ".....hhhwwwbwwwwhhh.....",
  "........wwwwwwww........",
  "........................",
  "........................",
  "........................"
];
var TAIL = [
  [20, 15],
  [21, 14],
  [22, 13],
  [22, 15],
  [21, 16],
  [20, 16]
];
var EYES = [
  [5, 11],
  [17, 11]
];
function cellsToPath(cells) {
  let d = "";
  for (const [x, y] of cells) d += "M" + String(x) + " " + String(y) + "h1v1h-1z";
  return d;
}
function paintByColor(rows) {
  const buckets = /* @__PURE__ */ new Map();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const char = row.charAt(x);
      if (char === ".") continue;
      const color = PALETTE[char];
      if (color === void 0) continue;
      const bucket = buckets.get(color);
      if (bucket === void 0) buckets.set(color, [[x, y]]);
      else bucket.push([x, y]);
    }
  });
  const painted = [];
  for (const [color, cells] of buckets) painted.push({ color, d: cellsToPath(cells) });
  return painted;
}
var BODY = paintByColor(SPRITE);
var TAIL_PATH = cellsToPath(TAIL);
var EYE_COLOR = PALETTE["e"] ?? "#2f6fd0";
function useBlink(enabled) {
  const [closed, setClosed] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) {
      setClosed(false);
      return void 0;
    }
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return void 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return void 0;
    let stopped = false;
    let closeTimer = 0;
    let openTimer = 0;
    const schedule = () => {
      const wait = 2400 + Math.random() * 2600;
      closeTimer = window.setTimeout(() => {
        if (stopped) return;
        setClosed(true);
        openTimer = window.setTimeout(() => {
          if (stopped) return;
          setClosed(false);
          schedule();
        }, 140);
      }, wait);
    };
    schedule();
    return () => {
      stopped = true;
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
    };
  }, [enabled]);
  return closed;
}
function PetAvatar({ mood, closed = false }) {
  const squint = closed || mood === "happy";
  const eyePath = EYES.map(([x, y]) => squint ? "M" + String(x) + " " + String(y + 1) + "h2v1h-2z" : "M" + String(x) + " " + String(y) + "h2v2h-2z").join("");
  const eyeShine = squint ? "" : EYES.map(([x, y]) => "M" + String(x) + " " + String(y) + "h1v1h-1z").join("");
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className: "dca-pet-svg",
      viewBox: "0 0 24 24",
      width: 96,
      height: 96,
      shapeRendering: "crispEdges",
      "aria-hidden": "true",
      focusable: "false"
    },
    /* @__PURE__ */ React.createElement("g", { className: "dca-pet-bob" + (mood === "happy" ? " dca-pet-happy" : "") }, BODY.map((layer) => /* @__PURE__ */ React.createElement("path", { key: layer.color, d: layer.d, fill: layer.color })), /* @__PURE__ */ React.createElement("g", { className: "dca-pet-tail" }, /* @__PURE__ */ React.createElement("path", { d: TAIL_PATH, fill: PALETTE["b"] })), /* @__PURE__ */ React.createElement("path", { d: eyePath, fill: EYE_COLOR }), eyeShine !== "" && /* @__PURE__ */ React.createElement("path", { d: eyeShine, fill: PALETTE["w"] })),
    mood === "thinking" && /* @__PURE__ */ React.createElement("g", { fill: PALETTE["b"] }, /* @__PURE__ */ React.createElement("rect", { className: "dca-pet-think-dot", x: 16, y: 3, width: 1, height: 1 }), /* @__PURE__ */ React.createElement("rect", { className: "dca-pet-think-dot", x: 18, y: 2, width: 1, height: 1 }), /* @__PURE__ */ React.createElement("rect", { className: "dca-pet-think-dot", x: 20, y: 4, width: 1, height: 1 }))
  );
}
function ThinkingDots() {
  return /* @__PURE__ */ React.createElement("span", { className: "dca-pet-dots", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "dca-pet-dot" }), /* @__PURE__ */ React.createElement("span", { className: "dca-pet-dot" }), /* @__PURE__ */ React.createElement("span", { className: "dca-pet-dot" }));
}
function PetQuestionRow({ mood, title, questions, thinkingLabel, bubbleLabel, children }) {
  const [greeting, setGreeting] = React.useState(void 0);
  const [happy, setHappy] = React.useState(false);
  const [greetingIndex, setGreetingIndex] = React.useState(0);
  const closed = useBlink(true);
  React.useEffect(() => {
    if (!happy) return void 0;
    const timer = window.setTimeout(() => {
      setHappy(false);
    }, 300);
    return () => {
      window.clearTimeout(timer);
    };
  }, [happy]);
  const moodNow = happy ? "happy" : mood;
  const onPetClick = (event) => {
    event.preventDefault();
    const next = (greetingIndex + 1) % PET_GREETINGS.length;
    setGreetingIndex(next);
    setGreeting(PET_GREETINGS[next]);
    setHappy(true);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dca-pet-row" }, /* @__PURE__ */ React.createElement("div", { className: "dca-pet-left" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "dca-pet-stage",
      onClick: onPetClick,
      onMouseDown: (event) => {
        event.preventDefault();
      },
      "aria-hidden": "true"
    },
    /* @__PURE__ */ React.createElement(PetAvatar, { mood: moodNow, closed })
  ), /* @__PURE__ */ React.createElement("div", { className: "dca-pet-bubble", role: "status", "aria-live": "polite", "aria-label": bubbleLabel }, greeting !== void 0 ? /* @__PURE__ */ React.createElement("div", { className: "dca-pet-bubble-title" }, greeting) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dca-pet-bubble-title" }, title, mood === "thinking" && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(ThinkingDots, null))), questions.map((question, index) => /* @__PURE__ */ React.createElement("p", { className: "dca-pet-question", key: String(index) }, question)), questions.length === 0 && mood === "thinking" && /* @__PURE__ */ React.createElement("p", { className: "dca-pet-question" }, thinkingLabel)))), /* @__PURE__ */ React.createElement("div", { className: "dca-pet-right" }, children)));
}

// src/client/pet-css.ts
var PET_CSS = `
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

/* \u7A84\u5C4F\uFF1A\u5BA0\u7269\u4E0E\u6C14\u6CE1\u5728\u4E0A\uFF0C\u8F93\u5165\u6846\u5728\u4E0B */
@media (max-width: 560px) {
  .dca-pet-row { flex-direction: column; }
  .dca-pet-left { width: 100%; align-items: flex-start; }
  .dca-pet-bubble { max-width: none; flex: 1 1 auto; }
  .dca-pet-bubble::before, .dca-pet-bubble::after { display: none; }
}

/* \u2500\u2500 sprite \u52A8\u753B\uFF08\u9010\u5E27\u611F\uFF1A\u7528 steps \u800C\u4E0D\u662F\u5E73\u6ED1\u66F2\u7EBF\uFF09 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u5C0A\u91CD\u7CFB\u7EDF\u7684"\u51CF\u5C11\u52A8\u6001\u6548\u679C"\uFF1A\u5168\u90E8\u52A8\u753B\u5173\u95ED\uFF0C\u53EA\u7559\u9759\u6001\u50CF\u7D20\u5E27 */
@media (prefers-reduced-motion: reduce) {
  .dca-pet-bob,
  .dca-pet-tail,
  .dca-pet-happy,
  .dca-pet-think-dot,
  .dca-pet-dot {
    animation: none;
  }
}
`;

// src/shared/constants.ts
var ROUTE_PATH = "/api/dsh-convey-assistant/rewrite";
var MAX_DRAFT_CHARS = 8e3;
var TIMEOUT_MS = 45e3;
var REF_TOKEN_RE = /⟦R(\d+)⟧/g;

// src/client/placeholders.ts
function tokenOf(index) {
  return "\u27E6R" + String(index) + "\u27E7";
}
function tokenRegex() {
  return new RegExp(REF_TOKEN_RE.source, "g");
}
var CaptureError = class extends Error {
  constructor(code) {
    super(`capture: ${code}`);
    __publicField(this, "code");
    this.name = "CaptureError";
    this.code = code;
  }
};
function buildTemplate(draft, occurrences) {
  const sorted = [...occurrences].sort((left, right) => left.offset - right.offset);
  const parts = [];
  const refs = [];
  let cursor = 0;
  for (const occurrence of sorted) {
    const end = occurrence.offset + occurrence.length;
    if (occurrence.length <= 0 || occurrence.offset < cursor || end > draft.length) {
      throw new CaptureError("inconsistent-refs");
    }
    if (draft.slice(occurrence.offset, end) !== occurrence.clipboardText) {
      throw new CaptureError("inconsistent-refs");
    }
    parts.push(draft.slice(cursor, occurrence.offset), tokenOf(refs.length));
    refs.push(occurrence);
    cursor = end;
  }
  parts.push(draft.slice(cursor));
  return { template: parts.join(""), refs };
}
function validateTokens(text, expected) {
  const residue = text.replace(tokenRegex(), "");
  if (residue.includes("\u27E6") || residue.includes("\u27E7")) {
    const fragments = residue.match(/⟦[^⟧]{0,10}⟧?/gu) ?? ["\u27E6\u2026\u27E7"];
    return { ok: false, issue: "unknown", broken: fragments.slice(0, 3) };
  }
  const regex = tokenRegex();
  const found = [];
  const ids = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    found.push(match[0]);
    ids.push(Number(match[1]));
  }
  if (ids.length !== expected) {
    return { ok: false, issue: "count", broken: expected === 0 ? found : ids.map((_, index) => tokenOf(index)) };
  }
  for (let index = 0; index < ids.length; index += 1) {
    if (ids[index] !== index) return { ok: false, issue: "order", broken: ids.map((id) => tokenOf(id)) };
  }
  return { ok: true };
}
function rebuild(text, refs) {
  const regex = tokenRegex();
  const parts = [];
  const references = [];
  let visible = 0;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const chunk = text.slice(last, match.index);
    parts.push(chunk);
    visible += chunk.length;
    const occurrence = refs[Number(match[1])];
    if (occurrence === void 0) throw new CaptureError("inconsistent-refs");
    parts.push(occurrence.clipboardText);
    references.push({
      source: occurrence.source,
      ref: occurrence.ref,
      label: occurrence.label,
      ...occurrence.appearance === void 0 ? {} : { appearance: occurrence.appearance },
      clipboardText: occurrence.clipboardText,
      offset: visible,
      length: occurrence.clipboardText.length,
      ...occurrence.invalid === void 0 ? {} : { invalid: occurrence.invalid }
    });
    visible += occurrence.clipboardText.length;
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return { text: parts.join(""), references };
}

// src/client/transport.ts
var FAILURE_CODES = ["no-model", "timeout", "aborted", "upstream", "bad-output", "too-long", "bad-request"];
function isTransportStatus(status) {
  return status === 415 || status === 413 || status === 400 || status === 405 || status === 401 || status === 403;
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function parseResponse(value) {
  if (!isRecord(value)) return void 0;
  if (value["ok"] === true) {
    if (typeof value["text"] !== "string" || value["text"].trim() === "") return void 0;
    if (value["mode"] !== "light" && value["mode"] !== "max") return void 0;
    if (typeof value["model"] !== "string") return void 0;
    const questions = Array.isArray(value["questions"]) ? value["questions"].filter((item) => typeof item === "string" && item.trim() !== "").slice(0, 3) : [];
    return { ok: true, mode: value["mode"], text: value["text"], questions, model: value["model"] };
  }
  if (value["ok"] === false) {
    const code = FAILURE_CODES.find((candidate) => candidate === value["code"]) ?? "upstream";
    const message = typeof value["message"] === "string" ? value["message"] : "";
    return { ok: false, code, message };
  }
  return void 0;
}
async function requestRewrite(request, signal) {
  let response;
  try {
    response = await fetch(ROUTE_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal
    });
  } catch {
    return { ok: false, failure: { kind: "network" } };
  }
  if (response.status === 404) return { ok: false, failure: { kind: "host-missing", status: 404 } };
  if (isTransportStatus(response.status)) return { ok: false, failure: { kind: "http", status: response.status } };
  if (!response.ok) return { ok: false, failure: { kind: "http", status: response.status } };
  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, failure: { kind: "bad-shape", status: response.status } };
  }
  const parsed = parseResponse(body);
  if (parsed === void 0) return { ok: false, failure: { kind: "bad-shape", status: response.status } };
  return { ok: true, response: parsed };
}

// src/client/store.ts
var import_react = require("react");
var Store = class {
  constructor(initial) {
    __publicField(this, "value");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    /** 当前值（引用稳定，直到下一次 set） */
    __publicField(this, "getSnapshot", () => this.value);
    /** 订阅；返回退订函数 */
    __publicField(this, "subscribe", (listener) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    });
    this.value = initial;
  }
  /** 写入新值（同一个引用直接忽略，避免无谓重渲染） */
  set(next) {
    if (next === this.value) return;
    this.value = next;
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch {
      }
    }
  }
};
function useStore(store) {
  return (0, import_react.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// src/client/controller.ts
var IDLE = { kind: "idle" };
function captureFrom(state) {
  if (state.draft.trim() === "") throw new CaptureError("empty");
  if (state.draft.length > MAX_DRAFT_CHARS) throw new CaptureError("too-long");
  return {
    draft: state.draft,
    draftRev: state.draftRev,
    refs: state.occurrences,
    ...state.claim === void 0 ? {} : { claimToken: state.claim.token }
  };
}
function codeForCapture(error) {
  if (error.code === "empty") return "error.empty";
  if (error.code === "too-long") return "error.tooLongClient";
  if (error.code === "inconsistent-refs") return "error.placeholder";
  return "error.command";
}
function codeForTransport(failure) {
  if (failure.kind === "host-missing") return "error.host-missing";
  if (failure.kind === "network") return "error.network";
  if (failure.kind === "bad-shape") return "error.bad-output";
  if (failure.status === 413) return "error.too-long";
  if (failure.status === 401 || failure.status === 403) return "error.auth";
  return "error.bad-request";
}
function toReferences(refs) {
  return refs.map((occurrence) => ({
    source: occurrence.source,
    ref: occurrence.ref,
    offset: occurrence.offset,
    length: occurrence.length,
    label: occurrence.label,
    ...occurrence.appearance === void 0 ? {} : { appearance: occurrence.appearance },
    clipboardText: occurrence.clipboardText,
    ...occurrence.invalid === void 0 ? {} : { invalid: occurrence.invalid }
  }));
}
function commandOf(capture, text) {
  const token = capture.claimToken;
  if (token === void 0) return void 0;
  const spelling = token.trimEnd();
  if (spelling === "") return void 0;
  return text.startsWith(spelling) ? { token } : void 0;
}
function planWriteBack(capture, editedText) {
  const validation = validateTokens(editedText, capture.refs.length);
  if (!validation.ok) return { ok: false, code: "error.placeholder" };
  const rebuilt = rebuild(editedText, capture.refs);
  const command = commandOf(capture, rebuilt.text);
  if (capture.claimToken !== void 0 && command === void 0) return { ok: false, code: "error.command" };
  return {
    ok: true,
    text: rebuilt.text,
    references: rebuilt.references,
    ...command === void 0 ? {} : { command }
  };
}
function planRestore(capture) {
  const command = commandOf(capture, capture.draft);
  return {
    ok: true,
    text: capture.draft,
    references: toReferences(capture.refs),
    ...command === void 0 ? {} : { command }
  };
}
var SessionController = class {
  constructor() {
    __publicField(this, "store", new Store(IDLE));
    /** 当前会话 id（由注册表写入） */
    __publicField(this, "sessionId", "");
    /** 由注册表注入：读当前语言 */
    __publicField(this, "localeReader", () => "en");
    /** 由注册表注入：读最近一条用户消息（可选 context） */
    __publicField(this, "contextReader", () => void 0);
    __publicField(this, "abortController");
    __publicField(this, "abortReason");
    __publicField(this, "requestSeq", 0);
    __publicField(this, "holders", 0);
    __publicField(this, "disposed", false);
  }
  /** 组件挂载计数（两个槽位共享同一个控制器） */
  retain() {
    this.holders += 1;
  }
  /** 组件卸载：计数归零时中止在途请求并回到 idle（applied 保留一帧用于撤销入口） */
  release() {
    this.holders = Math.max(0, this.holders - 1);
    if (this.holders > 0) return;
    this.abort("user");
    if (this.store.getSnapshot().kind !== "applied") this.store.set(IDLE);
  }
  /** 插件卸载 */
  dispose() {
    this.disposed = true;
    this.abort("user");
    this.holders = 0;
    this.store.set(IDLE);
  }
  /** 放弃 / 关闭卡片 */
  discard() {
    this.abort("user");
    this.store.set(IDLE);
  }
  /** 写回前发现草稿已变：让用户明确选一次（不硬覆盖） */
  flagConflict() {
    const state = this.store.getSnapshot();
    if (state.kind !== "ready" || state.conflict) return;
    this.store.set({ ...state, conflict: true });
  }
  /** 用户选择"用最新草稿重新编译"前清掉冲突标记 */
  clearConflict() {
    const state = this.store.getSnapshot();
    if (state.kind !== "ready" || !state.conflict) return;
    this.store.set({ ...state, conflict: false });
  }
  /** 用户改结果文本 */
  edit(editedText) {
    const state = this.store.getSnapshot();
    if (state.kind !== "ready") return;
    this.store.set({ ...state, editedText });
  }
  /** 用户改补充说明 */
  editSupplement(supplement) {
    const state = this.store.getSnapshot();
    if (state.kind !== "ready") return;
    this.store.set({ ...state, supplement });
  }
  /** 按钮触发：从一份实时草稿开始编译 */
  start(mode, state) {
    let capture;
    try {
      capture = captureFrom(state);
    } catch (error) {
      this.store.set({
        kind: "error",
        code: error instanceof CaptureError ? codeForCapture(error) : "error.unknown"
      });
      return;
    }
    this.run(mode, capture, "");
  }
  /** 从已有快照重跑（切档 / 重新编译 / 冲突后用新快照重跑） */
  recompile(mode, capture, supplement) {
    this.run(mode, capture, supplement);
  }
  /** 写回成功 */
  markApplied(degraded, capture) {
    this.store.set({ kind: "applied", degraded, capture });
  }
  /** 撤销写回成功 */
  markRestored() {
    this.store.set(IDLE);
  }
  /** 请求主流程 */
  run(mode, capture, supplement) {
    if (this.disposed) return;
    this.abort("superseded");
    const seq = ++this.requestSeq;
    this.store.set({ kind: "loading", mode, capture, supplement });
    let template;
    try {
      template = buildTemplate(capture.draft, capture.refs).template;
    } catch (error) {
      this.store.set({
        kind: "error",
        code: error instanceof CaptureError ? codeForCapture(error) : "error.unknown"
      });
      return;
    }
    const controller = new AbortController();
    this.abortController = controller;
    this.abortReason = void 0;
    const timer = window.setTimeout(() => {
      if (this.requestSeq !== seq) return;
      this.abortReason = "timeout";
      controller.abort();
    }, TIMEOUT_MS);
    const context = this.readContext(capture.draft);
    const request = {
      draft: template,
      mode,
      locale: this.readLocale(),
      ...context === void 0 ? {} : { context },
      ...supplement.trim() === "" ? {} : { supplement },
      // 只传会话 id：宿主用它解析"这个会话里用户选的模型"，不读任何会话内容
      ...this.sessionId === "" ? {} : { sessionId: this.sessionId }
    };
    void requestRewrite(request, controller.signal).then((result) => {
      window.clearTimeout(timer);
      if (this.requestSeq !== seq || this.disposed) return;
      this.abortController = void 0;
      const reason = this.abortReason;
      this.abortReason = void 0;
      if (reason === "timeout") {
        this.store.set({ kind: "error", code: "error.timeout", retry: { mode, capture, supplement } });
        return;
      }
      if (reason === "user" || reason === "superseded" || controller.signal.aborted) {
        if (reason !== "superseded") this.store.set(IDLE);
        return;
      }
      if (!result.ok) {
        this.store.set({ kind: "error", code: codeForTransport(result.failure), retry: { mode, capture, supplement } });
        return;
      }
      const response = result.response;
      if (response.ok === false) {
        if (response.code === "aborted") {
          this.store.set(IDLE);
          return;
        }
        const code = `error.${response.code}`;
        this.store.set({ kind: "error", code, retry: { mode, capture, supplement } });
        return;
      }
      this.store.set({
        kind: "ready",
        mode: response.mode,
        capture,
        model: response.model,
        resultText: response.text,
        editedText: normalizeResult(response.text),
        questions: response.questions,
        supplement,
        conflict: false
      });
    });
  }
  /** 主动中止：用户取消 / 关闭卡片 / 切档 / 卸载 */
  abort(reason) {
    const controller = this.abortController;
    this.abortReason = reason;
    if (controller === void 0) return;
    this.abortController = void 0;
    controller.abort();
  }
  /** 当前语言的 BCP-47 标签 */
  readLocale() {
    try {
      const active = this.localeReader();
      if (typeof active === "string" && active !== "") return active;
    } catch {
    }
    if (typeof navigator !== "undefined" && typeof navigator.language === "string" && navigator.language !== "") return navigator.language;
    return "en";
  }
  /** 可选 context：拿不到就不传，绝不伪造 */
  readContext(draft) {
    try {
      const context = this.contextReader(this.sessionId, draft);
      if (context === void 0 || context.trim() === "") return void 0;
      return context;
    } catch {
      return void 0;
    }
  }
};
function normalizeResult(text) {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gmu, "").replace(/\s+$/u, "");
}
var ConveyRegistry = class {
  constructor(localeReader, contextReader) {
    this.localeReader = localeReader;
    this.contextReader = contextReader;
    __publicField(this, "controllers", /* @__PURE__ */ new Map());
    __publicField(this, "disposed", false);
  }
  /** 组件挂载：取控制器并持有一份引用 */
  retain(sessionId) {
    const controller = this.controllers.get(sessionId) ?? this.create(sessionId);
    controller.retain();
    return controller;
  }
  /** 渲染期取（不增加持有计数） */
  for(sessionId) {
    return this.controllers.get(sessionId) ?? this.create(sessionId);
  }
  /** 组件卸载：释放一份持有 */
  release(sessionId) {
    this.controllers.get(sessionId)?.release();
  }
  /** 插件卸载：全部中止并清空 */
  dispose() {
    this.disposed = true;
    for (const controller of this.controllers.values()) controller.dispose();
    this.controllers.clear();
  }
  create(sessionId) {
    const controller = new SessionController();
    controller.sessionId = sessionId;
    controller.localeReader = () => this.localeReader();
    controller.contextReader = (id, draft) => this.contextReader(id, draft);
    if (!this.disposed) this.controllers.set(sessionId, controller);
    return controller;
  }
};

// src/client/components.tsx
var EMPTY_INPUT = { draft: "", draftRev: 0, occurrences: [], phase: "plain" };
var IDLE_STORE = new Store({ kind: "idle" });
function useEmptyInput(selector) {
  return selector(EMPTY_INPUT);
}
var keepFocus = (event) => {
  event.preventDefault();
};
function useController(props) {
  const { forge, sessionId } = props;
  return React2.useMemo(() => sessionId === void 0 ? void 0 : forge.for(sessionId), [forge, sessionId]);
}
function useRetain(props) {
  const { forge, sessionId } = props;
  React2.useEffect(() => {
    if (sessionId === void 0) return void 0;
    const controller = forge.retain(sessionId);
    void controller;
    return () => {
      forge.release(sessionId);
    };
  }, [forge, sessionId]);
}
function ConveyButtons(props) {
  const { forge, t, inputActions } = props;
  const useInput = props.useInput ?? useEmptyInput;
  const state = useInput((value) => value);
  const controller = useController(props);
  const card = useStore(controller?.store ?? IDLE_STORE);
  useRetain(props);
  const compiling = card.kind === "loading";
  const locked = inputActions === void 0 || state.phase !== "plain" || state.draft.trim() === "" || compiling;
  const start = (mode) => {
    if (locked || controller === void 0) return;
    controller.start(mode, state);
  };
  void forge;
  return /* @__PURE__ */ React2.createElement("span", { style: styles.buttonGroup }, /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("btn.light"), side: "top", portal: true }, /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "ghost",
      "aria-label": t("btn.light.aria"),
      disabled: locked,
      onMouseDown: keepFocus,
      onClick: () => {
        start("light");
      }
    },
    /* @__PURE__ */ React2.createElement("span", { "aria-hidden": "true" }, "\u2728")
  )), /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("btn.max"), side: "top", portal: true }, /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "ghost",
      "aria-label": t("btn.max.aria"),
      disabled: locked,
      onMouseDown: keepFocus,
      onClick: () => {
        start("max");
      }
    },
    /* @__PURE__ */ React2.createElement("span", { "aria-hidden": "true" }, "\u{1FA84}")
  )));
}
function ConveyCard(props) {
  const { t, inputActions } = props;
  const useInput = props.useInput ?? useEmptyInput;
  const state = useInput((value) => value);
  const controller = useController(props);
  const card = useStore(controller?.store ?? IDLE_STORE);
  useRetain(props);
  const [planError, setPlanError] = React2.useState(null);
  const pendingVerify = React2.useRef(null);
  const edited = card.kind === "ready" ? card.editedText : "";
  const refCount = card.kind === "ready" ? card.capture.refs.length : 0;
  const validation = React2.useMemo(() => validateTokens(edited, refCount), [edited, refCount]);
  React2.useEffect(() => {
    const pending = pendingVerify.current;
    if (pending === null || card.kind !== "applied" || inputActions === void 0) return;
    pendingVerify.current = null;
    if (state.draft === pending.expectedText && state.occurrences.length === pending.expectedRefs) return;
    inputActions.setDraft(pending.expectedText);
    controller?.markApplied(true, card.capture);
  }, [state, card, controller, inputActions]);
  const commit = (plan, capture) => {
    if (inputActions === void 0 || !plan.ok) return;
    if (plan.references.length === 0) {
      inputActions.setDraft(plan.text);
      controller?.markApplied(false, capture);
      return;
    }
    const snapshot = {
      text: plan.text,
      references: plan.references,
      ...plan.command === void 0 ? {} : { command: plan.command }
    };
    pendingVerify.current = { expectedText: plan.text, expectedRefs: plan.references.length };
    try {
      ;
      inputActions.setDraft(snapshot);
    } catch {
      pendingVerify.current = null;
      inputActions.setDraft(plan.text);
      controller?.markApplied(true, capture);
      return;
    }
    controller?.markApplied(false, capture);
  };
  const apply2 = (overwrite) => {
    if (card.kind !== "ready" || inputActions === void 0) return;
    if (state.phase !== "plain") return;
    const plan = planWriteBack(card.capture, card.editedText);
    if (!plan.ok) {
      setPlanError(plan.code);
      return;
    }
    if (!overwrite && state.draftRev !== card.capture.draftRev) {
      controller?.flagConflict();
      return;
    }
    setPlanError(null);
    commit(plan, card.capture);
  };
  const undo = (capture) => {
    commit(planRestore(capture), capture);
    pendingVerify.current = null;
    controller?.markRestored();
  };
  if (controller === void 0 || card.kind === "idle") return null;
  const close = () => {
    setPlanError(null);
    controller.discard();
  };
  const header = (title, tone) => /* @__PURE__ */ React2.createElement("div", { style: styles.header }, /* @__PURE__ */ React2.createElement("div", { style: styles.headerLeft }, tone === "ongoing" && /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), tone === "done" && /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.StateDot, { state: "done" }), tone === "error" && /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.StateDot, { state: "error" }), /* @__PURE__ */ React2.createElement("span", { style: styles.title }, title)), /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", "aria-label": t("card.close"), onMouseDown: keepFocus, onClick: close }, /* @__PURE__ */ React2.createElement("span", { "aria-hidden": "true" }, "\u2715")));
  if (card.kind === "loading") {
    return /* @__PURE__ */ React2.createElement("div", { style: styles.card, "data-dca-card": "loading" }, /* @__PURE__ */ React2.createElement("style", null, PET_CSS), header(/* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.TextShimmer, { active: true }, t("card.loading")), "ongoing"), /* @__PURE__ */ React2.createElement(
      PetQuestionRow,
      {
        mood: "thinking",
        title: t("card.loading"),
        questions: [],
        thinkingLabel: t("card.loading.hint"),
        bubbleLabel: t("card.aria")
      },
      /* @__PURE__ */ React2.createElement("span", null)
    ));
  }
  if (card.kind === "error") {
    const params = card.code === "error.tooLongClient" ? { max: String(MAX_DRAFT_CHARS) } : void 0;
    return /* @__PURE__ */ React2.createElement("div", { style: styles.card, "data-dca-card": "error" }, /* @__PURE__ */ React2.createElement("style", null, PET_CSS), header(t("error.title"), "error"), /* @__PURE__ */ React2.createElement("p", { style: styles.errorText }, t(card.code, params)), /* @__PURE__ */ React2.createElement("div", { style: styles.footer }, card.retry !== void 0 && /* @__PURE__ */ React2.createElement(
      import_dsh_client_ui_primitives.Button,
      {
        size: "sm",
        variant: "outline",
        onClick: () => {
          controller.recompile(card.retry.mode, card.retry.capture, card.retry.supplement);
        }
      },
      t("action.retry")
    ), /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", onClick: close }, t("action.discard"))));
  }
  if (card.kind === "applied") {
    return /* @__PURE__ */ React2.createElement("div", { style: styles.card, "data-dca-card": "applied" }, /* @__PURE__ */ React2.createElement("style", null, PET_CSS), header(card.degraded ? t("state.applied.degraded") : t("state.applied"), "done"), /* @__PURE__ */ React2.createElement("div", { style: styles.footer }, /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", onMouseDown: keepFocus, onClick: () => {
      undo(card.capture);
    } }, t("action.undo")), /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", onClick: close }, t("action.discard"))));
  }
  const canApply = validation.ok && inputActions !== void 0 && state.phase === "plain";
  const tokensText = validation.ok ? "" : validation.broken.join(" ");
  return /* @__PURE__ */ React2.createElement("div", { style: styles.card, "data-dca-card": "ready", role: "group", "aria-label": t("card.aria") }, /* @__PURE__ */ React2.createElement("style", null, PET_CSS), header(t("card.title"), "plain"), /* @__PURE__ */ React2.createElement("div", { style: styles.metaRow }, /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.SegmentedControl,
    {
      id: "dca-convey-mode-" + String(props.sessionId ?? "none").replace(/[^a-zA-Z0-9_-]/gu, "-"),
      value: card.mode,
      options: [
        { value: "light", label: t("card.mode.light") },
        { value: "max", label: t("card.mode.max") }
      ],
      onChange: (next) => {
        setPlanError(null);
        controller.recompile(next, card.capture, card.supplement);
      },
      label: t("card.mode.label")
    }
  ), /* @__PURE__ */ React2.createElement("span", { style: styles.modelChip, title: card.model }, t("card.model", { model: card.model }))), /* @__PURE__ */ React2.createElement("details", { style: styles.details }, /* @__PURE__ */ React2.createElement("summary", { style: styles.summary }, t("card.original")), /* @__PURE__ */ React2.createElement("pre", { style: styles.pre }, card.capture.draft)), /* @__PURE__ */ React2.createElement("div", { style: styles.resultBlock }, /* @__PURE__ */ React2.createElement("div", { style: styles.label }, t("card.result")), /* @__PURE__ */ React2.createElement(
    "textarea",
    {
      className: "dca-pet-textarea",
      value: card.editedText,
      rows: 6,
      "aria-label": t("card.result.aria"),
      onChange: (event) => {
        setPlanError(null);
        controller.edit(event.target.value);
      },
      onMouseDown: (event) => {
        event.stopPropagation();
      }
    }
  ), /* @__PURE__ */ React2.createElement("div", { style: styles.hint }, t("card.result.hint")), !validation.ok && /* @__PURE__ */ React2.createElement("div", { style: styles.errorText }, t("card.placeholderBroken", { tokens: tokensText }))), card.questions.length > 0 && /* @__PURE__ */ React2.createElement(
    PetQuestionRow,
    {
      mood: "asking",
      title: t("card.questions"),
      questions: card.questions,
      thinkingLabel: t("card.loading"),
      bubbleLabel: t("card.aria")
    },
    /* @__PURE__ */ React2.createElement(
      "textarea",
      {
        className: "dca-pet-textarea",
        value: card.supplement,
        rows: 3,
        placeholder: t("card.supplement.placeholder"),
        "aria-label": t("card.questions.hint"),
        onChange: (event) => {
          controller.editSupplement(event.target.value);
        }
      }
    ),
    /* @__PURE__ */ React2.createElement("div", { style: styles.hint }, t("card.questions.hint"))
  ), card.conflict && /* @__PURE__ */ React2.createElement("div", { style: styles.conflict }, /* @__PURE__ */ React2.createElement("div", { style: styles.conflictTitle }, t("conflict.title")), /* @__PURE__ */ React2.createElement("div", { style: styles.hint }, t("conflict.body")), /* @__PURE__ */ React2.createElement("div", { style: styles.footer }, /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", onMouseDown: keepFocus, onClick: () => {
    apply2(true);
  } }, t("conflict.overwrite")), /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "ghost",
      onClick: () => {
        controller.clearConflict();
        controller.start(card.mode, state);
      }
    },
    t("conflict.recompile")
  ))), planError !== null && /* @__PURE__ */ React2.createElement("div", { style: styles.errorText }, t(planError)), /* @__PURE__ */ React2.createElement("div", { style: styles.footer }, /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "primary",
      disabled: !canApply || card.conflict,
      onMouseDown: keepFocus,
      onClick: () => {
        apply2(false);
      }
    },
    t("action.apply")
  ), /* @__PURE__ */ React2.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "outline",
      onMouseDown: keepFocus,
      onClick: () => {
        setPlanError(null);
        controller.recompile(card.mode, card.capture, card.supplement);
      }
    },
    t("action.recompile")
  ), /* @__PURE__ */ React2.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", onClick: close }, t("action.discard"))));
}
var styles = {
  buttonGroup: { display: "inline-flex", alignItems: "center", gap: 2 },
  card: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 8,
    padding: "10px 12px 12px",
    borderRadius: 12,
    border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.14))",
    background: "var(--dsw-alias-bg-base, #ffffff)",
    color: "var(--dsw-alias-label-primary, #1f2430)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
    fontSize: 13,
    lineHeight: 1.6
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  headerLeft: { display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 },
  title: { fontWeight: 600, color: "var(--dsw-alias-label-primary, #1f2430)" },
  metaRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 },
  modelChip: {
    maxWidth: 240,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: "var(--dsw-alias-label-tertiary, #7c8497)"
  },
  details: {
    marginBottom: 8,
    border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.08))",
    borderRadius: 8,
    padding: "4px 8px",
    background: "var(--dsw-alias-bg-base, #ffffff)"
  },
  summary: { cursor: "pointer", color: "var(--dsw-alias-label-secondary, #4a5266)", fontSize: 12 },
  pre: {
    margin: "6px 0 2px",
    maxHeight: 180,
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
    color: "var(--dsw-alias-label-secondary, #4a5266)"
  },
  resultBlock: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-secondary, #4a5266)" },
  hint: { fontSize: 12, color: "var(--dsw-alias-label-tertiary, #7c8497)" },
  errorText: { fontSize: 12, color: "var(--dsw-alias-state-error-primary, #d64545)", marginTop: 2 },
  conflict: {
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px dashed var(--dsw-alias-state-business-primary, #3aa0e8)",
    background: "transparent"
  },
  conflictTitle: { fontWeight: 600, marginBottom: 2 },
  footer: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }
};

// src/client/context.ts
var MAX_CONTEXT_CHARS = 500;
function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}
function userMessageText(data) {
  if (typeof data !== "object" || data === null) return void 0;
  const record = data;
  const source = record["source"];
  if (typeof source !== "object" || source === null) return void 0;
  if (source["kind"] !== "user") return void 0;
  const content = record["content"];
  if (!Array.isArray(content)) return void 0;
  const pieces = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const candidate = block;
    if (candidate["type"] !== "text") continue;
    if (typeof candidate["text"] === "string" && candidate["text"].trim() !== "") pieces.push(candidate["text"]);
  }
  if (pieces.length === 0) return void 0;
  const joined = collapse(pieces.join(" "));
  if (joined === "") return void 0;
  return joined.length > MAX_CONTEXT_CHARS ? joined.slice(0, MAX_CONTEXT_CHARS) + "\u2026" : joined;
}
function latestFromEntries(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry;
    if (record["type"] !== "event") continue;
    const event = record["event"];
    if (typeof event !== "object" || event === null) continue;
    const eventRecord = event;
    if (eventRecord["type"] !== "user/message") continue;
    const text = userMessageText(eventRecord["data"]);
    if (text !== void 0) return text;
  }
  return void 0;
}
function readRecentContext(sessions, sessionId, draft) {
  if (sessions === void 0 || sessionId === void 0) return void 0;
  try {
    const binding = sessions.binding?.(sessionId);
    const source = binding?.eventSource;
    if (source === void 0 || typeof source.getSnapshot !== "function") return void 0;
    const window2 = source.getSnapshot();
    if (typeof window2 !== "object" || window2 === null) return void 0;
    const entries = window2["entries"];
    if (!Array.isArray(entries) || entries.length === 0) return void 0;
    const latest = latestFromEntries(entries);
    if (latest === void 0 || latest === collapse(draft)) return void 0;
    return latest;
  } catch {
    return void 0;
  }
}

// src/client/locale.ts
var NS = "convey-assistant";
var zh = {
  "btn.light": "\u8F7B\uFF1A\u6574\u7406\u6210\u5217\u70B9",
  "btn.max": "\u91CD\uFF1A\u8BFB\u610F\u56FE\u91CD\u5199",
  "btn.light.aria": "\u8F7B\u5EA6\u6539\u5199\u8349\u7A3F\uFF1A\u6574\u7406\u6210\u5217\u70B9",
  "btn.max.aria": "\u6DF1\u5EA6\u6539\u5199\u8349\u7A3F\uFF1A\u8BFB\u610F\u56FE\u91CD\u5199",
  "btn.locked": "\u8349\u7A3F\u4E3A\u7A7A\u3001\u6B63\u5728\u63D0\u4EA4\u6216\u6B63\u5728\u7F16\u8BD1",
  "card.aria": "\u610F\u56FE\u786E\u8BA4\u5361\u7247",
  "card.title": "\u5148\u786E\u8BA4\u4E00\u4E0B\u610F\u56FE~",
  "card.model": "\u6A21\u578B\uFF1A{model}",
  "card.close": "\u5173\u95ED\u5361\u7247",
  "card.mode.label": "\u6539\u5199\u6863\u4F4D",
  "card.mode.light": "\u8F7B \xB7 \u5217\u70B9",
  "card.mode.max": "\u91CD \xB7 \u610F\u56FE",
  "card.original": "\u539F\u6587",
  "card.original.hint": "\u4F60\u521A\u624D\u5199\u4E0B\u7684\u8349\u7A3F",
  "card.result": "\u6539\u5199\u7ED3\u679C",
  "card.result.hint": "\u53EF\u4EE5\u76F4\u63A5\u5728\u8FD9\u91CC\u6539\u5B57\uFF0C\u6539\u5B8C\u518D\u786E\u8BA4\u5199\u56DE",
  "card.result.aria": "\u6539\u5199\u7ED3\u679C\uFF0C\u53EF\u7F16\u8F91",
  "card.placeholderBroken": "\u5F15\u7528\u5360\u4F4D\u7B26\u88AB\u6539\u574F\u4E86\uFF1A{tokens}\u3002\u628A\u5B83\u4EEC\u6062\u590D\u6210\u539F\u6837\u624D\u80FD\u5199\u56DE~",
  "card.loading": "\u6B63\u5728\u8BFB\u4F60\u7684\u8349\u7A3F\u2026",
  "card.loading.hint": "\u53EA\u628A\u8FD9\u4E00\u6BB5\u8349\u7A3F\u53D1\u7ED9\u6A21\u578B\uFF0C\u4E0D\u4F1A\u5199\u8FDB\u4F1A\u8BDD\u8BB0\u5F55",
  "card.questions": "\u6211\u60F3\u4E86\u4E00\u4E0B\uFF0C\u8FD9\u4E2A\u8981\u6C42\u597D\u50CF\u4E0D\u592A\u660E\u786E\u5462~",
  "card.questions.hint": "\u628A\u7B54\u6848\u5199\u5728\u8FD9\u91CC\uFF0C\u6211\u5E26\u4E0A\u91CD\u65B0\u7F16\u8BD1\u4E00\u6B21\uFF08\u4E0D\u7528\u9010\u6761\u56DE\u7B54\uFF09",
  "card.supplement.placeholder": "\u6BD4\u5982\uFF1A\u90A3\u4E2A\u811A\u672C\u6307\u7684\u662F tools/run_hhg.mjs",
  "action.apply": "\u786E\u8BA4\u5199\u56DE",
  "action.recompile": "\u91CD\u65B0\u7F16\u8BD1",
  "action.discard": "\u653E\u5F03",
  "action.retry": "\u91CD\u8BD5",
  "action.undo": "\u64A4\u9500\u5199\u56DE",
  "state.applied": "\u5DF2\u5199\u56DE\u8349\u7A3F\uFF0C\u53D1\u9001\u952E\u8FD8\u5728\u4F60\u624B\u91CC~",
  "state.applied.degraded": "\u5DF2\u5199\u56DE\u8349\u7A3F\u3002\u8FD9\u6B21\u5F15\u7528\u82AF\u7247\u9000\u5316\u6210\u4E86\u666E\u901A\u6587\u672C\uFF0C\u53D1\u51FA\u53BB\u4E4B\u524D\u68C0\u67E5\u4E00\u4E0B @ \u8DEF\u5F84~",
  "state.undoDone": "\u5DF2\u8FD8\u539F\u6210\u6539\u5199\u524D\u7684\u8349\u7A3F",
  "conflict.title": "\u8349\u7A3F\u5728\u7F16\u8BD1\u671F\u95F4\u53D8\u8FC7\u4E86",
  "conflict.body": "\u518D\u8986\u76D6\u5C31\u53EF\u80FD\u541E\u6389\u4F60\u521A\u6253\u7684\u5B57\u3002\u4F60\u8BF4\u4E86\u7B97\uFF1A",
  "conflict.overwrite": "\u4ECD\u7136\u5199\u56DE\uFF08\u8986\u76D6\u5F53\u524D\u8349\u7A3F\uFF09",
  "conflict.recompile": "\u7528\u6700\u65B0\u8349\u7A3F\u91CD\u65B0\u7F16\u8BD1",
  "error.title": "\u8FD9\u6B21\u6CA1\u7F16\u8BD1\u6210",
  "error.no-model": "\u6CA1\u627E\u5230\u53EF\u7528\u7684\u6A21\u578B\uFF0C\u5148\u5728\u8BBE\u7F6E\u91CC\u9009\u4E00\u4E2A\u6A21\u578B\u518D\u8BD5\u8BD5~",
  "error.timeout": "\u6A21\u578B\u592A\u4E45\u6CA1\u56DE\u8BDD\uFF0C\u5DF2\u7ECF\u5E2E\u4F60\u505C\u4E0B\u6765\u4E86\uFF0C\u53EF\u4EE5\u518D\u8BD5\u4E00\u6B21~",
  "error.aborted": "\u5DF2\u53D6\u6D88",
  "error.upstream": "\u6A21\u578B\u90A3\u8FB9\u51FA\u9519\u4E86\uFF0C\u6362\u4E2A\u65F6\u95F4\u518D\u8BD5\u8BD5~",
  "error.bad-output": "\u6A21\u578B\u7684\u56DE\u590D\u6CA1\u6CD5\u89E3\u6790\u6210\u7ED3\u6784\u5316\u7ED3\u679C\uFF0C\u518D\u8BD5\u4E00\u6B21\u901A\u5E38\u5C31\u597D~",
  "error.too-long": "\u8349\u7A3F\u592A\u957F\u4E86\uFF0C\u8FD9\u4E00\u6B21\u5148\u4E0D\u5904\u7406~",
  "error.bad-request": "\u8BF7\u6C42\u6CA1\u88AB\u63A5\u53D7\uFF08\u63D2\u4EF6\u7248\u672C\u53EF\u80FD\u5BF9\u4E0D\u4E0A\uFF09~",
  "error.host-missing": "\u5BBF\u4E3B\u534A\u8FB9\u6CA1\u52A0\u8F7D\uFF1A\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u5B8C\u6574\u5B89\u88C5\u5E76\u5237\u65B0\u9875\u9762~",
  "error.network": "\u8FDE\u4E0D\u4E0A\u5BBF\u4E3B\u534A\u8FB9\uFF0C\u68C0\u67E5\u4E00\u4E0B\u9875\u9762\u662F\u5426\u8FD8\u5728\u8FD0\u884C~",
  "error.empty": "\u8349\u7A3F\u662F\u7A7A\u7684\uFF0C\u5148\u5199\u70B9\u4EC0\u4E48\u5427~",
  "error.tooLongClient": "\u8349\u7A3F\u8D85\u8FC7 {max} \u4E2A\u5B57\u7B26\uFF0C\u8FD9\u4E00\u6B21\u5148\u4E0D\u5904\u7406~",
  "error.placeholder": "\u6539\u5199\u7ED3\u679C\u91CC\u7684\u5F15\u7528\u5360\u4F4D\u7B26\u5BF9\u4E0D\u4E0A\uFF0C\u4E3A\u4E86\u4E0D\u5F04\u4E22\u4F60\u7684 @ \u5F15\u7528\uFF0C\u8FD9\u6B21\u4E0D\u5199\u56DE~",
  "error.command": "\u8349\u7A3F\u5F00\u5934\u7684\u547D\u4EE4\u82AF\u7247\uFF08/xxx\uFF09\u5728\u6539\u5199\u91CC\u8D70\u4E22\u4E86\uFF0C\u4E3A\u4E86\u4E0D\u8BA9\u547D\u4EE4\u5931\u6548\uFF0C\u8FD9\u6B21\u4E0D\u5199\u56DE~",
  "error.auth": "\u8FD9\u6B21\u8BF7\u6C42\u6CA1\u6709\u901A\u8FC7\u5BBF\u4E3B\u4FA7\u7684\u4F1A\u8BDD\u6821\u9A8C\uFF0C\u5237\u65B0\u4E00\u4E0B\u9875\u9762\u518D\u8BD5\u8BD5~",
  "error.unknown": "\u9047\u5230\u4E86\u6CA1\u9884\u6599\u5230\u7684\u95EE\u9898\uFF0C\u53EF\u4EE5\u518D\u8BD5\u4E00\u6B21~"
};
var en = {
  "btn.light": "Light: tidy into bullets",
  "btn.max": "Deep: rewrite the intent",
  "btn.light.aria": "Light rewrite: tidy the draft into bullet points",
  "btn.max.aria": "Deep rewrite: read the intent and rewrite",
  "btn.locked": "Empty draft, submitting, or already compiling",
  "card.aria": "Intent confirmation card",
  "card.title": "Let me confirm the intent~",
  "card.model": "Model: {model}",
  "card.close": "Close the card",
  "card.mode.label": "Rewrite depth",
  "card.mode.light": "Light \xB7 bullets",
  "card.mode.max": "Deep \xB7 intent",
  "card.original": "Original",
  "card.original.hint": "The draft you just wrote",
  "card.result": "Rewritten",
  "card.result.hint": "Edit the text right here if you want, then confirm",
  "card.result.aria": "Rewritten draft, editable",
  "card.placeholderBroken": "Reference placeholders were altered: {tokens}. Restore them to write back~",
  "card.loading": "Reading your draft\u2026",
  "card.loading.hint": "Only this draft goes to the model; nothing is written to the session log",
  "card.questions": "I paused on something that is not clear yet~",
  "card.questions.hint": "Answer here and I will recompile with it (no need to answer each one)",
  "card.supplement.placeholder": "e.g. that script means tools/run_hhg.mjs",
  "action.apply": "Write back",
  "action.recompile": "Recompile",
  "action.discard": "Discard",
  "action.retry": "Retry",
  "action.undo": "Undo write-back",
  "state.applied": "Written back. The send button is still yours~",
  "state.applied.degraded": "Written back. Reference chips degraded to plain text this time \u2014 check the @ paths before sending~",
  "state.undoDone": "Restored the draft from before the rewrite",
  "conflict.title": "The draft changed while compiling",
  "conflict.body": "Overwriting now could swallow what you just typed. Your call:",
  "conflict.overwrite": "Write back anyway (replace the draft)",
  "conflict.recompile": "Recompile from the latest draft",
  "error.title": "That compile did not land",
  "error.no-model": "No usable model found. Pick one in settings and try again~",
  "error.timeout": "The model stayed quiet too long, so it was stopped. Try again~",
  "error.aborted": "Cancelled",
  "error.upstream": "The model side failed. Try again a bit later~",
  "error.bad-output": "The reply could not be parsed into a structured result. One more try usually works~",
  "error.too-long": "The draft is too long for one pass~",
  "error.bad-request": "The request was not accepted (the plugin versions may not match)~",
  "error.host-missing": "The host half is not loaded. Check the install and refresh the page~",
  "error.network": "Cannot reach the host half. Check that the page is still running~",
  "error.empty": "The draft is empty \u2014 write something first~",
  "error.tooLongClient": "The draft is over {max} characters, so this pass is skipped~",
  "error.placeholder": "Reference placeholders do not line up in the result. Nothing was written back so your @ references stay intact~",
  "error.command": "The leading command chip (/xxx) disappeared in the rewrite. Nothing was written back so the command still works~",
  "error.auth": "The host rejected this request at the session check. Refresh the page and try again~",
  "error.unknown": "Hit something unexpected. Try once more~"
};
function createTranslate(activeLocale) {
  return (key, params) => {
    const locale = activeLocale();
    const dict = locale.toLowerCase().startsWith("zh") ? zh : en;
    const template = dict[key] ?? en[key] ?? String(key);
    if (params === void 0) return template;
    return template.replace(/\{(\w+)\}/g, (match, name2) => Object.prototype.hasOwnProperty.call(params, name2) ? String(params[name2]) : match);
  };
}

// src/client/index.tsx
var inject = ["slots", "locale"];
var name = "convey-assistant";
function readService(ctx, serviceName) {
  try {
    const getter = ctx.get;
    if (typeof getter !== "function") return void 0;
    const service = getter.call(ctx, serviceName);
    return service === null || service === void 0 ? void 0 : service;
  } catch {
    return void 0;
  }
}
function apply(ctx) {
  const services = ctx;
  ctx.effect(
    () => services.locale.register(NS, { zh, en }),
    "convey-assistant: dictionaries"
  );
  const readLocaleTag = () => {
    try {
      const snapshot = services.locale.getSnapshot?.();
      const active = snapshot?.active;
      if (typeof active === "string" && active !== "") return active;
    } catch {
    }
    if (typeof navigator !== "undefined" && typeof navigator.language === "string" && navigator.language !== "") return navigator.language;
    return "en";
  };
  const t = createTranslate(readLocaleTag);
  const sessions = readService(ctx, "sessions");
  const forge = new ConveyRegistry(
    readLocaleTag,
    (sessionId, draft) => readRecentContext(sessions, sessionId, draft)
  );
  ctx.effect(() => () => {
    forge.dispose();
  }, "convey-assistant: per-session controllers");
  const face = () => ({ forge, t });
  services.slots.inject("conversation.input.left", () => services.slots.register({
    name: "conversation.input.left",
    id: "convey-assistant.buttons",
    order: 10,
    inject: face
  }, ConveyButtons));
  services.slots.inject("conversation.input.dock", () => services.slots.register({
    name: "conversation.input.dock",
    id: "convey-assistant.card",
    order: 10,
    inject: face
  }, ConveyCard));
}

  return module.exports;
}});
