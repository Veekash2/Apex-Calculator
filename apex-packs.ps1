<#
.SYNOPSIS
  Shows how many level-up Apex Packs you have left until account level 500.

.EXAMPLE
  $env:APEX_API_KEY = "your-key"
  .\apex-packs.ps1 -Player "YourName" -Platform PC

  Or calculate without the API:
  .\apex-packs.ps1 -Level 137
#>
param(
  [string]$Player,
  [ValidateSet("PC", "PS4", "X1")]
  [string]$Platform = "PC",
  [int]$Level
)

# Level-up pack schedule (EA):
#   Levels 2-20    : 1 pack every level
#   Levels 22-300  : 1 pack every 2 levels (even levels)
#   Levels 305-500 : 1 pack every 5 levels
function Test-PackLevel([int]$l) {
  if ($l -ge 2 -and $l -le 20) { return $true }
  if ($l -ge 22 -and $l -le 300) { return ($l % 2 -eq 0) }
  if ($l -ge 305 -and $l -le 500) { return ($l % 5 -eq 0) }
  return $false
}

$progress = $null
$prestige = 0

if (-not $Level) {
  if (-not $Player) { throw "Pass -Player <name> (with -Platform) or -Level <number>." }
  $key = $env:APEX_API_KEY
  if (-not $key) { throw "Set your API key first:  `$env:APEX_API_KEY = 'your-key'" }

  $url = "https://api.mozambiquehe.re/bridge?player=$([uri]::EscapeDataString($Player))&platform=$Platform"
  $data = Invoke-RestMethod -Uri $url -Headers @{ Authorization = $key }
  if ($data.Error) { throw "API error: $($data.Error)" }

  $Level    = [int]$data.global.level
  $progress = $data.global.toNextLevelPercent
  $prestige = [int]$data.global.levelPrestige
  Write-Host "Player   : $($data.global.name) ($Platform)"
}

$packLevels = @(2..500 | Where-Object { Test-PackLevel $_ })   # 199 levels
$earned = @($packLevels | Where-Object { $_ -le $Level }).Count
$left   = @($packLevels | Where-Object { $_ -gt $Level }).Count
$next   = $packLevels | Where-Object { $_ -gt $Level } | Select-Object -First 1

Write-Host "Level    : $Level$(if ($null -ne $progress) { " ($progress% to next)" })$(if ($prestige) { "  |  Prestige $prestige" })"
Write-Host "Packs earned from levels so far : $earned / 199"
Write-Host "Packs left until level 500      : $left"
if ($next) { Write-Host "Next pack at level              : $next" }
