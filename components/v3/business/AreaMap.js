'use client'
// نقشه و محله برای کسب‌وکار — نسخه v3.0
// همه مکان‌ها دیده می‌شوند، ولی از دیگران فقط «سطح شلوغی» پنج‌پله‌ای، نه عدد.
// عدد دقیق فقط در سطح محله و جمعی است؛ شمار آدم‌ها زیر حد حریم خالی می‌ماند.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Empty, Kpi, fa } from '@/components/v3/business/bizUi'

const LEVELS = ['بدون فعالیت', 'خلوت', 'معمولی', 'شلوغ', 'خیلی شلوغ']
const CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
const JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.L && window.L.map) return Promise.resolve(window.L)
  if (window.__tlLeaflet) return window.__tlLeaflet
  window.__tlLeaflet = new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CSS; document.head.appendChild(css)
    const js = document.createElement('script'); js.src = JS; js.onload = () => resolve(window.L); js.onerror = () => reject(new Error('leaflet failed'))
    document.head.appendChild(js)
  })
  return window.__tlLeaflet
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function AreaMap({ C, K, area }) {
  const boxRef = useRef(null), mapRef = useRef(null), layerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const places = (area && area.places) || []
  const districts = (area && area.districts) || []
  const mine = places.find(p => p.mine)
  const myD = districts.find(d => d.district === (area && area.district))
  const maxD = Math.max(1, ...districts.map(d => Number(d.checkins_30d) || 0))
  const rankD = useMemo(() => { const s = [...districts].sort((a, b) => b.checkins_30d - a.checkins_30d); return s.findIndex(d => d.district === (area && area.district)) + 1 }, [districts, area])
  const colors = [K.dark ? '#4a4a48' : '#b9b8b2'].concat(K.seq.slice(1))

  useEffect(() => {
    let alive = true
    loadLeaflet().then(L => {
      if (!alive || !boxRef.current || mapRef.current) return
      const c = mine || places[0]
      const m = L.map(boxRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(c ? [c.lat, c.lng] : [35.7219, 51.3979], c ? 14 : 12)
      L.tileLayer('/api/tiles/{z}/{x}/{y}.png?v=2', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
      mapRef.current = m
      setReady(true)
    }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false; try { mapRef.current && mapRef.current.remove() } catch (e) {} mapRef.current = null }
  }, [])

  useEffect(() => {
    const L = typeof window !== 'undefined' && window.L, m = mapRef.current
    if (!ready || !L || !m) return
    if (layerRef.current) { try { layerRef.current.remove() } catch (e) {} }
    const g = L.layerGroup()
    places.filter(p => !p.mine).forEach(p => {
      const lv = Math.max(0, Math.min(4, Number(p.level) || 0))
      L.circleMarker([p.lat, p.lng], { radius: 5 + lv * 1.6, color: C.card, weight: 2, fillColor: colors[lv], fillOpacity: 0.95 })
        .bindTooltip('<b>' + esc(p.name) + '</b><br>' + esc(p.district || '') + ' · ' + LEVELS[lv], { direction: 'top' }).addTo(g)
    })
    if (mine) {
      L.circleMarker([mine.lat, mine.lng], { radius: 15, color: C.accent, weight: 3, fillColor: C.accent, fillOpacity: 0.18 }).addTo(g)
      L.circleMarker([mine.lat, mine.lng], { radius: 7, color: C.card, weight: 2, fillColor: C.accent, fillOpacity: 1 })
        .bindTooltip('<b>' + esc(mine.name) + '</b><br>مکان تو', { direction: 'top', permanent: true }).addTo(g)
    }
    g.addTo(m); layerRef.current = g
  }, [ready, places, mine, C.accent, C.card])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <Kpi C={C} K={K} icon="📍" label="محله تو" value={(area && area.district) || '—'} hint={myD ? fa(myD.places) + ' مکان در این محله' : ''} />
        <Kpi C={C} K={K} icon="🚶" label="چک‌این محله در 30 روز" value={fa(myD && myD.checkins_30d)} hint={myD && myD.checkins_prev_30d ? 'ماه قبل ' + fa(myD.checkins_prev_30d) : 'جمع همه مکان‌های محله'} />
        <Kpi C={C} K={K} icon="🏙" label="رتبه محله در شهر" value={rankD ? fa(rankD) : '—'} unit={districts.length ? 'از ' + fa(districts.length) : ''} />
        <Kpi C={C} K={K} icon="🌆" label="چک‌این کل شهر در 30 روز" value={fa(area && area.city && area.city.checkins_30d)} hint={area && area.city && area.city.active_places ? fa(area.city.active_places) + ' مکان فعال' : ''} />
      </div>
      <Card C={C} K={K} title="نقشه شلوغی" hint="نقطه بزرگ‌تر و تیره‌تر یعنی شلوغ‌تر در 30 روز اخیر. عدد دقیق مکان‌های دیگر نشان داده نمی‌شود." pad={12}>
        <div style={{ position: 'relative', height: 'min(56vh, 460px)', minHeight: 300, borderRadius: 14, overflow: 'hidden', background: C.chip, isolation: 'isolate' }}>
          <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />
          {failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty C={C} icon="🗺" title="نقشه بار نشد" text="اتصال را بررسی کن و صفحه را تازه کن." /></div>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10, alignItems: 'center' }}>
          {LEVELS.map((l, i) => <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.sub, fontWeight: 700 }}>
            <span style={{ width: 8 + i * 2.4, height: 8 + i * 2.4, borderRadius: '50%', background: colors[i], border: '1.5px solid ' + C.card, boxShadow: '0 0 0 1px ' + C.border }} />{l}</span>)}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.sub, fontWeight: 700 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: C.accent }} />مکان تو</span>
        </div>
      </Card>
      <Card C={C} K={K} title="محله‌ها" hint={'چک‌این 30 روز اخیر. شمار بازدیدکننده فقط وقتی دست‌کم ' + fa((area && area.min_group) || 5) + ' نفر باشند نشان داده می‌شود.'}>
        {districts.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {districts.map(d => {
              const me = d.district === (area && area.district)
              return (
                <div key={d.district}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: me ? 900 : 700, color: C.text }}>
                    <span>{d.district}{me ? ' · محله تو' : ''}</span>
                    <span style={{ color: C.sub, fontWeight: 700, fontSize: 11.5 }}>{fa(d.places)} مکان · <b style={{ color: C.text }}>{fa(d.checkins_30d)}</b> چک‌این{d.visitors_30d != null ? ' · ' + fa(d.visitors_30d) + ' نفر' : ''}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.chip, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ width: ((Number(d.checkins_30d) || 0) / maxD * 100) + '%', height: '100%', borderRadius: 3, background: me ? C.accent : K.series[0], opacity: me ? 1 : 0.7 }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : <Empty C={C} icon="🏙" title="داده محله‌ای هنوز نیست" />}
      </Card>
    </div>
  )
}
