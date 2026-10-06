// ثبت رویدادهای مکان: بازدید برگه، کلیک روی راه‌های تماس، اشتراک و هر رویداد بعدی.
// همه قاعده‌ها — چه کسی، چند بار، شمرده شود یا نه — در دیتابیس و تابع log_place_event اجرا می‌شود؛
// این فایل فقط پیام می‌فرستد و هیچ‌وقت جلوی کار کاربر را نمی‌گیرد.
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

let enabled = true
// حالت نمایشی و هر جای دیگری که نباید چیزی ثبت شود، ثبت را خاموش می‌کند
export function setTracking(on) { enabled = !!on }

// o: { channel, source, refType, refId }
export function trackPlace(cafeId, type, o) {
  if (!enabled || !cafeId || typeof window === 'undefined') return
  try {
    const s = getSession()
    if (!s || !s.access_token) return
    const x = o || {}
    fetch(SB_URL + '/rest/v1/rpc/log_place_event', {
      method: 'POST', keepalive: true,
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_cafe_id: cafeId, p_type: type, p_channel: x.channel || null, p_source: x.source || null,
        p_ref_type: x.refType || null, p_ref_id: x.refId != null ? String(x.refId) : null,
        p_device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      }),
    }).catch(() => {})
  } catch (e) {}
}

// نشانی وب‌سایت کسب‌وکار با برچسب مبدأ، تا صاحب سایت در آمار خودش هم بازدید TwinLand را ببیند.
// هیچ داده‌ای از کاربر در نشانی نمی‌رود.
export function withUtm(url, medium, campaign) {
  try {
    const u = new URL(url)
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'twinland')
      u.searchParams.set('utm_medium', medium || 'place_sheet')
      if (campaign) u.searchParams.set('utm_campaign', String(campaign))
    }
    return u.toString()
  } catch (e) { return url }
}
