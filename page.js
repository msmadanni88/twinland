'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:     { name:'تهران',      lat:35.7219, lng:51.3979, zoom:12 },
  mashhad:    { name:'مشهد',       lat:36.2972, lng:59.6067, zoom:12 },
  isfahan:    { name:'اصفهان',     lat:32.6539, lng:51.6660, zoom:12 },
  shiraz:     { name:'شیراز',      lat:29.5918, lng:52.5837, zoom:12 },
  tabriz:     { name:'تبریز',      lat:38.0962, lng:46.2738, zoom:12 },
  karaj:      { name:'کرج',        lat:35.8400, lng:50.9391, zoom:12 },
  ahvaz:      { name:'اهواز',      lat:31.3183, lng:48.6706, zoom:12 },
  rasht:      { name:'رشت',        lat:37.2809, lng:49.5831, zoom:12 },
  gorgan:     { name:'گرگان',      lat:36.8468, lng:54.4430, zoom:12 },
  kermanshah: { name:'کرمانشاه',   lat:34.3142, lng:47.0650, zoom:12 },
  kerman:     { name:'کرمان',      lat:30.2839, lng:57.0834, zoom:12 },
  kish:       { name:'کیش',        lat:26.5267, lng:53.9800, zoom:13 },
  qom:        { name:'قم',         lat:34.6401, lng:50.8764, zoom:12 },
  urmia:      { name:'ارومیه',     lat:37.5527, lng:45.0761, zoom:12 },
  hamadan:    { name:'همدان',      lat:34.7993, lng:48.5146, zoom:12 },
  arak:       { name:'اراک',       lat:34.0917, lng:49.6892, zoom:12 },
}

const MAP_STYLES = {
  normal:  { label:'🗺 معمولی',  filter:'none' },
  game:    { label:'🎮 گیم',     filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.9)' },
  dark:    { label:'🌙 تاریک',   filter:'brightness(0.3) saturate(0.4) invert(0.05)' },
  cartoon: { label:'🎨 کارتون',  filter:'saturate(2.2) contrast(1.25) brightness(1.05)' },
}

const CAFE_COLORS = ['#FF6B35','#E84393','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

function cafeColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return CAFE_COLORS[Math.abs(h) % CAFE_COLORS.length]
}

