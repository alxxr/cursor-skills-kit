#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Instala la lista "Prioridad para instalar skills" en un proyecto Cursor.

.EXAMPLE
  .\bin\install.ps1
  .\bin\install.ps1 -Target "C:\path\to\project" -Global
  .\bin\install.ps1 -Only vercel-skills,diagram-design
#>
[CmdletBinding()]
param(
  [string]$Target = (Get-Location).Path,
  [string]$Manifest = "",
  [string[]]$Only = @(),
  [switch]$Global,
  [switch]$DryRun,
  [string]$Agent = "cursor"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $Manifest) {
  $Manifest = Join-Path $Root "priority\priority-skills.json"
}

if (-not (Test-Path $Manifest)) {
  throw "No encuentro el manifiesto: $Manifest"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js es requerido (recomendado >= 22.20) para npx skills."
}

$json = Get-Content -Raw -Path $Manifest | ConvertFrom-Json
$items = @($json.items | Sort-Object priority)
if ($Only.Count -gt 0) {
  $items = $items | Where-Object { $Only -contains $_.id -or $Only -contains $_.keyword -or $Only -contains $_.source }
}

if (-not $items -or $items.Count -eq 0) {
  throw "No hay items para instalar. Revisa -Only o el manifiesto."
}

Write-Host "Target:  $Target"
Write-Host "Agent:   $Agent"
Write-Host "Global:  $Global"
Write-Host "Items:   $($items.Count)"
Write-Host ""

Push-Location $Target
try {
  $ok = 0
  $fail = 0
  foreach ($item in $items) {
    $args = @("skills", "add", $item.source, "-a", $Agent, "-y")
    if ($Global) { $args += "-g" }

    Write-Host "==> [$($item.priority)] $($item.nombre)  ($($item.source))"
    if ($DryRun) {
      Write-Host "    dry-run: npx $($args -join ' ')"
      $ok++
      continue
    }

    & npx @args
    if ($LASTEXITCODE -eq 0) {
      $ok++
      Write-Host "    ok"
    } else {
      $fail++
      Write-Warning "    fallo instalando $($item.source) (exit $LASTEXITCODE)"
    }
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Listo. ok=$ok fail=$fail"
Write-Host "Notion Skills DB: https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2"
if ($fail -gt 0) { exit 1 }
