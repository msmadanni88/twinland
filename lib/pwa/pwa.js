// نصب روی گوشی و اعلان روی گوشی.
// • نصب: رویداد beforeinstallprompt در کروم و اندروید گرفته و نگه داشته می‌شود تا دکمه «نصب» آن را باز کند.
//   در آیفون این رویداد نیست و فقط راهنمای «افزودن به صفحه اصلی» نشان داده می‌شود.
// • اعلان: کلید عمومی از push_config می‌آید. تا وقتی کلید ساخته نشده، گزینه اعلان دیده نمی‌شود.
//   اشتراک با push_subscribe در دیتابیس ثبت می‌شود و هر اعلان تازه داخل اپ به گوشی هم می‌رود.
import { SB_KEY, SB_URL } from '@/lib/config'

let deferred = null
const listeners = new Set()
function emit() { listeners.forEach(fn => { try { fn() } catch (e) {} }) }

export function initPwa() {
  if (typeof window === 'undefined' || window.__tlPwa) return
  window.__tlPwa = true
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; emit() })
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  if ('serviceWorker' in navigator && (!local || /[?&]sw=1\b/.test(window.location.search))) {
    const go = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true })
  }
}

export function onPwaChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function canPromptInstall() { return !!deferred }
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true
}
export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export async function promptInstall() {
  if (!deferred) return 'unavailable'
  const e = deferred
  deferred = null; emit()
  try { e.prompt(); const r = await e.userChoice; return r && r.outcome === 'accepted' ? 'accepted' : 'dismissed' } catch (err) { return 'dismissed' }
}

// ── اعلان روی گوشی ──
function rpc(name, body, token) {
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}
function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
function b64url(buf) {
  const bytes = new Uint8Array(buf); let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}
export async function pushPublicKey() {
  const r = await rpc('push_config', {})
  return (r && r.public_key) || null
}
export async function pushState() {
  if (!pushSupported()) return { supported: false }
  const key = await pushPublicKey()
  if (!key) return { supported: true, ready: false }
  let on = false
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = reg && await reg.pushManager.getSubscription()
    on = !!sub && Notification.permission === 'granted'
  } catch (e) {}
  return { supported: true, ready: true, on, permission: Notification.permission, key }
}
export async function pushEnable(token) {
  if (!pushSupported()) return { ok: false, error: 'unsupported' }
  const key = await pushPublicKey()
  if (!key) return { ok: false, error: 'not_ready' }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, error: 'denied' }
  const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) })
  const r = await rpc('push_subscribe', {
    p_endpoint: sub.endpoint, p_p256dh: b64url(sub.getKey('p256dh')), p_auth: b64url(sub.getKey('auth')), p_ua: navigator.userAgent.slice(0, 200),
  }, token)
  return r && r.ok ? { ok: true } : { ok: false, error: 'save' }
}
export async function pushDisable(token) {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = reg && await reg.pushManager.getSubscription()
    if (sub) { await rpc('push_unsubscribe', { p_endpoint: sub.endpoint }, token); await sub.unsubscribe() }
    return { ok: true }
  } catch (e) { return { ok: false } }
}
