#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Wrapper → bin/install.mjs (skills-cli + agency-agents).

.EXAMPLE
  .\bin\install.ps1
  .\bin\install.ps1 -Target "C:\path\to\project"
  .\bin\install.ps1 -Only taste-skill,agency-agents -DryRun
#>
[CmdletBinding()]
param(
  [string]$Target = (Get-Location).Path,
  [string]$Manifest = "",
  [string[]]$Only = @(),
  [switch]$Global,
  [switch]$DryRun,
  [switch]$List,
  [string]$Agent = "cursor"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Installer = Join-Path $Root "bin\install.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js es requerido (recomendado >= 22.20)."
}
if (-not (Test-Path $Installer)) {
  throw "No encuentro $Installer"
}

$argsList = @($Installer, "--target", $Target, "--agent", $Agent)
if ($Manifest) { $argsList += @("--manifest", $Manifest) }
if ($Only.Count -gt 0) { $argsList += @("--only", ($Only -join ",")) }
if ($Global) { $argsList += "--global" }
if ($DryRun) { $argsList += "--dry-run" }
if ($List) { $argsList += "--list" }

& node @argsList
exit $LASTEXITCODE
