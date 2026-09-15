# Generates android/ and ios/ if missing. Run once after cloning.
# Usage: .\scripts\bootstrap.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host "Flutter not found. Install from https://docs.flutter.dev/get-started/install/windows"
  exit 1
}

Push-Location $PSScriptRoot\..

if (-not (Test-Path android)) {
  Write-Host "Running flutter create..."
  flutter create . --org com.asktheimageguru --project-name every_hue
}

flutter pub get
Write-Host "Done. Run: flutter run --dart-define=API_URL=http://YOUR_LAN_IP:3000"

Pop-Location
