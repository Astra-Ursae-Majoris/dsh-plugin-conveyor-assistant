#!/usr/bin/env node
/**
 * 运行时冒烟测试（不依赖 DSH 进程）：
 *   1) 宿主产物能被 Node 正常 import，并暴露 Cordis 插件面
 *   2) 浏览器产物是经典脚本，且只 require 共享表里的词
 *   3) 两端引用的路由常量一致
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const fails = []
const logs = []
const ok = m => logs.push('  OK   ' + m)
const bad = m => fails.push('  FAIL ' + m)

// 1) 宿主插件面
const hostPath = path.join(root, 'lib/index.js')
try {
  const mod = await import(pathToFileURL(hostPath).href)
  if (mod.name === 'dsh-convey-assistant') ok(`name = dsh-convey-assistant`)
  else bad(`name 不是 dsh-convey-assistant（实际 ` + mod.name + `）`)
  if (typeof mod.apply === 'function') ok('导出 apply(ctx, config)')
  else bad('没有导出 apply 函数')
  if (Array.isArray(mod.inject)) ok(`inject = [` + mod.inject.join(', ') + `]`)
  else bad('没有导出 inject 数组')
} catch (e) {
  bad('lib/index.js 无法被 import：' + (e && e.message ? e.message.split('\n')[0] : e))
}

// 2) 浏览器产物
const clientPath = path.join(root, 'lib/client.js')
if (fs.existsSync(clientPath)) {
  const c = fs.readFileSync(clientPath, 'utf8')
  const reqs = [...c.matchAll(/require\(["']([^"']+)["']\)/g)].map(m => m[1])
  const uniq = [...new Set(reqs)].sort()
  const ALLOWED = [
    'react', 'react-dom', 'react/jsx-runtime', 'cordis', 'zod', 'react-virtual',
    '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-primitives', '@deepseek-ai/dsh-client-ui-dockkit'
  ]
  const evil = uniq.filter(r => !ALLOWED.includes(r))
  if (evil.length === 0) ok('client 只 require 共享表词汇：' + (uniq.join(', ') || '(无)'))
  else bad('client require 了未声明的模块：' + evil.join(', '))
  if (/window\.__ModuleLoader__\.load\(\{ id: 'dsh-convey-assistant'/.test(c)) ok('工厂 id 正确')
  else bad('工厂 id 不正确')
}

// 3) 路由一致性
const ctext = fs.existsSync(clientPath) ? fs.readFileSync(clientPath, 'utf8') : ''
const htext = fs.existsSync(hostPath) ? fs.readFileSync(hostPath, 'utf8') : ''
const ROUTE = '/api/dsh-convey-assistant/rewrite'
if (ctext.includes(ROUTE) && htext.includes(ROUTE)) ok('两端路由常量一致 ' + ROUTE)
else bad('两端路由常量不一致（期望 ' + ROUTE + '）')

// 4) 隐私硬约束的静态断言：宿主产物里不得出现会话写入 API
// 只查「写入会话」的 API；requestHeader() 是只读的模型解析依据，属允许项
const forbidden = ['appendEvent', 'appendMessage', 'appendUserText', 'session.append', 'events.append']
const hits = forbidden.filter(f => htext.includes(f))
if (hits.length === 0) ok('宿主产物不含会话写入 API 调用')
else bad('宿主产物疑似含会话写入 API：' + hits.join(', '))

console.log('运行时冒烟测试\n' + logs.join('\n'))
if (fails.length) { console.log('\n' + fails.join('\n')); process.exit(1) }
console.log('\n结果：PASS')
