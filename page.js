'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:     { name:'تهران',     lat:35.7219, lng:51.3979, zoom:12 },
  mashhad:    { name:'مشهد',      lat:36.2972, lng:59.6067, zoom:12 },
  isfahan:    { name:'اصفهان',    lat:32.6539, lng:51.6660, zoom:12 },
  shiraz:     { name:'شیراز',     lat:29.5918, lng:52.5837, zoom:12 },
  tabriz:     { name:'تبریز',     lat:38.0962, lng:46.2738, zoom:12 },
  karaj:      { name:'کرج',       lat:35.8400, lng:50.9391, zoom:12 },
  rasht:      { name:'رشت',       lat:37.2809, lng:49.5831, zoom:12 },
  gorgan:     { name:'گرگان',     lat:36.8468, lng:54.4430, zoom:12 },
  kern:       { name:'کرمان',     lat:30.2839, lng:57.0834, zoom:12 },
  kish:       { name:'کیش',       lat:26.5267, lng:53.9800, zoom:13 },
  urmia:      { name:'ارومیه',    lat:37.5527, lng:45.0761, zoom:12 },
  hamadan:    { name:'همدان',     lat:34.7993, lng:48.5146, zoom:12 },
}

const CAFE_COLORS = ['#FF6B35','#E84393','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

function getColor(name) {
  if (!name) return CAFE_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return CAFE_COLORS[Math.abs(h) % CAFE_COLORS.length]
}

const STYLES = {
  bg:      '#F5F5F7',
  card:    '#FFFFFF',
  border:  '#E5E5EA',
  text:    '#1C1C1E',
  sub:     '#6E6E73',
  accent:  '#FF6B35',
  chip:    '#EFEFF4',
}

const MAP_MODES = [
  { key:'normal',  label:'🗺 معمولی', filter:'none' },
  { key:'game',    label:'🎮 گیم',    filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.9)' },
  { key:'dark',    label:'🌙 تاریک',  filter:'brightness(0.3) saturate(0.4)' },
  { key:'cartoon', label:'🎨 کارتون', filter:'saturate(2.2) contrast(1.25) brightness(1.05)' },
]

const ZONES = [
  { key:'all',    label:'همه' },
  { key:'north',  label:'⬆ شمال',  lat:35.766, lng:51.41 },
  { key:'center', label:'⬛ مرکز',  lat:35.703, lng:51.41 },
  { key:'east',   label:'➡ شرق',   lat:35.721, lng:51.50 },
  { key:'west',   label:'⬅ غرب',   lat:35.728, lng:51.34 },
  { key:'top',    label:'⭐ برتر' },
]

const NAV_ITEMS = [
  { key:'map',      icon:'🗺',  label:'نقشه' },
  { key:'missions', icon:'📋', label:'ماموریت' },
  { key:'clan',     icon:'🛡',  label:'کلن' },
  { key:'rank',     icon:'🏆', label:'رتبه' },
  { key:'profile',  icon:'👤', label:'پروفایل' },
]

const MENU_ITEMS = [
  { key:'map',      icon:'🗺',  label:'نقشه' },
  { key:'events',   icon:'🎮', label:'رویداد‌ها' },
  { key:'clans',    icon:'🛡',  label:'کلن‌ها' },
  { key:'rank',     icon:'🏆', label:'رتبه‌بندی' },
  { key:'chat',     icon:'💬', label:'چت زنده' },
  { key:'favs',     icon:'❤️', label:'علاقه‌مندی‌ها' },
  { key:'settings', icon:'⚙️', label:'تنظیمات' },
  { key:'profile',  icon:'👤', label:'پروفایل' },
]

const QUICK_FILTERS = [
  { tag:'صبحانه', icon:'🌅' },
  { tag:'شبانه',  icon:'🌙' },
  { tag:'کتاب',   icon:'📚' },
  { tag:'موسیقی', icon:'🎵' },
  { tag:'دنج',    icon:'🛋' },
  { tag:'اسپشالتی', icon:'☕' },
]

export default function Home() {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mksRef   = useRef({})

  const [cafes,     setCafes]     = useState([])
  const [city,      setCity]      = useState('tehran')
  const [mapMode,   setMapMode]   = useState('normal')
  const [zone,      setZone]      = useState('all')
  const [search,    setSearch]    = useState('')
  const [selCafe,   setSelCafe]   = useState(null)
  const [favs,      setFavs]      = useState(new Set())
  const [likes,     setLikes]     = useState(new Set())
  const [tab,       setTab]       = useState('map')
  const [panel,     setPanel]     = useState(false)
  const [showMenu,  setShowMenu]  = useState(false)
  const [showCity,  setShowCity]  = useState(false)
  const [showMode,  setShowMode]  = useState(false)
  const [toast,     setToast]     = useState('')
  const [mapReady,  setMapReady]  = useState(false)
  const [live,      setLive]      = useState({})
  const [land,      setLand]      = useState(false)

  useEffect(() => {
    const fn = () => setLand(window.innerWidth > window.innerHeight)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => {
    fetch(SB_URL + '/rest/v1/cafes?select=*&is_active=eq.true', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCafes(d)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!cafes.length) return
    const update = () => {
      const c = {}
      cafes.forEach(cafe => { c[cafe.id] = Math.floor(Math.random() * 14) })
      setLive(c)
    }
    update()
    const t = setInterval(update, 3000)
    return () => clearInterval(t)
  }, [cafes])

  useEffect(() => {
    cafes.forEach(cafe => {
      const el = document.getElementById('lv-' + cafe.id)
      if (!el) return
      const n = live[cafe.id] || 0
      el.textContent = n > 0 ? String(n) : ''
      el.style.display = n > 0 ? 'flex' : 'none'
    })
  }, [live, cafes])

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
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m)
      mapInst.current = m
      setMapReady(true)
    }
    document.head.appendChild(js)
  }, [])

  useEffect(() => {
    const pane = document.querySelector('.leaflet-tile-pane')
    if (pane) {
      const mode = MAP_MODES.find(m => m.key === mapMode)
      pane.style.filter = mode ? mode.filter : 'none'
    }
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
        const color = getColor(cafe.name)
        const n = live[cafe.id] || 0
        const html = '<div style="position:relative;width:42px;height:50px;cursor:pointer">'
          + '<div style="background:' + color + ';border:3px solid white;border-radius:50% 50% 50% 0;'
          + 'transform:rotate(-45deg);width:38px;height:38px;'
          + 'display:flex;align-items:center;justify-content:center;'
          + 'box-shadow:0 4px 14px ' + color + '88">'
          + '<span style="transform:rotate(45deg);font-size:17px">☕</span>'
          + '</div>'
          + (cafe.is_top ? '<div style="position:absolute;top:-8px;right:-2px;font-size:13px">⚔️</div>' : '')
          + '<div id="lv-' + cafe.id + '" style="position:absolute;top:-5px;left:-3px;'
          + 'background:#FF3B30;color:white;border:2px solid white;border-radius:99px;'
          + 'font-size:9px;font-weight:800;min-width:17px;height:17px;'
          + 'display:' + (n > 0 ? 'flex' : 'none') + ';align-items:center;justify-content:center;'
          + 'padding:0 3px">' + (n > 0 ? n : '') + '</div>'
          + '</div>'
        const icon = L.divIcon({ html: html, iconSize: [42, 50], iconAnchor: [21, 50], className: '' })
        const mk = L.marker([cafe.lat, cafe.lng], { icon: icon })
        mk.on('click', function() { setSelCafe(cafe) })
        mk.addTo(mapInst.current)
        mksRef.current[cafe.id] = mk
      })
    }, 200)
    return () => clearInterval(iv)
  }, [mapReady, cafes])

  const filtered = cafes.filter(function(c) {
    const zOk = zone === 'all' || c.zone === zone || (zone === 'top' && c.is_top)
    const sOk = !search || c.name.includes(search)
    return zOk && sOk
  })

  useEffect(() => {
    if (!mapReady || !mapInst.current) return
    Object.entries(mksRef.current).forEach(function(entry) {
      const id = entry[0]
      const mk = entry[1]
      const show = filtered.find(function(c) { return c.id === id })
      try {
        if (show) { if (!mapInst.current.hasLayer(mk)) mk.addTo(mapInst.current) }
        else mapInst.current.removeLayer(mk)
      } catch(e) {}
    })
  }, [zone, search, mapReady])

  function panMap(x, y) {
    if (mapInst.current) mapInst.current.panBy([x, y], { animate: true })
  }
  function goZone(z) {
    setZone(z.key)
    if (z.lat && mapInst.current) mapInst.current.flyTo([z.lat, z.lng], 13)
    else if (z.key === 'all' && mapInst.current) {
      const c = CITIES[city]
      mapInst.current.flyTo([c.lat, c.lng], c.zoom)
    }
  }

  const TH = land ? 48 : 54
  const BH = land ? 50 : 62
  const totalLive = Object.values(live).reduce(function(a, b) { return a + b }, 0)

  return (
    <div style={{
      height: '100dvh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Vazirmatn', system-ui, sans-serif",
      direction: 'rtl',
      background: STYLES.bg,
      overflow: 'hidden',
      position: 'fixed', inset: 0,
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        button { cursor: pointer; transition: opacity .15s; }
        button:active { opacity: .7; }
        input { outline: none; }
        input::placeholder { color: #AEAEB2; }
        .leaflet-container { background: #E8E8E8 !important; }
        .leaflet-control-attribution { display: none !important; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* TOPBAR */}
      <div style={{
        height: TH, flexShrink: 0,
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid ' + STYLES.border,
        padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 200,
        boxShadow: '0 1px 0 rgba(0,0,0,.06)',
      }}>
        <button onClick={() => setShowMenu(function(v) { return !v })} style={{
          background: STYLES.chip, border: 'none',
          borderRadius: 10, width: 36, height: 36,
          fontSize: 16, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: STYLES.text,
        }}>☰</button>

        <div style={{ fontSize: land ? 15 : 18, fontWeight: 900, color: STYLES.text, flexShrink: 0, letterSpacing: -0.5 }}>
          🏙️ Twin<span style={{ color: STYLES.accent }}>Land</span>
        </div>

        <input
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
          placeholder="🔍 جستجو..."
          style={{
            flex: 1,
            background: STYLES.chip,
            border: '1.5px solid ' + (search ? STYLES.accent : 'transparent'),
            borderRadius: 10, padding: '7px 12px',
            fontSize: 12, fontFamily: 'inherit',
            color: STYLES.text,
          }}
        />

        <button onClick={() => setShowMode(true)} style={{
          background: STYLES.chip, border: 'none', borderRadius: 10,
          padding: '0 10px', height: 36,
          fontSize: 12, color: STYLES.accent, fontFamily: 'inherit',
          fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{MAP_MODES.find(function(m) { return m.key === mapMode }).label.split(' ')[0]}</button>

        <button onClick={() => setShowCity(true)} style={{
          background: STYLES.accent, border: 'none', borderRadius: 10,
          padding: '0 11px', height: 36,
          fontSize: 12, color: 'white', fontFamily: 'inherit',
          fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{CITIES[city].name} ▾</button>
      </div>

      {/* FILTER BAR */}
      <div style={{
        height: 38, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        gap: 6, padding: '0 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
        background: 'rgba(255,255,255,.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid ' + STYLES.border,
      }}>
        {ZONES.map(function(z) {
          return (
            <button key={z.key} onClick={() => goZone(z)} style={{
              flexShrink: 0,
              background: zone === z.key ? STYLES.accent : STYLES.chip,
              border: 'none', borderRadius: 99,
              padding: '4px 13px',
              fontSize: 11, fontWeight: zone === z.key ? 700 : 400,
              color: zone === z.key ? 'white' : STYLES.text,
              whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{z.label}</button>
          )
        })}
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: land ? 'row-reverse' : 'column',
        position: 'relative', minHeight: 0, overflow: 'hidden',
      }}>

        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

          {mapMode === 'dark' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              background: 'rgba(8,12,35,0.75)',
            }} />
          )}

          {/* Live pill */}
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            background: 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid ' + STYLES.border,
            borderRadius: 99, padding: '5px 13px',
            display: 'flex', gap: 8, alignItems: 'center',
            fontSize: 11, color: STYLES.sub,
            boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          }}>
            <span style={{ color: STYLES.text, fontWeight: 700 }}>☕ {filtered.length}</span>
            <span style={{ color: STYLES.border }}>|</span>
            <span><span style={{ color: '#34C759', fontSize: 8 }}>●</span> {totalLive}</span>
          </div>

          {/* NAV Controls */}
          <div style={{ position: 'absolute', bottom: 14, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,32px)', gap: 3 }}>
              {[
                { l: '', empty: true },
                { l: '↑', fn: function() { panMap(0, -80) } },
                { l: '', empty: true },
                { l: '←', fn: function() { panMap(80, 0) } },
                { l: '⌖', fn: function() { if (mapInst.current) { var c = CITIES[city]; mapInst.current.flyTo([c.lat, c.lng], c.zoom) } } },
                { l: '→', fn: function() { panMap(-80, 0) } },
                { l: '', empty: true },
                { l: '↓', fn: function() { panMap(0, 80) } },
                { l: '', empty: true },
              ].map(function(b, i) {
                if (b.empty) return <div key={i} />
                return (
                  <button key={i} onClick={b.fn} style={{
                    background: 'rgba(255,255,255,.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid ' + STYLES.border,
                    borderRadius: 9, width: 32, height: 32,
                    fontSize: b.l === '⌖' ? 10 : 15,
                    color: STYLES.text, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,.1)',
                  }}>{b.l}</button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <button onClick={function() { if (mapInst.current) mapInst.current.zoomIn() }} style={{ background: 'rgba(255,255,255,.92)', border: '1px solid ' + STYLES.border, borderRadius: 9, width: 32, height: 32, fontSize: 18, color: STYLES.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>＋</button>
              <button onClick={function() { if (mapInst.current) mapInst.current.zoomOut() }} style={{ background: 'rgba(255,255,255,.92)', border: '1px solid ' + STYLES.border, borderRadius: 9, width: 32, height: 32, fontSize: 18, color: STYLES.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>－</button>
            </div>
          </div>

          {/* Panel toggle portrait */}
          {!land && (
            <button onClick={function() { setPanel(function(v) { return !v }) }} style={{
              position: 'absolute', bottom: 14, right: 12, zIndex: 10,
              background: panel ? STYLES.accent : 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid ' + (panel ? STYLES.accent : STYLES.border),
              borderRadius: 12, padding: '8px 14px',
              color: panel ? 'white' : STYLES.text,
              fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>📊 داشبورد {panel ? '✕' : ''}</button>
          )}
        </div>

        {/* PANEL landscape */}
        {land && (
          <div style={{
            width: panel ? 240 : 0, flexShrink: 0,
            overflow: 'hidden',
            transition: 'width .3s ease',
            background: 'rgba(255,255,255,.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid ' + STYLES.border,
          }}>
            <div style={{ width: 240, height: '100%', overflowY: 'auto' }}>
              <PanelInner cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} />
            </div>
          </div>
        )}

        {land && (
          <button onClick={function() { setPanel(function(v) { return !v }) }} style={{
            position: 'absolute', left: panel ? 240 : 0,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 50,
            background: 'rgba(255,255,255,.95)',
            border: '1px solid ' + STYLES.border,
            borderRight: 'none', borderRadius: '8px 0 0 8px',
            width: 20, height: 44,
            color: STYLES.sub, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'left .3s',
            boxShadow: '-2px 0 8px rgba(0,0,0,.06)',
          }}>{panel ? '›' : '‹'}</button>
        )}

        {/* PANEL portrait bottom sheet */}
        {!land && panel && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '52%', zIndex: 50,
            background: 'rgba(255,255,255,.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid ' + STYLES.border,
            borderBottom: 'none',
            animation: 'slideUp .3s ease',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: 40, height: 4, background: STYLES.border, borderRadius: 99, margin: '10px auto 0', flexShrink: 0 }} onClick={function() { setPanel(false) }} />
            <PanelInner cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} />
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        height: BH, flexShrink: 0,
        background: 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid ' + STYLES.border,
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -1px 0 rgba(0,0,0,.06)',
      }}>
        {NAV_ITEMS.map(function(item) {
          const active = tab === item.key
          return (
            <button key={item.key} onClick={function() {
              setTab(item.key)
              if (item.key !== 'map') showToast('📣 ' + item.label + ' به زودی!')
            }} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2, background: 'none', border: 'none',
              color: active ? STYLES.accent : STYLES.sub,
              fontSize: land ? 9 : 10,
              padding: land ? '4px 0' : '8px 0',
              position: 'relative', fontFamily: 'inherit', fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: land ? 18 : 22 }}>{item.icon}</span>
              {item.label}
              {active && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2.5, background: STYLES.accent, borderRadius: '2px 2px 0 0' }} />}
            </button>
          )
        })}
      </div>

      {/* CAFE POPUP */}
      {selCafe && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)' }} onClick={function() { setSelCafe(null) }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            maxHeight: '88dvh', overflowY: 'auto',
            background: STYLES.card, borderRadius: '24px 24px 0 0',
            border: '1px solid ' + STYLES.border, borderBottom: 'none',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{ width: 40, height: 4, background: STYLES.border, borderRadius: 99, margin: '14px auto' }} />

            <div style={{ padding: '0 18px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid ' + STYLES.border }}>
              <div style={{
                width: 58, height: 58, borderRadius: 16,
                background: getColor(selCafe.name) + '18',
                border: '2px solid ' + getColor(selCafe.name) + '44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>☕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: STYLES.text }}>{selCafe.name}</div>
                <div style={{ fontSize: 12, color: STYLES.accent, marginTop: 3 }}>📍 {selCafe.description}</div>
                <div style={{ color: '#FF9500', fontSize: 14, marginTop: 3 }}>{selCafe.is_top ? '★★★★★' : '★★★☆☆'}</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#34C759' }}>{live[selCafe.id] || 0}</div>
                <div style={{ fontSize: 9, color: STYLES.sub, marginTop: 1 }}>الان اینجا</div>
              </div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {selCafe.tags && selCafe.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {selCafe.tags.map(function(t) {
                    return <span key={t} style={{ background: STYLES.chip, borderRadius: 99, fontSize: 11, color: STYLES.text, padding: '3px 11px', fontWeight: 500 }}>{t}</span>
                  })}
                </div>
              )}

              {selCafe.is_top && (
                <div style={{ background: '#FFF9F0', border: '1px solid #FFE0B2', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 26 }}>⚔️</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E65100' }}>آیتم فعال: شمشیر گریفیندور</div>
                    <div style={{ fontSize: 11, color: STYLES.sub, marginTop: 2 }}>با سفارش ۱۰۰,۰۰۰ تومان شانس دریافت داری</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  ['☕', '+' + (selCafe.is_top ? 30 : 20) + ' XP', 'چک‌این'],
                  ['⏰', '۸ص–۱۰ش', 'ساعات'],
                  ['🏅', selCafe.is_top ? 'طلایی' : 'نقره', 'رتبه'],
                ].map(function(item) {
                  return (
                    <div key={item[2]} style={{ background: STYLES.chip, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>{item[0]}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: STYLES.text, marginTop: 4 }}>{item[1]}</div>
                      <div style={{ fontSize: 9, color: STYLES.sub, marginTop: 2 }}>{item[2]}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 14 }}>
                {[
                  { icon: '👍', lbl: 'لایک', set: likes, fn: setLikes },
                  { icon: '❤️', lbl: 'عشق',  set: null,  fn: null },
                  { icon: '🔖', lbl: 'ذخیره', set: favs, fn: setFavs },
                  { icon: '📤', lbl: 'اشتراک', set: null, fn: null },
                ].map(function(item) {
                  const on = item.set && item.set.has(selCafe.id)
                  return (
                    <button key={item.lbl} onClick={function() {
                      if (item.fn && item.set) {
                        const n = new Set(item.set)
                        if (on) n.delete(selCafe.id)
                        else n.add(selCafe.id)
                        item.fn(n)
                        showToast(on ? 'حذف شد' : item.icon + ' ثبت شد')
                      } else {
                        showToast('🔗 کپی شد!')
                      }
                    }} style={{
                      background: on ? STYLES.accent + '18' : STYLES.chip,
                      border: '1.5px solid ' + (on ? STYLES.accent : 'transparent'),
                      borderRadius: 12, padding: '9px 4px',
                      color: STYLES.text, fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontSize: 9, color: on ? STYLES.accent : STYLES.sub, fontWeight: on ? 700 : 400 }}>{on ? '✓' : item.lbl}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={function() {
                  showToast('✅ چک‌این! +' + (selCafe.is_top ? 30 : 20) + ' XP')
                  setSelCafe(null)
                }} style={{
                  flex: 1, background: STYLES.accent, color: 'white',
                  border: 'none', borderRadius: 14, padding: 14,
                  fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 16px ' + STYLES.accent + '44',
                }}>📍 چک‌این</button>
                <a href={'https://www.google.com/maps?q=' + selCafe.lat + ',' + selCafe.lng} target="_blank" style={{
                  background: STYLES.chip, border: '1px solid ' + STYLES.border,
                  borderRadius: 14, padding: '14px 16px',
                  fontSize: 20, textDecoration: 'none',
                  display: 'flex', alignItems: 'center',
                }}>🗺</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENU */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(8px)' }} onClick={function() { setShowMenu(false) }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{
            position: 'absolute', top: TH + 8, right: 14, left: 14,
            background: 'rgba(255,255,255,.96)',
            backdropFilter: 'blur(24px)',
            borderRadius: 18, border: '1px solid ' + STYLES.border,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,.15)',
            animation: 'fadeIn .2s ease',
          }}>
            {MENU_ITEMS.map(function(item, i) {
              return (
                <button key={item.key} onClick={function() {
                  setShowMenu(false)
                  setTab(item.key)
                  if (item.key !== 'map') showToast('📣 ' + item.label + ' به زودی!')
                }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  background: 'transparent', border: 'none',
                  padding: '13px 18px', color: STYLES.text,
                  fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
                  borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid ' + STYLES.border : 'none',
                }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* CITY PICKER */}
      {showCity && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={function() { setShowCity(false) }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{
            background: STYLES.card, borderRadius: '24px 24px 0 0',
            padding: '20px 20px 44px', width: '100%', maxWidth: 540,
            border: '1px solid ' + STYLES.border, borderBottom: 'none',
            animation: 'slideUp .3s ease', maxHeight: '75dvh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, background: STYLES.border, borderRadius: 99, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: STYLES.text, textAlign: 'center', marginBottom: 16 }}>🏙️ انتخاب شهر</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {Object.entries(CITIES).map(function(entry) {
                const k = entry[0]
                const v = entry[1]
                return (
                  <button key={k} onClick={function() { setCity(k); setShowCity(false); showToast('✈️ ' + v.name) }} style={{
                    background: city === k ? STYLES.accent : STYLES.chip,
                    border: 'none', borderRadius: 12, padding: '12px 6px',
                    fontSize: 12, fontWeight: city === k ? 800 : 500,
                    color: city === k ? 'white' : STYLES.text,
                    fontFamily: 'inherit',
                  }}>{v.name}</button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* MAP MODE PICKER */}
      {showMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={function() { setShowMode(false) }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{
            background: STYLES.card, borderRadius: '24px 24px 0 0',
            padding: '20px 20px 44px', width: '100%', maxWidth: 480,
            border: '1px solid ' + STYLES.border, borderBottom: 'none',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{ width: 40, height: 4, background: STYLES.border, borderRadius: 99, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: STYLES.text, textAlign: 'center', marginBottom: 16 }}>🎨 استایل نقشه</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MAP_MODES.map(function(m) {
                return (
                  <button key={m.key} onClick={function() { setMapMode(m.key); setShowMode(false); showToast(m.label + ' فعال شد') }} style={{
                    background: mapMode === m.key ? STYLES.accent : STYLES.chip,
                    border: 'none', borderRadius: 14, padding: '16px',
                    fontSize: 14, fontWeight: mapMode === m.key ? 800 : 500,
                    color: mapMode === m.key ? 'white' : STYLES.text,
                    fontFamily: 'inherit',
                  }}>{m.label}</button>
                )
              })}
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
          background: STYLES.text, color: 'white',
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

function PanelInner(props) {
  const cafes = props.cafes
  const filtered = props.filtered
  const live = props.live
  const totalLive = props.totalLive
  const showToast = props.showToast
  const setSearch = props.setSearch

  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: 10, color: STYLES.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>آمار زنده</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { icon:'☕', val:cafes.length,                                         lbl:'کافه' },
            { icon:'👥', val:totalLive,                                            lbl:'آنلاین' },
            { icon:'⭐', val:cafes.filter(function(c){return c.is_top}).length,    lbl:'برتر' },
            { icon:'🔍', val:filtered.length,                                      lbl:'نمایش' },
          ].map(function(item) {
            return (
              <div key={item.lbl} style={{ background: STYLES.chip, borderRadius: 10, padding: '9px 10px' }}>
                <div style={{ fontSize: 15 }}>{item.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: STYLES.text, marginTop: 2 }}>{item.val}</div>
                <div style={{ fontSize: 9, color: STYLES.sub, marginTop: 1 }}>{item.lbl}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px 14px', borderTop: '1px solid ' + STYLES.border, paddingTop: 14 }}>
        <div style={{ fontSize: 10, color: STYLES.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>فیلتر سریع</div>
        {QUICK_FILTERS.map(function(f) {
          return (
            <button key={f.tag} onClick={function() { setSearch(f.tag); showToast('🔍 ' + f.tag) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent', border: 'none',
              padding: '8px 4px', borderRadius: 8,
              color: STYLES.text, fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
            }}>
              <span style={{ fontSize: 17, width: 24, textAlign: 'center' }}>{f.icon}</span>{f.tag}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '14px', borderTop: '1px solid ' + STYLES.border }}>
        <div style={{ fontSize: 10, color: STYLES.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>رویداد فعال</div>
        <div style={{ background: '#FFF9F0', border: '1px solid #FFE0B2', borderRadius: 14, padding: '12px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚔️</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: STYLES.text }}>شمشیر گریفیندور</div>
          <div style={{ fontSize: 11, color: STYLES.sub, marginTop: 3, lineHeight: 1.5 }}>کافه‌های غرب تهران • امروز</div>
          <button onClick={function() { showToast('🎮 ورود به رویداد...') }} style={{
            marginTop: 10, width: '100%', background: STYLES.accent, border: 'none',
            borderRadius: 10, padding: '8px', fontSize: 12,
            color: 'white', fontWeight: 700, fontFamily: 'inherit',
          }}>شرکت در رویداد</button>
        </div>
      </div>

      <div style={{ padding: '14px', borderTop: '1px solid ' + STYLES.border }}>
        <div style={{ fontSize: 10, color: STYLES.sub, letterSpacing: .8, marginBottom: 8, fontWeight: 600 }}>پرطرفدارترین‌ها</div>
        {cafes.filter(function(c) { return c.is_top }).slice(0, 5).map(function(c) {
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid ' + STYLES.border }}>
              <span style={{ fontSize: 20 }}>☕</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: STYLES.text, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: STYLES.sub }}>{c.description}</div>
              </div>
              <div style={{ fontSize: 11, color: '#34C759', fontWeight: 700 }}>{live[c.id] || 0} نفر</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
