#!/usr/bin/env node
/**
 * 发布前自检 —— 每一条都对应一个真实踩过或明确验证过的约束（出处见 _research/A-packaging.md）。
 * 用法：node scripts/verify.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const problems = []
const notes = []
const ok = (m) => notes.push('  OK   ' + m)
const bad = (m) => problems.push('  FAIL ' + m)

// 1) 即下即用：包里不得有任何安装期脚本（否则用户端要授 allowBuilds）
const FORBIDDEN = ['preinstall', 'install', 'postinstall', 'prepare', 'prepublishOnly']
for (const s of FORBIDDEN) {
  if (pkg.scripts && pkg.scripts[s]) bad(`声明了安装期脚本 scripts.` + s + ` —— 会破坏"零编译安装"`)
}
if (!problems.length) ok('无安装期脚本（preinstall/install/postinstall/prepare）')

// 2) 两个产物必须已构建并入库
for (const f of ['lib/index.js', 'lib/client.js']) {
  const p = path.join(root, f)
  if (!fs.existsSync(p)) { bad(`缺少构建产物 ` + f + ` —— 先跑 npm run build`); continue }
  ok(`存在 ` + f + ` (` + fs.statSync(p).size + ` bytes)`)
}

// 3) client bundle 的协议硬要求：经典脚本 + __ModuleLoader__ + id 等于包名
if (fs.existsSync(path.join(root, 'lib/client.js'))) {
  const c = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8')
  if (!c.includes('__ModuleLoader__.load')) bad('lib/client.js 没有调用 window.__ModuleLoader__.load')
  else ok('lib/client.js 注册了 __ModuleLoader__ 工厂')
  if (new RegExp(`id: '` + pkg.name + `'`).test(c)) ok(`factory id 等于包名 ` + pkg.name)
  else bad(`factory id 不等于包名（必须是 ` + pkg.name + `）`)
  if (/^\s*(import|export)\s/m.test(c)) bad('lib/client.js 含 ESM import/export 语句 —— 必须是经典脚本')
  else ok('lib/client.js 是经典脚本（无 ESM 语句）')
}

// 4) host 产物必须是 ESM 插件面
if (fs.existsSync(path.join(root, 'lib/index.js'))) {
  const h = fs.readFileSync(path.join(root, 'lib/index.js'), 'utf8')
  if (/\bexport\s+(function|const|default|\{)/.test(h)) ok('lib/index.js 有 ESM 导出（可被 Cordis 当作插件）')
  else bad('lib/index.js 没有 ESM 导出')
  if (/from\s*['"]react/.test(h)) bad('lib/index.js 疑似引入了浏览器依赖 react')
  else ok('lib/index.js 未引入 react')
}

// 5) 清单字段
if (pkg.dsh?.bundle?.patch) ok('package.json 声明了 dsh.bundle.patch = ' + pkg.dsh.bundle.patch)
else bad('缺少 dsh.bundle.patch')
if (pkg.dsh?.client?.platform === 'web') ok('package.json 声明了 dsh.client.platform = web')
else bad('缺少 dsh.client.platform')
if (pkg.main === 'lib/index.js') ok('main 指向 lib/index.js')
else bad('main 必须指向 lib/index.js')
if (pkg.exports?.['./client']) ok('exports["./client"] 已声明')
else bad('缺少 exports["./client"]')

// 6) 路由常量一致性：client 与 host 必须用同一个路径
const sh = path.join(root, 'src/shared/constants.ts')
if (fs.existsSync(sh)) {
  const m = fs.readFileSync(sh, 'utf8').match(/ROUTE_PATH\s*=\s*'([^']+)'/)
  if (m) ok('共享路由常量 ' + m[1]); else bad('src/shared/constants.ts 里找不到 ROUTE_PATH')
}

// 7) 草稿不许进日志：粗筛 src 下的 console 调用
const suspicious = []
;(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { if (ent.name !== 'node_modules') walk(p); continue }
    if (!/\.(ts|tsx)$/.test(ent.name)) continue
    const t = fs.readFileSync(p, 'utf8')
    for (const line of t.split(/\r?\n/)) {
      if (/console\.(log|info|warn|error)/.test(line) && /(draft|text|prompt|req\b)/i.test(line)) {
        suspicious.push(path.relative(root, p) + ': ' + line.trim())
      }
    }
  }
})(path.join(root, 'src'))
if (suspicious.length) bad('疑似把草稿写进 console：\n' + suspicious.map(s => '       ' + s).join('\n'))
else ok('src 下没有把 draft/text 打进 console 的调用')

// 8) npm pack 内容自检
try {
  const out = execSync('npm pack --dry-run --json', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  // npm 10 输出数组、npm 12 输出「以包名为键的对象」；构建日志已改走 stderr，这里再兜一层
  let at = out.search(/^[\[{]/m)
  if (at < 0) throw new Error('npm pack 输出里没找到 JSON')
  const parsed = JSON.parse(out.slice(at))
  const info = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0]
  const names = info.files.map(f => f.path)
  const required = ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'package.json', 'README.md']
  for (const r of required) {
    if (names.includes(r)) ok('npm pack 包含 ' + r)
    else bad('npm pack 缺少 ' + r)
  }
  ok('npm pack 体积 ' + (info.size / 1024).toFixed(1) + ' KB，条目 ' + info.entryCount)
} catch (e) {
  bad('npm pack --dry-run 执行失败：' + (e && e.message ? e.message.split('\n')[0] : e))
}

console.log('dsh-convey-assistant 发布前自检\n' + notes.join('\n'))
if (problems.length) {
  console.log('\n' + problems.join('\n'))
  console.log('\n结果：FAIL（' + problems.length + ' 项）')
  process.exit(1)
}
console.log('\n结果：PASS')