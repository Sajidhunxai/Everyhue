# Google Sign-In — Web (step by step)

Do these **in order**. Domain examples use `asktheimageguru.com` — swap for your Vercel URL if the custom domain is not ready yet.

**Vercel tip:** never use the `NEXT_PUBLIC_` prefix for auth/DB secrets. Use **Encrypted** env vars (`AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_*`, `DATABASE_URL`, …).

---

## Step 1 — Open Google Cloud

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with the Google account that will own the OAuth app
3. Create a project (or select an existing one), e.g. **Every Hue**
4. Wait until the project is selected in the top bar

---

## Step 2 — Configure OAuth consent screen

1. Menu → **APIs & Services** → **OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - **App name:** `Every Hue`
   - **User support email:** your email
   - **App logo:** optional
   - **App domain — Application home page:** `https://asktheimageguru.com` (or your Vercel URL)
   - **Privacy policy:** `https://asktheimageguru.com/privacy`
   - **Terms of service:** `https://asktheimageguru.com/terms`
   - **Authorized domains:** add `asktheimageguru.com` (and `vercel.app` if you use a `*.vercel.app` URL)
   - **Developer contact:** your email
4. Click **Save and Continue**
5. **Scopes** → leave defaults (`email`, `profile`, `openid`) → **Save and Continue**
6. **Test users** (while status is Testing):
   - Click **Add users**
   - Add the Gmail you will use to sign in
   - **Save and Continue**
7. Review → **Back to dashboard**

**Later (when the site is public):** Consent screen → **Publish app**  
Until then, only **Test users** can log in with Google.

---

## Step 3 — Create the Web OAuth client

1. Menu → **APIs & Services** → **Credentials**
2. **Create credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Every Hue Web`
5. **Authorized JavaScript origins** → **Add URI** for each:

   ```
   http://localhost:3000
   https://asktheimageguru.com
   https://www.asktheimageguru.com
   https://YOUR_PROJECT.vercel.app
   ```

6. **Authorized redirect URIs** → **Add URI** for each:

   ```
   http://localhost:3000/api/auth/callback/google
   https://asktheimageguru.com/api/auth/callback/google
   https://www.asktheimageguru.com/api/auth/callback/google
   https://YOUR_PROJECT.vercel.app/api/auth/callback/google
   ```

7. Click **Create**
8. Copy and save somewhere safe (`.env.local` / Vercel only — never commit):
   - **Client ID** (ends with `.apps.googleusercontent.com`)
   - **Client secret** (starts with `GOCSPX-`)

Do **not** add `photomatcher://` anywhere.

---

## Step 4 — Put secrets in local env

1. Open `apps/web/.env.local`
2. Set (or update) these lines:

   ```env
   AUTH_URL=http://localhost:3000
   AUTH_SECRET=paste-a-long-random-string-here
   AUTH_TRUST_HOST=true
   AUTH_GOOGLE_ID=paste-client-id-here.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=paste-client-secret-here
   ```

3. Generate `AUTH_SECRET` if needed:

   ```bash
   openssl rand -base64 32
   ```

4. Keep your existing Supabase lines (`DATABASE_URL`, `DIRECT_URL`) — Google login still needs the database
5. Save the file

---

## Step 5 — Run the web app locally

1. In the repo root:

   ```bash
   pnpm dev:web
   ```

2. Wait until it says Ready
3. Open [http://localhost:3000/login](http://localhost:3000/login)
4. Click **Continue with Google**
5. Pick your **test user** Gmail
6. You should land on `/dashboard`

If it fails, see Step 8.

---

## Step 6 — Deploy to Vercel

1. Push code to GitHub (correct account with Write access)
2. Vercel → **Add New Project** → import the repo
3. Settings:
   - **Root Directory:** `apps/web`
   - **Install Command:** `cd ../.. && pnpm install`
   - **Build Command:** `pnpm build`
   - **Node.js:** 20+
4. **Environment Variables** → add as **Encrypted** (not Public / not `NEXT_PUBLIC_`):

   | Name | Value |
   |------|--------|
   | `AUTH_URL` | `https://www.asktheimageguru.com` |
   | `AUTH_SECRET` | new random secret |
   | `AUTH_TRUST_HOST` | `true` |
   | `AUTH_GOOGLE_ID` | Client ID from Step 3 |
   | `AUTH_GOOGLE_SECRET` | Client secret from Step 3 |
   | `DATABASE_URL` | Supabase pooler (`ap-southeast-2`, port `6543`) |
   | `DIRECT_URL` | Supabase session (port `5432`) |

5. If Vercel warns about a public prefix: **remove `NEXT_PUBLIC_`** and keep the name as `AUTH_URL` / `SUPABASE_URL` (Encrypted).
6. Deploy
7. Copy the live URL (custom domain or `xxx.vercel.app`)

---

## Step 7 — Point Google at your live URL

1. Back in Google Cloud → **Credentials** → open your **Web** client
2. Add any missing **origin** for the live site
3. Add any missing **redirect**:

   ```
   https://YOUR_LIVE_DOMAIN/api/auth/callback/google
   ```

4. **Save**
5. Wait 1–5 minutes
6. Open `https://YOUR_LIVE_DOMAIN/login` → **Continue with Google**

---

## Step 8 — If something breaks

| What you see | What to do |
|--------------|------------|
| No Google button | Step 4: both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` must be set; restart `pnpm dev:web` |
| `redirect_uri_mismatch` | Step 3/7: redirect must be **exact**, including `/api/auth/callback/google` |
| Access blocked / 400 | Step 2: add your Gmail as **Test user**, or **Publish** the consent screen |
| Works local, fails on Vercel | Step 6 env vars missing, or Step 7 live redirect not added |
| Signed in then kicked out | Check `AUTH_SECRET` and `AUTH_URL` match the site you’re on |
| Vercel “public framework prefix” warning | Rename `NEXT_PUBLIC_*` → server names (`AUTH_URL`, `SUPABASE_URL`, …) and set Encrypted |

---

## Step 9 — Go public (optional)

When real users (not only you) should sign in:

1. Consent screen → **Publish app**
2. Confirm privacy + terms URLs load on HTTPS
3. Test login with a Gmail that is **not** in the test-user list

---

## Done when

- [ ] Step 2 consent screen done (+ test user or published)
- [ ] Step 3 Web client created
- [ ] Step 4 `.env.local` filled
- [ ] Step 5 local Google login works
- [ ] Step 6 Vercel env + deploy done
- [ ] Step 7 live Google login works

You do **not** need Facebook or Android OAuth for web-only Google login.
