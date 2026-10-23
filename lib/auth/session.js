// ─────────────────────────────────────────────────────────────
//  نشست ورود: یک جا برای تازه نگه داشتن توکن
//
//  توکن ورود سوپابیس یک ساعت اعتبار دارد. قبلاً فقط وقتی تمدید می‌شد که کسی تابع
//  freshToken را صدا می‌زد، و بیشتر صفحه‌ها و پنل‌های v4 توکن را مستقیم از حافظه مرورگر
//  می‌خواندند. بعد از یک ساعت همه درخواست‌ها خطای 401 می‌گرفتند و مثلاً پروفایل دیگران باز نمی‌شد.
//
//  این فایل:
//   - توکن را پنج دقیقه پیش از تمام شدن، و هر بار که برگه دوباره دیده یا اینترنت وصل شد، تمدید می‌کند
//   - در هر لحظه فقط یک تمدید انجام می‌دهد، حتی بین چند زبانه باز، چون توکن تمدید یک‌بارمصرف است
//   - نشست تازه را در حافظه مرورگر و در همان شیء نشستی که صفحه اصلی دارد می‌گذارد
//   - رویداد tl-session را با نشست تازه و tl-session-dead را وقتی ورود دیگر معتبر نیست می‌فرستد
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'

const KEY = 'tl_session'
const EARLY_MS = 5 * 60 * 1000
const MIN_DELAY_MS = 5000

let inflight = null
let timer = null
let live = null          // شیء نشستی که صفحه اصلی نگه می‌دارد؛ همین شیء تازه می‌شود تا همه جا توکن تازه ببینند
let keeperStarted = false

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return s && s.access_token ? s : null
  } catch (e) { return null }
}
function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch (e) {} }

export function readSession() { return read() }

// زمان پایان توکن به میلی‌ثانیه؛ اگر ذخیره نشده بود از خود توکن خوانده می‌شود
export function expiresAt(s) {
  if (!s) return 0
  let e = Number(s.expires_at) || 0
  if (e && e < 1e12) e *= 1000
  if (!e && s.access_token) {
    try {
      const p = JSON.parse(atob(String(s.access_token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      e = (Number(p.exp) || 0) * 1000
    } catch (x) {}
  }
  return e
}

export function isFresh(s, margin = 0) { return !!s && expiresAt(s) - Date.now() > margin }

function syncLive(s) {
  if (live && s) Object.assign(live, s)
}
function emit(name, detail) {
  try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch (e) {}
}

// صفحه اصلی شیء نشستش را این‌جا می‌سپارد تا با هر تمدید، همان شیء توکن تازه بگیرد
export function bindSession(s) {
  live = s || null
  if (live) { const cur = read(); if (cur && cur.access_token !== live.access_token && cur.user && live.user && cur.user.id === live.user.id) syncLive(cur) }
}

async function doRefresh(force) {
  const s = read()
  if (!s || !s.refresh_token) return s
  if (!force && isFresh(s, EARLY_MS)) { syncLive(s); return s }
  let res = null, data = null
  try {
    res = await fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    })
    data = await res.json().catch(() => null)
  } catch (e) {
    return s
  }
  if (res && res.ok && data && data.access_token) {
    const next = {
      ...s,
      access_token: data.access_token,
      refresh_token: data.refresh_token || s.refresh_token,
      expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
      user: data.user || s.user,
    }
    write(next)
    syncLive(next)
    emit('tl-session', next)
    return next
  }
  // شاید زبانه دیگری همین الان تمدید کرده و توکن تمدید قبلی باطل شده
  const again = read()
  if (again && again.access_token !== s.access_token && isFresh(again)) { syncLive(again); emit('tl-session', again); return again }
  if (res && (res.status === 400 || res.status === 401) && !isFresh(s)) {
    emit('tl-session-dead', null)
    return null
  }
  return s
}

// تمدید در صورت نیاز؛ force برای وقتی که سرور توکن را رد کرده است
export function refreshSession(force = false) {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (inflight) return inflight
  const run = () => doRefresh(force)
  const locked = (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request)
    ? navigator.locks.request('tl-session-refresh', run)
    : run()
  inflight = Promise.resolve(locked).catch(() => read()).finally(() => { inflight = null; schedule() })
  return inflight
}

// توکن آماده برای درخواست؛ اگر نزدیک پایان باشد اول تمدید می‌شود
export async function getToken() {
  const s = read()
  if (!s) return null
  if (isFresh(s, 60 * 1000)) return s.access_token
  const n = await refreshSession()
  return (n && n.access_token) || null
}

function schedule() {
  if (typeof window === 'undefined' || !keeperStarted) return
  if (timer) clearTimeout(timer)
  const s = read()
  if (!s || !s.refresh_token) return
  const wait = Math.max(MIN_DELAY_MS, expiresAt(s) - Date.now() - EARLY_MS)
  timer = setTimeout(() => refreshSession(), Math.min(wait, 2147483000))
}

// یک بار برای کل سایت؛ در layout اجرا می‌شود
export function startSessionKeeper() {
  if (typeof window === 'undefined' || keeperStarted) return () => {}
  keeperStarted = true
  const wake = () => { if (document.visibilityState !== 'hidden') refreshSession() }
  const onStorage = (e) => {
    if (e.key !== KEY) return
    const s = read()
    if (s) { syncLive(s); emit('tl-session', s); schedule() }
  }
  document.addEventListener('visibilitychange', wake)
  window.addEventListener('focus', wake)
  window.addEventListener('online', wake)
  window.addEventListener('storage', onStorage)
  refreshSession()
  return () => {
    keeperStarted = false
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', wake)
    window.removeEventListener('focus', wake)
    window.removeEventListener('online', wake)
    window.removeEventListener('storage', onStorage)
  }
}

// برای صفحه‌های جدا: تا توکن تازه نشده، محتوایی که داده می‌خواهد ساخته نشود
export function useSessionReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (ready) return
    const s = read()
    if (!s || !s.refresh_token || isFresh(s, 60 * 1000)) { setReady(true); return }
    let alive = true
    const done = () => { if (alive) setReady(true) }
    const t = setTimeout(done, 6000)
    refreshSession().then(done, done)
    return () => { alive = false; clearTimeout(t) }
  }, [ready])
  return ready
}
