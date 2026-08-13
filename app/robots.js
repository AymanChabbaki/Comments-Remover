export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing useful to crawlers here anyway (Basic Auth-gated /
        // login-gated), but keep it explicit rather than relying only on
        // each page's own noindex meta tag.
        disallow: ['/admin', '/clients/', '/login', '/api/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comments.techermanos.org'}/sitemap.xml`,
  };
}
