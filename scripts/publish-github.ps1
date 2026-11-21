<#
.SYNOPSIS
  在 GitHub 登录窗口内一次性完成发布：建远端、推送 main、打 tag。

.DESCRIPTION
  本脚本不做任何构建（产物已入库）。它只做三件事：
    1. 校验工作区干净（没有未提交改动）
    2. 绑定 origin 并推送 main
    3. 推送 v* tag

  用法（趁登录有效时立刻执行）：
    powershell -File scripts\publish-github.ps1 -RepoUrl https://github.com/OWNER/dsh-convey-assistant.git

  前提：你已经在 https://github.com/new 建好空仓库（不要勾 README/.gitignore/License）。
#>
param(
  [Parameter(Mandatory = $true)][string]$RepoUrl,
  [string]$Branch = 'main',
  [switch]$PushTags = $true
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $dirty = & git status --porcelain
  if ($dirty) {
    Write-Warning "工作区有未提交改动："
    $dirty | ForEach-Object { Write-Host "  $_" }
    throw "请先提交或还原后再发布。"
  }

  $existing = & git remote 2>$null
  if ($existing -contains 'origin') {
    & git remote set-url origin $RepoUrl
  } else {
    & git remote add origin $RepoUrl
  }
  Write-Host "==> origin -> $RepoUrl" -ForegroundColor Cyan

  Write-Host "==> 推送 $Branch ..." -ForegroundColor Cyan
  & git push -u origin $Branch
  if ($LASTEXITCODE -ne 0) { throw "推送分支失败" }

  if ($PushTags) {
    $tags = & git tag
    if ($tags) {
      Write-Host "==> 推送 tags: $($tags -join ', ')" -ForegroundColor Cyan
      & git push origin --tags
      if ($LASTEXITCODE -ne 0) { Write-Warning "tag 推送失败（分支已成功）" }
    }
  }
  Write-Host ""
  Write-Host "发布完成。" -ForegroundColor Green
} finally { Pop-Location }
