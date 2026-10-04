'use client'
// مه نقشه و باز شدن خانه‌های شش‌ضلعی — نسخه v3.0
// قاعده بازی:
//   - هر کافه‌ای که کاربر در آن چک‌این کرده، خانه خودش را کامل باز می‌کند.
//   - شش خانه دور هر خانه باز «نیمه‌پیدا» می‌شوند: مه نازک‌تر، تا معلوم شود قدم بعدی کجاست.
//   - بقیه نقشه زیر مه می‌ماند. پین کافه‌ها همیشه دیده می‌شود؛ فقط زمین زیرشان پوشیده است.
//   - پایگاه، خانه اولین چک‌این کاربر است.
// چیزی در دیتابیس ذخیره نمی‌شود: خانه‌های باز هر بار از روی چک‌این‌های واقعی حساب می‌شود.
import { useEffect, useMemo, useRef, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { CITIES } from '@/lib/constants'
import { HEX_NEIGHBORS, hexFromKey, hexKey, makeHexGrid } from '@/components/v3/map/hexGrid'

const PANE = 'tl3-fog'
// رنگ مه برای هر پوسته نقشه: fog رنگ، deep تیرگی مه کامل، half تیرگی خانه نیمه‌پیدا، line رنگ خط شبکه
const FOG = {
  parchment: { fog: '#4a3416', deep: 0.6, half: 0.28, line: '#6b4a1f' },
  ember:     { fog: '#04060d', deep: 0.72, half: 0.36, line: '#ffc46b' },
  toon:      { fog: '#ffffff', deep: 0.8, half: 0.42, line: '#2f7d32' },
  sketch:    { fog: '#efeadb', deep: 0.88, half: 0.5, line: '#3d3d3d' },
  plain:     { fog: '#1c2230', deep: 0.55, half: 0.26, line: '#1c2230' },
}
const WORLD = [[-85, -180], [-85, 180], [85, 180], [85, -180]]

export function useHexFog({ cafes, checkedIn, city, enabled, mapInst, mapLoading, session, showToast, skinId }) {
  const layersRef = useRef(null)
  const lastOpenRef = useRef(null)
  const [baseCafeId, setBaseCafeId] = useState(null)
  const uid = session && session.user && session.user.id
  const token = session && session.access_token

  const grid = useMemo(() => makeHexGrid(CITIES[city] || CITIES.tehran), [city])

  // پایگاه = کافه اولین چک‌این
  useEffect(() => {
    if (!enabled || !uid || !token) return
    let alive = true
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id&order=created_at.asc&limit=1', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows) && rows[0]) setBaseCafeId(rows[0].cafe_id) }).catch(() => {})
    return () => { alive = false }
  }, [enabled, uid, token, checkedIn.size > 0])

  // خانه‌های باز، نیمه‌پیدا و آمار کشف
  const state = useMemo(() => {
    const open = new Set(), ring = new Set(), withCafe = new Set()
    let base = null
    if (!enabled) return { open, ring, base, total: 0, found: 0 }
    for (const c of cafes) {
      if (c.lat == null || c.lng == null) continue
      const cell = grid.cellOf(Number(c.lat), Number(c.lng)), k = hexKey(cell[0], cell[1])
      withCafe.add(k)
      if (checkedIn.has(c.id)) open.add(k)
      if (baseCafeId && c.id === baseCafeId) base = k
    }
    open.forEach(k => {
      const [q, r] = hexFromKey(k)
      HEX_NEIGHBORS.forEach(n => { const nk = hexKey(q + n[0], r + n[1]); if (!open.has(nk)) ring.add(nk) })
    })
    let found = 0
    withCafe.forEach(k => { if (open.has(k)) found++ })
    return { open, ring, base, total: withCafe.size, found }
  }, [enabled, cafes, checkedIn, grid, baseCafeId])

  // رسم لایه‌ها
  useEffect(() => {
    const map = mapInst.current, L = typeof window !== 'undefined' && window.L
    const clear = () => { if (layersRef.current) { layersRef.current.forEach(l => { try { l.remove() } catch (e) {} }); layersRef.current = null } }
    if (!enabled || mapLoading || !map || !L) { clear(); return }
    if (!map.getPane(PANE)) {
      const pane = map.createPane(PANE)
      pane.style.zIndex = 350          // بالای کاشی‌ها، زیر مرزها و پین‌ها
      pane.style.pointerEvents = 'none'
    }
    const F = FOG[skinId] || FOG.parchment
    const renderer = L.svg({ pane: PANE, padding: 0.5 })
    const poly = (k) => { const [q, r] = hexFromKey(k); return grid.corners(q, r) }
    const openArr = [...state.open], ringArr = [...state.ring]
    const empty = openArr.length === 0
    const layers = []
    // مه کامل با سوراخ برای خانه‌های باز و نیمه‌پیدا
    layers.push(L.polygon([WORLD].concat(openArr.map(poly), ringArr.map(poly)), {
      pane: PANE, renderer, interactive: false, stroke: false, fillColor: F.fog, fillOpacity: empty ? F.deep * 0.55 : F.deep, fillRule: 'evenodd', className: 'tl3-fog-deep',
    }))
    if (ringArr.length) layers.push(L.polygon(ringArr.map(k => [poly(k)]), {
      pane: PANE, renderer, interactive: false, color: F.line, weight: 1, opacity: 0.45, dashArray: '3 5', fillColor: F.fog, fillOpacity: F.half, className: 'tl3-fog-ring',
    }))
    if (openArr.length) layers.push(L.polygon(openArr.map(k => [poly(k)]), {
      pane: PANE, renderer, interactive: false, color: F.line, weight: 1.6, opacity: 0.7, fillOpacity: 0, className: 'tl3-fog-open',
    }))
    if (state.base) {
      const [q, r] = hexFromKey(state.base)
      layers.push(L.polygon([poly(state.base)], { pane: PANE, renderer, interactive: false, color: F.line, weight: 3, opacity: 0.95, fillColor: F.line, fillOpacity: 0.1, className: 'tl3-fog-base' }))
      layers.push(L.marker(grid.center(q, r), { pane: PANE, interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="tl3-base-flag">⛺ پایگاه</div>' }) }))
    }
    clear()
    layers.forEach(l => l.addTo(map))
    layersRef.current = layers
    return clear
  }, [enabled, mapLoading, mapInst, skinId, grid, state])

  // پیام باز شدن خانه تازه — بار اول که شمارش معلوم می‌شود پیامی نمی‌دهیم
  useEffect(() => {
    if (!enabled) return
    const n = state.open.size
    if (lastOpenRef.current !== null && n > lastOpenRef.current && showToast) showToast('🗺️ یک خانه تازه از نقشه باز شد!')
    if (cafes.length) lastOpenRef.current = n
  }, [enabled, state.open.size, cafes.length, showToast])

  return { found: state.found, open: state.open.size, total: state.total, hasBase: !!state.base }
}
