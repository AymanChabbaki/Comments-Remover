const jwt = require('jsonwebtoken');

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function signClientToken(clientId) {
  return jwt.sign({ clientId }, requireSecret(), { expiresIn: '30d' });
}

/** Returns the clientId encoded in the token, or null if missing/invalid/expired. */
function verifyClientToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, requireSecret()).clientId;
  } catch {
    return null;
  }
}

/** secure:true only when the request actually arrived over HTTPS, direct or via a proxy. */
function cookieOptions(req) {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
  return { httpOnly: true, secure: isHttps, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' };
}

module.exports = { signClientToken, verifyClientToken, cookieOptions };
