# ============================================================================
# Buli Shouzhang repository slim-down script (Windows PowerShell)
#
# What it removes:
# - release/ historical build snapshots
# - duplicate browser-download copies such as app (1).js and styles (5).css
# - temporary local-server logs and preview screenshots
#
# What it keeps:
# - app.js, styles.css, index.html, sw.js, manifest.webmanifest
# - assets/ and android-app/
#
# Usage from the real repository root:
#   powershell -ExecutionPolicy Bypass -File .\清理冗余文件.ps1
#
# Optional dry run:
#   powershell -ExecutionPolicy Bypass -File .\清理冗余文件.ps1 -DryRun
#
# This file intentionally uses ASCII-only script text so it also parses in
# Windows PowerShell 5.1 when the file is saved as UTF-8 without BOM.
# ============================================================================

param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Info($Message) {
  Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok($Message) {
  Write-Host $Message -ForegroundColor Green
}

function Write-Warn($Message) {
  Write-Host $Message -ForegroundColor Yellow
}

function Write-Fail($Message) {
  Write-Host $Message -ForegroundColor Red
}

# Safety check: the script must run from the repository root.
if (-not (Test-Path -LiteralPath 'app.js') -or -not (Test-Path -LiteralPath 'index.html')) {
  Write-Fail 'Safety check failed: app.js / index.html not found.'
  Write-Fail 'Please run this script from the real repository root.'
  exit 1
}

$targets = @(
  'release',
  'app (1).js','app (2).js','app (3).js',
  'index (1).html','index (2).html','index (3).html',
  'styles (1).css','styles (2).css','styles (3).css','styles (4).css','styles (5).css',
  '_local-server.js',
  '_local-server.err.log','_local-server.out.log',
  '_preview-server.err.log','_preview-server.out.log',
  '_python-http.err.log','_python-http.out.log',
  '_server8080.err.log','_server8080.out.log',
  '__bloom-after-mobile.png','__bloom-after-portrait.png','__bloom-before-mobile.png',
  '__bloom-before-portrait.png','__bloom-compose-mobile.png','__bloom-compose-portrait.png',
  '__bloom-shot-desktop.png','__bloom-shot-mobile.png','__bloom-shot-portrait.png',
  '__bloom-upload-photo-mobile.png',
  'preview-flyleaf-1.png','preview-flyleaf-1-desktop.png','preview-home.png'
)

$removed = 0
$missing = 0

foreach ($target in $targets) {
  if (Test-Path -LiteralPath $target) {
    if ($DryRun) {
      Write-Ok "Would remove: $target"
    } else {
      Remove-Item -LiteralPath $target -Recurse -Force
      Write-Ok "Removed: $target"
    }
    $removed++
  } else {
    $missing++
  }
}

Write-Host ''
if ($DryRun) {
  Write-Info ("Dry run complete. Matching targets found: {0}. Missing targets: {1}." -f $removed, $missing)
  Write-Info 'Run again without -DryRun to delete these files.'
} else {
  Write-Info ("Cleanup complete. Removed targets: {0}. Already absent: {1}." -f $removed, $missing)
}

# Protected item reminder.
foreach ($keep in @('app.js','styles.css','index.html','sw.js','manifest.webmanifest','assets','android-app')) {
  if (-not (Test-Path -LiteralPath $keep)) {
    Write-Warn ("Notice: expected item is missing: {0}" -f $keep)
  }
}

Write-Info 'Next step: review changes in GitHub Desktop, then Commit and Push.'
