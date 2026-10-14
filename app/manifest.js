// فایل نصب اپ برای مرورگر. آیکن‌ها موقت‌اند و از لوگوی صفحه لینکدین ساخته شده‌اند تا دنی آیکن نهایی را بسازد.
export default function manifest() {
  return {
    name: 'TwinLand · کشف شهر و کافه‌های تهران',
    short_name: 'TwinLand',
    description: 'نقشه بازی‌وار کافه‌های تهران: چک‌این کن، ماموریت بزن، جایزه بگیر.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'fa',
    background_color: '#f2e3c4',
    theme_color: '#0f1222',
    categories: ['travel', 'lifestyle', 'food'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
