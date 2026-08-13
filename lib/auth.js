import crypto from 'crypto';
import jwt from 'jsonwebtoken';

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * True if the request carries valid admin Basic Auth credentials
 * (DASHBOARD_USER/DASHBOARD_PASSWORD). Used both as a hard gate for
 * /admin and as a fallback on any individual client's dashboard, so you
 * can open it for support without needing that client's password.
 */
function isAdminRequest(request) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) return false;

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;

  const [reqUser, reqPass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  return !!reqUser && !!reqPass && timingSafeStringEqual(reqUser, user) && timingSafeStringEqual(reqPass, pass);
}

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function signClientToken(clientId) {
  return jwt.sign({ clientId }, requireSecret(), { expiresIn: '30d', algorithm: 'HS256' });
}

/** Returns the clientId encoded in the token, or null if missing/invalid/expired. */
function verifyClientToken(token) {
  if (!token) return null;
  try {
    // Algorithm pinned explicitly (rather than trusting the token's own
    // header) so a token forged with alg "none" or a different algorithm
    // can't slip past verification regardless of library defaults.
    return jwt.verify(token, requireSecret(), { algorithms: ['HS256'] }).clientId || null;
  } catch {
    return null;
  }
}

const CLIENT_COOKIE = 'client_token';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // seconds

/**
 * True if this request is allowed to act as the given client -- either
 * their own valid login cookie, or your admin credentials as a fallback.
 */
function isAuthorizedForClient(request, clientId) {
  if (!clientId) return false;
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${CLIENT_COOKIE}=([^;]+)`));
  const authedClientId = match && verifyClientToken(decodeURIComponent(match[1]));
  return (!!authedClientId && authedClientId === clientId) || isAdminRequest(request);
}

export {
  isAdminRequest,
  signClientToken,
  verifyClientToken,
  isAuthorizedForClient,
  CLIENT_COOKIE,
  COOKIE_MAX_AGE,
};
