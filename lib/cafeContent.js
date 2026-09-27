// Café page content — photo gallery and menu — shared by the café popup
// (read-only, for everyone) and the business panel (editing, for the café's
// verified owner and the app owner).
//
// Who may write is decided in the database: RLS on cafe_photos /
// cafe_menu_items and Storage policies on the cafe-photos bucket all go
// through can_manage_cafe(). Nothing here is trusted for security.

import { SB_URL, SB_KEY } from '@/lib/config'

const BUCKET = 'cafe-photos'
const MAX_BYTES = 2 * 1024 * 1024   // must match the bucket's file_size_limit

const headers = (token, extra) => ({
  apikey: SB_KEY,
  Authorization: 'Bearer ' + (token || SB_KEY),
  ...(extra || {}),
})

async function json(res) {
  const txt = await res.text()
  let body = null
  try { body = txt ? JSON.parse(txt) : null } catch (e) { body = null }
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || ('HTTP ' + res.status)
    const err = new Error(msg); err.status = res.status; err.body = body
    throw err
  }
  return body
}

// ── read ────────────────────────────────────────────────────────────────────
export function photoUrl(storagePath) {
  return SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + storagePath.split('/').map(encodeURIComponent).join('/')
}

export async function listPhotos(cafeId) {
  const res = await fetch(SB_URL + '/rest/v1/cafe_photos?cafe_id=eq.' + cafeId +
    '&select=id,storage_path,caption,sort,created_at&order=sort.asc,id.asc', { headers: headers() })
  const rows = await json(res)
  return Array.isArray(rows) ? rows : []
}

export async function listMenu(cafeId) {
  const res = await fetch(SB_URL + '/rest/v1/cafe_menu_items?cafe_id=eq.' + cafeId +
    '&select=id,section,name,description,price_toman,is_available,sort&order=section.asc,sort.asc,id.asc', { headers: headers() })
  const rows = await json(res)
  return Array.isArray(rows) ? rows : []
}

// Menu rows grouped by section, keeping the first-seen section order.
export function groupMenu(items) {
  const order = []; const map = {}
  for (const it of items || []) {
    const k = (it.section || '').trim()
    if (!map[k]) { map[k] = []; order.push(k) }
    map[k].push(it)
  }
  return order.map(k => ({ section: k, items: map[k] }))
}

export function formatToman(n) {
  if (n === null || n === undefined || n === '') return ''
  return Number(n).toLocaleString('fa') + ' تومان'
}

// The signed-in user's own rewards at one café (RLS: own rows only).
export async function listMyCafeRewards(cafeId, uid, token) {
  if (!uid || !token) return { codes: [], completed: [] }
  const h = headers(token)
  const [codes, completed] = await Promise.all([
    fetch(SB_URL + '/rest/v1/redemptions?user_id=eq.' + uid +
      '&select=id,code,reward_label,status,issued_at,redeemed_at,expires_at,quests!inner(title,icon,discount_pct,cafe_id)' +
      '&quests.cafe_id=eq.' + cafeId + '&order=issued_at.desc', { headers: h }).then(json),
    fetch(SB_URL + '/rest/v1/quest_progress?user_id=eq.' + uid + '&completed=eq.true' +
      '&select=quest_id,completed_at,quests!inner(title,icon,reward_label,reward_xp,cafe_id)' +
      '&quests.cafe_id=eq.' + cafeId + '&order=completed_at.desc', { headers: h }).then(json),
  ])
  return { codes: Array.isArray(codes) ? codes : [], completed: Array.isArray(completed) ? completed : [] }
}

// ── photos: write ───────────────────────────────────────────────────────────
// Resize to at most 1600 px and re-encode (WebP where the browser can, else
// JPEG) so every photo fits the 2 MB bucket limit and loads fast on mobile.
export async function compressImage(file) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not_an_image')
  const bmp = await createImageBitmap(file)
  const attempts = [[1600, 0.82], [1600, 0.7], [1280, 0.7], [1024, 0.65]]
  for (const [maxSide, q] of attempts) {
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    let blob = await new Promise(r => canvas.toBlob(r, 'image/webp', q))
    let ext = 'webp'
    if (!blob || blob.type !== 'image/webp') { blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q)); ext = 'jpg' }
    if (blob && blob.size <= MAX_BYTES) { if (bmp.close) bmp.close(); return { blob, ext, type: blob.type } }
  }
  if (bmp.close) bmp.close()
  throw new Error('too_large')
}

function randomName() {
  const a = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random()
  return a.replace(/[^0-9A-Za-z]/g, '').slice(0, 24)
}

// Upload the file, then add its row. If the row fails, the file is removed again.
export async function uploadPhoto(cafeId, file, token, caption) {
  const { blob, ext, type } = await compressImage(file)
  const path = cafeId + '/' + randomName() + '.' + ext
  const up = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST', headers: headers(token, { 'Content-Type': type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' }), body: blob,
  })
  await json(up)
  try {
    const res = await fetch(SB_URL + '/rest/v1/cafe_photos', {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ cafe_id: cafeId, storage_path: path, caption: (caption || '').slice(0, 140) || null }),
    })
    const rows = await json(res)
    return Array.isArray(rows) ? rows[0] : rows
  } catch (e) {
    await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + path, { method: 'DELETE', headers: headers(token) }).catch(() => {})
    throw e
  }
}

export async function updatePhotoCaption(id, caption, token) {
  const res = await fetch(SB_URL + '/rest/v1/cafe_photos?id=eq.' + id, {
    method: 'PATCH',
    headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ caption: (caption || '').slice(0, 140) || null }),
  })
  await json(res)
}

// Row first (so the gallery never shows a broken image), then the file.
export async function deletePhoto(photo, token) {
  const res = await fetch(SB_URL + '/rest/v1/cafe_photos?id=eq.' + photo.id, {
    method: 'DELETE', headers: headers(token, { Prefer: 'return=minimal' }),
  })
  await json(res)
  await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + photo.storage_path, {
    method: 'DELETE', headers: headers(token),
  }).catch(() => {})
}

// ── menu: write ─────────────────────────────────────────────────────────────
function cleanMenuItem(it) {
  const price = it.price_toman === '' || it.price_toman === null || it.price_toman === undefined
    ? null : Math.max(0, Math.round(Number(latinDigits(it.price_toman).replace(/[^0-9]/g, '')) || 0))
  return {
    section: (it.section || '').trim().slice(0, 40),
    name: (it.name || '').trim().slice(0, 80),
    description: (it.description || '').trim().slice(0, 200) || null,
    price_toman: price,
    is_available: it.is_available !== false,
  }
}

export async function saveMenuItem(cafeId, item, token) {
  const body = cleanMenuItem(item)
  const res = item.id
    ? await fetch(SB_URL + '/rest/v1/cafe_menu_items?id=eq.' + item.id, {
        method: 'PATCH', headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }), body: JSON.stringify(body),
      })
    : await fetch(SB_URL + '/rest/v1/cafe_menu_items', {
        method: 'POST', headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }), body: JSON.stringify({ ...body, cafe_id: cafeId }),
      })
  const rows = await json(res)
  return Array.isArray(rows) ? rows[0] : rows
}

export async function deleteMenuItem(id, token) {
  const res = await fetch(SB_URL + '/rest/v1/cafe_menu_items?id=eq.' + id, {
    method: 'DELETE', headers: headers(token, { Prefer: 'return=minimal' }),
  })
  await json(res)
}

// Persian digits → Latin, for price inputs typed on a Persian keyboard.
export function latinDigits(s) {
  return String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
}
