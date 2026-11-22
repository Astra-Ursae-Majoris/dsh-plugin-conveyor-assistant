// src/shared/constants.ts
var ROUTE_PATH = "/api/dsh-convey-assistant/rewrite";
var MODELS_PATH = "/api/dsh-convey-assistant/models";
var MAX_DRAFT_CHARS = 8e3;
var MAX_OUTPUT_TOKENS = 4096;
var TIMEOUT_MS = 45e3;
var REF_TOKEN_RE = /⟦R(\d+)⟧/g;

// src/host/errors.ts
function languageOf(locale) {
  return (locale ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
}
var MESSAGES = {
  "no-model": {
    zh: "\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\u5462~ \u5148\u5728\u8F93\u5165\u6846\u4E0B\u65B9\u6311\u4E00\u4E2A\u518D\u8BD5\u5427",
    en: "No model is available yet~ pick one below the composer and try again"
  },
  timeout: {
    zh: "\u6A21\u578B\u8FD9\u6B21\u60F3\u5F97\u6709\u70B9\u4E45 (\uFF61\u2022\u0301\uFE3F\u2022\u0300\uFF61) \u5148\u653E\u5B83\u4E00\u9A6C\uFF0C\u7A0D\u540E\u518D\u8BD5\u4E00\u6B21~",
    en: "The model took too long this time (\uFF61\u2022\u0301\uFE3F\u2022\u0300\uFF61) let us try again in a moment~"
  },
  aborted: {
    zh: "\u8FD9\u6B21\u4F18\u5316\u505C\u5728\u534A\u8DEF\uFF0C\u8349\u7A3F\u539F\u6837\u7559\u7740\u5462~",
    en: "Optimization stopped midway \u2014 your draft is untouched~"
  },
  upstream: {
    zh: "\u6A21\u578B\u90A3\u5934\u4FE1\u53F7\u4E0D\u592A\u597D (\xB4\uFF65_\uFF65\uFF40) \u7A0D\u540E\u518D\u8BD5\u4E00\u6B21\u5427",
    en: "The model service is not answering well (\xB4\uFF65_\uFF65\uFF40) please try again shortly"
  },
  "bad-output": {
    zh: "\u6A21\u578B\u6CA1\u628A\u539F\u8BDD\u63A5\u7A33\uFF0C\u8FD9\u6B21\u5148\u4E0D\u5199\u56DE~ \u518D\u8BD5\u4E00\u6B21\u53EF\u80FD\u5C31\u597D\u4E86",
    en: "The model tripped over your wording, so nothing was written back~ one more try may fix it"
  },
  "too-long": {
    zh: "\u8349\u7A3F\u6709 " + MAX_DRAFT_CHARS + " \u5B57\u7684\u4E0A\u9650\uFF0C\u5148\u51CF\u4E00\u70B9\u518D\u8BA9\u6211\u8BFB~",
    en: "The draft limit is " + MAX_DRAFT_CHARS + " characters~ trim it a little and try again"
  },
  "bad-request": {
    zh: "\u8FD9\u6B21\u8BF7\u6C42\u6CA1\u5BF9\u4E0A\u53F7\uFF0C\u5237\u65B0\u4E00\u4E0B\u9875\u9762\u518D\u8BD5\u8BD5\u5427",
    en: "That request did not line up \u2014 refresh the page and try again"
  }
};
function messageFor(code, locale) {
  return MESSAGES[code][languageOf(locale)];
}
var RESPONSE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};
function sendJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: RESPONSE_HEADERS });
}
function sendFailure(code, locale, status = 200) {
  return sendJson({ ok: false, code, message: messageFor(code, locale) }, status);
}

