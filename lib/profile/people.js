'use client'
// ─────────────────────────────────────────────────────────────
//  آدم‌ها: پروفایل عمومی، کارت عمومی، ویرایش پروفایل خودم، حریم خصوصی و عکس پروفایل
//
//  همه داده از تابع‌های امن دیتابیس می‌آید و همان‌جا طبق تنظیم حریم خصوصی هر نفر فیلتر می‌شود:
//   public_profile، public_cards، leaderboard_cards، update_my_profile، set_my_privacy
//  این فایل هیچ ستونی از جدول profiles دیگران را مستقیم نمی‌خواند.
//
//  کارت عمومی یک شکل دارد و همه‌جای سایت همین را نشان می‌دهند:
//   { id, name, emoji, photo, preset, level, public }
//  id برای پروفایل خصوصی در فهرست نظرها نمی‌آید، پس آن نفر قابل باز کردن نیست.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

export const AVATAR_BUCKET = 'avatars'
export const PHOTO_MAX_BYTES = 512 * 1024
export const PRIVACY_KEYS = ['profile_public', 'show_name', 'show_photo', 'show_stats', 'show_badges', 'show_clan', 'show_email']
export const PRIVACY_DEFAULTS = { profile_public: true, show_name: true, show_photo: true, show_stats: true, show_badges: true, show_clan: true, show_email: false }

function token() {
  const s = getSession()
  return (s && s.access_token) || null
}

