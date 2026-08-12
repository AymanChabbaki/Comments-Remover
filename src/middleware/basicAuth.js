const crypto = require('crypto');

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** True if the request carries valid admin Basic Auth credentials. Doesn't
 * write a response either way -- callers decide what "not admin" means
 * for their route (401 vs. falling through to another auth check). */
function isAdminRequest(req) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) return false;

  const header = req.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;

  const [reqUser, reqPass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  return !!reqUser && !!reqPass && timingSafeStringEqual(reqUser, user) && timingSafeStringEqual(reqPass, pass);
}

/**
 * Protects the admin screen with HTTP Basic Auth. Fails closed: if
 * DASHBOARD_USER/DASHBOARD_PASSWORD aren't configured, it's unreachable
 * rather than silently public, since it holds every client's access
 * tokens.
 */
function basicAuth(req, res, next) {
  if (!process.env.DASHBOARD_USER || !process.env.DASHBOARD_PASSWORD) {
    return res.status(503).send('Admin not configured: set DASHBOARD_USER and DASHBOARD_PASSWORD.');
  }
  if (isAdminRequest(req)) return next();
  res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
  res.sendStatus(401);
}

module.exports = { basicAuth, isAdminRequest };