// src/host/validate.ts
var MAX_BODY_BYTES = 64 * 1024;
var MODES = ["light", "max"];
var LOCALE_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/;
var CONTROL_RE = /[\u0000-\u001f\u007f]/;
async function readJsonBody(request) {
  const mediaType = (request.headers.get("content-type") ?? "").split(";", 1)[0] ?? "";
  if (mediaType.trim().toLowerCase() !== "application/json") {
    return { ok: false, status: 415, reason: "content-type" };
  }
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, reason: "body-too-large" };
  }
  if (request.body === null) return { ok: false, status: 400, reason: "body-invalid" };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => void 0);
        return { ok: false, status: 413, reason: "body-too-large" };
      }
      chunks.push(next.value);
    }
  } catch {
    return { ok: false, status: 400, reason: "body-invalid" };
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, status: 400, reason: "body-invalid" };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, reason: "body-invalid" };
  }
}
function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}
function localeOf(value) {
  if (value === void 0 || value === null || value === "") return void 0;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > 35 || !LOCALE_RE.test(trimmed)) return null;
  return trimmed;
}
function optionalText(value) {
  if (value === void 0 || value === null) return { ok: true, value: void 0 };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, value: void 0 };
  if (trimmed.length > MAX_DRAFT_CHARS) return { ok: false };
  return { ok: true, value: trimmed };
}
function routeIdOf(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > 128 || CONTROL_RE.test(trimmed)) return void 0;
  return trimmed;
}
function sessionIdOf(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > 128 || CONTROL_RE.test(trimmed)) return void 0;
  return trimmed;
}
function validateBody(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, code: "bad-request", locale: "en" };
  }
  const record = value;
  const locale = localeOf(record.locale);
  const languageHint = typeof locale === "string" ? locale : typeof record.locale === "string" ? record.locale : "en";
  if (locale === null) return { ok: false, code: "bad-request", locale: languageHint };
  const draft = record.draft;
  if (!nonEmptyString(draft)) return { ok: false, code: "bad-request", locale: languageHint };
  if (draft.length > MAX_DRAFT_CHARS) return { ok: false, code: "too-long", locale: languageHint };
  const mode = record.mode;
  if (typeof mode !== "string" || !MODES.includes(mode)) {
    return { ok: false, code: "bad-request", locale: languageHint };
  }
  const context = optionalText(record.context);
  if (!context.ok) return { ok: false, code: "bad-request", locale: languageHint };
  const supplement = optionalText(record.supplement);
  if (!supplement.ok) return { ok: false, code: "bad-request", locale: languageHint };
  const sessionId = sessionIdOf(record.sessionId);
  const pickedProvider = routeIdOf(record.provider);
  const pickedModel = routeIdOf(record.model);
  const picked = pickedProvider !== void 0 && pickedModel !== void 0 ? { provider: pickedProvider, model: pickedModel } : void 0;
  const body = {
    draft,
    mode,
    locale: locale ?? "en",
    ...context.value === void 0 ? {} : { context: context.value },
    ...supplement.value === void 0 ? {} : { supplement: supplement.value },
    ...sessionId === void 0 ? {} : { sessionId },
    ...picked === void 0 ? {} : { provider: picked.provider, model: picked.model }
  };
  return { ok: true, body };
}

// src/host/model.ts
function asRoute(value) {
  if (typeof value !== "object" || value === null) return void 0;
  const candidate = value;
  const provider = typeof candidate.provider === "string" ? candidate.provider.trim() : "";
  const model = typeof candidate.model === "string" ? candidate.model.trim() : "";
  if (provider === "" || model === "") return void 0;
  return { provider, model };
}
function attempt(read) {
  try {
    return asRoute(read());
  } catch {
    return void 0;
  }
}
function resolveRoute(ctx, sessionId, override, picked) {
  if (override.provider !== void 0 && override.model !== void 0) {
    return { provider: override.provider, model: override.model };
  }
  if (picked !== void 0 && picked.provider !== void 0 && picked.model !== void 0) {
    return { provider: picked.provider, model: picked.model };
  }
  if (sessionId !== void 0) {
    const agents = ctx.get("agents");
    const fromAgent = attempt(() => agents?.get?.(sessionId)?.model?.current?.());
    if (fromAgent !== void 0) return fromAgent;
    const sessions = ctx.get("sessions");
    const fromHeader = attempt(() => sessions?.get?.(sessionId)?.requestHeader?.()?.config);
    if (fromHeader !== void 0) return fromHeader;
  }
  const defaults = ctx.get("agentDefaultModel");
  const fromDefault = attempt(() => defaults?.currentSelection?.());
  if (fromDefault !== void 0) return fromDefault;
  return void 0;
}

