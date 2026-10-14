// صفحه‌های عمومی برای همه باز است؛ پنل‌ها و API برای موتور جستجو بسته است.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/business', '/api/', '/profile', '/clan', '/gallery', '/ingest'] }],
    sitemap: 'https://twinland.ir/sitemap.xml',
    host: 'https://twinland.ir',
  }
}
