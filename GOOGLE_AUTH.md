# Google Sign-In — Every Hue

Package: `com.asktheimageguru.everyhue`  
Domain: [asktheimageguru.com](https://asktheimageguru.com) (reverse-DNS package — required by Play / Google Sign-In)  
Use this guide to go from local testing to a **live Play Store** build.

Related: [FACEBOOK_AUTH.md](./FACEBOOK_AUTH.md) · [PLAY_STORE.md](./PLAY_STORE.md)

---

## How it works in this repo

| Surface | Flow |
|---------|------|
| **Web** | Auth.js Google provider → session cookie |
| **Android APK / Play Store** | Native Google Sign-In (`@react-native-google-signin`) → `POST /api/auth/mobile` with `idToken` / access token |
| **Expo Go** | **Not supported** — Google rejects Expo’s `exp://` redirects |

`GoogleSignin.configure({ webClientId })` must use the **Web** OAuth client ID.  
The **Android** OAuth client is only for package name + SHA-1 validation (not passed as `webClientId`).

---

## Part A — Live / Play Store (do this to ship)

### A1. Deploy the web API on HTTPS

Mobile production builds must call a public HTTPS API (not LAN):

```
EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN
```

Use **Supabase Postgres** for the web app (see [SUPABASE.md](./SUPABASE.md)). Web Auth.js needs:

```
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
AUTH_SECRET=<long random secret — openssl rand -base64 32>
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=<Web client ID>
AUTH_GOOGLE_SECRET=<Web client secret>
AUTH_GOOGLE_ANDROID_ID=<Android client ID>   # optional but recommended for id_token verify
```

### A2. OAuth consent screen → Production

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **OAuth consent screen**
2. App name, support email, **authorized domains** (e.g. `yourdomain.com`)
3. Privacy policy URL: `https://YOUR_DOMAIN/privacy`
4. Terms URL: `https://YOUR_DOMAIN/terms`
5. Scopes: `email`, `profile`, `openid` (default)
6. Click **Publish app** (leave Testing only if you have ≤100 test users and are not shipping publicly)

While status is **Testing**, only listed **Test users** can sign in. For a public Play Store app, publish the consent screen (or Google will block most users).

### A3. Web OAuth client (required)

- Type: **Web application**
- Authorized JavaScript origins:
  - `https://YOUR_DOMAIN`
  - `http://localhost:3000` (local only)
- Authorized redirect URIs:
  - `https://YOUR_DOMAIN/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google` (local only)

**Do not** add `photomatcher://…` — Google rejects custom schemes on Web clients.

Save:

| Env | Where |
|-----|--------|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | `apps/web` production env |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | same Web **client ID** (mobile + EAS) |

### A4. Android OAuth client (required for Play / APK)

- Type: **Android**
- Package name: `com.asktheimageguru.everyhue`
- Add **every** SHA-1 that signs the app users install:

#### SHA-1 sources you need for store

1. **Play App Signing key** (required once the app is in Play Console)  
   Play Console → your app → **Setup → App integrity → App signing** → copy **SHA-1 certificate fingerprint**.

2. **Upload key** (EAS / your release keystore — signs the AAB you upload)  
   ```bash
   cd apps/mobile
   eas credentials
   # Android → production → Keystore → view SHA-1
   ```
   Or after first upload, Play Console also shows the upload-key SHA-1 under App integrity.

3. **Debug SHA-1** (local APK only — optional for store, keep for local builds)  
   ```bash
   pnpm --filter @photomatcher/mobile print:sha1
   ```

Put **all** of these fingerprints on the **same** Android OAuth client (or recreate it with every SHA-1 listed). Missing Play App Signing SHA-1 is the #1 reason Google Sign-In works in debug APK but fails from Play.

Save Android client ID as:

| Env | Where |
|-----|--------|
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | mobile / EAS |
| `AUTH_GOOGLE_ANDROID_ID` | web (token verify) |

### A5. EAS production environment

Local `.env` is **not** uploaded to EAS. Set production vars:

```bash
cd apps/mobile

eas env:set production --name EXPO_PUBLIC_API_URL --value "https://YOUR_DOMAIN" --visibility plaintext --non-interactive
eas env:set production --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext --non-interactive
eas env:set production --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext --non-interactive
```

Then build and submit:

```bash
eas build --platform android --profile production
eas submit --platform android
```

Rebuild after any `EXPO_PUBLIC_*` change.

### A6. Live checklist (Google)

- [ ] Consent screen **Published** (or intentional Testing + test users only)
- [ ] Web redirect includes `https://YOUR_DOMAIN/api/auth/callback/google`
- [ ] Android client package `com.asktheimageguru.everyhue`
- [ ] SHA-1: **Play App Signing** + **upload key** (+ debug if you still use local APKs)
- [ ] Production `EXPO_PUBLIC_API_URL` is HTTPS
- [ ] Web `AUTH_GOOGLE_*` set on the deployed server
- [ ] Privacy / terms URLs match Play Console and consent screen
- [ ] Fresh production AAB after env + SHA-1 updates

---

## Part B — Local / testing (dev)

### Why “doesn’t comply with OAuth 2.0 policy” (400)

- Expo Go → use installed APK / emulator build (`com.asktheimageguru.everyhue`)
- Consent screen still **Testing** → add your Gmail under **Test users**
- Android client missing **debug** SHA-1 → run `pnpm --filter @photomatcher/mobile print:sha1`
- Web client has `photomatcher://` redirect → remove it

### Local env

**apps/web/.env.local**

```
AUTH_GOOGLE_ID=<Web client ID>
AUTH_GOOGLE_SECRET=<Web client secret>
AUTH_GOOGLE_ANDROID_ID=<Android client ID>
```

**apps/mobile/.env**

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Web client ID>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<Android client ID>
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000
```

Emulator tip: `http://10.0.2.2:3000` or `adb reverse tcp:3000 tcp:3000` + `http://127.0.0.1:3000`.

### Local builds

```bash
# Installable APK (preferred for Google Sign-In testing)
pnpm build:apk
# or local Gradle:
pnpm build:apk:local

# Dev client + Metro
cd apps/mobile && eas build --profile development --platform android
```

### EAS preview / development env (optional)

```bash
eas env:set preview --name EXPO_PUBLIC_API_URL --value "https://YOUR_STAGING_DOMAIN" --visibility plaintext --non-interactive
eas env:set preview --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "…" --visibility plaintext --non-interactive
eas env:set preview --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "…" --visibility plaintext --non-interactive
```

---

## iOS (when you ship App Store)

1. Create an **iOS** OAuth client (bundle `com.asktheimageguru.everyhue`)
2. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
3. Match `iosUrlScheme` in `apps/mobile/app.json` plugin `@react-native-google-signin/google-signin` to the reversed iOS client ID

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Works on web, fails on phone | Android SHA-1 / package; not Expo Go |
| Works on debug APK, fails from Play | Add **Play App Signing** SHA-1 |
| 400 / policy error | Consent Testing without test user, or wrong client type |
| Token verify fails on server | Set `AUTH_GOOGLE_ANDROID_ID`; ensure `EXPO_PUBLIC_API_URL` hits production |
| Button missing | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` empty in that build’s env |

Docs for the native library: https://react-native-google-signin.github.io/docs/troubleshooting
