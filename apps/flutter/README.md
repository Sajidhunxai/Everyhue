# Every Hue — Flutter app

Native Flutter client for the Every Hue API. Lives alongside `apps/mobile` (React Native/Expo).

## Prerequisites

1. [Install Flutter](https://docs.flutter.dev/get-started/install/windows) (stable channel)
2. Android Studio / SDK (see [LOCAL_ANDROID.md](../LOCAL_ANDROID.md))
3. Web API running: `pnpm dev:web` from repo root

## First-time setup

From repo root:

```powershell
cd apps/flutter
flutter create . --org com.asktheimageguru --project-name every_hue
flutter pub get
```

`flutter create .` adds `android/` and `ios/` folders. It will not overwrite existing `lib/` code.

Copy env values from `apps/mobile/.env` into dart-defines (or edit `lib/config/env.dart` defaults):

```powershell
flutter run `
  --dart-define=API_URL=http://192.168.18.98:3000 `
  --dart-define=GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com `
  --dart-define=GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

## Run

```powershell
cd apps/flutter
flutter run
```

Or from repo root:

```powershell
pnpm dev:flutter
```

## Build APK

```powershell
cd apps/flutter
flutter build apk --release `
  --dart-define=API_URL=http://192.168.18.98:3000 `
  --dart-define=GOOGLE_WEB_CLIENT_ID=... `
  --dart-define=GOOGLE_ANDROID_CLIENT_ID=...
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

## What's implemented

| Screen | Status |
|--------|--------|
| Home / dashboard | ✅ API wired |
| Login (Google) | ✅ |
| Analyze (camera/gallery) | ✅ |
| Results | ✅ palette + tips |
| Compare, Shop, Wardrobe, Profiles, Stylist | Placeholder |

## Architecture

- `lib/config/env.dart` — API URL and OAuth IDs
- `lib/services/api_client.dart` — REST calls to Next.js API
- `lib/services/image_samples.dart` — on-device Lab sampling (ported from RN)
- `lib/services/auth_service.dart` — secure token storage + Google Sign-In

Shared business logic stays on the server and in `packages/color-engine` (TypeScript). Flutter calls the same `/api/*` routes as the React Native app.

## Google Sign-In

Add your debug/release SHA-1 to the Google Cloud Android OAuth client. See [GOOGLE_AUTH.md](../../GOOGLE_AUTH.md).

```powershell
cd android
./gradlew signingReport
```

## Monorepo note

Flutter is **not** part of the pnpm workspace. It uses `pub` independently under `apps/flutter/`. Build from a short path (e.g. `C:\pm`) if you hit Windows path-length issues — same as React Native builds.
