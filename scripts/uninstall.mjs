#!/usr/bin/env node
/**
 * dsh-convey-assistant —— 跨平台卸载脚本
 *
 *   node scripts/uninstall.mjs                  # 从 desktop profile 卸载
 *   node scripts/uninstall.mjs --profile web    # 指定 profile
 *
 * 顺序很重要：先 dsh plugin remove（此时 package.json 还没被我们改过），
 * 再从 bundles 移除、删残留、恢复安装前的备份。
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PKG = 'dsh-convey-assistant'
const argv = process.argv.slice(2)
const i = argv.indexOf('--profile')
const profile = i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : 'desktop'
const isWin = process.platform === 'win32'

const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const profileDir = path.join(dshHome, 'profiles', profile)
const manifestPath = path.join(profileDir, 'package.json')

if (!fs.existsSync(manifestPath)) {
  console.error('[x] 找不到 profile：' + manifestPath)
  process.exit(1)
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')

console.log('==> 从 profile ' + profile + ' 卸载 ' + PKG)

// 1) 先卸依赖
try {
  execFileSync(isWin ? 'dsh.cmd' : 'dsh', ['plugin', '--profile', profile, 'remove', PKG], {
    cwd: profileDir,
    stdio: 'inherit',
    shell: isWin,
  })
} catch {
  console.warn('==> remove 返回非 0（本来就没装也无所谓），继续清理')
}

// 2) 从启用名单移除
try {
  const manifest = readJson(manifestPath)
  const bundles = manifest && manifest.dsh && manifest.dsh.profile && manifest.dsh.profile.bundles
  if (Array.isArray(bundles) && bundles.includes(PKG)) {
    manifest.dsh.profile.bundles = bundles.filter((name) => name !== PKG)
    writeJson(manifestPath, manifest)
    console.log('==> 已从 dsh.profile.bundles 移除')
  }
} catch (error) {
  console.warn('==> 从 bundles 移除失败：' + error.message)
}

// 3) 删残留
const leftover = path.join(profileDir, 'node_modules', PKG)
if (fs.existsSync(leftover)) {
  fs.rmSync(leftover, { recursive: true, force: true })
  console.log('==> 已删除 node_modules/' + PKG)
}

// 4) 恢复安装前备份
const backups = fs.readdirSync(profileDir).filter((n) => n.startsWith('package.json.bak-convey-')).sort()
if (backups.length > 0) {
  const latest = backups[backups.length - 1]
  fs.copyFileSync(path.join(profileDir, latest), manifestPath)
  console.log('==> 已恢复安装前备份：' + latest)
}

console.log('')
console.log('完成。刷新 DSH 页面确认开关消失。')