// src/shared/prompts.ts
var SHARED = `You are the engine behind "Convey Assistant", a DeepSeek Harness plugin.
The user typed a rough, informal draft into their composer. It is about to be sent to an AI agent \u2014 an autonomous coding / research agent that has tools and will act on it. Your job is to return a version of that draft which the agent cannot misread, plus at most a few questions for the user when something essential is genuinely missing.

NON-NEGOTIABLE RULES
1. NEVER invent facts. No new file paths, versions, numbers, names, APIs, deadlines, or acceptance criteria. If a detail is required but absent, it becomes a question \u2014 never a guess placed inside "text".
2. Copy verbatim; never translate, reflow or "fix" them: every reference placeholder of the form \u27E6Rn\u27E7, every path, URL, shell command, identifier, code span, number, unit, and quoted string.
3. Preserve the pragmatics. Hedges ("maybe", "\u5148\u8BD5\u8BD5"), priorities ("\u90A3\u4E2A\u5148\u4E0D\u7BA1"), and stakes ("\u968F\u4FBF\u770B\u770B") must survive. Never promote a casual request into a formal specification, and never demote a strict requirement into a suggestion.
4. "text" MUST be written in the same language as the draft. Keep the user's own domain vocabulary and their names for things.
5. Output EXACTLY one JSON object and nothing else \u2014 no markdown fence, no preamble, no trailing commentary.

QUESTIONS \u2014 this is the part that earns trust
- Think from the receiving agent's seat: "If I act on this draft right now, where would I go wrong? What would I have to guess?" Emit a question ONLY for a guess that changes what the agent would DO.
- Zero questions is the normal, healthy case. Never pad the list to look thorough. Maximum 3.
- One sentence each, pointing at the exact fork rather than asking "could you clarify". Good: \u300C\u4F60\u8BF4"\u90A3\u4E2A\u811A\u672C"\uFF0C\u662F\u6307 tools/run_hhg.mjs \u5427~\u300D. Bad: \u300C\u8BF7\u8865\u5145\u66F4\u591A\u4FE1\u606F\u300D.
- Tone: professional but warm and human \u2014 a "~" and a light kaomoji such as (\u0E51\u2022\u0300\u3142\u2022\u0301)\u0648 are welcome; exclamation marks and corporate filler are not.
- Never ask something already answered in the draft, the context, or the supplement.
- Output language for questions matches the draft's language.`;
var LIGHT = `MODE = LIGHT ("\u76F4\u8BD1\u5F0F\u6574\u7406")
Restructure only; do not re-author. Produce a compact, scannable form that an agent can parse in one pass:
- If the draft has an implied goal, open with one short goal line; then 3\u20138 numbered points.
- Split run-on sentences, pull parallel asks apart into separate points, drop filler ("\u90A3\u4E2A", "\u5C31\u662F", "\u5443", "you know"), make elided subjects explicit.
- Keep the user's own phrasing wherever it is already clear. Do NOT restyle, do NOT merge distinct asks, do NOT add sections the draft does not imply.
- Target length: 60\u2013120% of the draft. If the draft is already crisp, return it almost unchanged.`;
var MAX = `MODE = MAX ("\u610F\u8BD1\u5F0F\u8F6C\u8BD1")
Read for intent, then write the draft the agent should have received. Reconstruct what the user is really trying to achieve:
- Lead with the goal in one sentence \u2014 concretely what "done" looks like.
- Then include only the sections that actually carry information, in this order when present: \u4EA4\u4ED8\u7269 (deliverable) / \u5173\u952E\u7EA6\u675F (constraints) / \u5B8C\u6210\u5224\u636E (acceptance) / \u53C2\u8003\u7269 (references). Omit an empty section instead of inventing content for it.
- Resolve pronouns and elided references from the draft itself, and from REQUEST CONTEXT when provided. If a reference cannot be resolved from the available text, it becomes a question \u2014 do not pick a plausible target.
- You MAY reorder, regroup and re-phrase freely, but every factual claim must trace back to the draft or the supplement.
- Target length: 80\u2013200% of the draft.`;
function buildSystemPrompt(mode) {
  return [SHARED, mode === "max" ? MAX : LIGHT].join("\n\n");
}
function buildUserMessage(req) {
  const parts = [];
  parts.push("DRAFT (verbatim; \u27E6Rn\u27E7 are opaque reference placeholders \u2014 copy them back exactly):");
  parts.push("<<<");
  parts.push(req.draft);
  parts.push(">>>");
  if (req.context && req.context.trim()) {
    parts.push("");
    parts.push("REQUEST CONTEXT \u2014 recent conversation, use ONLY to resolve pronouns and omissions, never as material to rewrite:");
    parts.push("<<<");
    parts.push(req.context.trim());
    parts.push(">>>");
  }
  if (req.supplement && req.supplement.trim()) {
    parts.push("");
    parts.push("USER'S ANSWER TO YOUR PREVIOUS QUESTIONS \u2014 treat it as part of the draft; it outranks any ambiguous reading:");
    parts.push("<<<");
    parts.push(req.supplement.trim());
    parts.push(">>>");
  }
  parts.push("");
  parts.push("Return one JSON object shaped exactly like this, and nothing else:");
  parts.push('{"text": "<the draft to put back into the composer>", "questions": ["<question for the user>"]}');
  return parts.join("\n");
}

