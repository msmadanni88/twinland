/** @type {import('next').NextConfig} */
// تحلیل PostHog از نشانی خود سایت می‌گذرد تا بسته شدن دامنه‌های خارجی برای بعضی کاربران چیزی را خراب نکند.
// کاربر فقط /ingest را می‌بیند؛ این‌جا به سرورهای PostHog منطقه آمریکا فرستاده می‌شود.
const nextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/array/:path*', destination: 'https://us-assets.i.posthog.com/array/:path*' },
      { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
    ]
  },
}
module.exports = nextConfig
