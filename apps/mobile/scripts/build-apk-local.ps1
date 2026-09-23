# Build debug APK locally. Avoids OneDrive long-path failures by using C:\pm + hoisted node_modules.
# Usage: .\scripts\build-apk-local.ps1
# From repo root: pnpm build:apk:local

$ErrorActionPreference = "Stop"

$src = if ($env:PHOTOMATCHER_SRC) { $env:PHOTOMATCHER_SRC } else { (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path }
$buildRoot = if ($env:PHOTOMATCHER_BUILD_ROOT) { $env:PHOTOMATCHER_BUILD_ROOT } else { "C:\pm" }
$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot" }
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$gradleHome = if ($env:PHOTOMATCHER_GRADLE_HOME) { $env:PHOTOMATCHER_GRADLE_HOME } else { "C:\g" }
$tempHome = "C:\tmp"

Write-Host "Source:    $src"
Write-Host "Build dir: $buildRoot"
Write-Host "JAVA_HOME: $javaHome"
Write-Host "ANDROID_HOME: $sdkRoot"

if (-not (Test-Path $javaHome)) {
  throw "JDK not found at $javaHome. Install JDK 17 or set JAVA_HOME."
}
if (-not (Test-Path (Join-Path $sdkRoot "platform-tools\adb.exe"))) {
  throw "Android SDK not found. Run setup-android-sdk.ps1 or install Android Studio."
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:GRADLE_USER_HOME = $gradleHome
$env:EXPO_PUBLIC_API_URL = "https://www.asktheimageguru.com"
$env:EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "505236505372-8g9ouj623fiv0ppamal3ffq6g0dprig7.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "505236505372-ju410i6i5gbf3n6i4fahfuhjkc1r3nov.apps.googleusercontent.com"
New-Item -ItemType Directory -Force -Path $gradleHome | Out-Null
New-Item -ItemType Directory -Force -Path $tempHome | Out-Null
$env:TEMP = $tempHome
$env:TMP = $tempHome
$env:Path = "$javaHome\bin;$sdkRoot\platform-tools;$env:Path"

function Stop-GradleDaemons {
  $gradleWrapper = Join-Path $buildRoot "apps\mobile\android\gradlew.bat"
  if (Test-Path $gradleWrapper) {
    Write-Host "Stopping Gradle in build dir..."
    Push-Location (Split-Path $gradleWrapper)
    try {
      & .\gradlew.bat --stop 2>$null | Out-Null
    } catch { }
    Pop-Location
    Start-Sleep -Seconds 2
  }
}

Write-Host "Syncing project to $buildRoot (excluding node_modules)..."
Stop-GradleDaemons

New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
robocopy $src $buildRoot /E /XD node_modules .gradle android\build android\.gradle android\app\build /NFL /NDL /NJH /NJS /NC /NS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit $LASTEXITCODE" }

Push-Location $buildRoot
try {
  if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (hoisted)..."
    pnpm install --config.node-linker=hoisted
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
  } else {
    Write-Host "node_modules present - running pnpm install to refresh..."
    pnpm install --config.node-linker=hoisted
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
  }

  Push-Location apps\mobile
  Write-Host "expo prebuild --platform android --clean"
  npx expo prebuild --platform android --clean
  if ($LASTEXITCODE -ne 0) { throw "expo prebuild failed" }

  $appGradle = Join-Path (Get-Location) "android\app\build.gradle"
  $gradleText = Get-Content $appGradle -Raw
  if ($gradleText -notmatch '--entry-file", "apps/mobile/index.js') {
    $gradleText = $gradleText.Replace(
      '// extraPackagerArgs = []',
      'extraPackagerArgs = ["--entry-file", "apps/mobile/index.js"]'
    )
    Write-Host "Patched extraPackagerArgs for pnpm workspace Metro root"
  }
  if ($gradleText -notmatch "debuggableVariants = \[\]") {
    $gradleText = $gradleText.Replace(
      'bundleCommand = "export:embed"',
      "bundleCommand = `"export:embed`"`r`n    debuggableVariants = []"
    )
    Write-Host "Patched app/build.gradle to embed JS in debug APK"
  }
  Set-Content -Path $appGradle -Value $gradleText -NoNewline

  Push-Location android
  Write-Host "gradlew assembleDebug"
  .\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon
  if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

  $apk = Resolve-Path "app\build\outputs\apk\debug\app-debug.apk"
  $desktop = [Environment]::GetFolderPath("Desktop")
  $dest = Join-Path $desktop "EveryHue-debug.apk"
  $repoCopy = Join-Path $src "EveryHue-debug.apk"
  Copy-Item -Force $apk $dest
  Copy-Item -Force $apk $repoCopy
  Write-Host ""
  Write-Host "SUCCESS"
  Write-Host "  APK: $apk"
  Write-Host "  Copied to: $dest"
  Write-Host "  Also: $repoCopy"
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  Pop-Location -ErrorAction SilentlyContinue
  Pop-Location -ErrorAction SilentlyContinue
}
