#!/usr/bin/env node
/**
 * dsh-convey-assistant —— 跨平台安装脚本（Windows / macOS / Linux）
 *
 * 用法：
 *   node scripts/install.mjs                         # 装当前这个 clone（推荐）
 *   node scripts/install.mjs --profile web           # 指定 profile（默认 desktop）
 *   node scripts/install.mjs --spec github:you/repo  # 改为从 GitHub 安装
 *   node scripts/install.mjs --dry-run               # 只打印计划，不改任何文件
 *
 * 它做的事（和 GUI 里「添加插件」等价）：
 *   1. 备份 profile 的 package.json
 *   2. 调 dsh plugin --profile <p> add <spec> 装依赖（预构建产物，安装期不跑构建脚本）
 *   3. 把包名写进 dsh.profile.bundles（启用名单），否则 DSH 不会装配它
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PKG = 'dsh-convey-assistant'
const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const profile = flag('profile', 'desktop')
const dryRun = argv.includes('--dry-run')
const repoRoot = path.resolve(import.meta.dirname, '..')

// 默认装「当前这个 clone」——预构建产物已在 lib/ 里，所以不需要 build
const spec = flag('spec', 'file:' + repoRoot)
const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const profileDir = path.join(dshHome, 'profiles', profile)
const manifestPath = path.join(profileDir, 'package.json')
const isWin = process.platform === 'win32'

if (!fs.existsSync(manifestPath)) {
  console.error('[x] 找不到 profile：' + manifestPath)
  console.error('    可用 profile 在 ' + path.join(dshHome, 'profiles') + ' 下；用 --profile <名字> 指定。')
  process.exit(1)
}

console.log('==> profile : ' + profile + '  (' + profileDir + ')')
console.log('==> 安装源  : ' + spec)
if (dryRun) {
  console.log('==> dry-run：不修改任何文件。')
  process.exit(0)
}

// 1) 备份
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = manifestPath + '.bak-convey-' + stamp
fs.copyFileSync(manifestPath, backup)
console.log('==> 已备份  : ' + path.basename(backup))

// 2) 装依赖（dsh CLI 会把参数转给 profile 目录里的 pnpm）
try {
  execFileSync(isWin ? 'dsh.cmd' : 'dsh', ['plugin', '--profile', profile, 'add', spec], {
    cwd: profileDir,
    stdio: 'inherit',
    shell: isWin,
  })
} catch {
  fs.copyFileSync(backup, manifestPath)
  console.error('[x] 安装失败，已回滚 package.json。请确认 dsh CLI 在 PATH 里。')
  process.exit(1)
}

// 3) 启用：写进 dsh.profile.bundles（只装依赖不启用，DSH 不会加载它）
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')

const manifest = readJson(manifestPath)
manifest.dsh = manifest.dsh || {}
manifest.dsh.profile = manifest.dsh.profile || {}
const bundles = Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles : []
if (bundles.includes(PKG)) {
  console.log('==> 启用名单里已有 ' + PKG + '，跳过')
} else {
  manifest.dsh.profile.bundles = bundles.concat([PKG])
  writeJson(manifestPath, manifest)
  console.log('==> 已启用  : 写入 dsh.profile.bundles')
}

console.log('')
console.log('完成。接下来：')
console.log('  1) 回到 DSH 窗口按 Ctrl/Cmd+R 刷新；按钮没出现就重启一次 DSH')
console.log('  2) 输入框下方应出现「让大肥鱼常驻」开关（默认开启），工具栏出现 ✨')
console.log('  3) 卸载：node scripts/uninstall.mjs --profile ' + profile)
