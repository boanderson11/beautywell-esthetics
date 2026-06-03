/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},

  // Force the homepage and intake page to revalidate on every request at the
  // Netlify edge / browser. Both pages already use `export const dynamic =
  // 'force-dynamic'`, which makes Next.js server-render them on every request,
  // but Netlify's CDN can still cache the resulting HTML unless we explicitly
  // opt out. Without this, admin Settings changes (hours, contact info, etc.)
  // can take a long time to appear publicly because users get a stale cached
  // HTML response.
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/intake',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
