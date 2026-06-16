'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:   {name:'تهران',    lat:35.7219,lng:51.3979,zoom:12},
  mashhad:  {name:'مشهد',     lat:36.2972,lng:59.6067,zoom:12},
  isfahan:  {name:'اصفهان',   lat:32.6539,lng:51.6660,zoom:12},
  shiraz:   {name:'شیراز',    lat:29.5918,lng:52.5837,zoom:12},
  tabriz:   {name:'تبریز',    lat:38.0962,lng:46.2738,zoom:12},
  karaj:    {name:'کرج',      lat:35.8400,lng:50.9391,zoom:12},
  ahvaz:    {name:'اهواز',    lat:31.3183,lng:48.6706,zoom:12},
  rasht:    {name:'رشت',      lat:37.2809,lng:49.5831,zoom:12},
  gorgan:   {name:'گرگان',    lat:36.8468,lng:54.4430,zoom:12},
  kermanshah:{name:'کرمانشاه', lat:34.3142,lng:47.0650,zoom:12},
  kerman:   {name:'کرمان',    lat:30.2839,lng:57.0834,zoom:12},
  kish:     {name:'کیش',      lat:26.5267,lng:53.9800,zoom:13},
  qom:      {name:'قم',       lat:34.6401,lng:50.8764,zoom:12},
  arak:     {name:'اراک',     lat:34.0917,lng:49.6892,zoom:12},
  urmia:    {name:'ارومیه',   lat:37.5527,lng:45.0761,zoom:12},
  hamadan:  {name:'همدان',    lat:34.7993,lng:48.5146,zoom:12},
}

const MAP_STYLES = {
  normal:  {label:'🗺 معمولی', tileFilter:'none',             overlay:'none'},
  game:    {label:'🎮 گیم',    tileFilter:'saturate(1.9) contrast(1.15) hue-rotate(8deg) brightness(0.92)', overlay:'none'},
  dark:    {label:'🌙 تاریک',  tileFilter:'brightness(0.25) saturate(0.4)', overlay:'rgba(8,12,35,0.80)'},
  cartoon: {label:'🎨 کارتون', tileFilter:'saturate(2.4) contrast(1.2) brightness(1.08)', overlay:'none'},
}

const CAFE_COLORS = ['#FF6B35','#FF3D71','#FFD700','#00E096','#0095FF','#FF708D','#7B61FF','#FF9A3C']

const ASSETS = {
  sword:  {emoji:'⚔️', label:'شمشیر گریفیندور'},
  crown:  {emoji:'👑', label:'تاج طلایی'},
  gem:    {emoji:'💎', label:'الماس آبی'},
  star:   {emoji:'⭐', label:'ستاره نقره'},
  potion: {emoji:'🧪', label:'جادوی قهوه'},
}

