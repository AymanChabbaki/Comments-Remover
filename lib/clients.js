import * as db from './db.js';

function toClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    pageId: row.page_id,
    pageAccessToken: row.page_access_token,
    igUserId: row.ig_user_id,
    igAccessToken: row.ig_access_token,
    email: row.email,
    passwordHash: row.password_hash,
    active: row.active,
    createdAt: row.created_at,
  };
}

async function list() {
  const { rows } = await db.query('SELECT * FROM clients ORDER BY name');
  return rows.map(toClient);
}

async function get(id) {
  const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
  return toClient(rows[0]);
}

async function getByPageId(pageId) {
  if (!pageId) return null;
  const { rows } = await db.query('SELECT * FROM clients WHERE page_id = $1', [pageId]);
  return toClient(rows[0]);
}

async function getByIgUserId(igUserId) {
  if (!igUserId) return null;
  const { rows } = await db.query('SELECT * FROM clients WHERE ig_user_id = $1', [igUserId]);
  return toClient(rows[0]);
}

async function getByEmail(email) {
  if (!email) return null;
  const { rows } = await db.query('SELECT * FROM clients WHERE email = $1', [email.toLowerCase()]);
  return toClient(rows[0]);
}

async function slugify(name) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'client';
  let id = base;
  let n = 2;
  while (await get(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

/**
 * Adds a new client. Only `name` is strictly required -- pageId/
 * pageAccessToken (and igUserId/igAccessToken) can be filled in later by
 * the client themselves from their own dashboard Settings page, rather
 * than handed to whoever creates the account. That's the point: an
 * admin-created account is just a login shell (name/email/password) --
 * the operator never has to see or handle the client's Graph API
 * tokens. If pageId/pageAccessToken are provided, they're required
 * together (a Page ID with no token, or vice versa, isn't a valid
 * state). A client with no pageId yet simply won't match any incoming
 * webhook event until they connect one.
 */
async function create({ name, pageId, pageAccessToken, igUserId, igAccessToken, email, passwordHash }) {
  if (!name) {
    throw new Error('name is required');
  }
  if (!!pageId !== !!pageAccessToken) {
    throw new Error('pageId and pageAccessToken must be provided together');
  }
  if (pageId && (await getByPageId(pageId))) {
    throw new Error(`A client already uses Page ID ${pageId}`);
  }
  if (igUserId && (await getByIgUserId(igUserId))) {
    throw new Error(`A client already uses Instagram account ID ${igUserId}`);
  }
  if (email && (await getByEmail(email))) {
    throw new Error(`An account already exists for ${email}`);
  }

  const id = await slugify(name);
  const { rows } = await db.query(
    `INSERT INTO clients (id, name, page_id, page_access_token, ig_user_id, ig_access_token, email, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id, name, pageId || null, pageAccessToken || null, igUserId || null, igAccessToken || null, email ? email.toLowerCase() : null, passwordHash || null]
  );
  return toClient(rows[0]);
}

const UPDATABLE_FIELDS = {
  name: 'name',
  pageId: 'page_id',
  pageAccessToken: 'page_access_token',
  igUserId: 'ig_user_id',
  igAccessToken: 'ig_access_token',
  email: 'email',
  passwordHash: 'password_hash',
  active: 'active',
};

async function update(id, fields) {
  const existing = await get(id);
  if (!existing) return null;

  if (fields.pageId && fields.pageId !== existing.pageId && (await getByPageId(fields.pageId))) {
    throw new Error(`A client already uses Page ID ${fields.pageId}`);
  }
  if (fields.igUserId && fields.igUserId !== existing.igUserId && (await getByIgUserId(fields.igUserId))) {
    throw new Error(`A client already uses Instagram account ID ${fields.igUserId}`);
  }
  if (fields.email && fields.email !== existing.email && (await getByEmail(fields.email))) {
    throw new Error(`An account already exists for ${fields.email}`);
  }

  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (sets.length === 0) return existing;

  values.push(id);
  const { rows } = await db.query(
    `UPDATE clients SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return toClient(rows[0]);
}

async function remove(id) {
  const { rowCount } = await db.query('DELETE FROM clients WHERE id = $1', [id]);
  return rowCount > 0;
}

export { list, get, getByPageId, getByIgUserId, getByEmail, create, update, remove };