// src/host/complete.ts
function startDeadline(clientSignal, timeoutMs) {
  const controller = new AbortController();
  let expired = false;
  const forward = () => {
    controller.abort(clientSignal.reason);
  };
  if (clientSignal.aborted) forward();
  else clientSignal.addEventListener("abort", forward, { once: true });
  const timer = setTimeout(() => {
    expired = true;
    controller.abort(new Error("convey-assistant: model call budget exhausted"));
  }, timeoutMs);
  return {
    signal: controller.signal,
    expired: () => expired,
    dispose: () => {
      clearTimeout(timer);
      clientSignal.removeEventListener("abort", forward);
    }
  };
}
function lowestEffort(info) {
  const efforts = info.reasoning?.efforts ?? [];
  const off = efforts.find((effort) => String(effort.id) === "off");
  return (off ?? efforts[0])?.id;
}
function classify(error, deadline, clientSignal) {
  if (deadline.expired()) return { status: "timeout" };
  if (clientSignal.aborted) return { status: "aborted" };
  const code = typeof error === "object" && error !== null ? error.code : void 0;
  if (code === "NO_ADAPTER") return { status: "no-model" };
  return { status: "upstream" };
}
function failureOfFinish(reason, deadline, clientSignal) {
  switch (reason.kind) {
    case "stop":
      return void 0;
    case "max-tokens":
      return { status: "bad-output" };
    case "tool-calls":
      return { status: "bad-output" };
    case "aborted":
      if (deadline.expired()) return { status: "timeout" };
      if (clientSignal.aborted) return { status: "aborted" };
      return { status: "upstream" };
    case "error":
      return { status: "upstream" };
  }
}
async function callModel(ctx, route, request, clientSignal) {
  if (clientSignal.aborted) return { status: "aborted" };
  const deadline = startDeadline(clientSignal, TIMEOUT_MS);
  try {
    let prepared;
    try {
      prepared = await ctx.llm.prepareCall(
        { provider: route.provider, model: route.model, maxTokens: MAX_OUTPUT_TOKENS },
        deadline.signal,
        (controls, model) => {
          const effort = lowestEffort(model);
          return effort === void 0 ? { ...controls } : { ...controls, reasoningEffort: effort };
        }
      );
    } catch (error) {
      return classify(error, deadline, clientSignal);
    }
    const messages = [
      { role: "user", content: [{ type: "text", text: buildUserMessage(request) }] }
    ];
    const options = {
      ...prepared.config,
      system: buildSystemPrompt(request.mode),
      messages,
      signal: deadline.signal
    };
    const parts = [];
    let finish;
    try {
      for await (const chunk of prepared.stream(options)) {
        switch (chunk.type) {
          case "text-delta":
            parts.push(chunk.text);
            break;
          case "finish":
            finish = chunk.reason;
            break;
          case "usage":
            break;
          case "block-start":
            if (chunk.blockType !== "text") return { status: "bad-output" };
            break;
          case "block-end":
            if (chunk.block.type !== "text") return { status: "bad-output" };
            break;
          case "reasoning-delta":
          case "tool-call-delta":
            return { status: "bad-output" };
        }
      }
    } catch (error) {
      return classify(error, deadline, clientSignal);
    }
    if (deadline.expired()) return { status: "timeout" };
    if (clientSignal.aborted) return { status: "aborted" };
    if (finish === void 0) return { status: "upstream" };
    const failure = failureOfFinish(finish, deadline, clientSignal);
    if (failure !== void 0) return failure;
    const text = parts.join("");
    if (text.trim() === "") return { status: "bad-output" };
    return { status: "ok", text };
  } finally {
    deadline.dispose();
  }
}

// src/host/output.ts
var MAX_QUESTIONS = 3;
var MAX_QUESTION_CHARS = 200;
var MAX_MODEL_TEXT_CHARS = 1e5;
function tokensOf(value) {
  const matched = value.match(REF_TOKEN_RE);
  return matched === null ? [] : matched;
}
function questionsOf(value) {
  if (value === void 0) return [];
  if (!Array.isArray(value)) return void 0;
  const questions = [];
  for (const item of value) {
    if (typeof item !== "string") return void 0;
    const trimmed = item.trim();
    if (trimmed === "") continue;
    if (Array.from(trimmed).length > MAX_QUESTION_CHARS) return void 0;
    questions.push(trimmed);
    if (questions.length > MAX_QUESTIONS) return void 0;
  }
  return questions;
}
function jsonObjectOf(modelText) {
  const start = modelText.indexOf("{");
  const end = modelText.lastIndexOf("}");
  if (start < 0 || end <= start) return void 0;
  try {
    return JSON.parse(modelText.slice(start, end + 1));
  } catch {
    return void 0;
  }
}
function placeholdersMatch(draft, text) {
  const expected = tokensOf(draft);
  const actual = tokensOf(text);
  if (expected.length !== actual.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] !== actual[index]) return false;
  }
  const stripped = text.replace(REF_TOKEN_RE, "");
  return !stripped.includes("\u27E6") && !stripped.includes("\u27E7");
}
function parseModelOutput(modelText, draft) {
  if (modelText.length > MAX_MODEL_TEXT_CHARS) return { ok: false };
  const value = jsonObjectOf(modelText);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false };
  const record = value;
  const text = record.text;
  if (typeof text !== "string") return { ok: false };
  const normalized = text.trim();
  if (normalized === "") return { ok: false };
  const questions = questionsOf(record.questions);
  if (questions === void 0) return { ok: false };
  if (!placeholdersMatch(draft, normalized)) return { ok: false };
  return { ok: true, text: normalized, questions };
}

