const express = require('express');
const bcrypt = require('bcryptjs');
const clients = require('../services/clients');
const { signClientToken, cookieOptions } = require('../middleware/clientAuth');

const router = express.Router();

router.get('/signup', (_req, res) => {
  res.type('html').send(pageHtml('Sign up', SIGNUP_FORM));
});

router.post('/signup', async (req, res) => {
  const { name, email, password, pageId, pageAccessToken, igUserId, igAccessToken } = req.body || {};

  if (!name || !email || !password || !pageId || !pageAccessToken) {
    return res.type('html').send(pageHtml('Sign up', SIGNUP_FORM, 'Name, email, password, Page ID, and Page Access Token are all required.'));
  }
  if (password.length < 8) {
    return res.type('html').send(pageHtml('Sign up', SIGNUP_FORM, 'Password must be at least 8 characters.'));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const client = await clients.create({
      name, email, passwordHash, pageId, pageAccessToken,
      igUserId: igUserId || undefined, igAccessToken: igAccessToken || undefined,
    });
    res.cookie('client_token', signClientToken(client.id), cookieOptions(req));
    res.redirect(`/webhook/clients/${client.id}/dashboard`);
  } catch (err) {
    res.type('html').send(pageHtml('Sign up', SIGNUP_FORM, err.message));
  }
});

router.get('/login', (req, res) => {
  res.type('html').send(pageHtml('Log in', loginForm(req.query.next)));
});

router.post('/login', async (req, res) => {
  const { email, password, next } = req.body || {};
  const client = email && (await clients.getByEmail(email));

  const ok = client?.passwordHash && (await bcrypt.compare(password || '', client.passwordHash));
  if (!ok) {
    return res.type('html').send(pageHtml('Log in', loginForm(next), 'Incorrect email or password.'));
  }
  if (!client.active) {
    return res.type('html').send(pageHtml('Log in', loginForm(next), 'This account is paused. Contact support.'));
  }

  res.cookie('client_token', signClientToken(client.id), cookieOptions(req));
  res.redirect(next || `/webhook/clients/${client.id}/dashboard`);
});

router.post('/logout', (req, res) => {
  res.clearCookie('client_token', { path: '/' });
  res.redirect('/login');
});

function loginForm(next) {
  return `
    <form method="post" action="/login">
      ${next ? `<input type="hidden" name="next" value="${escapeHtml(next)}">` : ''}
      <label>Email<input type="email" name="email" required autofocus></label>
      <label>Password<input type="password" name="password" required></label>
      <button type="submit">Log in</button>
      <p class="alt">No account yet? <a href="/signup">Sign up</a></p>
    </form>`;
}

const SIGNUP_FORM = `
  <form method="post" action="/signup">
    <label>Business name<input type="text" name="name" required></label>
    <label>Email<input type="email" name="email" required></label>
    <label>Password (8+ characters)<input type="password" name="password" required minlength="8"></label>
    <hr>
    <p class="hint">Get these from the Meta setup guide -- your Page ID and Page Access Token.</p>
    <label>Facebook Page ID<input type="text" name="pageId" required></label>
    <label>Page Access Token<input type="text" name="pageAccessToken" required></label>
    <p class="hint">Optional -- only if you also want Instagram comments moderated.</p>
    <label>Instagram Account ID (optional)<input type="text" name="igUserId"></label>
    <label>Instagram Access Token (optional)<input type="text" name="igAccessToken"></label>
    <button type="submit">Create account</button>
    <p class="alt">Already have an account? <a href="/login">Log in</a></p>
  </form>`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pageHtml(title, formHtml, error) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} &ndash; Comment Moderation</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #0b0d12; --panel: #151822; --panel-2: #1b1f2b; --border: #262b38;
    --text: #eceef2; --muted: #8b93a3; --accent: #5b8def; --error: #f0555b; --radius: 10px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--text); padding: 24px;
  }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; width: 100%; max-width: 420px; }
  h1 { font-size: 18px; margin: 0 0 18px; }
  form { display: flex; flex-direction: column; gap: 12px; }
  label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); }
  input {
    background: var(--panel-2); border: 1px solid var(--border); color: var(--text);
    border-radius: 7px; padding: 9px 11px; font-size: 14px; font-family: inherit;
  }
  button {
    background: var(--accent); border: none; color: white; border-radius: 7px;
    padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px;
  }
  hr { border: none; border-top: 1px solid var(--border); margin: 4px 0; }
  .hint { font-size: 12px; color: var(--muted); margin: 0; }
  .alt { font-size: 13px; color: var(--muted); text-align: center; margin: 8px 0 0; }
  .alt a { color: var(--accent); }
  .error { background: rgba(240,85,91,0.12); border: 1px solid var(--error); color: var(--error); border-radius: 7px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
    ${formHtml}
  </div>
</body>
</html>`;
}

module.exports = router;
