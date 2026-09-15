# Print Android debug SHA-1 for Google Cloud Console (Android OAuth client).
# Usage: .\scripts\print-sha1.ps1

$ErrorActionPreference = "Continue"

$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot" }
$keytool = Join-Path $javaHome "bin\keytool.exe"
$keystore = Join-Path $env:USERPROFILE ".android\debug.keystore"

if (-not (Test-Path $keytool)) {
  Write-Host "keytool not found at $keytool. Install JDK 17 or set JAVA_HOME."
  exit 1
}

$found = $false

if (Test-Path $keystore) {
  Write-Host "=== Default Android debug keystore ==="
  Write-Host "Keystore: $keystore"
  & $keytool -list -v -keystore $keystore -alias androiddebugkey -storepass android -keypass android 2>$null |
    Select-String -Pattern "SHA1:"
  $found = $true
  Write-Host ""
} else {
  Write-Host "No default debug keystore at $keystore"
  Write-Host ""
}

$gradlePaths = @(
  "C:\pm\apps\mobile\android\gradlew.bat",
  (Join-Path $PSScriptRoot "..\android\gradlew.bat")
)

foreach ($gradleWrapper in $gradlePaths) {
  if (-not (Test-Path $gradleWrapper)) { continue }
  Write-Host "=== Gradle signingReport ($gradleWrapper) ==="
  Push-Location (Split-Path $gradleWrapper)
  try {
    $out = & .\gradlew.bat signingReport --quiet 2>&1 | Out-String
    $out -split "`n" | ForEach-Object {
      if ($_ -match "Variant: debug|SHA1:") { Write-Host $_ }
    }
    $found = $true
  } catch {
    Write-Host "Gradle signingReport failed (build android/ first if missing)."
  }
  Pop-Location
  Write-Host ""
}

Write-Host "Add the SHA-1 above to:"
Write-Host "  Google Cloud -> Credentials -> Android OAuth client"
Write-Host "  Package name: com.asktheimageguru.everyhue"
Write-Host ""
Write-Host "Do NOT add photomatcher:// to the Web OAuth client."

if (-not $found) {
  Write-Host ""
  Write-Host "No SHA-1 found yet. Run pnpm build:apk:local first, then retry."
  exit 1
}
