# Contributing / 参与开发

欢迎 PR、issue、以及"这句话真的被 Agent 理解错了吗"的实测反馈。

## 开发环境

```powershell
npm install
npm run build      # 产出 lib/index.js（宿主）+ lib/client.js（浏览器）
npm run typecheck  # 针对 DSH 0.2.2-rc.5 真实类型
npm run verify     # 发布前自检（含 npm pack 内容检查）
```

装到真实 DSH 里调试：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Profile desktop
# 改完代码重跑 npm run build，再刷新 DSH 页面
powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1 -Profile desktop
```

## 目录结构

```
src/
  index.ts            宿主插件入口（Cordis apply）
  host/               路由、鉴权、模型解析、LLM 调用、输出校验
  client/             按钮、意图卡片、宠物、占位符往返、写回
  shared/
    protocol.ts       浏览器 ↔ 宿主的请求/响应类型（唯一契约）
    prompts.ts        两个档位的提示词（本项目的核心资产）
    constants.ts      路由、上限、超时
lib/                  预构建产物，必须提交
scripts/              安装/卸载/发布/自检
```

## 不能破坏的硬约束

改动前请先确认这几条；任何一条被破坏的 PR 都不会被合并。

1. **不虚构事实**：模型输出里缺失的信息只能进 `questions`，不能进 `text`。
2. **占位符保真**：`⟦Rn⟧` 的数量与顺序在往返后必须完全一致，否则拒绝写回（见 `src/host/output.ts`）。
3. **不写会话**：不 append 会话事件、不传 `sessionId` 给模型调用之外的地方、不写 JSONL、不产生会话 Token 统计。
4. **零遥测**：不引入任何分析/上报 SDK，不新增网络出口。
5. **草稿不进日志**：不出现在 error message、`console`、`~/.dsh/logs`，也不进 `message` 字段。
6. **零编译安装**：`package.json` 里不得出现 `prepare/install/postinstall`；`lib/` 必须随仓库提交。

`npm run verify` 会自动检查第 2、6 条以及探针可达的部分。

## 提 PR 前

- [ ] `npm run build` 通过，且 `lib/` 是最新的
- [ ] `npm run typecheck` 零错误
- [ ] `npm run verify` 与 `npm run smoke` 都 PASS
- [ ] 若改了提示词：在 PR 描述里贴 2–3 组「输入草稿 → light 结果 → max 结果 → 追问」的真实对照
- [ ] 若新增 UI 文案：中文与英文都补齐

## 想加什么最容易被接受

- **新的档位**：在 `src/shared/prompts.ts` 加一段模式提示词，在 `protocol.ts` 的 `ConveyMode` 里加枚举值，客户端加一个按钮即可。
- **更多语言**：`src/client/locale.ts` 里补一份语言表。
- **更好的追问**：`prompts.ts` 里 QUESTIONS 那一段是迭代重点——它决定"追问像人还是像表单"。
- **真实翻车案例**：把你被 Agent 理解错的原始句子贴成 issue，这比任何抽象讨论都有用。

## 关于形象

卡片里提问的**大肥鱼**是**原创像素 SVG**（24×24 字符网格 + 调色板，每种颜色合并成一条 path）。
它不引用、不复刻任何官方美术资源，也没有任何外部图片请求。
如果你想换成别的形象，改 `src/client/Pet.tsx` 里的 `SPRITE` 网格即可。

## 许可

提交的代码默认以 MIT 授权。
