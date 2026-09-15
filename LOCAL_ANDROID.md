# Local Android APK build (Windows)

Build a debug APK on your machine without EAS. Use this when cloud builds fail or you need a quick installable app for testing Google Sign-In (not available in Expo Go).

## Prerequisites

1. **JDK 17** — e.g. Microsoft OpenJDK at `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot`
2. **Android SDK** — run `apps/mobile/scripts/setup-android-sdk.ps1` in PowerShell, or install via Android Studio
3. **Environment variables** (User or System):

   ```
   JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot
   ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
   ```

   Add to `Path`: `%ANDROID_HOME%\platform-tools`

## OneDrive / long path issue

Gradle native builds fail when the repo lives under OneDrive with pnpm’s nested `node_modules` paths (`CreateProcess error=2` on `prefab_command.bat`).

**Recommended:** build from a short path with hoisted dependencies:

```powershell
# One-time: copy project (exclude node_modules)
robocopy C:\Users\YOU\OneDrive\Documents\GitHub\photomatcher C:\pm /E /XD node_modules .gradle android\build

cd C:\pm
pnpm install --config.node-linker=hoisted

cd apps\mobile
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

APK output: `apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

Or run from repo root: `pnpm build:apk:local` (uses `C:\pm` if set).

**Alternative:** enable [Windows long paths](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation) (requires admin) and move the repo out of OneDrive.

## Install on your phone

1. Copy `app-debug.apk` to the phone (USB, email, or cloud).
2. Enable **Install unknown apps** for your file manager or browser.
3. Open the APK and install.
4. Run `pnpm dev:web` on your PC; phone and PC must be on the same Wi‑Fi.
5. The app uses `EXPO_PUBLIC_API_URL` from `apps/mobile/.env` (your LAN IP, e.g. `http://192.168.x.x:3000`).

## Google Sign-In on the native build

Add your debug keystore SHA-1 to the Google Cloud Android OAuth client. See [GOOGLE_AUTH.md](./GOOGLE_AUTH.md).

Get SHA-1:

```powershell
cd apps\mobile\android
.\gradlew signingReport
```

Look for `SHA1` under `Variant: debug`.

## Quick commands

| Command | Description |
|---------|-------------|
| `pnpm build:apk:local` | Sync to `C:\pm`, install hoisted deps, prebuild, assemble debug APK |
| `pnpm --filter @photomatcher/mobile android` | Run on emulator/device via USB (`adb`) |
| `pnpm build:apk` | EAS cloud build (when Expo API is healthy) |
