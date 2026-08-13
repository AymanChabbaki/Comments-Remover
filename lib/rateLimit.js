/**
 * In-memory sliding-window rate limiter. Lives at module scope like the
 * webhook route's seenCommentIds Set -- persists across warm serverless
 * invocations on the same instance, but not guaranteed across cold
 * starts or multiple instances. That's an acceptable trade-off here: it's
 * a meaningful speed bump against scripted brute-forcing of a single
 * login, not a hard guarantee, and this app has no other shared state
 * store to lean on.
 */
const MAX_KEYS = 5000;
const attempts = new Map(); // key -> array of timestamps (ms)

function isRateLimited(key, { max, windowMs }) {
  const now = Date.now();
  const existing = (attempts.get(key) || []).filter((t) => now - t < windowMs);

  if (existing.length >= max) {
    attempts.set(key, existing);
    return true;
  }

  existing.push(now);
  attempts.set(key, existing);

  if (attempts.size > MAX_KEYS) {
    attempts.delete(attempts.keys().next().value);
  }
  return false;
}

function clearRateLimit(key) {
  attempts.delete(key);
}

/** Best-effort client IP from the headers a proxy/CDN sets -- there's no fully spoof-proof source of this without controlling the edge network. */
function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export { isRateLimited, clearRateLimit, clientIp };
