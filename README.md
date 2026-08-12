# Comment Moderation SaaS

Multi-tenant AI-powered comment moderation for Facebook Pages and Instagram
accounts. One deployment serves every client: each client (self-serve or
added by you) gets their own isolated dashboard, blocklist, and moderation
history, all routed through a single shared Meta app and webhook endpoint.

Built with Next.js (App Router) + Tailwind, Postgres (Neon), and OpenAI.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Neon's free tier works well; `localhost` connection strings skip SSL automatically). Tables are created automatically on first request.
   - `SESSION_SECRET` — any long random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `FB_VERIFY_TOKEN`, `FB_APP_SECRET` — from your Meta App (see below).
   - `OPENAI_API_KEY`
   - `DASHBOARD_USER` / `DASHBOARD_PASSWORD` — your own admin login for `/admin`.
3. `npm run dev`, then visit `http://localhost:3000`.

For local webhook testing, tunnel port 3000 (e.g. `ngrok http 3000`) and use that HTTPS URL as the Meta callback URL below.

## How multi-tenancy works

There's exactly one Meta app and one webhook endpoint (`/api/webhook`) —
Meta only supports one callback URL per app, so this can't be per-client.
Instead, every incoming event carries the Facebook Page ID or Instagram
Business Account ID it came from, and the app looks that ID up against the
`clients` table (Postgres) to figure out whose comment it is and which
tokens to moderate/delete it with. Each client's events, blocklist, and
dashboard are fully isolated from every other client's.

**Onboarding a client**, two ways:
- **Self-serve**: they visit `/signup`, generate their own Page/IG tokens (Meta App Dashboard steps below), and create their own account — instant activation, they land straight on their own dashboard.
- **Manual**: you add them yourself through `/admin` (protected by `DASHBOARD_USER`/`DASHBOARD_PASSWORD`) if they'd rather hand you the tokens directly.

There's also a public, unauthenticated `/demo` — the real dashboard UI
running on fake sample data, fully clickable (Delete/Unblock work, locally
only) — for a prospective client to see the product before deciding to
connect their own Page.

## Configure the Meta app (once, shared by every client)

1. App Dashboard → Webhooks → Page → Subscribe to this object.
2. Callback URL: `https://<your-domain>/api/webhook`
3. Verify token: same value as `FB_VERIFY_TOKEN`.
4. Subscribe to the `feed` field.

## Getting a client's Page Access Token (for self-serve signup or manual admin add)

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer) → select your app → request a **User** token with scopes: `pages_show_list`, `pages_read_engagement`, `pages_manage_engagement`, `pages_read_user_content`, `pages_manage_metadata` (the last one is required to subscribe the Page to webhook events, next step).
2. `GET /me/accounts?access_token=<user-token>` → take the `access_token` field for their Page from the response. That's the Page Access Token — not the user token.
3. Subscribe the Page to actually send events (the App Dashboard toggle alone isn't enough — this has no dashboard UI, it's API-only):
   ```
   curl -X POST "https://graph.facebook.com/v19.0/<PAGE_ID>/subscribed_apps?subscribed_fields=feed&access_token=<PAGE_ACCESS_TOKEN>"
   ```
   Expect `{"success":true}`.

## Also moderating Instagram comments

Instagram is wired through the separate **"Instagram API with Instagram
Login"** product, not the classic Page-linked flow — it does **not** reuse
the Page Access Token. It signs webhooks with its own App Secret
(`IG_APP_SECRET` in `.env`) and needs its own access token (`igAccessToken`,
stored per-client, used against `graph.instagram.com` — see `lib/facebook.js`).

Unlike the Facebook Page token, this **cannot be self-served by the client**
the way the Page token can via Graph API Explorer. Token generation for
this product lives on the App Dashboard's own "API setup with Instagram
login" page (`developers.facebook.com/apps/<id>/instagram-business-login`),
which only Admins/Developers of the app can open — Instagram Testers do not
get dashboard access, only the ability to be added there. So the flow is
admin-assisted:

1. Add the client as an Instagram Tester (App Dashboard → Instagram → API setup with Instagram login → Roles → Instagram Testers — distinct from the Facebook Tester list). They accept the invite from inside the Instagram app itself (Settings → Apps and websites → Tester invites), not a Facebook notification.
2. Once accepted, on the "API setup with Instagram login" page, under **1. Générez des tokens d'accès**, click **Add account**, select their Instagram account, then **Générer un token** — that's the `igAccessToken`. The Instagram Account ID shown next to it (e.g. `17841454947560776`) is `igUserId`.
3. On the same row, flip **Abonnement Webhooks** to enabled — no separate `subscribed_apps` curl call needed, it's a toggle in this UI (unlike the Page's `feed` subscription, which is API-only).
4. Send the client their `igUserId`/`igAccessToken` to paste into their own Settings page — same hand-off pattern as everything else, you generate the raw values (unavoidable for this one product) but the client still does the actual connecting.

If comments don't get processed, set `DEBUG_WEBHOOK_PAYLOAD=true`, redeploy, post a test comment, and check the logs for the real payload shape.

## How it works

- `POST /api/webhook` — verified via `X-Hub-Signature-256` (HMAC-SHA256, checked against `FB_APP_SECRET` and, if set, `IG_APP_SECRET`) before anything else runs. Awaited synchronously (not fire-and-forget) since this runs as a Vercel serverless function — there's no guarantee of continued execution after a response is sent the way there is on an always-on server.
- Text isn't reliably included in the webhook payload, so it's fetched via `GET /{comment-id}?fields=message,text`, then sent to `gpt-4o-mini` to decide `DELETE` or `KEEP`.
- The moderation prompt currently deletes on hate speech/spam/toxicity **or any negative sentiment at all** (complaints, "I don't recommend this", mild criticism) — not just abuse. It also reads Arabic script and Darija/Arabizi. Adjust `lib/moderation.js` if that's more aggressive than intended for a given use case — this is a product/reputation decision, not just a technical one.
- **Blocklist**: once a comment from someone is deleted (automatically or manually from the dashboard), that author is blocklisted for that client — their future comments are deleted on sight, skipping the OpenAI call. Reversible any time from the dashboard's "Blocked authors" panel.
- **Manual delete**: any kept comment can be deleted directly from the dashboard, for when the model misses something. Also blocklists the author.

## Dashboard & admin

- `/clients/<id>/dashboard` — a client's own moderation dashboard (stats, 24h activity chart, filters, blocklist panel). Gated by that client's own login (set at `/signup`), or your admin credentials as a fallback for support access.
- `/admin` — add/pause/delete clients, protected by `DASHBOARD_USER`/`DASHBOARD_PASSWORD` (`proxy.js` gates this at the request level, before any page or API route runs).

## Notes / things to decide before going further

- The moderation call fails closed (`KEEP`) on any unparseable model output, since deletion is irreversible.
- No retry/backoff on OpenAI or Graph API calls; a failed call is logged and dropped.
- Deleting a comment is permanent — consider hiding (`is_hidden`) instead if you want a less destructive first step or an audit trail.
- OpenAI cost is billed to one shared `OPENAI_API_KEY` across every client, not split per client.
- See `DEPLOY_SAAS.md` for the actual Vercel + Neon deployment steps.