export default function Home() {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mksRef   = useRef({})
  const tileRef  = useRef(null)
  const overlayRef = useRef(null)

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
  const [isLandscape,setIsLandscape]= useState(false)

  // detect orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toast_ = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }, [])

  // fetch cafes
  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/cafes?select=*&is_active=eq.true`, {
      headers: {'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`}
    }).then(r=>r.json()).then(d=>setCafes(Array.isArray(d)?d:[]))
      .catch(()=>{})
  }, [])

  // simulate live counts — realtime
  useEffect(() => {
    if (!cafes.length) return
    const update = () => {
      const c = {}
      cafes.forEach(cafe => {
        c[cafe.id] = Math.floor(Math.random()*15)
      })
      setLiveCount(c)
    }
    update()
    const t = setInterval(update, 3000)
    return () => clearInterval(t)
  }, [cafes])

  // update live badges on markers without re-rendering
  useEffect(() => {
    cafes.forEach(cafe => {
      const el = document.getElementById(`badge-${cafe.id}`)
      if (el) {
        const n = liveCount[cafe.id] || 0
        el.textContent = n > 0 ? n : ''
        el.style.display = n > 0 ? 'flex' : 'none'
      }
    })
  }, [liveCount, cafes])

  // init leaflet
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
        center:[c.lat,c.lng], zoom:c.zoom,
        zoomControl:false, attributionControl:false
      })
      tileRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19})
      tileRef.current.addTo(m)
      mapInst.current = m
      setMapReady(true)
    }
    document.head.appendChild(js)
  }, [])

  // apply map style filter
  useEffect(() => {
    const tiles = document.querySelectorAll('.leaflet-tile')
    const MS = MAP_STYLES[mapStyle]
    tiles.forEach(t => { t.style.filter = MS.tileFilter })
  })

  // fly to city
  useEffect(() => {
    if (!mapInst.current) return
    const c = CITIES[city]
    mapInst.current.flyTo([c.lat,c.lng],c.zoom,{duration:1.2})
  }, [city])

  // add markers
  useEffect(() => {
    if (!mapReady || !cafes.length || !window.L) return
    const L = window.L
    cafes.forEach(cafe => {
      if (mksRef.current[cafe.id]) return
      const color = CAFE_COLORS[Math.abs(cafe.name.charCodeAt(0)+cafe.name.charCodeAt(1))%CAFE_COLORS.length]
      const hasAsset = cafe.is_top
      const assetEmoji = hasAsset ? '⚔️' : ''
      const live = liveCount[cafe.id] || 0

      const html = `
        <div style="position:relative;cursor:pointer;width:44px;height:52px" class="cafe-mk">
          <div style="
            background:${color};
            border:3px solid white;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            width:40px;height:40px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 16px ${color}99;
            transition:transform .2s
          ">
            <span style="transform:rotate(45deg);font-size:18px">☕</span>
          </div>
          ${hasAsset ? `<div style="position:absolute;top:-8px;right:-2px;font-size:14px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">${assetEmoji}</div>` : ''}
          <div id="badge-${cafe.id}" style="
            position:absolute;top:-6px;left:-4px;
            background:#FF3B30;color:white;
            border:2px solid white;border-radius:99px;
            font-size:9px;font-weight:800;
            min-width:18px;height:18px;
            display:${live>0?'flex':'none'};
            align-items:center;justify-content:center;
            padding:0 3px;
            box-shadow:0 2px 6px rgba(255,59,48,.5);
            font-family:system-ui,sans-serif
          ">${live>0?live:''}</div>
        </div>`

      const icon = L.divIcon({html, iconSize:[44,52], iconAnchor:[22,52], className:''})
      const mk = L.marker([cafe.lat, cafe.lng], {icon})
        .on('click', () => setSelCafe(cafe))
        .addTo(mapInst.current)
      mksRef.current[cafe.id] = mk
    })
  }, [mapReady, cafes])

  // filter markers
  const filtered = cafes.filter(c => {
    const zOk = zone==='all' || c.zone===zone || (zone==='top' && c.is_top)
    const sOk = !search || c.name.includes(search)
    return zOk && sOk
  })

  useEffect(() => {
    if (!mapReady) return
    Object.entries(mksRef.current).forEach(([id,m]) => {
      const show = filtered.find(c=>c.id===id)
      try {
        if (show) { if (!mapInst.current.hasLayer(m)) m.addTo(mapInst.current) }
        else mapInst.current.removeLayer(m)
      } catch(e){}
    })
  }, [filtered, mapReady])

  const MS = MAP_STYLES[mapStyle]

  // layout vars
  const TOPBAR_H = isLandscape ? 48 : 56
  const FILTER_H = 40
  const BOTTOM_H = isLandscape ? 52 : 64
  const PANEL_W  = isLandscape ? 260 : 240

  return (
    <div style={{
      height:'100dvh', width:'100vw',
      display:'flex', flexDirection:'column',
      fontFamily:"'Vazirmatn',sans-serif",
      direction:'rtl',
      background:'#0d1520',
      overflow:'hidden',
      position:'fixed', inset:0
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
        .cafe-mk:active > div:first-child{transform:rotate(-45deg) scale(1.15)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes slideRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes badgePop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
        .leaflet-container{background:#1a2332!important}
        .leaflet-control-attribution{display:none!important}
        input::placeholder{color:rgba(255,255,255,.3)}
        input:focus{border-color:rgba(255,107,53,.5)!important;box-shadow:0 0 0 3px rgba(255,107,53,.1)}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{
        height:TOPBAR_H, flexShrink:0,
        background:'rgba(13,21,32,.95)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,.07)',
        padding:`0 ${isLandscape?12:14}px`,
        display:'flex', alignItems:'center', gap:8,
        zIndex:200,
        boxShadow:'0 2px 20px rgba(0,0,0,.5)'
      }}>
        <button onClick={()=>setShowMenu(v=>!v)} style={{
          background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)',
          borderRadius:10, width:36, height:36, cursor:'pointer',
          fontSize:16, color:'white', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>☰</button>

        <div style={{
          fontSize: isLandscape?15:17, fontWeight:900,
          color:'white', letterSpacing:-0.5, flexShrink:0
        }}>
          🏙️ Twin<span style={{color:'#FF6B35'}}>Land</span>
        </div>

        <div style={{flex:1, position:'relative'}}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="جستجو..."
            style={{
              width:'100%',
              background:'rgba(255,255,255,.07)',
              border:'1px solid rgba(255,255,255,.1)',
              borderRadius:10, padding:`6px ${isLandscape?10:12}px`,
              fontSize:12, fontFamily:'inherit', outline:'none',
              color:'white', transition:'all .2s'
            }}
          />
        </div>

        <button onClick={()=>setShowStyle(true)} style={{
          background:'rgba(255,107,53,.12)',
          border:'1px solid rgba(255,107,53,.25)',
          borderRadius:10, padding:'6px 9px',
          cursor:'pointer', fontSize:11,
          color:'#FF6B35', fontFamily:'inherit',
          whiteSpace:'nowrap', flexShrink:0, fontWeight:600
        }}>{MS.label.split(' ')[0]}</button>

        <button onClick={()=>setShowCity(true)} style={{
          background:'rgba(255,255,255,.07)',
          border:'1px solid rgba(255,255,255,.1)',
          borderRadius:10, padding:'6px 9px',
          cursor:'pointer', fontSize:11,
          color:'rgba(255,255,255,.85)', fontFamily:'inherit',
          whiteSpace:'nowrap', flexShrink:0
        }}>{CITIES[city].name} ▾</button>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        height:FILTER_H, flexShrink:0,
        display:'flex', alignItems:'center',
        gap:6, padding:'0 10px',
        overflowX:'auto', scrollbarWidth:'none',
        background:'rgba(13,21,32,.88)',
        backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(255,255,255,.05)'
      }}>
        {[['all','همه'],['north','شمال'],['center','مرکز'],['east','شرق'],['west','غرب'],['top','⭐برتر']].map(([z,l])=>(
          <button key={z} onClick={()=>setZone(z)} style={{
            flexShrink:0,
            background: zone===z ? '#FF6B35' : 'rgba(255,255,255,.06)',
            border:`1px solid ${zone===z?'#FF6B35':'rgba(255,255,255,.08)'}`,
            borderRadius:99, padding:'4px 12px',
            fontSize:11, fontWeight: zone===z?700:400,
            color: zone===z?'white':'rgba(255,255,255,.55)',
            cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
            transition:'all .2s'
          }}>{l}</button>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div style={{
        flex:1, display:'flex',
        flexDirection: isLandscape ? 'row-reverse' : 'column',
        position:'relative', minHeight:0, overflow:'hidden'
      }}>

        {/* MAP AREA */}
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>

          {/* Map */}
          <div ref={mapRef} style={{position:'absolute',inset:0,zIndex:1}}/>

          {/* Map style overlay */}
          {MS.overlay!=='none' && (
            <div style={{
              position:'absolute',inset:0,zIndex:2,
              background:MS.overlay, pointerEvents:'none',
              transition:'background .6s'
            }}/>
          )}

          {/* Game grid */}
          {mapStyle==='game' && (
            <div style={{
              position:'absolute',inset:0,zIndex:2,pointerEvents:'none',
              backgroundImage:'linear-gradient(rgba(255,180,60,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,180,60,.04) 1px,transparent 1px)',
              backgroundSize:'50px 50px'
            }}/>
          )}

          {/* Live counter pill */}
          <div style={{
            position:'absolute', top:10, right:10, zIndex:10,
            background:'rgba(13,21,32,.88)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,.1)',
            borderRadius:99, padding:'5px 12px',
            display:'flex', gap:10, alignItems:'center',
            fontSize:11, color:'rgba(255,255,255,.7)',
            boxShadow:'0 2px 12px rgba(0,0,0,.3)'
          }}>
            <span>☕ {filtered.length}</span>
            <span style={{color:'rgba(255,255,255,.2)'}}>|</span>
            <span><span style={{color:'#4ade80',fontSize:8}}>●</span> {Object.values(liveCount).reduce((a,b)=>a+b,0)}</span>
          </div>

          {/* NAV CONTROLS */}
          <div style={{
            position:'absolute',
            bottom: isLandscape ? 12 : 16,
            left: isLandscape ? 12 : 14,
            zIndex:10,
            display:'flex', flexDirection:'column', gap:5
          }}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,32px)',gap:3}}>
              {[
                null,{l:'↑',a:()=>mapInst.current?.panBy([0,-80])},null,
                {l:'←',a:()=>mapInst.current?.panBy([80,0])},
                {l:'⌖',a:()=>{const c=CITIES[city];mapInst.current?.flyTo([c.lat,c.lng],c.zoom)}},
                {l:'→',a:()=>mapInst.current?.panBy([-80,0])},
                null,{l:'↓',a:()=>mapInst.current?.panBy([0,80])},null,
              ].map((b,i)=> b ? (
                <button key={i} onClick={b.a} style={{
                  background:'rgba(13,21,32,.88)', backdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:9, width:32, height:32,
                  fontSize:b.l==='⌖'?10:15, cursor:'pointer',
                  color:'rgba(255,255,255,.8)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(0,0,0,.3)',
                  fontWeight: b.l==='⌖'?400:700
                }}>{b.l}</button>
              ) : <div key={i} style={{width:32}}/>)}
            </div>
            <div style={{display:'flex',gap:3}}>
              {[['＋',()=>mapInst.current?.zoomIn()],['－',()=>mapInst.current?.zoomOut()]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{
                  background:'rgba(13,21,32,.88)', backdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:9, width:32, height:32, fontSize:18,
                  cursor:'pointer', color:'rgba(255,255,255,.8)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(0,0,0,.3)'
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* SIDE PANEL — landscape: right side, portrait: bottom sheet */}
        {isLandscape ? (
          <div style={{
            width: panel ? PANEL_W : 0,
            flexShrink:0, overflow:'hidden',
            transition:'width .3s ease',
            background:'rgba(13,21,32,.97)',
            backdropFilter:'blur(20px)',
            borderLeft:'1px solid rgba(255,255,255,.08)',
            position:'relative', zIndex:50,
            display:'flex', flexDirection:'column'
          }}>
            <PanelContent
              cafes={cafes} filtered={filtered}
              liveCount={liveCount} toast_={toast_}
              setSearch={setSearch} width={PANEL_W}
            />
          </div>
        ) : null}

        {/* Portrait panel toggle button */}
        {isLandscape ? (
          <button onClick={()=>setPanel(p=>!p)} style={{
            position:'absolute', left: panel ? PANEL_W : 0,
            top:'50%', transform:'translateY(-50%)',
            zIndex:51,
            background:'rgba(13,21,32,.95)',
            border:'1px solid rgba(255,255,255,.1)',
            borderRight:'none', borderRadius:'8px 0 0 8px',
            width:20, height:48, cursor:'pointer',
            color:'rgba(255,255,255,.5)', fontSize:13,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'left .3s',
            boxShadow:'-2px 0 8px rgba(0,0,0,.3)'
          }}>{panel?'›':'‹'}</button>
        ) : (
          <button onClick={()=>setPanel(p=>!p)} style={{
            position:'absolute', bottom:16, right:16, zIndex:10,
            background:'rgba(13,21,32,.9)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,.1)',
            borderRadius:12, padding:'8px 14px',
            cursor:'pointer', color:'rgba(255,255,255,.8)',
            fontSize:12, fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:6,
            boxShadow:'0 4px 16px rgba(0,0,0,.4)'
          }}>
            📊 داشبورد {panel?'✕':''}
          </button>
        )}

        {/* Portrait panel bottom sheet */}
        {!isLandscape && panel && (
          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            height:'55%', zIndex:50,
            background:'rgba(13,21,32,.97)',
            backdropFilter:'blur(20px)',
            borderRadius:'20px 20px 0 0',
            border:'1px solid rgba(255,255,255,.08)',
            borderBottom:'none',
            animation:'slideUp .3s ease',
            overflow:'hidden', display:'flex', flexDirection:'column'
          }}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,.2)',borderRadius:99,margin:'12px auto 0',flexShrink:0}} onClick={()=>setPanel(false)}/>
            <PanelContent
              cafes={cafes} filtered={filtered}
            

