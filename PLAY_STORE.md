# Play Store launch checklist

Package: `com.asktheimageguru.everyhue` · Expo SDK 54 · Brand: **Every Hue**

Auth setup (do these before / with store submit):

- **[GOOGLE_AUTH.md](./GOOGLE_AUTH.md)** — Part A (Live / Play Store)
- **[FACEBOOK_AUTH.md](./FACEBOOK_AUTH.md)** — Part A (Live / Play Store)
- **[SUPABASE.md](./SUPABASE.md)** — Postgres for Vercel / production API

---

## Must do before submit

1. **Host privacy + terms on HTTPS**
   - Deploy `apps/web` so `/privacy`, `/terms`, and `/account/delete` are public.
   - Play Console → App content → Privacy policy → `https://YOUR_DOMAIN/privacy`
   - Update `apps/mobile/app.json` → `extra.privacyPolicyUrl` to that URL.
   - Same URLs on Google OAuth consent screen and Meta app settings.

2. **Production API URL**
   - Set `EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN` (EAS **production** env — not LAN HTTP).
   - Use **Supabase Postgres** (`DATABASE_URL` + `DIRECT_URL`) — see [SUPABASE.md](./SUPABASE.md).
   - Set a strong `AUTH_SECRET` (not the dev string).
   - Set `AUTH_URL=https://YOUR_DOMAIN` on the web host (e.g. Vercel).

3. **Google OAuth for release builds**
   - Follow [GOOGLE_AUTH.md](./GOOGLE_AUTH.md) Part A.
   - Consent screen **Published** for public users.
   - Android OAuth client: package `com.asktheimageguru.everyhue`.
   - Add **Play App Signing SHA-1** + **upload key SHA-1** (`eas credentials`).
   - Web client redirect: `https://YOUR_DOMAIN/api/auth/callback/google`.
   - EAS production: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (+ Android client ID).

4. **Facebook Login for release builds**
   - Follow [FACEBOOK_AUTH.md](./FACEBOOK_AUTH.md) Part A.
   - Meta app → **Live** mode + App Review for `email` if required.
   - Android package + **key hashes** (Play signing + upload + debug).
   - Web: `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` + redirect `…/api/auth/callback/facebook`.
   - EAS production: `EXPO_PUBLIC_FACEBOOK_APP_ID`.

5. **Account deletion**
   - In-app: Home → Delete account → `DELETE /api/account`.
   - Web: `/account/delete`.
   - Declare both paths in Play Data safety and Meta “User data deletion”.

6. **Store assets**
   - Icons/splash are in `apps/mobile/assets/` (replace with brand finals if desired).
   - Feature graphic 1024×500, phone screenshots, short/full description.
   - Store listing name should match OAuth / Meta branding where possible.

7. **Build & submit**
   ```bash
   cd apps/mobile
   # Confirm production env vars first (Google + Facebook + API URL)
   eas env:list production
   eas build --platform android --profile production
   eas submit --platform android
   ```

---

## Data safety (declare accurately)

| Data | Collected | Shared | Purpose |
|------|-----------|--------|---------|
| Name, email, avatar | Yes (Google / Facebook / email) | Sign-in providers | Account |
| Photos / camera | Yes (user-chosen only) | Our API; Google Gemini for Look studio; optional OpenAI | Analysis + try-on |
| App activity (analyses, wardrobe, chat) | Yes | Hosting / optional OpenAI for stylist | App features |
| Ads / advertising ID | No | — | Declare “no” in Play Console |
| Account deletion | Supported | — | In-app + https://www.asktheimageguru.com/account/delete |

---

## Optional before v1.1

- Face/skin Lab via MediaPipe (replace average-image sampling)
- Play Billing for premium
- OpenAI key for richer stylist replies
- Redis rate limits
- iOS App Store (see Google / Facebook iOS sections in auth docs)

---

## Verify locally before EAS

```bash
pnpm install
# apps/web/.env.local must have Supabase DATABASE_URL + DIRECT_URL
pnpm --filter @photomatcher/web db:push
pnpm --filter @photomatcher/web build
pnpm --filter @photomatcher/mobile lint
pnpm test
```
