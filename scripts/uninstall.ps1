<#
.SYNOPSIS
  把 dsh-convey-assistant 从 DSH profile 彻底卸除，便于"从零复现"测试。

.DESCRIPTION
  顺序很重要（踩过一次坑）：
    1. 先 dsh plugin remove —— 此时 package.json 还没被脚本改过，格式一定合法
    2. 再从 dsh.profile.bundles 移除包名（**必须写成无 BOM 的 UTF-8**，
       DSH 用 JSON.parse 读 profile 清单，带 BOM 会直接崩，后续 dsh plugin 命令全废）
    3. 删除 node_modules 残留
    4. 若有安装期备份，恢复安装前的 package.json（最干净的回滚）
#>
param([string]$Profile = 'desktop')

$ErrorActionPreference = 'Continue'
$PKG = 'dsh-convey-assistant'
$profileDir = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile"
$manifest = Join-Path $profileDir 'package.json'

Write-Host "==> 从 profile '$Profile' 卸载 $PKG" -ForegroundColor Cyan
if (-not (Test-Path $manifest)) { Write-Warning "找不到 profile：$manifest"; return }

# 1) 先卸依赖（此时 JSON 未被我们改过）
Push-Location $profileDir
try {
  & dsh plugin --profile $Profile remove $PKG
  Write-Host "==> remove 已执行" -ForegroundColor Yellow
} finally { Pop-Location }

# 2) 再从启用名单移除
try {
  $json = (Get-Content $manifest -Raw -Encoding UTF8) | ConvertFrom-Json
  if ($json.dsh -and $json.dsh.profile -and $json.dsh.profile.bundles) {
    $bundles = @($json.dsh.profile.bundles) | Where-Object { $_ -ne $PKG }
    $json.dsh.profile.bundles = @($bundles)
    [System.IO.File]::WriteAllText($manifest, ($json | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "==> 已从 dsh.profile.bundles 移除" -ForegroundColor Green
  }
} catch { Write-Warning "从 bundles 移除失败：$_" }

# 3) 清残留
$leftover = Join-Path $profileDir "node_modules\$PKG"
if (Test-Path $leftover) {
  Remove-Item $leftover -Recurse -Force
  Write-Host "==> 已删除 node_modules\$PKG" -ForegroundColor Green
}

# 4) 恢复备份
$baks = Get-ChildItem -Path $profileDir -Filter 'package.json.bak-convey-*' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
if ($baks.Count -gt 0) {
  Copy-Item $baks[0].FullName $manifest -Force
  Write-Host "==> 已恢复安装前备份：$($baks[0].Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "完成。刷新 DSH 页面确认按钮消失。" -ForegroundColor Green
Write-Host "从零复现：scripts\uninstall.ps1 然后 scripts\install.ps1" -ForegroundColor Gray
