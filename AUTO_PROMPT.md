# Paste this into Auto (Agent mode)

Copy everything below the line into a new Cursor chat with Auto / Agent mode enabled.

---

Read `NOTES.md` in this repo and follow it exactly. Scaffold the monorepo and MVP — do not clone Colorwise (no their name, UI, copy, palettes, or assets).

## Goals

Build a personal color-analysis product:

1. Monorepo with shared TypeScript color engine
2. Next.js web app + API
3. Expo React Native app aimed at Google Play

## 1. Monorepo

- Use **pnpm workspaces** (add Turborepo if helpful).
- Structure:
  - `apps/web` — Next.js App Router (TypeScript)
  - `apps/mobile` — Expo + Expo Router
  - `packages/color-engine` — pure TS color math
  - `packages/types` — shared types
  - Optional `packages/api-client`
- Root README: how to install, run web, run mobile, run tests.
- `.env.example` only (no real secrets). Document required vars.

## 2. `packages/color-engine`

- sRGB → linear → XYZ → **CIE Lab** helpers (use `culori` or `colorjs.io` if useful).
- Original seasonal centroids / labels (invent our own 12-season or 4-season set — do not copy Colorwise).
- `matchSeason(labSamples)` → season id, confidence, palette hexes (ours).
- Export `engine_version` string constant.
- Unit tests for Lab conversion and basic matching (golden fixtures).

## 3. `apps/web` (Next.js)

- Pages/routes:
  - Home / capture or upload photo
  - Results (season, palette, short styling tips — original copy)
  - Privacy policy stub
  - Terms of service stub
  - Account deletion stub page (required for Play-aligned product)
- API:
  - `POST /api/analyze` — Zod-validated body; accept image upload **or** Lab samples; size/MIME limits; rate-limit stub; return season + palette + `engine_version`
  - Auth stub (e.g. session placeholder or Auth.js/Better Auth scaffold) — no secrets committed
- UI: clean original design; Google Fonts / Lucide or similar licensed icons only.
- Do not put server secrets in client components.

## 4. `apps/mobile` (Expo)

- Expo Router screens: onboarding tip (good lighting), camera/gallery pick, results, privacy link, account deletion stub.
- Android package / applicationId: `com.asktheimageguru.everyhue`
- Camera / media permissions only as needed, with in-app rationale text.
- Call the same analyze API via shared types/client (configurable `EXPO_PUBLIC_API_URL` in `.env.example`).
- No API keys in the app bundle beyond public URL.

## 5. Security & legal (must)

- HTTPS API assumption; CORS locked to web origin for browser; mobile uses auth token pattern (stub ok).
- Image retention: document + stub delete-after-analyze or TTL note in code comments / README.
- Rate limit analyze endpoint (even a simple in-memory stub).
- Original everything — no Colorwise references in UI strings except maybe “not affiliated” is unnecessary; just don’t mention them.
- Play-oriented notes in README: Data Safety, privacy URL, account deletion, permissions.

## 6. Out of scope for this scaffold

- Real Play Billing / Stripe wiring (leave TODO comments)
- Production face ML (stub sampling or simple average skin region is OK; note MediaPipe as next step)
- Pushing to Play Store

## Done when

- `pnpm install` works
- Web runs and analyze API returns a valid JSON result for a sample request
- Color-engine tests pass
- Mobile app boots and can hit analyze with a mock/dev API URL
- NOTES.md decisions are respected throughout

Implement now. Prefer working code over docs beyond README + existing NOTES.md.
