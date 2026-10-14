// تحلیل رفتار کاربر با PostHog — سبک، بدون اطلاعات شخصی و بدون موقعیت دقیق.
// • کتابخانه فقط بعد از بالا آمدن صفحه و در زمان بیکاری مرورگر بارگذاری می‌شود، پس سرعت شروع را کم نمی‌کند.
// • همه درخواست‌ها از نشانی خود سایت می‌گذرند (/ingest، در next.config.js)، تا اگر دامنه PostHog برای بعضی کاربران بسته بود چیزی گم نشود.
// • کاربر فقط با شناسه ناشناس دیتابیس معرفی می‌شود؛ نام، ایمیل و شماره هرگز فرستاده نمی‌شود.
// • مختصات و هر چیز شبیه موقعیت از رویدادها حذف می‌شود. در حالت نمایشی و روی localhost چیزی نمی‌رود.
// • خاموش کردن کامل: NEXT_PUBLIC_ANALYTICS=off در تنظیمات Vercel، یا setAnalyticsEnabled(false) در کد.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_nedTmPkwa862fSkwqN6mBcsUZakipyB3UBgq7dNsdewd'
const BLOCKED = /^(lat|lng|lon|latitude|longitude|coords?|position|email|phone|mobile|name|display_name|token|password)$/i

let ph = null          // نمونه PostHog وقتی آماده شد
let booting = false
let enabled = true
let pendingId = null   // شناسه کاربر پیش از آماده شدن کتابخانه
const queue = []

function allowed() {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_ANALYTICS === 'off') return false
  const h = window.location.hostname
  const local = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost')
  if (local && !/[?&]ph=1\b/.test(window.location.search)) return false
  return true
}

export function setAnalyticsEnabled(on) { enabled = !!on }

export function initAnalytics() {
  if (ph || booting || !allowed()) return
  booting = true
  const boot = () => {
    import('posthog-js').then(m => {
      const posthog = m.default || m
      posthog.init(KEY, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        person_profiles: 'identified_only',
        autocapture: false,             // فقط رویدادهایی که خودمان نام می‌گذاریم؛ داده تمیز و کم‌حجم می‌ماند
        capture_pageview: false,        // صفحه اصلی یک برنامه تک‌صفحه‌ای است؛ رویداد app_open را خودمان می‌فرستیم
        capture_pageleave: false,
        disable_session_recording: true,
        capture_exceptions: true,       // خطاهای جاوااسکریپت کاربران واقعی؛ جای Sentry تا وقتی آن وصل شود
        respect_dnt: true,
        persistence: 'localStorage+cookie',
        ip: false,                      // نشانی IP ذخیره نشود
        sanitize_properties: (props) => { const o = {}; Object.keys(props || {}).forEach(k => { if (!BLOCKED.test(k)) o[k] = props[k] }); return o },
        loaded: (p) => { ph = p; if (pendingId) p.identify(pendingId); while (queue.length) { const [e, pr] = queue.shift(); try { p.capture(e, pr) } catch (x) {} } },
      })
    }).catch(() => { booting = false })
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(boot, { timeout: 4000 }); else setTimeout(boot, 1500)
}

// نام رویداد snake_case و خاصیت‌ها فقط عدد، متن کوتاه یا true/false
export function track(event, props) {
  if (!enabled || !allowed()) return
  const clean = {}
  Object.keys(props || {}).forEach(k => {
    if (BLOCKED.test(k)) return
    const v = props[k]
    if (typeof v === 'number' || typeof v === 'boolean') clean[k] = v
    else if (typeof v === 'string') clean[k] = v.slice(0, 80)
  })
  clean.device = window.innerWidth < 768 ? 'mobile' : 'desktop'
  if (ph) { try { ph.capture(event, clean) } catch (e) {} } else { if (queue.length < 40) queue.push([event, clean]); initAnalytics() }
}

export function identifyUser(userId) {
  if (!userId || !allowed()) return
  pendingId = String(userId)
  if (ph) { try { ph.identify(pendingId) } catch (e) {} }
}
export function resetAnalyticsUser() { pendingId = null; if (ph) { try { ph.reset() } catch (e) {} } }
