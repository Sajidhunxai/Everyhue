# Installs Android SDK command-line tools (no Android Studio UI required).
# Run in PowerShell: .\scripts\setup-android-sdk.ps1

$ErrorActionPreference = "Stop"

$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$cmdline = Join-Path $sdkRoot "cmdline-tools\latest"
$sdkmanager = Join-Path $cmdline "bin\sdkmanager.bat"

Write-Host "SDK root: $sdkRoot"

if (-not (Test-Path $sdkmanager)) {
  New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot "cmdline-tools") | Out-Null
  $zip = Join-Path $env:TEMP "cmdline-tools.zip"
  $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
  Write-Host "Downloading Android command-line tools..."
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath (Join-Path $env:TEMP "cmdline-tools-extract") -Force
  New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot "cmdline-tools\latest") | Out-Null
  Copy-Item -Recurse -Force (Join-Path $env:TEMP "cmdline-tools-extract\cmdline-tools\*") (Join-Path $sdkRoot "cmdline-tools\latest")
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
}

Write-Host "Installing SDK packages (this may take several minutes)..."
$packages = @(
  "platform-tools",
  "platforms;android-35",
  "build-tools;35.0.0",
  "ndk;27.1.12297006"
)

foreach ($p in $packages) {
  Write-Host "  -> $p"
  echo y | & $sdkmanager $p
}

Write-Host ""
Write-Host "Done. Add these to your environment (System or user):"
Write-Host "  ANDROID_HOME=$sdkRoot"
Write-Host "  JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.1-hotspot"
Write-Host "  Path += %ANDROID_HOME%\platform-tools"