export function rpc(name, body, tk) {
  const t = tk === undefined ? token() : tk
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (t || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

export function privacyOf(p) {
  const o = { ...PRIVACY_DEFAULTS }
  if (p && typeof p === 'object') PRIVACY_KEYS.forEach(k => { if (typeof p[k] === 'boolean') o[k] = p[k] })
  return o
}

// ── خواندن ───────────────────────────────────────────────
export function fetchPublicProfile(id) {
  if (!id) return Promise.resolve({ ok: false, error: 'missing' })
  if (!token()) return Promise.resolve({ ok: false, error: 'auth' })
  return rpc('public_profile', { p_id: id }).then(r => r || { ok: false, error: 'network' })
}

export function fetchCards(ids) {
  const list = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 100)
  if (!list.length || !token()) return Promise.resolve({})
  return rpc('public_cards', { p_ids: list }).then(r => {
    const m = {}
    if (Array.isArray(r)) r.forEach(c => { if (c && c.id) m[c.id] = c })
    return m
  })
}

export function fetchLeaderboardCards(scope, region, limit = 50) {
  return rpc('leaderboard_cards', { p_scope: scope, p_region: region || null, p_limit: limit }).then(r => (Array.isArray(r) ? r : null))
}

// ── کارت خودم: یک منبع برای همه جاهای سایت ─────────────────
// هر بار پروفایل عوض شود، همه جاهایی که چهره یا نام من را نشان می‌دهند خودکار تازه می‌شوند.
let meState = null
let meAt = 0
let meInflight = null
const subs = new Set()
const emit = () => subs.forEach(f => { try { f(meState) } catch (e) {} })

export function loadMe(force = false) {
  const s = getSession()
  const uid = s && s.user && s.user.id
  if (!uid) { meState = null; emit(); return Promise.resolve(null) }
  if (!force && meState && meState.id === uid && Date.now() - meAt < 60e3) return Promise.resolve(meState)
  if (meInflight) return meInflight
  meInflight = Promise.all([
    rpc('public_profile', { p_id: uid }),
    fetch(SB_URL + '/rest/v1/profiles?id=eq.' + uid + '&select=id,display_name,avatar_path,avatar_preset,bio,city,privacy,created_at,xp,level,streak', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]).then(([pub, rows]) => {
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null
    if (pub && pub.ok) {
      // عکس خودم را همیشه می‌بینم، حتی وقتی برای دیگران پنهانش کرده‌ام
      const ownPhoto = row && row.avatar_path ? photoUrl(row.avatar_path) : null
      meState = {
        id: uid,
        email: (s.user && s.user.email) || '',
        card: { ...pub.card, photo: ownPhoto || pub.card.photo || null },
        publicCard: pub.card,
        profile: pub,
        row,
        privacy: privacyOf(pub.privacy),
        nameConfirmed: !!(pub.privacy && pub.privacy.name_confirmed),
      }
      meAt = Date.now()
    }
    meInflight = null
    emit()
    return meState
  }).catch(() => { meInflight = null; return meState })
  return meInflight
}

export function useMe() {
  const [me, setMe] = useState(meState)
  useEffect(() => {
    const f = (v) => setMe(v)
    subs.add(f)
    loadMe(false).then(v => setMe(v))
    return () => { subs.delete(f) }
  }, [])
  return me
}

export function photoUrl(path) {
  return path ? SB_URL + '/storage/v1/object/public/' + AVATAR_BUCKET + '/' + path : null
}

// ── نوشتن ────────────────────────────────────────────────
export const PROFILE_ERRORS = {
  auth: 'دوباره وارد شو و امتحان کن',
  input: 'چیزی درست فرستاده نشد؛ دوباره امتحان کن',
  name_len: 'نام باید بین ۲ تا ۳۰ حرف باشد',
  name_chars: 'نام نمی‌تواند پیوند، ایمیل یا نشانه‌های < > { } داشته باشد',
  bio_len: 'درباره من حداکثر ۱۶۰ حرف است',
  bio_links: 'در «درباره من» پیوند یا آیدی نگذار',
  city: 'این شهر در فهرست نیست',
  emoji: 'این چهره قابل استفاده نیست',
  preset: 'این آواتار پیدا نشد',
  photo_path: 'عکس ذخیره نشد؛ دوباره امتحان کن',
  photo_missing: 'عکس هنوز بالا نرفته؛ دوباره امتحان کن',
  network: 'اتصال برقرار نشد؛ دوباره امتحان کن',
}

export async function updateMyProfile(patch) {
  const r = await rpc('update_my_profile', { p: patch })
  if (r && r.ok) await loadMe(true)
  return r || { ok: false, error: 'network' }
}

export async function setMyPrivacy(patch) {
  const r = await rpc('set_my_privacy', { p: patch })
  if (r && r.ok) await loadMe(true)
  return r || { ok: false, error: 'network' }
}

// ── عکس پروفایل ──────────────────────────────────────────
// عکس در مرورگر مربع و 512 پیکسل می‌شود و دوباره ساخته می‌شود؛ پس اطلاعات پنهان عکس (مکان، دوربین، تاریخ) هیچ‌وقت بالا نمی‌رود.
export async function prepareAvatar(file) {
  if (!file) throw new Error('no_file')
  if (!/^image\//.test(file.type || '')) throw new Error('type')
  if (file.size > 15 * 1024 * 1024) throw new Error('too_big')
  const src = await loadImage(file)
  const S = 512
  const w = src.width, h = src.height
  if (!w || !h) throw new Error('decode')
  const side = Math.min(w, h)
  const sx = (w - side) / 2, sy = (h - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src.img, sx, sy, side, side, 0, 0, S, S)
  if (src.close) src.close()
  let blob = await toBlob(canvas, 'image/webp', 0.86)
  let ext = 'webp'
  if (!blob || blob.type !== 'image/webp') { blob = await toBlob(canvas, 'image/jpeg', 0.88); ext = 'jpg' }
  if (!blob) throw new Error('encode')
  if (blob.size > PHOTO_MAX_BYTES) {
    blob = await toBlob(canvas, 'image/jpeg', 0.72); ext = 'jpg'
    if (!blob || blob.size > PHOTO_MAX_BYTES) throw new Error('too_big')
  }
  return { blob, ext, preview: canvas.toDataURL(ext === 'webp' ? 'image/webp' : 'image/jpeg', 0.8) }
}

function toBlob(canvas, type, q) {
  return new Promise(res => { try { canvas.toBlob(b => res(b), type, q) } catch (e) { res(null) } })
}

async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { img: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close && bmp.close() }
    } catch (e) {}
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    return { img, width: img.naturalWidth, height: img.naturalHeight }
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0) }
}

function randomName(n = 16) {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const a = new Uint32Array(n)
  crypto.getRandomValues(a)
  return Array.from(a, x => abc[x % abc.length]).join('')
}

