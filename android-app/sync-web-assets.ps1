$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$target = Join-Path $repo "android-app/app/src/main/assets"

New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $repo "assets") -Destination $target -Recurse -Force

$files = @(".nojekyll", "app.js", "index.html", "manifest.webmanifest", "PWA_INSTALL.md", "styles.css", "sw.js")
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $target -Force
}

Write-Host "Synced notebook web assets to $target"
