# Facebook Login — Every Hue

Package: `com.asktheimageguru.everyhue`  
Domain: [asktheimageguru.com](https://asktheimageguru.com)  
Use this guide to enable Facebook for **web + Android** and switch the Facebook app to **Live** for the Play Store.

Related: [GOOGLE_AUTH.md](./GOOGLE_AUTH.md) · [PLAY_STORE.md](./PLAY_STORE.md)

---

## How it works in this repo

| Surface | Flow |
|---------|------|
| **Web** | Auth.js Facebook provider → `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` |
| **Android** | `expo-auth-session` Facebook provider → access token → `POST /api/auth/mobile` (`provider: "facebook"`) |
| **Button visibility** | Web: both ID + secret set. Mobile: `EXPO_PUBLIC_FACEBOOK_APP_ID` set |

Never put the Facebook **App Secret** in the mobile app. Only the App ID is public (`EXPO_PUBLIC_FACEBOOK_APP_ID`).

---

## Part A — Live / Play Store

### A1. Create the Facebook app

1. Open [Meta for Developers](https://developers.facebook.com/apps/) → **Create App**
2. Use case: **Authenticate and request data from users with Facebook Login** (or Consumer / None + add Facebook Login)
3. App name: **Every Hue** (or your store name)
4. Note **App ID** and **App Secret** (Settings → Basic)

### A2. Settings → Basic (required for Live)

Fill and save:

| Field | Value |
|-------|--------|
| **App Domains** | `YOUR_DOMAIN` (no `https://`) |
| **Privacy Policy URL** | `https://YOUR_DOMAIN/privacy` |
| **Terms of Service URL** | `https://YOUR_DOMAIN/terms` |
| **User data deletion** | `https://YOUR_DOMAIN/account/delete` (or in-app + this URL) |
| **Category** | Lifestyle / Shopping (pick what fits) |

Upload an app icon (1024×1024) before going Live.

### A3. Add Facebook Login product

**Facebook Login → Settings**

**Valid OAuth Redirect URIs** (Auth.js / web):

```
https://YOUR_DOMAIN/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

Also enable:

- Client OAuth login: **Yes**
- Web OAuth login: **Yes**
- Enforce HTTPS: **Yes** (production)

**Do not** rely on custom schemes alone for web Auth.js — use the HTTPS callback above.

### A4. Android platform (Play Store app)

In Facebook app → **Settings → Basic** → **Add Platform → Android**:

| Field | Value |
|-------|--------|
| Package name | `com.asktheimageguru.everyhue` |
| Class name | `com.asktheimageguru.everyhue.MainActivity` (Expo default; confirm in `android/app/src/main/AndroidManifest.xml` after a prebuild if unsure) |
| Key hashes | See below |

#### Android key hashes (Facebook)

Facebook wants a **Base64 key hash**, not the Google SHA-1 hex string.

**From Play App Signing (store installs):**

1. Play Console → App integrity → App signing → download **App signing key certificate** (or copy SHA-1)
2. Convert SHA-1 to Facebook key hash, **or** use `keytool` on the cert:

```bash
# Example: from a PEM/DER cert exported from Play Console
keytool -exportcert -keystore YOUR_UPLOAD.keystore -alias YOUR_ALIAS | openssl sha1 -binary | openssl base64
```

**From EAS upload keystore:**

```bash
cd apps/mobile
eas credentials
# Download/view Android production keystore, then:
keytool -exportcert -keystore path/to/keystore.jks -alias YOUR_ALIAS | openssl sha1 -binary | openssl base64
```

**Debug (local APK):**

```bash
keytool -exportcert -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64
```

Add **debug + upload + Play App Signing** key hashes so Facebook Login works in local APKs and Play installs.

### A5. Permissions & App Review

Default permissions used by this project:

- `public_profile`
- `email`

1. App Review → Permissions and Features → request **email** if required for Live
2. Provide privacy policy URL and a short use explanation (“Sign in to Every Hue to save color analyses and wardrobe”)
3. Complete **Business verification** if Meta asks (common once you leave Development mode)

Until review is approved, only **Roles → Testers / Developers / Admins** can log in while the app is in Development mode.

### A6. Switch app to Live

1. Top of Meta dashboard: **App Mode → Live**
2. Confirm privacy policy, contact email, and platforms are saved
3. Test with a normal Facebook account that is **not** only a tester (after Live)

### A7. Environment variables (production)

**Web host (`apps/web`):**

```
AUTH_FACEBOOK_ID=<App ID>
AUTH_FACEBOOK_SECRET=<App Secret>
AUTH_URL=https://YOUR_DOMAIN
```

**Mobile / EAS production:**

```bash
cd apps/mobile

eas env:set production --name EXPO_PUBLIC_FACEBOOK_APP_ID --value "YOUR_APP_ID" --visibility plaintext --non-interactive
eas env:set production --name EXPO_PUBLIC_API_URL --value "https://YOUR_DOMAIN" --visibility plaintext --non-interactive
```

Also set Google vars (see [GOOGLE_AUTH.md](./GOOGLE_AUTH.md)). Then:

```bash
eas build --platform android --profile production
eas submit --platform android
```

### A8. Live checklist (Facebook)

- [ ] Privacy + terms + data deletion URLs on Meta app
- [ ] OAuth redirect: `https://YOUR_DOMAIN/api/auth/callback/facebook`
- [ ] Android package `com.asktheimageguru.everyhue` + key hashes (Play + upload + debug)
- [ ] `email` / `public_profile` approved for Live (or App Review submitted)
- [ ] App Mode = **Live**
- [ ] `AUTH_FACEBOOK_ID` + `AUTH_FACEBOOK_SECRET` on production web
- [ ] `EXPO_PUBLIC_FACEBOOK_APP_ID` on EAS **production**
- [ ] New production build after env changes
- [ ] Sign-in tested on a **non-tester** Facebook account from a Play / production APK

---

## Part B — Local / Development mode

While Meta app is in **Development**:

1. Meta → **Roles** → add yourself as Administrator / Developer / Tester
2. Log in on device with that Facebook account only

**apps/web/.env.local**

```
AUTH_FACEBOOK_ID=<App ID>
AUTH_FACEBOOK_SECRET=<App Secret>
```

**apps/mobile/.env**

```
EXPO_PUBLIC_FACEBOOK_APP_ID=<App ID>
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000
```

Restart Metro / rebuild after changing `EXPO_PUBLIC_*`.

Local web redirect must stay listed:

```
http://localhost:3000/api/auth/callback/facebook
```

---

## iOS (when you ship App Store)

1. Meta → Add Platform → **iOS**
2. Bundle ID: `com.asktheimageguru.everyhue`
3. Enable Facebook Login for iOS
4. Same App ID in `EXPO_PUBLIC_FACEBOOK_APP_ID`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No Facebook button on web | Missing `AUTH_FACEBOOK_ID` or `AUTH_FACEBOOK_SECRET` |
| No Facebook button on mobile | Missing `EXPO_PUBLIC_FACEBOOK_APP_ID` in that build |
| “App not set up” / only works for you | App still **Development** — add testers or go **Live** + App Review |
| Works in browser, fails in APK | Android package / **key hash** wrong; add Play signing hash |
| Redirect URI error on web | Exact match: `https://YOUR_DOMAIN/api/auth/callback/facebook` |
| Token exchange 401 | Web API cannot reach Graph API; check server logs / App ID |

Mobile exchange endpoint: `POST /api/auth/mobile` with `{ provider: "facebook", accessToken }`.

---

## Security notes

- App Secret = server only (`AUTH_FACEBOOK_SECRET`)
- Rotate the secret in Meta if it leaks; update web host env and redeploy
- Keep Data deletion URL working — Meta and Play both expect it
