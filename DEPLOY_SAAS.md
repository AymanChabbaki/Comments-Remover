# Deploying the Saas branch (Vercel + Neon)

This is a separate deployment from `DEPLOY.md` (which covers the VPS/Docker
setup for the old single-tenant `main` branch). This is a proper Next.js
app now -- Tailwind UI, API routes, everything in one project. Vercel
auto-detects Next.js, so there's no custom wrapper/rewrite config needed
(unlike an earlier version of this branch that ran Express inside a
single Vercel function).

## 1. Create the database (Neon)

1. [neon.tech](https://neon.tech) → New Project.
2. Copy the connection string from the dashboard (it looks like
   `postgres://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`).
   That's your `DATABASE_URL`.
3. Nothing else to do here -- the app creates its own tables (`clients`,
   `events`, `blocklist`) automatically on first request (`lib/db.js`'s
   `migrate()`, idempotent `CREATE TABLE IF NOT EXISTS`).

## 2. Deploy to Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → import the
   `ultex-Automation` repo.
2. **Important**: set the branch to deploy from to `Saas`, not `main`
   (Project Settings → Git → Production Branch).
3. Framework preset: Vercel should auto-detect "Next.js" -- leave the
   build settings as-is.
4. Environment variables (Project Settings → Environment Variables) --
   same names as `.env.example`:
   - `DATABASE_URL` (from step 1)
   - `SESSION_SECRET` -- generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `FB_VERIFY_TOKEN`
   - `FB_APP_SECRET`
   - `IG_APP_SECRET` (if using Instagram's separate login product)
   - `GRAPH_API_VERSION`
   - `OPENAI_API_KEY`, `OPENAI_MODEL`
   - `DASHBOARD_USER`, `DASHBOARD_PASSWORD`
5. Deploy. Vercel gives you a `*.vercel.app` URL immediately -- test with
   that before touching DNS.

## 3. Point comments.techermanos.org at it

1. Vercel project → Settings → Domains → add `comments.techermanos.org`.
2. Vercel shows you the exact DNS record to add (usually a `CNAME` to
   `cname.vercel-dns.com`, or an `A` record if it's an apex domain) --
   add that at your DNS provider for `techermanos.org`.
3. Wait for it to show "Valid Configuration" in Vercel before moving on.

## 4. Verify it's actually working

```
curl https://comments.techermanos.org/            # landing page, expect 200
curl https://comments.techermanos.org/demo         # sandbox demo, expect 200
```

Then:
1. Open `https://comments.techermanos.org/admin` -- your browser should
   prompt for the `DASHBOARD_USER`/`DASHBOARD_PASSWORD` you set in Vercel.
2. Add one real or throwaway client through that screen and confirm it
   shows up -- this is the one thing I could not verify against a live
   Neon connection myself (no working Postgres available while building
   this), so treat it as the real first test of that connection.
3. Separately, try `/signup` and confirm a self-serve account can be
   created and lands on its own dashboard immediately (instant
   activation, no approval step, per your call on that).

## 5. Point Meta's webhook at the new URL

In the Meta App Dashboard's Webhooks page:

```
Callback URL: https://comments.techermanos.org/api/webhook
Verify token: <same FB_VERIFY_TOKEN as in Vercel's env vars>
```

Every client's events flow through this one shared endpoint (Meta only
supports one callback URL per app, regardless of how many Pages/clients
are subscribed through it); the app figures out which client an event
belongs to from the Page/IG ID Meta sends, using whatever's in the
`clients` table.

## App structure, if you're picking this back up later

- `app/` -- pages (React + Tailwind) and API routes (`app/api/*/route.js`)
- `lib/` -- framework-agnostic backend logic (Postgres, Graph API, OpenAI
  moderation, auth helpers) -- no Express/Next-specific code in here
- `proxy.js` -- gates `/admin` and `/api/admin/*` with your Basic Auth
  credentials before the request reaches any page or route handler
- `components/ModerationDashboard.jsx` -- the actual dashboard UI, shared
  between a real client's authenticated dashboard and the public `/demo`
  sandbox (which just feeds it fake data and local-only mutation handlers)

## Notes

- This is a genuinely separate deployment/database from the VPS-hosted
  ULTEx instance on `main` -- nothing here migrates ULTEx's existing
  data automatically. If ULTEx should move onto this system, re-add them
  as a client through `/admin`.
- `/demo` needs no setup at all -- zero backend dependency, works the
  moment the deploy succeeds, independent of whether Neon/clients are
  configured yet.
