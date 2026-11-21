<#
.SYNOPSIS
  把 dsh-convey-assistant 装进指定 DSH profile（默认 desktop），并**启用**它。

.DESCRIPTION
  DSH 的 profile 有两道门：
    1. dependencies       —— 包要在 node_modules 里（dsh plugin add 负责）
    2. dsh.profile.bundles —— 包要在**启用名单**里，否则不会被装配
  只做第 1 步插件不会出现，所以本脚本两步都做。

  流程：
    1. 备份 profile package.json -> package.json.bak-convey-<时间戳>
    2. 构建 + npm pack 出 tarball（预构建产物随包分发，安装期不跑任何构建脚本）
    3. dsh plugin --profile <p> add <tarball>
    4. 把包名追加到 dsh.profile.bundles（幂等）
  完成后刷新 DSH 页面，输入框工具栏会出现 ✨ / 🪄。

.PARAMETER Profile
  desktop / headless / llmtest

.PARAMETER FromGitHub
  从 GitHub 安装（需要仓库已发布）

.PARAMETER Repo
  搭配 -FromGitHub 使用，形如 OWNER/dsh-convey-assistant
#>
param(
  [string]$Profile = 'desktop',
  [switch]$FromGitHub,
  [string]$Repo = ''
)

$ErrorActionPreference = 'Stop'
$PKG = 'dsh-convey-assistant'
$root = Split-Path -Parent $PSScriptRoot
$profileDir = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile"
$manifest = Join-Path $profileDir 'package.json'

Write-Host "==> 目标 profile: $Profile" -ForegroundColor Cyan
if (-not (Test-Path $manifest)) { throw "找不到 profile：$manifest" }

# 1) 备份
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bak = "$manifest.bak-convey-$stamp"
Copy-Item $manifest $bak
Write-Host "==> 已备份 -> $bak" -ForegroundColor Green

# 2) 安装源
if ($FromGitHub) {
  if (-not $Repo) { throw "使用 -FromGitHub 时必须提供 -Repo，例如 -Repo OWNER/dsh-convey-assistant" }
  $spec = "github:$Repo"
} else {
  Push-Location $root
  try {
    Write-Host "==> 构建预构建产物..." -ForegroundColor Cyan
    & node build.mjs
    if ($LASTEXITCODE -ne 0) { throw "构建失败" }
    $tgz = (& npm pack --silent | Select-Object -Last 1).Trim()
    if (-not $tgz) { throw "npm pack 未返回 tarball 名" }
    $spec = Join-Path $root $tgz
  } finally { Pop-Location }
}
Write-Host "==> 安装源: $spec" -ForegroundColor Cyan

# 3) 装依赖
Push-Location $profileDir
try {
  & dsh plugin --profile $Profile add $spec
  if ($LASTEXITCODE -ne 0) {
    Copy-Item $bak $manifest -Force
    throw "安装失败，已回滚 package.json"
  }
} finally { Pop-Location }

# 4) 启用（追加到 bundles，幂等）
$raw = Get-Content $manifest -Raw -Encoding UTF8
$json = $raw | ConvertFrom-Json
if (-not $json.dsh) { $json | Add-Member -NotePropertyName dsh -NotePropertyValue ([pscustomobject]@{}) }
if (-not $json.dsh.profile) { $json.dsh | Add-Member -NotePropertyName profile -NotePropertyValue ([pscustomobject]@{}) }
if (-not $json.dsh.profile.bundles) { $json.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @() }

$bundles = @($json.dsh.profile.bundles)
if ($bundles -notcontains $PKG) {
  $json.dsh.profile.bundles = @($bundles + $PKG)
  # 关键：profile 的 package.json 必须写成「无 BOM」的 UTF-8，
  # 否则 DSH 自己的 JSON.parse 会因 BOM 报错，后续 dsh plugin 命令全部失败。
  [System.IO.File]::WriteAllText($manifest, ($json | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "==> 已把 $PKG 加入 dsh.profile.bundles" -ForegroundColor Green
} else {
  Write-Host "==> $PKG 已在 dsh.profile.bundles 中（跳过）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "完成。下一步：" -ForegroundColor Green
Write-Host "  1) 回到 DSH 窗口按 Ctrl+R 刷新；按钮没出现就重启一次 DSH"
Write-Host "  2) 输入框工具栏应出现 ✨（轻）与 🪄（重）"
Write-Host "  3) 卸载：powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1 -Profile $Profile"
