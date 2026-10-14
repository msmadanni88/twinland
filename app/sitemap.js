// نقشه سایت برای موتورهای جستجو: صفحه اصلی، فهرست کافه‌ها و صفحه عمومی هر کافه فعال.
import { SITE, allActiveCafes } from '@/lib/public/sbServer'

export const revalidate = 86400

export default async function sitemap() {
  const cafes = await allActiveCafes('id,tier,created_at', 86400)
  const now = new Date()
  return [
    { url: SITE + '/', lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: SITE + '/cafes', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...cafes.map(c => ({
      url: SITE + '/cafe/' + c.id,
      lastModified: c.created_at ? new Date(c.created_at) : now,
      changeFrequency: 'weekly',
      priority: c.tier === 'featured' ? 0.7 : 0.5,
    })),
  ]
}