function storageHeaders(extra) {
  return { apikey: SB_KEY, Authorization: 'Bearer ' + token(), ...(extra || {}) }
}

async function listMine(uid) {
  const r = await fetch(SB_URL + '/storage/v1/object/list/' + AVATAR_BUCKET, {
    method: 'POST', headers: storageHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix: uid, limit: 20, offset: 0 }),
  }).catch(() => null)
  const rows = r && r.ok ? await r.json().catch(() => []) : []
  return (Array.isArray(rows) ? rows : []).map(o => uid + '/' + o.name).filter(n => /\.(webp|jpe?g|png)$/i.test(n))
}

export async function removeStoredPhoto(path) {
  if (!path) return false
  const uid = (getSession() || {}).user?.id
  if (!uid || !path.startsWith(uid + '/')) return false
  const r = await fetch(SB_URL + '/storage/v1/object/' + AVATAR_BUCKET + '/' + path, { method: 'DELETE', headers: storageHeaders() }).catch(() => null)
  return !!(r && r.ok)
}

// فایل‌های جامانده قبلی را پاک می‌کند تا سقف چهار فایل پر نماند
async function sweep(uid, keep) {
  const names = await listMine(uid)
  await Promise.all(names.filter(n => n !== keep).map(n => removeStoredPhoto(n)))
}

export async function uploadAvatar(prepared) {
  const s = getSession()
  const uid = s && s.user && s.user.id
  if (!uid || !prepared) return { ok: false, error: 'auth' }
  const path = uid + '/' + randomName(16) + '.' + prepared.ext
  const put = () => fetch(SB_URL + '/storage/v1/object/' + AVATAR_BUCKET + '/' + path, {
    method: 'POST',
    headers: storageHeaders({ 'Content-Type': prepared.blob.type, 'x-upsert': 'false', 'cache-control': '31536000' }),
    body: prepared.blob,
  }).catch(() => null)
  let r = await put()
  if (!r || !r.ok) {
    // شاید سقف فایل‌ها پر شده؛ جامانده‌ها را پاک کن و یک بار دیگر
    const cur = meState && meState.row ? meState.row.avatar_path : null
    await sweep(uid, cur)
    r = await put()
  }
  if (!r || !r.ok) return { ok: false, error: 'upload' }
  const res = await updateMyProfile({ avatar_path: path, avatar_preset: null })
  if (!res.ok) { await removeStoredPhoto(path); return res }
  if (res.old_path) removeStoredPhoto(res.old_path)
  return { ok: true, path }
}

export async function clearAvatar(preset = null) {
  const old = meState && meState.row ? meState.row.avatar_path : null
  const res = await updateMyProfile({ avatar_path: null, avatar_preset: preset })
  if (res.ok && (res.old_path || old)) removeStoredPhoto(res.old_path || old)
  return res
}

// ── دانلود داده‌های خودم ─────────────────────────────────
export async function exportMyData() {
  const s = getSession()
  const uid = s && s.user && s.user.id
  if (!uid) return null
  const h = { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token }
  const get = (q) => fetch(SB_URL + '/rest/v1/' + q, { headers: h }).then(r => (r.ok ? r.json() : [])).catch(() => [])
  const [profile, checkins, xp, awards, favorites, quests, clans] = await Promise.all([
    get('profiles?id=eq.' + uid + '&select=*'),
    get('checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,district)&order=created_at.desc&limit=2000'),
    get('xp_history?user_id=eq.' + uid + '&select=amount,reason,resulting_xp,created_at&order=created_at.desc&limit=2000'),
    get('awards?user_id=eq.' + uid + '&select=kind,code,title,rarity,source,earned_at&order=earned_at.desc'),
    get('favorites?user_id=eq.' + uid + '&select=cafe_id,created_at'),
    get('quest_progress?user_id=eq.' + uid + '&select=quest_id,progress,completed,completed_at'),
    get('clan_history?user_id=eq.' + uid + '&select=clan_name,event_type,detail,created_at&order=created_at.desc'),
  ])
  return {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: (s.user && s.user.email) || null },
    profile: Array.isArray(profile) ? profile[0] || null : null,
    checkins, xp_history: xp, awards, favorites, quest_progress: quests, clan_history: clans,
  }
}
