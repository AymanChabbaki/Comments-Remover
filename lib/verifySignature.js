import crypto from 'crypto';

function matchesSignature(signature, secret, rawBody) {
  if (!secret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * True if the X-Hub-Signature-256 header matches either the main app's
 * secret (Facebook Page events) or the separate Instagram product's
 * secret (Instagram comment events) -- see the long trail of comments in
 * the git history for why two secrets are needed here.
 */
function isValidMetaSignature(signatureHeader, rawBody) {
  if (!signatureHeader) return false;
  const secrets = [process.env.FB_APP_SECRET, process.env.IG_APP_SECRET];
  return secrets.some((secret) => matchesSignature(signatureHeader, secret, rawBody));
}

export { isValidMetaSignature };
