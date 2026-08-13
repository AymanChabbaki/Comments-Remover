const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next's own hydration/theme-init inline
  // scripts and Tailwind's inline styles -- a nonce-based CSP would drop
  // this, but isn't worth the hydration-breakage risk here. The rest of
  // the policy (no external script/object/frame sources, no third-party
  // form targets) still meaningfully narrows the attack surface.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // https: is broad, but image sources are genuinely third-party here
  // (Instagram profile pictures come straight from Meta's CDN, whose
  // subdomains rotate) -- data: covers the theme-init/inline SVG cases.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Only takes effect over HTTPS (browsers ignore it on plain HTTP), so
  // safe to send unconditionally rather than branching on environment.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
