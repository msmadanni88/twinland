// ورودی‌های پیوند: کد دعوت ?ref=ABC234 و پیوند مستقیم کافه ?cafe=<id>
// هر دو پیش از ورود ذخیره می‌شوند، چون کاربر تازه اول صفحه ورود را می‌بیند.
// کد دعوت 14 روز روی همین مرورگر می‌ماند و بعد از اولین ورود یک بار برای سرور فرستاده می‌شود.
// همه قاعده‌های ضدتقلب در claim_referral سمت سرور است؛ اینجا فقط یادداشت و یک درخواست است.
import { SB_KEY, SB_URL } from '@/lib/config'

const REF_KEY = 'tl_ref'
const CAFE_KEY = 'tl_open_cafe'
const MSG_KEY = 'tl_ref_msg'
const REF_TTL = 14 * 86400e3
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function rememberEntryParams() {
  if (typeof window === 'undefined') return
  try {
    const sp = new URLSearchParams(window.location.search)
    const ref = String(sp.get('ref') || '').trim().toUpperCase()
    if (/^[A-Z2-9]{6}$/.test(ref)) localStorage.setItem(REF_KEY, JSON.stringify({ code: ref, at: Date.now() }))
    const cafe = String(sp.get('cafe') || '').trim()
    if (UUID.test(cafe)) sessionStorage.setItem(CAFE_KEY, cafe)
    if (sp.has('ref') || sp.has('cafe')) {
      sp.delete('ref'); sp.delete('cafe')
      const q = sp.toString()
      window.history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash)
    }
  } catch (e) {}
}

// شناسه کافه‌ای که باید بعد از بالا آمدن نقشه باز شود؛ فقط یک بار برگردانده می‌شود
export function takeOpenCafe() {
  try { const v = sessionStorage.getItem(CAFE_KEY); if (v) sessionStorage.removeItem(CAFE_KEY); return v || null } catch (e) { return null }
}

const MSG = {
  ok: '🎁 دعوتت ثبت شد. اولین چک‌این واقعی‌ات را بزن تا تو و دوستت هر کدام ۱۵۰ امتیاز بگیرید',
  self: 'این کد دعوت خودت است',
  old: 'کد دعوت فقط برای حساب‌های تازه است',
  already: 'قبلاً با یک کد دعوت آمده‌ای',
  code: 'این کد دعوت پیدا نشد',
  business: 'حساب کسب‌وکار کد دعوت نمی‌گیرد',
  loop: 'دو نفر نمی‌توانند همدیگر را دعوت کنند',
}

let inflight = false
export async function claimPendingReferral(session) {
  if (inflight || typeof window === 'undefined' || !session || !session.access_token) return
  let item = null
  try { item = JSON.parse(localStorage.getItem(REF_KEY) || 'null') } catch (e) {}
  if (!item || !item.code) return
  if (!item.at || Date.now() - item.at > REF_TTL) { try { localStorage.removeItem(REF_KEY) } catch (e) {} return }
  inflight = true
  try {
    const r = await fetch(SB_URL + '/rest/v1/rpc/claim_referral', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: item.code }),
    }).then(x => (x.ok ? x.json() : null))
    if (r && (r.ok || r.error)) {
      try { localStorage.removeItem(REF_KEY) } catch (e) {}
      const msg = r.ok ? MSG.ok : (MSG[r.error] || null)
      if (msg) {
        try { sessionStorage.setItem(MSG_KEY, JSON.stringify({ msg, ok: !!r.ok })) } catch (e) {}
        window.dispatchEvent(new Event('tl-referral'))
      }
    }
  } catch (e) {
    // خطای شبکه: کد می‌ماند تا دفعه بعد
  } finally { inflight = false }
}

// پیام نتیجه دعوت، یک بار
export function takeReferralMessage() {
  try { const v = JSON.parse(sessionStorage.getItem(MSG_KEY) || 'null'); if (v) sessionStorage.removeItem(MSG_KEY); return v } catch (e) { return null }
}

export function inviteLink(code) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://twinland.ir'
  return base + '/?ref=' + encodeURIComponent(code)
}
