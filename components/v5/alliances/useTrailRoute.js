'use client'
// ─────────────────────────────────────────────────────────────
//  خط مسیر روی نقشه — نسخه v5.0
//  وقتی کاربر یک مسیر را باز می‌کند: یک خط نازک خط‌چین بین مکان‌های مسیر و شماره هر قدم.
//  نقشه پایه دست نمی‌خورد؛ فقط یک لایه سبک روی آن می‌آید و با بستن مسیر کامل برداشته می‌شود.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'

export function useTrailRoute({ mapInst, ready, trail, color = '#111111', ring = '#FFFFFF', ink = '#FFFFFF' }) {
  useEffect(() => {
    const map = mapInst && mapInst.current
    const L = typeof window !== 'undefined' ? window.L : null
    if (!ready || !map || !L || !trail) return
    const pts = (trail.places || []).filter(p => p.is_step && p.lat != null && p.lng != null).sort((a, b) => a.seq - b.seq)
    if (pts.length < 2) return
    const group = L.layerGroup()
    const line = pts.map(p => [Number(p.lat), Number(p.lng)])
    L.polyline(line, { color: ring, weight: 7, opacity: 0.55, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(group)
    L.polyline(line, { color, weight: 3, opacity: 0.95, dashArray: '2 8', lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(group)
    pts.forEach((p, i) => {
      const html = '<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:900 12px Estedad,Vazirmatn,sans-serif;' +
        'background:' + (p.done ? color : ring) + ';color:' + (p.done ? ink : color) + ';border:2px solid ' + color + ';box-shadow:0 4px 10px -3px rgba(0,0,0,.45)">' +
        (p.done ? '✓' : String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])) + '</div>'
      L.marker([Number(p.lat), Number(p.lng)], { icon: L.divIcon({ html, iconSize: [24, 24], iconAnchor: [12, 34], className: '' }), interactive: false, zIndexOffset: 2000 }).addTo(group)
    })
    group.addTo(map)
    try { map.flyToBounds(L.latLngBounds(line), { padding: [70, 70], maxZoom: 16, duration: 0.9 }) } catch (e) {}
    return () => { try { map.removeLayer(group) } catch (e) {} }
  }, [mapInst, ready, trail, color, ring, ink])
}
