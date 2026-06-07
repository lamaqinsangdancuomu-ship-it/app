$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$index = Join-Path $root "index.html"

if (!(Test-Path -LiteralPath $index)) {
  Write-Host "index.html was not found next to this launcher."
  exit 1
}

$url = ([System.Uri]$index).AbsoluteUri
$profile = Join-Path $env:LOCALAPPDATA "FawangNotebook\browser-profile"
New-Item -ItemType Directory -Path $profile -Force | Out-Null

$browserCandidates = @(
  (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
  (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

if ($browserCandidates.Count -gt 0) {
  Start-Process -FilePath $browserCandidates[0] -ArgumentList @("--app=$url", "--user-data-dir=$profile")
} else {
  Start-Process $url
}
