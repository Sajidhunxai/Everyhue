# Every Hue

Personal color analysis for web and Android (Expo). Original product — not affiliated with any third-party palette brand.

## Stack

- `apps/web` — Next.js App Router (UI + API) with Auth.js (Google + Facebook)
- `apps/mobile` — Expo / React Native (`com.asktheimageguru.everyhue`) with Google + Facebook via Expo AuthSession → `/api/auth/mobile`
- `packages/color-engine` — CIE Lab + original 12-season matching
- `packages/types` / `packages/api-client` — shared contracts

## Setup

```bash
pnpm install
cp .env.example apps/web/.env.local
# Fill AUTH_SECRET, AUTH_GOOGLE_*, AUTH_FACEBOOK_*, DATABASE_URL, DIRECT_URL (Supabase — see SUPABASE.md)
# Optional mobile: copy Expo public vars into apps/mobile/.env
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### OAuth apps

**Google** — full live + local guide: [GOOGLE_AUTH.md](./GOOGLE_AUTH.md)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Web + Android OAuth clients
2. Web redirect: `http://localhost:3000/api/auth/callback/google` (add production HTTPS before store)
3. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` + mobile `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
4. Android client: package `com.asktheimageguru.everyhue` + SHA-1 (debug locally; Play App Signing for store)

**Facebook** — full live + local guide: [FACEBOOK_AUTH.md](./FACEBOOK_AUTH.md)

1. [Meta for Developers](https://developers.facebook.com/apps/) → Facebook Login
2. Valid OAuth redirect: `http://localhost:3000/api/auth/callback/facebook` (+ production HTTPS)
3. `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET`
4. Mobile: `EXPO_PUBLIC_FACEBOOK_APP_ID` (App ID only — never the secret)

## Scripts

```bash
pnpm dev          # web on :3000
pnpm test         # color-engine unit tests
pnpm dev:mobile   # Expo
```

## Security notes

- Never put OAuth client secrets in the mobile app.
- `/api/analyze` requires a NextAuth session cookie (web) or Bearer token from `/api/auth/mobile`.
- Prefer Lab samples from the device; multipart images are processed in memory only (no disk write in MVP).
- Rate limits are in-memory stubs — use Redis in production.

## Play Store

See **[PLAY_STORE.md](./PLAY_STORE.md)** plus auth Part A sections in Google / Facebook docs.

## Database & hosting

- **[SUPABASE.md](./SUPABASE.md)** — Postgres for local + Vercel
- Deploy `apps/web` to Vercel with Supabase `DATABASE_URL` / `DIRECT_URL`

## Payments (TODO)

- Web: Stripe
- Android: Google Play Billing / RevenueCat
