# Print Android debug SHA-1 for Google Cloud Console (Android OAuth client).
# Usage: .\scripts\print-sha1.ps1

$ErrorActionPreference = "Continue"

$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot" }
$keytool = Join-Path $javaHome "bin\keytool.exe"
$keystore = Join-Path $env:USERPROFILE ".android\debug.keystore"
$expoDebug = @(
  (Join-Path $PSScriptRoot "..\android\app\debug.keystore"),
  "C:\pm\apps\mobile\android\app\debug.keystore"
)

if (-not (Test-Path $keytool)) {
  Write-Host "keytool not found at $keytool. Install JDK 17 or set JAVA_HOME."
  exit 1
}

function Show-Sha1([string]$path, [string]$label) {
  if (-not (Test-Path $path)) { return $false }
  Write-Host "=== $label ==="
  Write-Host "Keystore: $path"
  & $keytool -list -v -keystore $path -alias androiddebugkey -storepass android -keypass android 2>$null |
    Select-String -Pattern "SHA1:"
  Write-Host ""
  return $true
}

$found = $false
if (Show-Sha1 $keystore "Default Android debug keystore") { $found = $true }
foreach ($p in $expoDebug) {
  if (Show-Sha1 $p "Expo / local APK debug.keystore") { $found = $true }
}

if (-not $found) {
  Write-Host "No default debug keystore at $keystore"
  Write-Host ""
}

Write-Host "Add every SHA-1 to:"
Write-Host "  Google Cloud -> Credentials -> Android OAuth client"
Write-Host "  Package name: com.asktheimageguru.everyhue"
Write-Host ""
Write-Host "EAS / Play APKs use a different keystore. Run: npx eas credentials -p android"
Write-Host "Do NOT add photomatcher:// to the Web OAuth client."

if (-not $found) {
  Write-Host ""
  Write-Host "No SHA-1 found yet. Run pnpm build:apk:local first, then retry."
  exit 1
}