// src/host/models.ts
var MAX_OPTIONS = 200;
async function listModelOptions(ctx) {
  let providers;
  try {
    providers = ctx.llm.listProviders();
  } catch {
    return [];
  }
  const options = [];
  for (const provider of providers) {
    if (options.length >= MAX_OPTIONS) break;
    let models;
    try {
      models = await ctx.llm.listModels(provider.id);
    } catch {
      continue;
    }
    for (const model of models) {
      if (options.length >= MAX_OPTIONS) break;
      if (typeof model.id !== "string" || model.id === "") continue;
      options.push({
        provider: provider.id,
        providerLabel: provider.name,
        model: model.id,
        label: typeof model.name === "string" && model.name !== "" ? model.name : model.id,
        ...typeof model.description === "string" && model.description !== "" ? { description: model.description } : {}
      });
    }
  }
  return options;
}

// src/host/route.ts
function configText(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed === "" ? void 0 : trimmed;
}
function normalizeConfig(config) {
  const provider = configText(config?.provider);
  const model = configText(config?.model);
  if (provider === void 0 && model === void 0) return {};
  if (provider === void 0 || model === void 0) {
    throw new Error("convey-assistant: config.provider and config.model must both be non-empty strings when either is set");
  }
  return { provider, model };
}
function registerRoute(ctx, config) {
  ctx.effect(
    () => ctx.connection.fetch.register({
      path: ROUTE_PATH,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: (request) => handleRequest(ctx, config, request)
    }),
    "convey-assistant: rewrite route"
  );
  ctx.effect(
    () => ctx.connection.fetch.register({
      path: MODELS_PATH,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: (request) => handleModelsRequest(ctx, request)
    }),
    "convey-assistant: models route"
  );
}
async function handleModelsRequest(ctx, request) {
  let rejection;
  try {
    rejection = ctx.connection.requestRejection(request);
  } catch {
    rejection = 403;
  }
  if (rejection !== void 0) return sendFailure("bad-request", "en", rejection);
  if (request.method !== "POST") return sendFailure("bad-request", "en", 405);
  const options = await listModelOptions(ctx);
  const payload = { ok: true, options, current: null };
  return sendJson(payload);
}
async function handleRequest(ctx, config, request) {
  let rejection;
  try {
    rejection = ctx.connection.requestRejection(request);
  } catch {
    rejection = 403;
  }
  if (rejection !== void 0) return sendFailure("bad-request", "en", rejection);
  if (request.method !== "POST") return sendFailure("bad-request", "en", 405);
  const body = await readJsonBody(request);
  if (!body.ok) return sendFailure("bad-request", "en", body.status);
  const parsed = validateBody(body.value);
  if (!parsed.ok) return sendFailure(parsed.code, parsed.locale);
  const current = parsed.body;
  const picked = current.provider !== void 0 && current.model !== void 0 ? { provider: current.provider, model: current.model } : void 0;
  const route = resolveRoute(ctx, current.sessionId, config, picked);
  if (route === void 0) return sendFailure("no-model", current.locale);
  const outcome = await callModel(ctx, route, current, request.signal);
  if (outcome.status !== "ok") return sendFailure(outcome.status, current.locale);
  const output = parseModelOutput(outcome.text, current.draft);
  if (!output.ok) return sendFailure("bad-output", current.locale);
  const result = {
    ok: true,
    mode: current.mode,
    text: output.text,
    questions: output.questions,
    model: route.provider + "/" + route.model
  };
  return sendJson(result);
}

// src/index.ts
var name = "dsh-convey-assistant";
var inject = ["llm", "connection"];
function apply(ctx, config) {
  registerRoute(ctx, normalizeConfig(config));
}
export {
  apply,
  inject,
  name
};
