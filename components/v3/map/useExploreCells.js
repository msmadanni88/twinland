'use client'
// لایه «کشف نقشه» — نسخه v3.0، فاز یکم
//
// قاعده‌ها:
//   - نقشه پایه دست نمی‌خورد. هیچ تیرگی، ته‌رنگ یا رنگ‌زدایی روی کل نقشه نیست.
//   - خانه کشف‌شده: خانه‌ای که دست‌کم یک چک‌این تو در آن است. پر شدن خیلی کم‌رنگ و یک مرز پیوسته دور کل قلمرو.
//   - مرز کشف: فقط خانه‌های همسایه‌ای که مکان سرنزده دارند، با خط‌چین روان. همسایه خالی کشیده نمی‌شود.
//   - کشف بعدی: اگر همسایه پری نبود، نزدیک‌ترین خانه‌های دارای مکان سرنزده تا حدود 800 متر، حداکثر 3 تا.
//   - پایگاه: خانه اولین چک‌این، فقط برای خود کاربر.
//
// منبع حقیقت سرور است: تابع my_explore کلید خانه‌ها را از روی چک‌این‌ها برمی‌گرداند، پس با غیرفعال یا جابه‌جا شدن
// یک مکان، پیشرفت کاربر از بین نمی‌رود. در حالت نمایشی یا بدون ورود، همین حساب از روی چک‌این‌های محلی انجام می‌شود.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { cellCenter, cellCorners, cellDistanceM, cellKeyOf, neighborKey, neighborKeys } from '@/components/v3/map/hexGrid'

const PANE = 'tl3-cells'
const FAR_M = 800
const FAR_MAX = 3
// رنگ قلمرو برای هر پوسته نقشه. پوسته ساده رنگ تأکیدی پالت را می‌گیرد
const INK = {
  parchment: '#8a4b14',
  ember: '#ffc46b',
  toon: '#1f7a3a',
  sketch: '#2d2d2d',
  // پوسته مینیمال نسخه v4.0 در دو حالت روشن و تیره؛ قلمرو هم سیاه و سفید
  'v4-mini-light': '#1c1c1f',
  'v4-mini-dark': '#e9e9ec',
}
// رنگ امضای کشف روی پوسته ساده: رنگ تأکیدی پالت اگر به اندازه کافی رنگی باشد، وگرنه فیروزه‌ای
function saturation(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!m) return 0
  const n = parseInt(m[1], 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1))
}
export function exploreInk(C, skinId) {
  if (INK[skinId]) return INK[skinId]
  const dark = C && C.mode === 'dark'
  return C && saturation(C.accent) >= 0.45 ? C.accent : (dark ? '#2dd4bf' : '#0f9d8a')
}

// پله‌های نشان منطقه، همان تابع tl_milestone_steps در سرور
export const milestoneSteps = (total) => (total < 10 ? [100] : [10, 25, 50, 75, 90])

