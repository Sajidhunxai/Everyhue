# Supabase database (Every Hue)

Prisma now uses **PostgreSQL** via Supabase (SQLite is no longer used).

Related: [PLAY_STORE.md](./PLAY_STORE.md) · [GOOGLE_AUTH.md](./GOOGLE_AUTH.md)

---

## 1. Create a project

1. Sign up at [supabase.com](https://supabase.com)
2. **New project** → pick region → set a strong DB password (save it)
3. Wait until the project is healthy

---

## 2. Connection strings

Supabase → **Project Settings → Database** (or **Connect**)

You need **two** URLs:

| Env | Purpose | Typical port |
|-----|---------|--------------|
| `DATABASE_URL` | App runtime (Vercel / Next.js) — **Transaction pooler** | `6543` + `?pgbouncer=true` |
| `DIRECT_URL` | `prisma db push` / migrations — **Session** or **direct** | `5432` |

Example (URI mode from Supabase dashboard — copy yours, don’t invent hostnames):

```env
DATABASE_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

Tips:

- URL-encode special characters in the password (`@` → `%40`, etc.)
- Prefer the **pooler** host for serverless (Vercel)
- Put both in `apps/web/.env.local` locally and in **Vercel → Environment Variables** for production

---

## 3. Push the schema

From the repo:

```bash
# Ensure apps/web/.env.local has DATABASE_URL + DIRECT_URL
cd apps/web
pnpm exec prisma db push
pnpm exec prisma generate
```

Or from root:

```bash
pnpm --filter @photomatcher/web db:push
```

This creates `User`, `Analysis`, `WardrobeItem`, `FamilyProfile`, `ChatMessage` in Supabase.

You can confirm in Supabase → **Table Editor**.

---

## 4. Local Next.js

```bash
# apps/web/.env.local — same Supabase URLs (or a separate free project for staging)
pnpm dev:web
```

---

## 5. Vercel

1. Root Directory: `apps/web` (monorepo — ensure workspace packages install)
2. Env vars:

```
DATABASE_URL=...   # pooler :6543
DIRECT_URL=...     # :5432
AUTH_URL=https://asktheimageguru.com
AUTH_SECRET=...
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GOOGLE_ANDROID_ID=...
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
OPENAI_API_KEY=...
```

3. Deploy, then run `prisma db push` once against production URLs if tables aren’t created yet (from your machine with production env, or a one-off CI step).

Build already runs `prisma generate` — it does **not** run `db push` automatically.

---

## 6. Mobile API URL

After web is live:

```
EXPO_PUBLIC_API_URL=https://asktheimageguru.com
```

(EAS production env + rebuild)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Can't reach database server` | Check password encoding, project paused (free tier), or IP allow list |
| `prepared statement` / pooler errors | Use pooler URL with `?pgbouncer=true` for `DATABASE_URL`; keep `DIRECT_URL` for migrations |
| `Environment variable not found: DIRECT_URL` | Add `DIRECT_URL` next to `DATABASE_URL` |
| Empty tables after deploy | Run `pnpm --filter @photomatcher/web db:push` with production URLs |
| Old `file:./dev.db` in `.env.local` | Remove it — SQLite is no longer supported |
| **`FATAL: tenant/user postgres.… not found`** (Vercel digest / dashboard crash) | Wrong pooler **region**. This project must use **`aws-0-ap-southeast-2`**. If Vercel still has `ap-southeast-1` or `db.…supabase.co`, replace both URLs and **Redeploy**. |

### This project’s working hosts (copy into Vercel)

```
DATABASE_URL → …@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL   → …@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

Username form: `postgres.vcjgwuwbdebqpxzzheaa` (project ref after `postgres.`).


---

## Security

- Never commit `.env.local` or Supabase passwords
- Restrict DB password rotation if leaked
- Row Level Security (RLS) is optional here — the Next.js API uses the service connection and its own auth; do not expose `DATABASE_URL` to the browser
