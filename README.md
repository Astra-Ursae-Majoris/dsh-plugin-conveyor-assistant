# dsh-convey-assistant

> Say it once, say it right — turn a rough draft into intent an AI agent cannot misread.

A [DeepSeek Harness](https://www.deepseek.com/en/harness/) (DSH) plugin.
Write your draft as you normally would, hit one button, and get a version the model
can act on unambiguously — **reviewed and approved by you before it is sent**.

English | [中文](README.zh.md)

---

## The problem

People talk to AI as if it shared their head:

> "tweak that figure again, colors feel off, and rerun the fit on yesterday's data while you're at it"

Three things in that sentence are undecidable for an agent: *which* figure, *which direction* the colors are off,
and *which file* "yesterday's data" means. The model will not complain — it will **guess**. Then you re-explain, and that
extra round trip is exactly where the time goes.

This plugin does not guess for you. It does two things:

1. **Restructures the text** into an unambiguous form (two depths, below);
2. **Turns whatever it genuinely cannot infer into one plain-language question**, so a one-sentence answer replaces a round trip.

## Two postures

Default is **"Guess what I really mean"**. If you would rather she did not editorialize, switch to **"Let me finish first"** in her settings panel.

| | Let me finish first | Guess what I really mean (default) |
|---|---|---|
| In a word | literal | faithful |
| What it does | Structure only: split run-ons, drop filler, separate parallel asks, make elided subjects explicit | Read for intent and rewrite as goal / deliverable / constraints / acceptance criteria |
| What it refuses to do | Restyle, merge distinct asks, invent structure you did not imply | Invent facts, pick a referent it cannot resolve, add specifications |
| Length | 60–120% of the draft | 80–200% of the draft |

Both obey one hard rule: **missing information becomes a question, never a fabricated line of text.**

## Using it

1. Write your draft in the composer.
2. Click ✨ in the composer toolbar.
3. A card shows **your original** next to **the result**; the result is editable.
4. If a genuine fork exists that would change what the agent does, the card asks, e.g.:

   > I had a think — this one's still a bit fuzzy~ did you mean figures/hhg_spectrum.png by "that figure"?

   Answer in the box, hit **Recompile**, and she reruns with your answer folded in.
5. Hit **Apply to draft**. The composer text is replaced; **you still press send yourself.**

## The resident pet & her settings

Below the composer there is a switch: **"Let the fat fish stay around"**, **on by default** — otherwise you would never find her.

- While resident she **wanders and hops** around the empty space of the conversation. Move your mouse and she **freezes instantly**, waiting for you; a moment after you stop, she resumes.
- **Hover her** and she asks: **"Master, would you like to configure me?"** — click it to open her settings panel:

| Setting | Meaning |
|---|---|
| **Model** | Defaults to "follow this conversation". You may also pin one model for a single rewrite — it **does not change the model your session uses**. |
| **Posture** | "Let me finish first" / "Guess what I really mean" — see above. |
| **Permission to roam** | "Go on, run around~" / "Stay still, don't move". |
| Resident switch off | She clocks out. Turn it back on and she **makes an entrance** again. |

Every choice is stored locally in your browser — a couple of strings, never any draft content.

## Install

This plugin ships **prebuilt** — `lib/index.js` and `lib/client.js` are committed, and installation runs **no build script on your machine**.

```powershell
# From GitHub (pinning a commit is recommended)
dsh plugin --profile web add "github:Astra-Ursae-Majoris/dsh-convey-assistant"

# Or from a local tarball
dsh plugin --profile web add ./dsh-convey-assistant-0.1.0.tgz
```

You can also paste the GitHub URL into **Settings → Plugins → Add plugin**. Refresh the page — if the buttons do not appear, restart DSH once (a newly added bundle sometimes needs the host to re-compose).

### Uninstall (for a clean from-scratch test)

```powershell
dsh plugin --profile desktop remove dsh-convey-assistant
```

Or use the bundled scripts — they back up the profile's `package.json` and restore it on uninstall, so a from-zero test really starts from zero:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1 -Profile desktop
powershell -ExecutionPolicy Bypass -File scripts\install.ps1   -Profile desktop
```

> Profile name: `desktop` for the desktop app; use your own profile name elsewhere.

### Pinning a model (optional)

By default the plugin uses **the model you selected in the current DSH session**. To pin it, provide both `provider` and `model` in the plugin config:

```yaml
- id: convey-assistant
  name: 'dsh-convey-assistant'
  config:
    provider: deepseek
    model: deepseek-chat
```

Supplying only one of them fails loudly at load time — no silent fallback to a different model.

## Privacy

This is the project's first priority, and it is checkable rather than merely promised:

| Question | Answer |
|---|---|
| Who sees my draft? | Only the model **you selected inside DSH**. The plugin owns no API key and talks to no third-party endpoint. |
| What leaves the machine? | Browser → one authenticated local route (`/api/dsh-convey-assistant/rewrite`) → your model. That is the entire list. |
| Does the rewrite enter my conversation? | **No.** No session event, no `sessionId`, no JSONL entry, not counted in token usage. |
| Analytics / telemetry | **None.** |
| Does my draft reach logs? | **No.** Never in error messages, console output, or `~/.dsh/logs`. |
| Does the plugin store my draft? | **No.** In memory only. |
| Is my model choice remembered? | Only the `provider/model` strings (localStorage), never any conversation content. |

**Honest boundaries** — we do not pretend to remove these:

- The provider you chose obviously receives the text that is sent; that is the point.
- If you configured an HTTPS proxy, it sees connection metadata (TLS payload stays opaque to it).
- Another plugin inside the same host process could in principle hook the LLM stream — that is the harness trust boundary, not something this plugin can or tries to bypass.
- DSH itself already persists drafts in Electron localStorage (key `dsh.conversation.<sessionId>`). That is host behaviour; this plugin adds **no** local storage of its own.

## How it works

```
┌──────────────── browser ────────────────┐        ┌──────── host (Node) ────────┐
│ conversation.input.left   ✨ / 🪄       │        │                             │
│        │ read draft via useInput        │  POST  │ authenticated route         │
│ conversation.input.dock   intent card   │ ─────► │  · validate input           │
│        │                               │        │  · resolve YOUR selected    │
│        └─ apply → setDraft             │ ◄───── │    model                    │
│                                         │        │  · one tool-less llm call   │
└─────────────────────────────────────────┘        └─────────────────────────────┘
```

**Keeping reference chips alive.** `@file` references and command chips in the draft are not plain text. Before the
model sees the draft they are replaced by `⟦R0⟧⟦R1⟧…` placeholders (which the model is ordered to return verbatim), then
re-inserted at their original offsets. If the placeholder set comes back changed, the plugin **refuses to apply**
instead of silently degrading your references to plain text.

## Compatibility

- DSH `>= 0.2.2-rc.5 < 0.3.0`
- Desktop and Web GUI (needs a same-origin `/api` route)

## Development

```powershell
npm install
npm run build        # produces lib/index.js + lib/client.js
npx tsc --noEmit     # typecheck against real 0.2.2-rc.5 types
npm pack --dry-run   # pre-publish check
```

`lib/` is a build artifact and **must be committed** — that is what makes "install and go" true.

## Roadmap

- [x] Two depths, intent card, clarifying questions, placeholder round-trip
- [ ] Streaming output
- [ ] User-editable prompt templates
- [ ] Session-local memory of your previous answers (still no session log)

## License

MIT
