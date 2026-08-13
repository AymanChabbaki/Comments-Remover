const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://comments.techermanos.org';

// Only the genuinely public, indexable pages -- everything under
// /clients/ and /admin is private/login-gated and excluded via robots.js.
export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/demo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/live-demo`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/data-deletion`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
