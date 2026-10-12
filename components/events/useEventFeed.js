'use client'
// خوراک مشترک رویدادها. نوار رویداد، داشبورد و هر جای دیگر از همین‌جا می‌خوانند و فقط یک درخواست می‌رود.
//
// چطور کار می‌کند:
//   1. رتبه‌بندی در دیتابیس انجام می‌شود (تابع event_feed). مرورگر فقط ۱۲ یا ۸ مورد برتر را می‌گیرد، نه همه را.
//   2. اگر آن تابع در دسترس نبود، به خواندن مستقیم quests برمی‌گردد تا چیزی خراب نشود.
//   3. با هر تغییر جدول quests، همه خوراک‌ها با تاخیر کوتاه تازه می‌شوند.
//   4. هر جایگاه (slot) سقف و ترتیب خودش را در دیتابیس دارد: bar، dashboard، list.
//
// برای عوض کردن قاعده «کدام رویدادها نشان داده شوند» فقط تابع event_feed را در دیتابیس عوض کن.
import { useEffect, useRef, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession, subscribeToChanges } from '@/lib/game/gameSystem'
import { normEvent } from '@/lib/events/format'

const STALE_MS = 25000
const cache = {}      // key → { rows, at, inflight }
const watchers = {}   // key → Set(callback)
let unsubRealtime = null
let watcherCount = 0

function headers() {
  const s = getSession()
  return { apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY), 'Content-Type': 'application/json' }
}

async function fetchFeed(slot, limit, pos) {
  const body = { p_slot: slot, p_limit: limit, p_lat: pos ? pos.lat : null, p_lng: pos ? pos.lng : null }
  try {
    const r = await fetch(SB_URL + '/rest/v1/rpc/event_feed', { method: 'POST', headers: headers(), body: JSON.stringify(body) })
    if (r.ok) {
      const rows = await r.json()
      if (Array.isArray(rows)) return rows.map(normEvent)
    }
  } catch (e) {}
  // برگشت امن: خواندن مستقیم
  try {
    const now = new Date().toISOString()
    const url = SB_URL + '/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.' + now + ')&select=id,title,description,icon,art_key,category,reward_label,reward_xp,discount_pct,target_count,ends_at,cafe_id,cafes(name,district,lat,lng),collectible_defs(title,icon,rarity)&order=created_at.desc&limit=' + limit
    const r = await fetch(url, { headers: headers() })
    const rows = r.ok ? await r.json() : []
    return (Array.isArray(rows) ? rows : []).map(x => normEvent({ ...x, lat: x.cafes && x.cafes.lat, lng: x.cafes && x.cafes.lng }))
  } catch (e) {}
  return []
}

function load(key, slot, limit, getPos, force) {
  const c = cache[key] || (cache[key] = { rows: [], at: 0, inflight: null, getPos: null })
  if (getPos) c.getPos = getPos
  if (c.inflight) return c.inflight
  if (!force && Date.now() - c.at < STALE_MS) return Promise.resolve(c.rows)
  const gp = getPos || c.getPos
  c.inflight = fetchFeed(slot, limit, gp ? gp() : null).then(rows => {
    c.rows = rows; c.at = Date.now(); c.inflight = null
    ;(watchers[key] || []).forEach(cb => cb(rows))
    return rows
  }).catch(() => { c.inflight = null; return c.rows })
  return c.inflight
}

function startRealtime() {
  if (unsubRealtime) return
  unsubRealtime = subscribeToChanges(['quests'], () => {
    Object.keys(watchers).forEach(key => {
      if (!watchers[key] || watchers[key].size === 0) return
      const [slot, limit] = key.split(':')
      load(key, slot, Number(limit), null, true)
    })
  })
}

// slot: 'bar' | 'dashboard' | 'list'. getPos: () => ({lat, lng}) | null، هنگام هر درخواست خوانده می‌شود
export function useEventFeed({ slot = 'bar', limit = 12, getPos, enabled = true } = {}) {
  const key = slot + ':' + limit
  const [events, setEvents] = useState(() => (cache[key] ? cache[key].rows : []))
  const [ready, setReady] = useState(() => !!(cache[key] && cache[key].at))
  const posRef = useRef(getPos)
  posRef.current = getPos

  useEffect(() => {
    if (!enabled) return
    let alive = true
    const cb = (rows) => { if (alive) { setEvents(rows); setReady(true) } }
    if (!watchers[key]) watchers[key] = new Set()
    watchers[key].add(cb)
    watcherCount++
    startRealtime()
    load(key, slot, limit, () => (posRef.current ? posRef.current() : null), false).then(rows => { if (alive) { setEvents(rows); setReady(true) } })
    // تازه‌سازی دوره‌ای، تا پایان‌یافته‌ها و تازه‌رسیده‌ها بدون رفرش اثر کنند
    const t = setInterval(() => { load(key, slot, limit, () => (posRef.current ? posRef.current() : null), true) }, 60000)
    return () => {
      alive = false; clearInterval(t)
      watchers[key].delete(cb); watcherCount--
      if (watcherCount <= 0 && unsubRealtime) { unsubRealtime(); unsubRealtime = null; watcherCount = 0 }
    }
  }, [key, enabled, slot, limit])

  return { events, ready }
}