export function useExploreCells({ C, cafes, checkedIn, enabled, mapInst, mapLoading, session, skinId, offline = false }) {
  const [server, setServer] = useState(null)
  const [tick, setTick] = useState(0)
  const layersRef = useRef(null)
  const shownRef = useRef(null)          // خانه‌هایی که بار قبل کشیده شدند، برای انیمیشن خانه تازه
  const armedRef = useRef(false)         // انیمیشن خانه تازه فقط بعد از بار اول، نه وقتی داده سرور می‌رسد
  const token = session && session.access_token
  const uid = session && session.user && session.user.id

  const refresh = useCallback(() => setTick(t => t + 1), [])

  // داده سرور
  useEffect(() => {
    if (!enabled || offline || !uid || !token) { setServer(null); return }
    let alive = true
    fetch(SB_URL + '/rest/v1/rpc/my_explore', { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive && j && Array.isArray(j.cells)) setServer(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [enabled, offline, uid, token, tick])

  // مکان‌ها به تفکیک خانه
  const placeCells = useMemo(() => {
    const m = new Map()
    if (!enabled) return m
    for (const c of cafes) {
      if (c.lat == null || c.lng == null) continue
      const k = cellKeyOf(Number(c.lat), Number(c.lng))
      let e = m.get(k)
      if (!e) { e = { total: 0, fresh: 0 }; m.set(k, e) }
      e.total++
      if (!checkedIn.has(c.id)) e.fresh++
    }
    return m
  }, [enabled, cafes, checkedIn])

  const state = useMemo(() => {
    const explored = new Set(), frontier = new Set(), far = new Set()
    let base = null
    if (!enabled) return { explored, frontier, far, base }
    if (server && !offline) {
      server.cells.forEach(c => c && c.k && explored.add(c.k))
      base = server.base || null
    }
    // چک‌این تازه‌ای که هنوز در جواب سرور نیامده، یا حالت نمایشی
    for (const c of cafes) {
      if (checkedIn.has(c.id) && c.lat != null && c.lng != null) explored.add(cellKeyOf(Number(c.lat), Number(c.lng)))
    }
    if (!base && explored.size) base = explored.values().next().value
    explored.forEach(k => {
      neighborKeys(k).forEach(n => {
        if (explored.has(n)) return
        const e = placeCells.get(n)
        if (e && e.fresh > 0) frontier.add(n)
      })
    })
    // جزیره‌ها: اگر مرز کشف کم است، نزدیک‌ترین کشف‌های بعدی
    if (explored.size && frontier.size < 2) {
      const cand = []
      placeCells.forEach((e, k) => {
        if (e.fresh <= 0 || explored.has(k) || frontier.has(k)) return
        let best = Infinity
        explored.forEach(x => { const d = cellDistanceM(x, k); if (d < best) best = d })
        if (best <= FAR_M) cand.push([best, k])
      })
      cand.sort((a, b) => a[0] - b[0]).slice(0, FAR_MAX - frontier.size).forEach(c => far.add(c[1]))
    }
    return { explored, frontier, far, base }
  }, [enabled, offline, server, cafes, checkedIn, placeCells])

  // پیشرفت منطقه: منطقه آخرین چک‌این، وگرنه منطقه‌ای که بیشترین سر زدن را دارد
  const progress = useMemo(() => {
    if (!enabled) return null
    const tot = new Map(), seen = new Map()
    for (const c of cafes) {
      if (!c.district) continue
      tot.set(c.district, (tot.get(c.district) || 0) + 1)
      if (checkedIn.has(c.id)) seen.set(c.district, (seen.get(c.district) || 0) + 1)
    }
    let d = server && !offline && server.last_district && tot.has(server.last_district) ? server.last_district : null
    if (!d) { let b = 0; seen.forEach((n, k) => { if (n > b) { b = n; d = k } }) }
    if (!d) return { district: null, seen: 0, total: 0, pct: 0, next: null, reached: [], cells: state.explored.size, frontier: state.frontier.size + state.far.size }
    const total = tot.get(d) || 0, s = seen.get(d) || 0
    const steps = milestoneSteps(total)
    const fromServer = new Set(((server && server.milestones) || []).filter(m => m.d === d).map(m => Number(m.p)))
    const reached = steps.filter(p => fromServer.has(p) || s * 100 >= p * total)
    const nextPct = steps.find(p => !reached.includes(p)) || null
    const next = nextPct ? { pct: nextPct, need: Math.max(1, Math.ceil(nextPct * total / 100) - s) } : null
    // پیشرفت حلقه: از نشان قبلی تا نشان بعدی
    const prevPct = reached.length ? reached[reached.length - 1] : 0
    const ring = next ? Math.min(1, Math.max(0, (s * 100 / total - prevPct) / (nextPct - prevPct))) : 1
    return { district: d, seen: s, total, pct: total ? Math.round(s * 100 / total) : 0, next, reached, ring, cells: state.explored.size, frontier: state.frontier.size + state.far.size }
  }, [enabled, offline, server, cafes, checkedIn, state])

  // رسم
  useEffect(() => {
    const map = mapInst.current, L = typeof window !== 'undefined' && window.L
    const clear = () => { if (layersRef.current) { layersRef.current.forEach(l => { try { l.remove() } catch (e) {} }); layersRef.current = null } }
    if (!enabled || mapLoading || !map || !L) { clear(); return }
    let pane = map.getPane(PANE)
    if (!pane) {
      pane = map.createPane(PANE)
      pane.style.zIndex = 350          // بالای کاشی‌ها، زیر مرزها و پین‌ها
      pane.style.pointerEvents = 'none'
    }
    const ink = exploreInk(C, skinId)
    pane.style.setProperty('--tl3-ink', ink)
    const syncZoom = () => pane.classList.toggle('tl3-far-zoom', map.getZoom() < 12.5)
    syncZoom()
    map.on('zoomend', syncZoom)

    const renderer = L.svg({ pane: PANE, padding: 0.6 })
    const ex = [...state.explored]
    const prev = shownRef.current
    const fresh = prev && armedRef.current ? ex.filter(k => !prev.has(k)) : []
    shownRef.current = new Set(ex)
    const layers = []
    const poly = (keys, o) => L.polygon(keys.map(k => [cellCorners(k)]), { pane: PANE, renderer, interactive: false, ...o })

    if (ex.length) {
      // پر شدن کم‌رنگ قلمرو، با خط بسیار محو بین خانه‌ها تا ساختار شش‌ضلعی حس شود
      layers.push(poly(ex, { color: ink, weight: 0.7, opacity: 0.18, fillColor: ink, fillOpacity: 0.1, className: 'tl3-cell' }))
      // مرز بیرونی قلمرو: فقط ضلع‌هایی که همسایه آن طرفشان کشف نشده
      const segs = []
      ex.forEach(k => {
        const cs = cellCorners(k)
        for (let i = 0; i < 6; i++) if (!state.explored.has(neighborKey(k, i))) segs.push([cs[i], cs[(i + 1) % 6]])
      })
      layers.push(L.polyline(segs, { pane: PANE, renderer, interactive: false, color: ink, weight: 7, opacity: 0.12, lineCap: 'round', lineJoin: 'round', className: 'tl3-edge-halo' }))
      layers.push(L.polyline(segs, { pane: PANE, renderer, interactive: false, color: ink, weight: 2, opacity: 0.85, lineCap: 'round', lineJoin: 'round', className: 'tl3-edge' }))
    }
    const fr = [...state.frontier], fa = [...state.far]
    if (fr.length) layers.push(poly(fr, { color: ink, weight: 1.6, opacity: 0.7, dashArray: '1 7', lineCap: 'round', fillColor: ink, fillOpacity: 0.03, className: 'tl3-frontier' }))
    if (fa.length) {
      layers.push(poly(fa, { color: ink, weight: 1.6, opacity: 0.6, dashArray: '1 7', lineCap: 'round', fillColor: ink, fillOpacity: 0.02, className: 'tl3-frontier tl3-frontier-far' }))
      // راهنمای کوچک برای جزیره‌ها: معلوم شود این خط‌چین دور، قدم بعدی است
      fa.forEach(k => layers.push(L.marker(cellCenter(k), { pane: PANE, interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="tl3-next-chip">کشف بعدی</div>' }) })))
    }
    if (fresh.length) layers.push(poly(fresh, { color: ink, weight: 2.4, opacity: 0, fillColor: ink, fillOpacity: 0, className: 'tl3-cell-fresh' }))
    if (state.base && state.explored.has(state.base)) {
      layers.push(poly([state.base], { color: ink, weight: 3, opacity: 0.95, fillOpacity: 0, className: 'tl3-base' }))
      layers.push(L.marker(cellCenter(state.base), { pane: PANE, interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="tl3-base-chip"><i></i>پایگاه</div>' }) }))
    }
    clear()
    layers.forEach(l => l.addTo(map))
    layersRef.current = layers
    return () => { map.off('zoomend', syncZoom); clear() }
  }, [enabled, mapLoading, mapInst, skinId, C && C.accent, state])

  useEffect(() => {
    if (!enabled || mapLoading) return
    const t = setTimeout(() => { armedRef.current = true }, 3000)
    return () => clearTimeout(t)
  }, [enabled, mapLoading])

  return { ...state, progress, refresh, open: state.explored.size, ink: exploreInk(C, skinId) }
}
