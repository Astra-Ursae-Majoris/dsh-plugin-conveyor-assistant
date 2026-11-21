# dsh-convey-assistant

> 说一遍，就说对。把口语草稿编译成 AI Agent 不会理解错的意图。

一个 [DeepSeek Harness](https://www.deepseek.com/en/harness/)（DSH）插件。
你在输入框里写完草稿，点一下按钮，它把这段话变成模型能准确执行的版本——
**在你发送之前**，由你过目确认。

[English](README.md) | 中文

---

## 它解决什么问题

人类对 AI 说话时默认对方共享自己的上下文：

> "那个图再改改，颜色不太对，顺便把昨天那组数据的拟合也跑一下"

这句话里藏着三个 Agent 无法自行确定的东西：「那个图」是哪张、「颜色不对」往哪个方向调、「昨天那组数据」是哪个文件。
模型不会报错，它会**猜**——猜错之后你得重说一遍，这就是那轮反复的根源。

这个插件不替你猜，它做两件事：

1. **把话整理成结构化、无歧义的形式**（两个档位，见下）；
2. **把猜不出来的地方变成一句人话的追问**，让你补一句话就能省掉一轮来回。

## 两个档位

| | ✨ 轻（light） | 🪄 重（max） |
|---|---|---|
| 比喻 | 直译 | 信达雅的意译 |
| 做什么 | 总结 + 列点：拆长句、去口水词、把并行的要求分开、补明主语 | 阅读理解式转译：还原你真正想达成的目标，按「目标 / 交付物 / 约束 / 完成判据」重写 |
| 不做什么 | 不重写措辞、不合并要求、不添加原文没有的结构 | 不虚构任何事实、不猜指代、不补规格 |
| 长度 | 原文 60–120% | 原文 80–200% |

两档都遵守同一条铁律：**缺失的信息只会变成追问，绝不会被编造成内容。**

## 怎么用

1. 在输入框写完草稿；
2. 点输入框工具栏的 ✨（轻）或 🪄（重）；
3. 卡片里并排给出**原文**与**结果**，结果可以直接编辑；
4. 如果存在真正会导致 Agent 走错路的歧义，卡片下方会出现一句追问，例如：

   > 我想了一下，这个要求好像不太明确呢~ 「那个图」是指 figures/hhg_spectrum.png 吗？

   你在框里补一句，点「重新编译」，它会带着你的补充重跑；
5. 满意了就点「确认写回」，草稿被替换；**发送仍然由你自己点**。

## 安装

本插件是**预构建**的：仓库里已经包含 `lib/index.js` 与 `lib/client.js`，安装时**不会**在你的机器上执行任何构建脚本。

```powershell
# 从 GitHub 安装（推荐钉到 commit）
dsh plugin --profile web add "github:Astra-Ursae-Majoris/dsh-convey-assistant"

# 或从本地 tarball 安装
dsh plugin --profile web add ./dsh-convey-assistant-0.1.0.tgz
```

也可以在 **设置 → 插件 → 添加插件** 里粘贴 GitHub 地址。

装完刷新页面；如果按钮没出现，重启一次 DSH（新增 bundle 有时需要重新装配 host 侧）。

### 卸载（从零复现用）

```powershell
dsh plugin --profile desktop remove dsh-convey-assistant
```

或者用仓库自带脚本——它会先备份 profile 的 `package.json`，卸载时再恢复，所以能真正做到"从零复现"：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1 -Profile desktop
powershell -ExecutionPolicy Bypass -File scripts\install.ps1   -Profile desktop
```

> profile 名：桌面端是 `desktop`；CLI/无头环境换成你自己的 profile 名（本机另有 `headless` / `llmtest`）。

### 指定模型（可选）

默认跟随你在 DSH 里**当前会话所选**的模型。如果你想把这个插件钉死在某个模型上，在插件配置里同时给 `provider` 与 `model`：

```yaml
- id: convey-assistant
  name: 'dsh-convey-assistant'
  config:
    provider: deepseek
    model: deepseek-chat
```

只给其中一个会**加载期直接报错**（故意 fail loud，避免静默走错模型）。

## 隐私

这是本项目的第一优先级，并且是可核对的而非口头承诺：

| 项 | 行为 |
|---|---|
| 谁会看到你的草稿 | 只有你**在 DSH 里自己选的模型**。插件没有自带 API key，也不连任何第三方端点。 |
| 网络出口 | 浏览器 → 本机一个受认证路由（`/api/dsh-convey-assistant/rewrite`）→ 你的模型。**只有这一个**。 |
| 这次改写会不会进会话记录 | **不会**。不 append 会话事件、不传 sessionId、不写 JSONL、不计入 token 统计。 |
| 遥测 / 埋点 | **没有**。零分析、零上报。 |
| 草稿会不会进日志 | **不会**。草稿不进 error message、不进 console、不进 `~/.dsh/logs`。 |
| 插件自己存不存草稿 | **不存**。全程只在内存里。 |

**诚实的边界**（我们不假装能消掉它们）：

- 你选的模型提供方当然会收到发出去的那段文本——这是它工作的前提；
- 如果你配置了 HTTPS 代理，代理能看到连接元数据（TLS 载荷对它不可见）；
- 同一 Host 进程内其它插件理论上可以 hook LLM 流——这是 harness 的信任边界，本插件无法也无意绕过。
- DSH 自身本来就会把草稿明文持久化在 Electron 的 localStorage 里（键 `dsh.conversation.<sessionId>`）。这是宿主行为，本插件**没有新增**任何本地存储。

## 工作原理

```
┌──────────────── 浏览器 ────────────────┐        ┌──────── 宿主（Node）────────┐
│ conversation.input.left   ✨ / 🪄      │        │                            │
│        │ 读草稿 useInput               │  POST  │ 受认证路由                  │
│ conversation.input.dock   意图卡片      │ ─────► │  · 校验入参（长度/档位）     │
│        │                               │        │  · 解析你选中的模型          │
│        └─ 确认后 setDraft 写回          │ ◄───── │  · ctx.llm 单轮无工具调用    │
└────────────────────────────────────────┘        └────────────────────────────┘
```

**引用芯片怎么保住**：草稿里的 `@文件引用`、命令芯片不是纯文本。送模型前它们被替换成 `⟦R0⟧⟦R1⟧…` 占位符（模型被严令原样回传），回来再按原偏移回插。占位符数量或顺序对不上时，插件**拒绝写回**而不是把引用退化成文本。

## 兼容性

- DSH `>= 0.2.2-rc.5 < 0.3.0`
- 桌面端与 Web GUI 均可（需要同源的 `/api` 路由）

## 开发

```powershell
npm install
npm run build        # 产出 lib/index.js + lib/client.js
npx tsc --noEmit     # 类型自检（针对 0.2.2-rc.5 的真实类型）
npm pack --dry-run   # 发布前自检
```

`lib/` 是构建产物且**必须提交**——这是"即下即用"的前提。

## 路线图

- [x] 双档位、意图卡片、追问框、占位符往返
- [ ] 流式输出（边生成边显示）
- [ ] 用户自定义档位的提示词模板
- [ ] 会话级的"上次我补充过什么"记忆（仍然不写会话日志）

## 许可

MIT
