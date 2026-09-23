# Google Sign-In — Every Hue

Package: `com.asktheimageguru.everyhue`  
Site: https://www.asktheimageguru.com

Related: [GOOGLE_AUTH_WEB.md](./GOOGLE_AUTH_WEB.md) · [FACEBOOK_AUTH.md](./FACEBOOK_AUTH.md) · [PLAY_STORE.md](./PLAY_STORE.md)

If the app shows **“Google sign-in needs setup (test user + Android SHA-1)”**, do **Fix the error (do this first)** below. Email sign-in still works while Google is incomplete.

---

## Fix the error (do this first)

That message is **error 10 / DEVELOPER_ERROR / 12500**. Google is blocking native sign-in because either your Gmail is not a test user, or the app’s signing SHA-1 is missing on the **Android** OAuth client.

You need **both**. The Web client ID is not enough.

### 1. Add your Gmail as a Test user

Consent screen is almost certainly still **Testing**. Until you click **Publish app**, only listed test users can sign in.

1. Open [Google Cloud → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Status must be **Testing** *or* **In production**
3. If **Testing**:
   - **Test users** → **Add users**
   - Add the **same Gmail you tap on the phone** (the Android Google account)
   - Save
4. Wait 1–2 minutes, force-close Every Hue, try Google again

If you skip this, Google often returns **Access blocked** / 403 / 12500 even with a correct SHA-1.

### 2. Create an Android OAuth client (package + SHA-1)

1. [Credentials](https://console.cloud.google.com/apis/credentials) → **Create credentials** → **OAuth client ID** → type **Android**
2. Package name (exact):

   ```
   com.asktheimageguru.everyhue
   ```

3. SHA-1 fingerprints — add **every** key that signs an APK you install.

#### A. Local / Desktop `EveryHue-debug.apk` (Expo debug keystore)

This is the SHA-1 for the APK we built on this PC (`android/app/debug.keystore`):

```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

Paste that into the Android client. Google Cloud only accepts **SHA-1**, not SHA-256, on this form.

Print it yourself anytime:

```bash
pnpm --filter @photomatcher/mobile print:sha1
```

#### B. Expo EAS APK (the expo.dev install link)

That build is signed with a **different** EAS keystore. Debug SHA-1 above will **not** unlock it.

EAS APK SHA-1 (paste this on a **second** Android OAuth client if the first already has the debug SHA-1):

```
7A:05:82:70:5A:FC:E9:73:E4:EC:06:DE:AA:D1:D8:C8:48:AA:68:DE
```

Google Cloud’s Android client form only has **one** SHA-1 field. Create another Android client with the same package `com.asktheimageguru.everyhue` and this SHA-1. You do not need a new app rebuild after adding SHA-1 — wait 1–2 minutes, uninstall/reinstall is not required, but force-close the app.

#### C. Play Store (later)

Play Console → **Test and release** → **App integrity** → **App signing** → copy **App signing key certificate SHA-1** (and upload-key SHA-1). Add those too.

### 3. Web OAuth client (required for the button)

Native Google Sign-In still uses the **Web** client ID in the app (`webClientId`).

- Type: **Web application**
- Authorized JavaScript origins:
  - `https://www.asktheimageguru.com`
  - `http://localhost:3000`
- Authorized redirect URIs:
  - `https://www.asktheimageguru.com/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`

**Do not** add `photomatcher://` anywhere. Google rejects custom schemes on Web clients.

### 4. Env vars (then rebuild the app)

Web (`apps/web` / Vercel):

```
AUTH_GOOGLE_ID=505236505372-8g9ouj623fiv0ppamal3ffq6g0dprig7.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<Web client secret>
AUTH_GOOGLE_ANDROID_ID=505236505372-ju410i6i5gbf3n6i4fahfuhjkc1r3nov.apps.googleusercontent.com
```

Mobile (`apps/mobile/.env` and EAS):

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=505236505372-8g9ouj623fiv0ppamal3ffq6g0dprig7.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=505236505372-ju410i6i5gbf3n6i4fahfuhjkc1r3nov.apps.googleusercontent.com
EXPO_PUBLIC_API_URL=https://www.asktheimageguru.com
```

`EXPO_PUBLIC_*` is baked in at **build time**. Changing Google Cloud is not enough if the installed APK was built without the Web client ID — rebuild:

```bash
pnpm --filter @photomatcher/mobile build:apk:local
# or
cd apps/mobile && npx eas build --profile apk --platform android
```

EAS (already used for the cloud APK):

```bash
cd apps/mobile
npx eas env:set preview --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext
npx eas env:set preview --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext
npx eas env:set apk --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext
```

Then rebuild the APK.

### 5. Recheck

- [ ] Test user = the Gmail on the phone
- [ ] Android client package `com.asktheimageguru.everyhue`
- [ ] SHA-1 for **this** APK (debug vs EAS vs Play — they differ)
- [ ] Web client ID in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- [ ] New APK installed after env changes
- [ ] Force-close the app after adding a test user

Until this is done, use **Sign in with email** on the login screen.

---

## How it works in this repo

| Surface | Flow |
|---------|------|
| **Web** | Auth.js Google provider → session cookie |
| **Android APK / Play** | Native Google Sign-In → `POST /api/auth/mobile` with `idToken` |
| **Expo Go** | **Not supported** |

`GoogleSignin.configure({ webClientId })` uses the **Web** OAuth client ID.  
The **Android** client is only package name + SHA-1 (Play Services checks it; you do not pass it as `webClientId`).

---

## Part A — Live / Play Store

### A1. Web API on HTTPS

```
EXPO_PUBLIC_API_URL=https://www.asktheimageguru.com
AUTH_URL=https://www.asktheimageguru.com
AUTH_SECRET=<long random secret>
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=505236505372-8g9ouj623fiv0ppamal3ffq6g0dprig7.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<Web client secret>
AUTH_GOOGLE_ANDROID_ID=505236505372-ju410i6i5gbf3n6i4fahfuhjkc1r3nov.apps.googleusercontent.com
```

### A2. Consent screen → Production

For a public Play app, **Publish app** on the consent screen. Testing is only for listed Gmail accounts (max 100).

Privacy: `https://www.asktheimageguru.com/privacy`  
Terms: `https://www.asktheimageguru.com/terms`  
Authorized domain: `asktheimageguru.com`

### A3–A5. Clients, SHA-1s, EAS

Same as **Fix the error** steps 2–4. For store, always add **Play App Signing SHA-1**.

```bash
cd apps/mobile
npx eas build --platform android --profile production
npx eas submit --platform android
```

Rebuild after any `EXPO_PUBLIC_*` change.

---

## iOS (App Store later)

1. Create an **iOS** OAuth client (bundle `com.asktheimageguru.everyhue`)
2. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
3. Match `iosUrlScheme` in `apps/mobile/app.json` to the reversed iOS client ID

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “needs setup (test user + Android SHA-1)” | This file, **Fix the error** |
| Works on web, fails on phone | SHA-1 / package; not Expo Go |
| Desktop APK fails, EAS APK fails (or the reverse) | Different keystores — add **both** SHA-1s |
| Debug APK works, Play fails | Add **Play App Signing** SHA-1 |
| Access blocked / 403 | Add Test user, or Publish consent screen |
| Button missing / disabled | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` empty in that build |
| Token verify fails on server | `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_ANDROID_ID` on Vercel |

Library docs: https://react-native-google-signin.github.io/docs/troubleshooting
