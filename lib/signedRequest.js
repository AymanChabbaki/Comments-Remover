import crypto from 'crypto';

function base64UrlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Parses and verifies Meta's `signed_request` format (used for the
 * Instagram deauthorize callback): "<sig>.<payload>", both base64url, sig
 * is an HMAC-SHA256 of the payload segment keyed with the app secret.
 * Throws if the signature doesn't match or the payload is malformed.
 */
function parseSignedRequest(signedRequest, secret) {
  if (!secret) throw new Error('No secret configured to verify signed_request');
  const [encodedSig, encodedPayload] = String(signedRequest).split('.');
  if (!encodedSig || !encodedPayload) throw new Error('Malformed signed_request');

  const sig = base64UrlDecode(encodedSig);
  const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest();
  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error('Signature mismatch');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
  if (String(payload.algorithm).toUpperCase() !== 'HMAC-SHA256') {
    throw new Error(`Unsupported algorithm: ${payload.algorithm}`);
  }
  return payload;
}

export { parseSignedRequest };
