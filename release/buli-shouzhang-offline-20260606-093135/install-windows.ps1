$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $env:LOCALAPPDATA "BuliNotebook"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "不离手账.lnk"

New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $source "assets") -Destination $target -Recurse -Force

$files = @(
  ".nojekyll",
  "app.js",
  "index.html",
  "launch-notebook.bat",
  "launch-notebook.ps1",
  "manifest.webmanifest",
  "PWA_INSTALL.md",
  "styles.css",
  "sw.js"
)

foreach ($file in $files) {
  $path = Join-Path $source $file
  if (Test-Path -LiteralPath $path) {
    Copy-Item -LiteralPath $path -Destination $target -Force
  }
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $target "launch-notebook.bat"
$shortcut.WorkingDirectory = $target
$shortcut.Description = "不离手账"
$shortcut.Save()

Write-Host "Installed 不离手账 to:"
Write-Host $target
Write-Host "Desktop shortcut:"
Write-Host $shortcutPath
Write-Host ""
Write-Host "Opening the notebook..."
Start-Process -FilePath (Join-Path $target "launch-notebook.bat")
