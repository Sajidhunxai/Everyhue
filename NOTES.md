# PhotoMatcher — Project Notes

Decision log for Auto / future agents. Read this before implementing.

## Product

- Personal color analysis: seasonal palettes from a face photo (undertone, value, contrast).
- Category similar to colorwise.me — **not a clone**.
- Original brand name TBD (placeholder: PhotoMatcher). Do not use "Colorwise" or their branding.
- Targets: web app + Android (Google Play). iOS later optional.

## Stack (locked)

- **Web + API:** Next.js (App Router), TypeScript
- **Mobile:** React Native via **Expo** (not Flutter)
- **Monorepo:**
  - `apps/web` — Next.js marketing, app UI, Route Handlers
  - `apps/mobile` — Expo (Expo Router), Play Store package `com.asktheimageguru.everyhue`
  - `packages/color-engine` — shared Lab / season matching (pure TS)
  - `packages/types` — shared types
  - Optional: `packages/api-client` — typed fetch to the API
- Package manager: pnpm workspaces (+ Turborepo if useful)

## Color analysis

- Prefer **CIE Lab** (not raw RGB hex guesses).
- Prefer **on-device** face/skin sampling when practical; send Lab stats or short-lived images to API.
- Palettes and season names must be **original** (define our own centroids / labels).
- Version the engine (`engine_version`) so results stay reproducible after upgrades.

## Security

- No API keys or secrets in the mobile (or web client) bundle. Mobile talks only to our HTTPS API.
- Auth: secure sessions / tokens from our backend.
- Uploads: auth required, size/type limits, validate on server.
- Rate-limit `/api/analyze`.
- Photo retention: delete originals after processing (or short TTL); user can delete analyses.
- Account deletion path required (Play Store).
- CORS locked; never trust client-only “season” as paid truth without server validation if persisted.

## Legal / copyright

- Original UI, copy, illustrations, palette hex lists, and marketing text.
- Licensed fonts/icons only (e.g. Google Fonts, Lucide/Material).
- ML SDKs with commercial-friendly licenses (e.g. MediaPipe Apache) — read licenses before bundling.
- No Colorwise assets, screenshots, palette dumps, or scraped content.
- Privacy policy + Terms pages; Play Data Safety form when publishing.

## Payments (later)

- Web: Stripe
- Android in-app digital goods: Google Play Billing (not Stripe-only unlocks inside the Play app)

## Implementation status

- Monorepo scaffolded (Next.js + Expo + color-engine).
- Auth: Google + Facebook via Auth.js on web; mobile exchanges provider tokens at `/api/auth/mobile`.
- See `README.md` and `.env.example` for OAuth setup.
