import pg from 'pg';
const { Pool } = pg;

// Neon (and most managed Postgres) require SSL; rejectUnauthorized:false
// matches Neon's docs since their cert chain isn't always in Node's
// default trust store on every host. DATABASE_URL comes from Neon's
// dashboard ("Connection string").
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

// Every exported query() call ensures the schema exists first, memoized
// so it only actually runs once per warm serverless instance (or once
// total on a long-lived server) -- no separate startup step or
// middleware needed per deployment target. rawQuery bypasses this so
// migrate() itself doesn't recurse into ensureMigrated().
function rawQuery(text, params) {
  return pool.query(text, params);
}

let migrated = null;
async function ensureMigrated() {
  if (!migrated) {
    migrated = migrate().catch((err) => {
      migrated = null;
      throw err;
    });
  }
  return migrated;
}

async function query(text, params) {
  await ensureMigrated();
  return rawQuery(text, params);
}

/**
 * Creates the schema if it doesn't exist yet. Idempotent -- safe to run
 * on every cold start.
 */
async function migrate() {
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      page_id TEXT UNIQUE,
      page_access_token TEXT,
      ig_user_id TEXT UNIQUE,
      ig_access_token TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  // ADD COLUMN IF NOT EXISTS / DROP NOT NULL so this stays idempotent for
  // a database that already had the clients table before self-serve
  // signup (email/password_hash) or account-shell creation (nullable
  // page_id/page_access_token, so an admin can create a bare login and
  // the client connects their own Page later from their dashboard).
  await rawQuery('ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT UNIQUE');
  await rawQuery('ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT');
  await rawQuery('ALTER TABLE clients ALTER COLUMN page_id DROP NOT NULL');
  await rawQuery('ALTER TABLE clients ALTER COLUMN page_access_token DROP NOT NULL');
  await rawQuery('ALTER TABLE clients ADD COLUMN IF NOT EXISTS ig_username TEXT');
  await rawQuery('ALTER TABLE clients ADD COLUMN IF NOT EXISTS ig_profile_pic_url TEXT');
  // Master on/off switch for automatic comment deletion. Defaults to
  // true so every existing client keeps the behaviour they signed up
  // for; turning it off pauses the AI verdict + Graph API delete while
  // still logging incoming comments for manual review.
  await rawQuery('ALTER TABLE clients ADD COLUMN IF NOT EXISTS moderation_enabled BOOLEAN NOT NULL DEFAULT true');

  await rawQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      comment_id TEXT NOT NULL,
      text TEXT,
      verdict TEXT,
      deleted BOOLEAN NOT NULL DEFAULT false,
      error TEXT,
      platform TEXT,
      author TEXT,
      author_id TEXT,
      auto_blocked BOOLEAN NOT NULL DEFAULT false,
      manual BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await rawQuery('CREATE INDEX IF NOT EXISTS idx_events_client_time ON events(client_id, created_at DESC)');
  await rawQuery('CREATE INDEX IF NOT EXISTS idx_events_client_comment ON events(client_id, comment_id)');
  // Link to the post/reel the comment was left on -- from the webhook
  // payload directly for Facebook, from an extra Graph lookup for
  // Instagram (see getPostPermalink in lib/facebook.js). Nullable: not
  // always available, and never blocks anything else if missing.
  await rawQuery('ALTER TABLE events ADD COLUMN IF NOT EXISTS post_url TEXT');
  // Best-effort direct profile link for a Facebook commenter (see
  // getAuthorProfileLink in lib/facebook.js) -- usually null, since
  // Meta's scoped-ID system generally doesn't expose this to apps.
  await rawQuery('ALTER TABLE events ADD COLUMN IF NOT EXISTS author_url TEXT');

  await rawQuery(`
    CREATE TABLE IF NOT EXISTS blocklist (
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT,
      reason TEXT,
      blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (client_id, platform, author_id)
    )
  `);
  await rawQuery(`CREATE TABLE IF NOT EXISTS messaging_rules (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, kind TEXT NOT NULL, keyword TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await rawQuery(`CREATE TABLE IF NOT EXISTS messaging_contacts (
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE, platform TEXT NOT NULL,
    account_id TEXT NOT NULL, recipient_id TEXT NOT NULL, last_inbound_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY(client_id, platform, account_id, recipient_id)
  )`);
  await rawQuery(`CREATE TABLE IF NOT EXISTS messaging_jobs (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, account_id TEXT NOT NULL, kind TEXT NOT NULL, recipient_id TEXT NOT NULL,
    message TEXT NOT NULL, dedupe_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
    expires_at TIMESTAMPTZ NOT NULL, error TEXT, provider_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(client_id, dedupe_key)
  )`);
  await rawQuery('CREATE INDEX IF NOT EXISTS idx_messaging_queue ON messaging_jobs(status, created_at)');
}

export { query, migrate };
