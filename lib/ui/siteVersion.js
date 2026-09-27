// نسخه ظاهر فعال کل سایت را از دیتابیس می‌خواند — فقط سمت سرور، در layout.
// نتیجه 30 ثانیه در کش Vercel می‌ماند؛ پس هر تغییر نسخه حداکثر در همین مدت به همه می‌رسد.
// اگر دیتابیس جواب ندهد، نسخه پیش‌فرض و پایدار نشان داده می‌شود.
import { SB_URL, SB_KEY } from '@/lib/config'
import { DEFAULT_UI, UI_REVALIDATE_SECONDS, isKnownUi } from '@/lib/ui/versions'

export async function fetchSiteUiVersion() {
  try {
    const r = await fetch(SB_URL + '/rest/v1/app_settings?key=eq.ui_version&select=value', {
      headers: { apikey: SB_KEY },
      next: { revalidate: UI_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return DEFAULT_UI
    const rows = await r.json()
    const v = Array.isArray(rows) && rows[0] ? rows[0].value : null
    return isKnownUi(v) ? v : DEFAULT_UI
  } catch (e) {
    return DEFAULT_UI
  }
}