export default function Home() {
  const mapRef    = useRef(null)
  const mapInst   = useRef(null)
  const mksRef    = useRef({})
  const tileLayer = useRef(null)

  const [cafes,      setCafes]      = useState([])
  const [city,       setCity]       = useState('tehran')
  const [mapStyle,   setMapStyle]   = useState('normal')
  const [zone,       setZone]       = useState('all')
  const [search,     setSearch]     = useState('')
  const [selCafe,    setSelCafe]    = useState(null)
  const [favs,       setFavs]       = useState(new Set())
  const [likes,      setLikes]      = useState(new Set())
  const [tab,        setTab]        = useState('map')
  const [panel,      setPanel]      = useState(false)
  const [showMenu,   setShowMenu]   = useState(false)
  const [showCity,   setShowCity]   = useState(false)
  const [showStyle,  setShowStyle]  = useState(false)
  const [toast,      setToast]      = useState(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [liveCount,  setLiveCount]  = useState({})
  const [landscape,  setLandscape]  = useState(false)

  useEffect(() => {
    const fn = () => setLandscape(window.innerWidth > window.innerHeight)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/cafes?select=*&is_active=eq.true`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    }).then(r => r.json()).then(d => setCafes(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!cafes.length) return
    const update = () => {
      const c = {}
      cafes.forEach(cafe => { c[cafe.id] = Math.floor(Math.random() * 14) })
      setLiveCount(c)
    }
    update()
    const t = setInterval(update, 3000)
    return () => clearInterval(t)
  }, [cafes])

  useEffect(() => {
    cafes.forEach(cafe => {
      const el = document.getElementById('b-' + cafe.id)
      if (!el) return
      const n = liveCount[cafe.id] || 0
      el.textContent = n > 0 ? String(n) : ''
      el.style.display = n > 0 ? 'flex' : 'none'
    })
  }, [liveCount, cafes])

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)
    const js = document.createElement('script')
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    js.onload = () => {
      const L = window.L
      const c = CITIES[city]
      const m = L.map(mapRef.current, {
        center: [c.lat, c.lng], zoom: c.zoom,
        zoomControl: false, attributionControl: false
      })
      tileLayer.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
      tileLayer.current.addTo(m)
      mapInst.current = m
      setMapReady(true)
    }
    document.head.appendChild(js)
  }, [])

  useEffect(() => {
    const el = document.querySelector('.leaflet-tile-pane')
    if (el) el.style.filter = MAP_STYLES[mapStyle].filter
  })

  useEffect(() => {
    if (!mapInst.current) return
    const c = CITIES[city]
    mapInst.current.flyTo([c.lat, c.lng], c.zoom, { duration: 1 })
  }, [city])

  useEffect(() => {
    if (!mapReady || !cafes.length) return
    const iv = setInterval(() => {
      if (!window.L) return
      clearInterval(iv)
      const L = window.L
      cafes.forEach(cafe => {
        if (mksRef.current[cafe.id]) return
        const color = cafeColor(cafe.name)
        const live = liveCount[cafe.id] || 0
        const html = `<div style="position:relative;width:42px;height:50px;cursor:pointer">
          <div style="background:${color};border:3px solid white;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);width:38px;height:38px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 14px ${color}88">
            <span style="transform:rotate(45deg);font-size:17px">☕</span>
          </div>
          ${cafe.is_top ? '<div style="position:absolute;top:-8px;right:-2px;font-size:13px">⚔️</div>' : ''}
          <div id="b-${cafe.id}" style="position:absolute;top:-5px;left:-3px;
            background:#FF3B30;color:white;border:2px solid white;border-radius:99px;
            font-size:9px;font-weight:800;min-width:17px;height:17px;
            display:${live > 0 ? 'flex' : 'none'};align-items:center;justify-content:center;
            padding:0 3px;box-shadow:0 2px 6px rgba(255,59,48,.5)">${live > 0 ? live : ''}</div>
        </div>`
        const icon = L.divIcon({ html, iconSize: [42, 50], iconAnchor: [21, 50], className: '' })
        const mk = L.marker([cafe.lat, cafe.lng], { icon }).on('click', () => setSelCafe(cafe))
        mk.addTo(mapInst.current)
        mksRef.current[cafe.id] = mk
      })
    }, 200)
    return () => clearInterval(iv)
  }, [mapReady, cafes])

  const filtered = cafes.filter(c => {
    const zOk = zone === 'all' || c.zone === zone || (zone === 'top' && c.is_top)
    const sOk = !search || c.name.includes(search)
    return zOk && sOk
  })

  useEffect(() => {
    if (!mapReady || !mapInst.current) return
    Object.entries(mksRef.current).forEach(([id, mk]) => {
      const show = filtered.find(c => c.id === id)
      try {
        if (show) { if (!mapInst.current.hasLayer(mk)) mk.addTo(mapInst.current) }
        else mapInst.current.removeLayer(mk)
      } catch (e) {}
    })
  }, [zone, search, mapReady])

  const panMap = (x, y) => mapInst.current && mapInst.current.panBy([x, y], { animate: true })
  const zoomIn = () => mapInst.current && mapInst.current.zoomIn()
  const zoomOut = () => mapInst.current && mapInst.current.zoomOut()
  const resetView = () => {
    if (!mapInst.current) return
    const c = CITIES[city]
    mapInst.current.flyTo([c.lat, c.lng], c.zoom, { duration: 0.8 })
  }

  const TH = landscape ? 48 : 54
  const FH = 38
  const BH = landscape ? 50 : 62

  const S = {
    bg: '#F5F5F7',
    card: '#FFFFFF',
    border: '#E5E5EA',
    text: '#1C1C1E',
    sub: '#6E6E73',
    accent: '#FF6B35',
    chip: '#EFEFF4',
    chipText: '#3A3A3C',
  }

  return (
    <div style={{
      height: '100dvh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Vazirmatn', system-ui, sans-serif",
      direction: 'rtl',
      background: S.bg,
      overflow: 'hidden',
      position: 'fixed', inset: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input { outline: none; }
        input::placeholder { color: #AEAEB2; }
        button { transition: opacity .15s; }
        button:active { opacity: .7; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .leaflet-container { background: #E8E8E8 !important; }
        .leaflet-control-attribution { display: none !important; }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        height: TH, flexShrink: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${S.border}`,
        padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 200,
        boxShadow: '0 1px 0 rgba(0,0,0,.06)',
      }}>
        <button onClick={() => setShowMenu(v => !v)} style={{
          background: S.chip, border: 'none',
          borderRadius: 10, width: 36, height: 36,
          cursor: 'pointer', fontSize: 16, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: S.text,
        }}>☰</button>

        <div style={{ fontSize: landscape ? 15 : 18, fontWeight: 900, color: S.text, flexShrink: 0, letterSpacing: -0.5 }}>
          🏙️ Twin<span style={{ color: S.accent }}>Land</span>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 جستجوی کافه..."
            style={{
              width: '100%',
              background: S.chip,
              border: `1.5px solid ${search ? S.accent : 'transparent'}`,
              borderRadius: 10, padding: '7px 12px',
              fontSize: 12, fontFamily: 'inherit',
              color: S.text,
            }}
          />
        </div>

        <button onClick={() => setShowStyle(true)} style={{
          background: S.chip, border: 'none', borderRadius: 10,
          padding: '0 10px', height: 36, cursor: 'pointer',
          fontSize: 12, color: S.accent, fontFamily: 'inherit',
          fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{MAP_STYLES[mapStyle].label.split(' ')[0]}</button>

        <button onClick={() => setShowCity(true)} style={{
          background: S.accent, border: 'none', borderRadius: 10,
          padding: '0 11px', height: 36, cursor: 'pointer',
          fontSize: 12, color: 'white', fontFamily: 'inherit',
          fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{CITIES[city].name} ▾</button>
      </div>

      {/* FILTER BAR */}
      <div style={{
        height: FH, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        gap: 6, padding: '0 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${S.border}`,
      }}>
        {[['all','همه'],['north','⬆ شمال'],['center','⬛ مرکز'],['east','➡ شرق'],['west','⬅ غرب'],['top','⭐ برتر']].map(([z, l]) => (
          <button key={z} onClick={() => {
            setZone(z)
            if (z === 'north' && mapInst.current) mapInst.current.flyTo([35.766, 51.41], 13)
            else if (z === 'center' && mapInst.current) mapInst.current.flyTo([35.703, 51.41], 13)
            else if (z === 'east' && mapInst.current) mapInst.current.flyTo([35.721, 51.50], 13)
            else if (z === 'west' && mapInst.current) mapInst.current.flyTo([35.728, 51.34], 13)
            else if (z === 'all' && mapInst.current) resetView()
          }} style={{
            flexShrink: 0,
            background: zone === z ? S.accent : S.chip,
            border: 'none', borderRadius: 99,
            padding: '4px 13px',
            fontSize: 11, fontWeight: zone === z ? 700 : 400,
            color: zone === z ? 'white' : S.chipText,
            cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}>{l}</button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: landscape ? 'row-reverse' : 'column',
        position: 'relative', minHeight: 0, overflow: 'hidden',
      }}>
        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

          {/* Dark overlay for dark mode */}
          {mapStyle === 'dark' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              background: 'rgba(8,12,35,0.75)',
            }} />
          )}

          {/* Live pill */}
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${S.border}`,
            borderRadius: 99, padding: '5px 13px',
            display: 'flex', gap: 10, alignItems: 'center',
            fontSize: 11, color: S.sub,
            boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          }}>
            <span style={{ color: S.text, fontWeight: 600 }}>☕ {filtered.length}</span>
            <span style={{ color: S.border }}>|</span>
            <span><span style={{ color: '#34C759', fontSize: 8 }}>●</span> {Object.values(liveCount).reduce((a, b) => a + b, 0)} نفر</span>
          </div>

          {/* NAV Controls */}
          <div style={{
            position: 'absolute', bottom: 14, left: 12, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,32px)', gap: 3 }}>
              {[
                null, { l: '↑', fn: () => panMap(0, -80) }, null,
                { l: '←', fn: () => panMap(80, 0) },
                { l: '⌖', fn: resetView },
                { l: '→', fn: () => panMap(-80, 0) },
                null, { l: '↓', fn: () => panMap(0, 80) }, null,
              ].map((b, i) => b ? (
                <button key={i} onClick={b.fn} style={{
                  background: 'rgba(255,255,255,.92)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${S.border}`,
                  borderRadius: 9, width: 32, height: 32,
                  fontSize: b.l === '⌖' ? 10 : 15, cursor: 'pointer',
                  color: S.text, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,.1)',
                }}>{b.l}</button>
              ) : <div key={i} />)}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[['＋', zoomIn], ['－', zoomOut]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{
                  background: 'rgba(255,255,255,.92)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${S.border}`,
                  borderRadius: 9, width: 32, height: 32,
                  fontSize: 18, cursor: 'pointer', color: S.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,.1)',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Panel toggle (portrait) */}
          {!landscape && (
            <button onClick={() => setPanel(v => !v)} style={{
              position: 'absolute', bottom: 14, right: 12, zIndex: 10,
              background: panel ? S.accent : 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${panel ? S.accent : S.border}`,
              borderRadius: 12, padding: '8px 14px',
              cursor: 'pointer',
              color: panel ? 'white' : S.text,
              fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>📊 داشبورد {panel ? '✕' : ''}</button>
          )}
        </div>

        {/* SIDE PANEL — landscape */}
        {landscape && (
          <>
            <div style={{
              width: panel ? 240 : 0, flexShrink: 0,
              overflow: 'hidden',
              transition: 'width .3s ease',
              background: 'rgba(255,255,255,.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: `1px solid ${S.border}`,
            }}>
              <div style={{ width: 240, height: '100%', overflowY: 'auto' }}>
                <PanelContent cafes={cafes} filtered={filtered} liveCount={liveCount} showToast={showToast} setSearch={setSearch} S={S} />
              </div>
            </div>
            <button onClick={() => setPanel(v => !v)} style={{
              position: 'absolute', left: panel ? 240 : 0,
              top: '50%', transform: 'translateY(-50%)',
              zIndex: 50,
              background: 'rgba(255,255,255,.95)',
              border: `1px solid ${S.border}`,
              borderRight: 'none', borderRadius: '8px 0 0 8px',
              width: 20, height: 44, cursor: 'pointer',
              color: S.sub, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'left .3s',
              boxShadow: '-2px 0 8px rgba(0,0,0,.06)',
            }}>{panel ? '›' : '‹'}</button>
          </>
        )}

        {/* PANEL bottom sheet — portrait */}
        {!landscape && panel && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '52%', zIndex: 50,
            background: 'rgba(255,255,255,.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 0 0',
            border: `1px solid ${S.border}`,
            borderBottom: 'none',
            animation: 'slideUp .3s ease',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: 40, height: 4, background: S.border, borderRadius: 99, margin: '10px auto 0', flexShrink: 0, cursor: 'pointer' }} onClick={() => setPanel(false)} />
            <PanelContent cafes={cafes} filtered={filtered} liveCount={liveCount} showToast={showToast} setSearch={setSearch} S={S} />
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        height: BH, flexShrink: 0,
        background: 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${S.border}`,
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -1px 0 rgba(0,0,0,.06)',
      }}>
        {[['🗺', 'نقشه', 'map'], ['📋', 'ماموریت', 'missions'], ['🛡', 'کلن', 'clan'], ['🏆', 'رتبه', 'rank'], ['👤', 'پروفایل', 'profile']].map(([icon, lbl, key]) => (
          <button key={key} onClick={() => { setTab(key); if (key !== 'map') showToast(`📣 ${lbl} به زودی!`) }} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2, background: 'none', border: 'none', cursor: 'pointer',
            color: tab === key ? S.accent : S.sub,
            fontSize: landscape ? 9 : 10,
            padding: landscape ? '4px 0' : '8px 0',
            position: 'relative', fontFamily: 'inherit', fontWeight: tab === key ? 700 : 400,
          }}>
            <span style={{ fontSize: landscape ? 18 : 22 }}>{icon}</span>
            {lbl}
            {tab === key && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2.5, background: S.accent, borderRadius: '2px 2px 0 0' }} />}
          </button>
        ))}
      </div>

      {/* CAFE POPUP */}
      {selCafe && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)' }} onClick={() => setSelCafe(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            maxHeight: '88dvh', overflowY: 'auto',
            background: S.card, borderRadius: '24px 24px 0 0',
            border: `1px solid ${S.border}`, borderBottom: 'none',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{ width: 40, height: 4, background: S.border, borderRadius: 99, margin: '14px auto' }} />
            <div style={{
              padding: '0 18px 16px', display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: `1px solid ${S.border}`,
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: 16,
                background: cafeColor(selCafe.name) + '18',
                border: `2px solid ${cafeColor(selCafe.name)}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>☕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: S.text }}>{selCafe.name}</div>
                <div style={{ fontSize: 12, color: S.accent, marginTop: 3 }}>📍 {selCafe.description}</div>
                <div style={{ color: '#FF9500', fontSize: 14, marginTop: 3 }}>{selCafe.is_top ? '★★★★★' : '★★★☆☆'}</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#34C759' }}>{liveCount[selCafe.id] || 0}</div>
                <div style={{ fontSize: 9, color: S.sub, marginTop: 1 }}>الان اینجا</div>
              </div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {selCafe.tags && selCafe.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {selCafe.tags.map(t => (
                    <span key={t} style={{ background: S.chip, borderRadius: 99, fontSize: 11, color: S.chipText, padding: '3px 11px', fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              )}

              {selCafe.is_top && (
                <div style={{
                  background: 'linear-gradient(135deg,#FFF9F0,#FFF3E0)',
                  border: '1px solid #FFE0B2', borderRadius: 14,
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                }}>
                  <span style={{ fontSize: 26 }}>⚔️</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E65100' }}>آیتم فعال: شمشیر گریفیندور</div>
                    <div style={{ fontSize: 11, color: S.sub, marginTop: 2 }}>با سفارش ۱۰۰,۰۰۰ تومان شانس دریافت داری</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  ['☕', `+${selCafe.is_top ? 30 : 20} XP`, 'چک‌این'],
                  ['⏰', '۸ص–۱۰ش', 'ساعات'],
                  ['🏅', selCafe.is_top ? 'طلایی' : 'نقره', 'رتبه'],
                ].map(([icon, val, lbl]) => (
                  <div key={lbl} style={{ background: S.chip, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: S.text, marginTop: 4 }}>{val}</div>
                    <div style={{ fontSize: 9, color: S.sub, marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 14 }}>
                {[
                  { icon: '👍', lbl: 'لایک', s: likes, fn: setLikes },
                  { icon: '❤️', lbl: 'عشق', s: new Set(), fn: null },
                  { icon: '🔖', lbl: 'ذخیره', s: favs, fn: setFavs },
                  { icon: '📤', lbl: 'اشتراک', s: new Set(), fn: null },
                ].map(({ icon, lbl, s, fn }) => {
                  const on = s.has && s.has(selCafe.id)
                  return (
                    <button key={lbl} onClick={() => {
                      if (fn) { const n = new Set(s); on ? n.delete(selCafe.id) : n.add(selCafe.id); fn(n) }
                      showToast(fn ? (on ? 'حذف شد' : `${icon} ثبت شد`) : '🔗 لینک کپی شد!')
                    }} style={{
                      background: on ? S.accent + '18' : S.chip,
                      border: `1.5px solid ${on ? S.accent : 'transparent'}`,
                      borderRadius: 12, padding: '9px 4px',
                      cursor: 'pointer', color: S.text, fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <span style={{ fontSize: 9, color: on ? S.accent : S.sub, fontWeight: on ? 700 : 400 }}>{on && fn ? '✓' : lbl}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { showToast(`✅ چک‌این! +${selCafe.is_top ? 30 : 20} XP`); setSelCafe(null) }} style={{
                  flex: 1, background: S.accent, color: 'white',
                  border: 'none', borderRadius: 14, padding: 14,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${S.accent}44`,
                }}>📍 چک‌این</button>
                <a href={`https://www.google.com/maps?q=${selCafe.lat},${selCafe.lng}`} target="_blank" style={{
                  background: S.chip, border: `1px solid ${S.border}`,
                  borderRadius: 14, padding: '14px 16px',
                  fontSize: 20, textDecoration: 'none',
                  display: 'flex', alignItems: 'center',
                }}>🗺</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HAMBURGER MENU */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(8px)' }} onClick={() => setShowMenu(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: TH + 8, right: 14, left: 14,
            background: 'rgba(255,255,255,.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 18, border: `1px solid ${S.border}`,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,.15)',
            animation: 'fadeIn .2s ease',
          }}>
            {[
              ['🗺', 'نقشه', 'map'],
              ['🎮', 'رویداد‌ها', 'events'],
              ['🛡', 'کلن‌ها', 'clans'],
              ['🏆', 'رتبه‌بندی', 'rank'],
              ['💬', 'چت زنده', 'chat'],
              ['❤️', 'علاقه‌مندی‌ها', 'favs'],
              ['⚙️', 'تنظیمات', 'settings'],
              ['👤', 'پروفایل', 'profile'],
            ].map(([icon, lbl, key], i, arr) => (
              <button key={key} onClick={() => { setShowMenu(false); setTab(key); if (key !== 'map') showToast(`📣 ${lbl} به زودی!`) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '13px 18px', color: S.text,
                fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
                borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : 'none',
              }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CITY PICKER */}
      {showCity && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCity(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: S.card, borderRadius: '24px 24px 0 0',
            padding: '20px 20px 44px', width: '100%', maxWidth: 540,
            border: `1px solid ${S.border}`, borderBottom: 'none',
            animation: 'slideUp .3s ease', maxHeight: '75dvh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, background: S.border, borderRadius: 99, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: S.text, textAlign: 'center', marginBottom: 16 }}>🏙️ انتخاب شهر</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {Object.entries(CITIES).map(([k, v]) => (
                <button key={k} onClick={() => { setCity(k); setShowCity(false); showToast(`✈️ ${v.name}`) }} style={{
                  background: city === k ? S.accent : S.chip,
                  border: 'none', borderRadius: 12, padding: '12px 6px',
                  fontSize: 12, fontWeight: city === k ? 800 : 500,
                  color: city === k ? 'white' : S.text,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{v.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAP STYLE PICKER */}
      {showStyle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowStyle(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: S.card, borderRadius: '24px 24px 0 0',
            padding: '20px 20px 44px', width: '100%', maxWidth: 480,
            border: `1px solid ${S.border}`, borderBottom: 'none',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{ width: 40, height: 4, background: S.border, borderRadius: 99, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: S.text, textAlign: 'center', marginBottom: 16 }}>🎨 استایل نقشه</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(MAP_STYLES).map(([k, v]) => (
                <button key={k} onClick={() => { setMapStyle(k); setShowStyle(false); showToast(`${v.label} فعال شد`) }} style={{
                  background: mapStyle === k ? S.accent : S.chip,
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 14, fontWeight: mapStyle === k ? 800 : 500,
                  color: mapStyle === k ? 'white' : S.text,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{v.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: BH + 14,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 4000,
          background: S.text, color: 'white',
          borderRadius: 99, padding: '10px 22px',
          fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,.2)',
          animation: 'fadeUp .2s ease',
        }}>{toast}</div>
      )}
    </div>
  )
}

function PanelContent({ cafes, filtered, liveCount, showToast, setSearch, S }) {
  const totalLive = Object.values(liveCount).reduce((a, b) => a + b, 0)
  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ fontSize: 10, color: S.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>آمار زنده</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['☕', cafes.length, 'کافه'], ['👥', totalLive, 'آنلاین'], ['⭐', cafes.filter(c => c.is_top).length, 'برتر'], ['🔍', filtered.length, 'نمایش']].map(([icon, val, lbl]) => (
            <div key={lbl} style={{ background: S.chip, borderRadius: 10, padding: '9px 10px' }}>
              <div style={{ fontSize: 15 }}>{icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: S.text, marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 9, color: S.sub, marginTop: 1 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px', borderTop: `1px solid ${S.border}`, marginTop: 14 }}>
        <div style={{ fontSize: 10, color: S.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>فیلتر سریع</div>
        {[['🌅', 'صبحانه'], ['🌙', 'شبانه'], ['📚', 'کتاب'], ['🎵', 'موسیقی'], ['🛋', 'دنج'], ['☕', 'اسپشالتی']].map(([icon, lbl]) => (
          <button key={lbl} onClick={() => { setSearch(lbl); showToast(`🔍 ${lbl}`) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '8px 4px', borderRadius: 8,
            color: S.text, fontSize: 13, fontFamily: 'inherit',
            fontWeight: 500,
          }}>
            <span style={{ fontSize: 17, width: 24, textAlign: 'center' }}>{icon}</span>{lbl}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px', borderTop: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 10, color: S.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>رویداد فعال</div>
        <div style={{ background: 'linear-gradient(135deg,#FFF9F0,#FFF3E0)', border: '1px solid #FFE0B2', borderRadius: 14, padding: '12px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚔️</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: S.text }}>شمشیر گریفیندور</div>
          <div style={{ fontSize: 11, color: S.sub, marginTop: 3, lineHeight: 1.5 }}>کافه‌های غرب تهران • امروز</div>
          <button onClick={() => showToast('🎮 ورود به رویداد...')} style={{
            marginTop: 10, width: '100%', background: S.accent, border: 'none',
            borderRadius: 10, padding: '8px', fontSize: 12,
            color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>شرکت در رویداد</button>
        </div>
      </div>

      <div style={{ padding: '14px', borderTop: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 10, color: S.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>پرطرفدارترین‌ها</div>
        {cafes.filter(c => c.is_top).slice(0, 5).map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: S.text, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: S.sub }}>{c.description}</div>
            </div>
            <div style={{ fontSize: 11, color: '#34C759', fontWeight: 700 }}>{liveCount[c.id] || 0} نفر</div>
          </div>
        ))}
      </div>
    </div>
  )
}
