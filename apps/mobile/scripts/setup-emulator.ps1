# Install Android emulator + create AVD for Every Hue
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot" }
$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$sdkmanager = Join-Path $sdk "cmdline-tools\latest\bin\sdkmanager.bat"
$avdmanager = Join-Path $sdk "cmdline-tools\latest\bin\avdmanager.bat"
$emulator = Join-Path $sdk "emulator\emulator.exe"

Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host "SDK: $sdk"

if (-not (Test-Path $sdkmanager)) { throw "sdkmanager not found at $sdkmanager" }

Write-Host "Accepting licenses..."
$yes = ("y`n" * 20)
$yes | & $sdkmanager --sdk_root=$sdk --licenses | Out-Null

Write-Host "Installing emulator + system image (may take several minutes)..."
$pkgs = @(
  "emulator",
  "platform-tools",
  "platforms;android-35",
  "system-images;android-35;google_apis;x86_64"
)
$yes | & $sdkmanager --sdk_root=$sdk $pkgs
if ($LASTEXITCODE -ne 0) {
  Write-Host "sdkmanager exit: $LASTEXITCODE (continuing if packages exist)"
}

$sysimg = Join-Path $sdk "system-images\android-35\google_apis\x86_64"
if (-not (Test-Path (Join-Path $sysimg "system.img"))) {
  throw "System image not installed at $sysimg"
}

$avdName = "EveryHue_API35"
$existing = & $emulator -list-avds 2>$null

if ($existing -notcontains $avdName) {
  Write-Host "Creating AVD $avdName..."
  echo "no" | & $avdmanager create avd -n $avdName -k "system-images;android-35;google_apis;x86_64" -d "pixel_6" --force
  if ($LASTEXITCODE -ne 0) {
    echo "no" | & $avdmanager create avd -n $avdName -k "system-images;android-35;google_apis;x86_64" --force
  }
} else {
  Write-Host "AVD $avdName already exists"
}

Write-Host ""
Write-Host "DONE"
Write-Host "  Emulator: $emulator"
Write-Host "  AVD: $avdName"
Write-Host "  Start with: emulator -avd $avdName"
