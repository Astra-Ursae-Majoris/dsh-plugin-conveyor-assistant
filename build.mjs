#!/usr/bin/env node
/**
 * dsh-convey-assistant 构建脚本
 * 产物：
 *   lib/index.js   —— 宿主半边（ESM，Node 直接 import，Cordis 插件）
 *   lib/client.js  —— 浏览器半边（经典脚本，注册 window.__ModuleLoader__ 工厂）
 *
 * 关键约束（见 _research/A-packaging.md `3.7）：
 *   - host 产物是 ESM，不得 import 浏览器包
 *   - client 产物必须是「经典脚本」：没有 import/export 语句，只能 require 共享表的词
 *   - client 的 module id 必须等于包名
 *   - 发布前不得出现 prepare/preinstall/install/postinstall 脚本
 */
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const PKG = 'dsh-convey-assistant'
const root = path.resolve(import.meta.dirname)
const lib = path.join(root, 'lib')
const tmp = path.join(root, '.tmp')
fs.mkdirSync(lib, { recursive: true })
fs.mkdirSync(tmp, { recursive: true })

/** 宿主平台表提供的共享模块（PLATFORM_MODULES）；client bundle 只能 require 这些 + react 系 */
const PLATFORM_MODULES = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'cordis',
  'zod',
  'react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit'
]

// ── 宿主半边 ────────────────────────────────────────────────────────────
await build({
  entryPoints: [path.join(root, 'src/index.ts')],
  outfile: path.join(lib, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  external: ['@deepseek-ai/*', 'cordis'],
  logLevel: 'info'
})

// ── 浏览器半边：先出 CJS，再包进 __ModuleLoader__ 工厂 ──────────────────
await build({
  entryPoints: [path.join(root, 'src/client/index.tsx')],
  outfile: path.join(tmp, 'client.cjs'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  jsx: 'transform',
  sourcemap: false,
  external: [...PLATFORM_MODULES, '@deepseek-ai/*/client'],
  logLevel: 'info'
})

const code = fs.readFileSync(path.join(tmp, 'client.cjs'), 'utf8')
const wrapper =
  `window.__ModuleLoader__.load({ id: '` + PKG + `', factory: require => {\n  var module = { exports: {} }; var exports = module.exports;\n  Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });\n` +
  code +
  `\n  return module.exports;\n}});\n`
fs.writeFileSync(path.join(lib, 'client.js'), wrapper)

const bytes = fs.statSync(path.join(lib, 'client.js')).size
console.error(`[build] lib/client.js ` + bytes + ` bytes`)
console.error(`[build] done.`)