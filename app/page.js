'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:  {name:'تهران',   lat:35.7219,lng:51.3979,zoom:12},
  isfahan: {name:'اصفهان',  lat:32.6539,lng:51.6660,zoom:12},
  shiraz:  {name:'شیراز',   lat:29.5918,lng:52.5837,zoom:12},
  mashhad: {name:'مشهد',    lat:36.2972,lng:59.6067,zoom:12},
  tabriz:  {name:'تبریز',   lat:38.0962,lng:46.2738,zoom:12},
  karaj:   {name:'کرج',     lat:35.8400,lng:50.9391,zoom:12},
  ahvaz:   {name:'اهواز',   lat:31.3183,lng:48.6706,zoom:12},
  qom:     {name:'قم',      lat:34.6401,lng:50.8764,zoom:12},
}

const MAP_STYLES = {
  normal:   {label:'🗺 معمولی',   filter:'none',                                          overlay:'none'},
  game:     {label:'🎮 گیم',      filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.95)', overlay:'none'},
  dark:     {label:'🌙 تاریک',    filter:'brightness(0.3) saturate(0.5)',                overlay:'rgba(10,15,40,0.82)'},
  cartoon:  {label:'🎨 کارتون',   filter:'saturate(2.2) contrast(1.3) brightness(1.05)', overlay:'none'},
}

export default function Home() {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mksRef   = useRef({})

  const [cafes,     setCafes]     = useState([])
  const [city,      setCity]      = useState('tehran')
  const [mapStyle,  setMapStyle]  = useState('normal')
  const [zone,      setZone]      = useState('all')
  const [search,    setSearch]    = useState('')
  const [selCafe,   setSelCafe]   = useState(null)
  const [favs,      setFavs]      = useState(new Set())
  const [likes,     setLikes]     = useState(new Set())
  const [tab,       setTab]       = useState('map')
  const [panel,     setPanel]     = useState(true)
  const [showMenu,  setShowMenu]  = useState(false)
  const [showCity,  setShowCity]  = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [toast,     setToast]     = useState(null)
  const [mapReady,  setMapReady]  = useState(false)
  const [liveCount, setLiveCount] = useState({})

  const toast_ = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }, [])

  // fetch cafes
  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/cafes?select=*&is_active=eq.true`, {
      headers: {'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`}
    }).then(r=>r.json()).then(d=>setCafes(Array.isArray(d)?d:[]))
  }, [])

  // simulate live counts
  useEffect(() => {
    const update = () => {
      const counts = {}
      cafes.forEach(c => { counts[c.id] = Math.floor(Math.random()*12) })
      setLiveCount(counts)
    }
    update()
    const t = setInterval(update, 5000)
    return () => clearInterval(t)
  }, [cafes])

  // init map
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
      const m = L.map(mapRef.current, {center:[c.lat,c.lng],zoom:c.zoom,zoomControl:false,attributionControl:false})
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m)
      mapInst.current = m
      setMapReady(true)
    }
    document.head.appendChild(js)
  }, [])

  // fly to city
  useEffect(() => {
    if (!mapInst.current) return
    const c = CITIES[city]
    mapInst.current.flyTo([c.lat,c.lng],c.zoom,{duration:1.2})
  }, [city])

  // markers
  useEffect(() => {
    if (!mapReady || !cafes.length) return
    const iv = setInterval(() => {
      if (!window.L) return
      clearInterval(iv)
      const L = window.L
      cafes.forEach(c => {
        if (mksRef.current[c.id]) return
        const mk = buildMarker(L, c)
        mk.on('click', () => setSelCafe(c))
        mk.addTo(mapInst.current)
        mksRef.current[c.id] = mk
      })
    }, 200)
    return () => clearInterval(iv)
  }, [mapReady, cafes])

  function buildMarker(L, c) {
    const colors = ['#FF6B6B','#FF8E53','#FFC300','#36D986','#4FC3F7','#CE93D8']
    const color = c.is_top ? '#FF6B35' : colors[Math.abs(c.name.charCodeAt(0))%colors.length]
    const live = liveCount[c.id] || 0
    const html = `
      <div style="position:relative;cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3))">
        <div style="
          background:${color};
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px ${color}88
        ">
          <span style="transform:rotate(45deg);font-size:16px">☕</span>
        </div>
        ${live>0?`<div style="position:absolute;top:-6px;right:-6px;background:#FF3B30;color:white;border-radius:99px;font-size:9px;font-weight:700;padding:1px 5px;border:2px solid white;min-width:18px;text-align:center">${live}</div>`:''}
      </div>`
    return L.divIcon({html, iconSize:[36,42], iconAnchor:[18,42], className:''})
  }

  // filter markers
  const filtered = cafes.filter(c => {
    const zOk = zone==='all' || c.zone===zone
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
  const PANEL_W = 220

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',fontFamily:"'Vazirmatn',sans-serif",direction:'rtl',background:'#0f1923',overflow:'hidden',position:'relative'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{display:none}
        .mk-hover:hover{transform:scale(1.1)!important}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .panel-section{border-bottom:1px solid rgba(255,255,255,.06);padding:12px 0}
        .nav-btn{transition:all .2s}
        .nav-btn:hover{background:rgba(255,255,255,.1)!important}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        background:'rgba(15,25,35,.92)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,.08)',
        padding:'10px 14px',
        display:'flex', alignItems:'center', gap:10,
        zIndex:200, flexShrink:0,
        boxShadow:'0 4px 24px rgba(0,0,0,.4)'
      }}>
        {/* Logo */}
        <div style={{fontSize:18,fontWeight:900,color:'white',letterSpacing:-0.5,whiteSpace:'nowrap'}}>
          🏙️ Twin<span style={{color:'#FF6B35'}}>Land</span>
        </div>

        {/* Search */}
        <div style={{flex:1,position:'relative',maxWidth:200}}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 جستجو..."
            style={{
              width:'100%', background:'rgba(255,255,255,.08)',
              border:'1px solid rgba(255,255,255,.12)',
              borderRadius:12, padding:'7px 12px',
              fontSize:12, fontFamily:'inherit', outline:'none',
              color:'white', backdropFilter:'blur(10px)'
            }}
          />
        </div>

        {/* Map Style */}
        <button onClick={()=>setShowStyle(true)} style={{
          background:'rgba(255,107,53,.15)', border:'1px solid rgba(255,107,53,.3)',
          borderRadius:10, padding:'7px 10px', cursor:'pointer',
          fontSize:12, color:'#FF6B35', fontFamily:'inherit', whiteSpace:'nowrap'
        }}>{MS.label}</button>

        {/* City */}
        <button onClick={()=>setShowCity(true)} style={{
          background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
          borderRadius:10, padding:'7px 12px', cursor:'pointer',
          fontSize:12, color:'white', fontFamily:'inherit', whiteSpace:'nowrap'
        }}>{CITIES[city].name} ▾</button>

        {/* Menu */}
        <button onClick={()=>setShowMenu(true)} style={{
          background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
          borderRadius:10, padding:'7px 10px', cursor:'pointer', fontSize:18
        }}>☰</button>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        display:'flex', gap:6, padding:'7px 12px',
        overflowX:'auto', flexShrink:0, scrollbarWidth:'none',
        background:'rgba(15,25,35,.85)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(255,255,255,.06)'
      }}>
        {[['all','🗺 همه'],['north','⬆ شمال'],['center','⬛ مرکز'],['east','➡ شرق'],['west','⬅ غرب'],['top','⭐ برتر']].map(([z,l])=>(
          <button key={z} onClick={()=>setZone(z)} style={{
            flexShrink:0,
            background: zone===z ? '#FF6B35' : 'rgba(255,255,255,.06)',
            border:`1px solid ${zone===z?'#FF6B35':'rgba(255,255,255,.1)'}`,
            borderRadius:99, padding:'5px 13px',
            fontSize:11, color: zone===z ? 'white' : 'rgba(255,255,255,.6)',
            cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
            transition:'all .2s'
          }}>{l}</button>
        ))}
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{flex:1,display:'flex',position:'relative',minHeight:0,overflow:'hidden'}}>

        {/* LEFT PANEL */}
        <div style={{
          width: panel ? PANEL_W : 0,
          flexShrink:0, overflow:'hidden',
          transition:'width .3s ease',
          background:'rgba(15,25,35,.95)',
          backdropFilter:'blur(20px)',
          borderLeft:'1px solid rgba(255,255,255,.08)',
          position:'relative', zIndex:100,
          display:'flex', flexDirection:'column'
        }}>
          <div style={{width:PANEL_W, overflowY:'auto', flex:1, padding:'10px 0'}}>

            {/* Panel Header */}
            <div style={{padding:'8px 16px 12px', borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,.4)',letterSpacing:1,textTransform:'uppercase'}}>داشبورد</div>
            </div>

            {/* Stats */}
            <div className="panel-section" style={{padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:.5}}>آمار زنده</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {[['☕',cafes.length,'کافه'],['👥',Object.values(liveCount).reduce((a,b)=>a+b,0),'آنلاین'],['⭐',cafes.filter(c=>c.is_top).length,'برتر'],['🔍',filtered.length,'فیلتر']].map(([icon,val,lbl])=>(
                  <div key={lbl} style={{background:'rgba(255,255,255,.05)',borderRadius:10,padding:'8px 10px',border:'1px solid rgba(255,255,255,.06)'}}>
                    <div style={{fontSize:16}}>{icon}</div>
                    <div style={{fontSize:16,fontWeight:700,color:'white',marginTop:2}}>{val}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="panel-section" style={{padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:.5}}>فیلتر سریع</div>
              {[['🌅','صبحانه','صبحانه'],['🌙','شبانه','شبانه'],['📚','با کتاب','کتاب'],['🎵','موسیقی','موسیقی'],['🛋','دنج','دنج'],['☕','اسپشالتی','اسپشالتی']].map(([icon,lbl,tag])=>(
                <button key={tag} onClick={()=>{setSearch(tag);toast_(`🔍 ${lbl}`)}} style={{
                  width:'100%',display:'flex',alignItems:'center',gap:8,
                  background:'transparent',border:'none',cursor:'pointer',
                  padding:'7px 4px',borderRadius:8,color:'rgba(255,255,255,.7)',
                  fontSize:13,fontFamily:'inherit',textAlign:'right',
                  transition:'background .15s'
                }} className="nav-btn">
                  <span style={{fontSize:16}}>{icon}</span>{lbl}
                </button>
              ))}
            </div>

            {/* Events */}
            <div className="panel-section" style={{padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:.5}}>رویداد‌های فعال</div>
              <div style={{background:'linear-gradient(135deg,rgba(255,107,53,.2),rgba(255,107,53,.05))',border:'1px solid rgba(255,107,53,.3)',borderRadius:12,padding:'10px 12px'}}>
                <div style={{fontSize:18,marginBottom:4}}>⚔️</div>
                <div style={{fontSize:12,fontWeight:700,color:'white'}}>شمشیر گریفیندور</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:3,lineHeight:1.4}}>کافه‌های غرب تهران • امروز</div>
                <div style={{marginTop:8,background:'#FF6B35',borderRadius:8,padding:'5px 10px',fontSize:11,color:'white',textAlign:'center',cursor:'pointer'}} onClick={()=>toast_('🎮 در حال ورود به رویداد...')}>شرکت در رویداد</div>
              </div>
            </div>

            {/* Clans */}
            <div className="panel-section" style={{padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:.5}}>کلن‌ها</div>
              {[['🦁','شیرهای تهران','۲۳ عضو'],['🐺','گرگ‌های شب','۱۷ عضو'],['🦊','روباه‌های هوشمند','۱۲ عضو']].map(([icon,name,members])=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 4px',borderRadius:8,cursor:'pointer'}} onClick={()=>toast_(`🛡 ${name}`)}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <div>
                    <div style={{fontSize:12,color:'white',fontWeight:600}}>{name}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{members}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="panel-section" style={{padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:.5}}>برترین‌ها</div>
              {[['🥇','کاشف_دانی','۱۲۴۰ XP'],['🥈','قهوه‌باز','۹۸۰ XP'],['🥉','تهران‌گرد','۸۴۰ XP']].map(([medal,name,xp])=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 4px'}}>
                  <span style={{fontSize:18}}>{medal}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'white'}}>{name}</div>
                    <div style={{fontSize:10,color:'#FF6B35'}}>{xp}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* PANEL TOGGLE */}
        <button onClick={()=>setPanel(p=>!p)} style={{
          position:'absolute', right: panel ? PANEL_W : 0,
          top:'50%', transform:'translateY(-50%)',
          zIndex:101, background:'rgba(15,25,35,.95)',
          border:'1px solid rgba(255,255,255,.1)',
          borderRight:'none', borderRadius:'8px 0 0 8px',
          width:20, height:48, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'rgba(255,255,255,.5)', fontSize:12,
          transition:'right .3s'
        }}>{panel?'›':'‹'}</button>

        {/* MAP CONTAINER */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>

          {/* Map tiles */}
          <div ref={mapRef} style={{
            position:'absolute', inset:0,
            filter: MS.filter,
            transition:'filter .5s'
          }}/>

          {/* Dark overlay for navy mode */}
          {MS.overlay !== 'none' && (
            <div style={{
              position:'absolute', inset:0, zIndex:2,
              background: MS.overlay,
              pointerEvents:'none',
              transition:'background .5s'
            }}/>
          )}

          {/* Game mode grid overlay */}
          {mapStyle==='game' && (
            <div style={{
              position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
              backgroundImage:'linear-gradient(rgba(255,200,100,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,100,.03) 1px,transparent 1px)',
              backgroundSize:'40px 40px'
            }}/>
          )}

          {/* NAV CONTROLS */}
          <div style={{position:'absolute',bottom:16,left:16,zIndex:10,display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,34px)',gap:3}}>
              {[
                null,{l:'↑',a:()=>mapInst.current?.panBy([0,-80])},null,
                {l:'←',a:()=>mapInst.current?.panBy([80,0])},
                {l:'⌖',a:()=>{const c=CITIES[city];mapInst.current?.flyTo([c.lat,c.lng],c.zoom)}},
                {l:'→',a:()=>mapInst.current?.panBy([-80,0])},
                null,{l:'↓',a:()=>mapInst.current?.panBy([0,80])},null,
              ].map((b,i)=> b ? (
                <button key={i} onClick={b.a} style={{
                  background:'rgba(15,25,35,.85)', backdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:10, width:34, height:34,
                  fontSize:b.l==='⌖'?11:16, cursor:'pointer',
                  color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(0,0,0,.3)'
                }}>{b.l}</button>
              ) : <div key={i}/>)}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              {[['＋',()=>mapInst.current?.zoomIn()],['－',()=>mapInst.current?.zoomOut()]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{
                  background:'rgba(15,25,35,.85)', backdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:10, width:34, height:34, fontSize:20,
                  cursor:'pointer', color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(0,0,0,.3)'
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Live counter */}
          <div style={{
            position:'absolute', top:10, left:panel?10:10, zIndex:10,
            background:'rgba(15,25,35,.85)', backdropFilter:'blur(10px)',
            border:'1px solid rgba(255,255,255,.1)',
            borderRadius:12, padding:'6px 12px',
            fontSize:12, color:'rgba(255,255,255,.8)',
            display:'flex', gap:10
          }}>
            <span>☕ {filtered.length}</span>
            <span style={{color:'rgba(255,255,255,.3)'}}>|</span>
            <span style={{color:'#4ade80'}}>● {Object.values(liveCount).reduce((a,b)=>a+b,0)} آنلاین</span>
          </div>

        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        background:'rgba(15,25,35,.95)', backdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(255,255,255,.08)',
        display:'flex', flexShrink:0,
        boxShadow:'0 -4px 24px rgba(0,0,0,.4)'
      }}>
        {[['🗺','نقشه','map'],['📋','ماموریت','missions'],['🛡','کلن','clan'],['🏆','رتبه','rank'],['👤','پروفایل','profile']].map(([icon,lbl,key])=>(
          <button key={key} onClick={()=>{setTab(key);if(key!=='map')toast_(`📣 ${lbl} به زودی!`)}} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:2, background:'none', border:'none', cursor:'pointer',
            color: tab===key ? '#FF6B35' : 'rgba(255,255,255,.4)',
            fontSize:10, padding:'10px 0', position:'relative', fontFamily:'inherit',
            transition:'color .2s'
          }}>
            <span style={{fontSize:22}}>{icon}</span>{lbl}
            {tab===key && <div style={{position:'absolute',bottom:0,left:'20%',right:'20%',height:2,background:'#FF6B35',borderRadius:'2px 2px 0 0'}}/>}
          </button>
        ))}
      </div>

      {/* ── CAFE SHEET ── */}
      {selCafe && (
        <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}} onClick={()=>setSelCafe(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:'absolute',bottom:0,left:0,right:0,
            background:'rgba(15,25,35,.98)',
            backdropFilter:'blur(20px)',
            borderRadius:'24px 24px 0 0',
            border:'1px solid rgba(255,255,255,.08)',
            maxHeight:'88vh', overflowY:'auto',
            animation:'slideIn .3s ease'
          }}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,.2)',borderRadius:99,margin:'14px auto 0'}}/>
            {/* Header */}
            <div style={{
              background:'linear-gradient(135deg,rgba(255,107,53,.2),rgba(255,107,53,.05))',
              padding:'14px 18px', display:'flex', alignItems:'center', gap:14, marginTop:10,
              borderBottom:'1px solid rgba(255,255,255,.06)'
            }}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(255,107,53,.2)',border:'2px solid rgba(255,107,53,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>☕</div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:700,color:'white'}}>{selCafe.name}</div>
                <div style={{fontSize:12,color:'#FF6B35',marginTop:3}}>📍 {selCafe.description}</div>
                <div style={{color:'#FFD700',fontSize:14,marginTop:3}}>{selCafe.is_top?'★★★★★':'★★★☆☆'}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:700,color:'#4ade80'}}>{liveCount[selCafe.id]||0}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>الان اینجا</div>
              </div>
            </div>

            <div style={{padding:'14px 18px'}}>
              {/* Tags */}
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                {selCafe.tags?.map(t=>(
                  <span key={t} style={{background:'rgba(255,107,53,.1)',border:'1px solid rgba(255,107,53,.2)',borderRadius:99,fontSize:11,color:'#FF6B35',padding:'3px 10px'}}>{t}</span>
                ))}
              </div>

              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                {[['☕',`+${selCafe.is_top?30:20}`,'XP'],['⏰','۸صبح-۱۰شب','ساعات'],['🏅',selCafe.is_top?'طلایی':'عادی','رتبه']].map(([icon,val,lbl])=>(
                  <div key={lbl} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
                    <div style={{fontSize:18}}>{icon}</div>
                    <div style={{fontSize:14,fontWeight:700,color:'white',marginTop:4}}>{val}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginTop:2}}>{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Reactions */}
              <div style={{display:'flex',gap:8,marginBottom:14}}>
                {[
                  {icon:'👍',lbl:'لایک',s:likes,fn:setLikes},
                  {icon:'❤️',lbl:'عشق',s:new Set(),fn:()=>{}},
                  {icon:'🔖',lbl:'ذخیره',s:favs,fn:setFavs},
                  {icon:'📤',lbl:'اشتراک',s:new Set(),fn:()=>toast_('🔗 لینک کپی شد!')},
                ].map(({icon,lbl,s,fn})=>{
                  const on = s.has?.(selCafe.id)
                  return (
                    <button key={lbl} onClick={()=>{
                      if(s.has){const n=new Set(s);on?n.delete(selCafe.id):n.add(selCafe.id);fn(n)}else fn()
                      if(s.has)toast_(on?'حذف شد':`${icon} ثبت شد`)
                    }} style={{
                      flex:1,background:on?'rgba(255,107,53,.2)':'rgba(255,255,255,.05)',
                      border:`1px solid ${on?'rgba(255,107,53,.4)':'rgba(255,255,255,.08)'}`,
                      borderRadius:12,padding:'9px 4px',fontSize:12,
                      cursor:'pointer',color:'white',fontFamily:'inherit',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                      transition:'all .2s'
                    }}>
                      <span style={{fontSize:18}}>{icon}</span>
                      <span style={{fontSize:10,color:'rgba(255,255,255,.5)'}}>{on&&s.has?'✓':lbl}</span>
                    </button>
                  )
                })}
              </div>

              {/* Actions */}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>{toast_(`✅ چک‌این! +${selCafe.is_top?30:20} XP`);setSelCafe(null)}} style={{
                  flex:1,background:'linear-gradient(135deg,#FF6B35,#FF8E53)',
                  color:'white',border:'none',borderRadius:14,padding:14,
                  fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                  boxShadow:'0 4px 20px rgba(255,107,53,.4)',
                  animation:'pulse 2s infinite'
                }}>📍 چک‌این کن</button>
                <a href={`https://www.google.com/maps?q=${selCafe.lat},${selCafe.lng}`} target="_blank" style={{
                  background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:14,padding:'14px 16px',fontSize:18,textDecoration:'none',
                  display:'flex',alignItems:'center'
                }}>🗺</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CITY PICKER ── */}
      {showCity && (
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.7)',backdropFilter:'blur(12px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowCity(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:'rgba(15,25,35,.98)',backdropFilter:'blur(20px)',
            borderRadius:'28px 28px 0 0',padding:'20px 20px 44px',
            width:'100%',maxWidth:480,
            border:'1px solid rgba(255,255,255,.08)',
            animation:'slideIn .3s ease'
          }}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,.2)',borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:700,color:'white',textAlign:'center',marginBottom:18}}>🏙️ انتخاب شهر</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {Object.entries(CITIES).map(([k,v])=>(
                <button key={k} onClick={()=>{setCity(k);setShowCity(false);toast_(`✈️ رفتیم ${v.name}!`)}} style={{
                  background: city===k ? 'rgba(255,107,53,.2)' : 'rgba(255,255,255,.05)',
                  border:`1.5px solid ${city===k?'#FF6B35':'rgba(255,255,255,.1)'}`,
                  borderRadius:14,padding:'14px',fontSize:15,
                  fontWeight:city===k?700:400,
                  color:city===k?'#FF6B35':'rgba(255,255,255,.8)',
                  cursor:'pointer',fontFamily:'inherit',transition:'all .2s'
                }}>{v.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAP STYLE PICKER ── */}
      {showStyle && (
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.7)',backdropFilter:'blur(12px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowStyle(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:'rgba(15,25,35,.98)',backdropFilter:'blur(20px)',
            borderRadius:'28px 28px 0 0',padding:'20px 20px 44px',
            width:'100%',maxWidth:480,
            border:'1px solid rgba(255,255,255,.08)'
          }}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,.2)',borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:700,color:'white',textAlign:'center',marginBottom:18}}>🎨 استایل نقشه</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {Object.entries(MAP_STYLES).map(([k,v])=>(
                <button key={k} onClick={()=>{setMapStyle(k);setShowStyle(false);toast_(`${v.label} فعال شد`)}} style={{
                  background: mapStyle===k ? 'rgba(255,107,53,.2)' : 'rgba(255,255,255,.05)',
                  border:`1.5px solid ${mapStyle===k?'#FF6B35':'rgba(255,255,255,.1)'}`,
                  borderRadius:14,padding:'16px',fontSize:14,
                  fontWeight:mapStyle===k?700:400,
                  color:mapStyle===k?'#FF6B35':'rgba(255,255,255,.8)',
                  cursor:'pointer',fontFamily:'inherit',transition:'all .2s'
                }}>{v.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HAMBURGER MENU ── */}
      {showMenu && (
        <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)'}} onClick={()=>setShowMenu(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:'absolute',top:60,left:14,right:14,
            background:'rgba(20,30,45,.96)',
            backdropFilter:'blur(24px)',
            WebkitBackdropFilter:'blur(24px)',
            borderRadius:20,
            border:'1px solid rgba(255,255,255,.1)',
            padding:'8px 0',
            boxShadow:'0 8px 40px rgba(0,0,0,.6)',
            animation:'fadeIn .2s ease'
          }}>
            {[
              ['🗺','نقشه','map'],['🎮','رویداد‌ها','events'],['🛡','کلن‌ها','clans'],
              ['🏆','رتبه‌بندی','rank'],['💬','چت زنده','chat'],['❤️','علاقه‌مندی‌ها','favs'],
              ['⚙️','تنظیمات','settings'],['👤','پروفایل','profile'],
            ].map(([icon,lbl,key],i)=>(
              <button key={key} onClick={()=>{setShowMenu(false);setTab(key);if(!['map'].includes(key))toast_(`📣 ${lbl} به زودی!`)}} style={{
                width:'100%',display:'flex',alignItems:'center',gap:12,
                background:'transparent',border:'none',cursor:'pointer',
                padding:'12px 18px',color:'rgba(255,255,255,.85)',
                fontSize:14,fontFamily:'inherit',textAlign:'right',
                borderBottom: i<7 ? '1px solid rgba(255,255,255,.05)' : 'none',
                transition:'background .15s'
              }} className="nav-btn">
                <span style={{fontSize:20,width:28}}>{icon}</span>{lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',
          zIndex:4000,background:'rgba(15,25,35,.95)',
          backdropFilter:'blur(20px)',
          color:'white',borderRadius:99,
          padding:'10px 22px',fontSize:13,fontWeight:600,
          whiteSpace:'nowrap',
          border:'1px solid rgba(255,255,255,.15)',
          boxShadow:'0 4px 20px rgba(0,0,0,.4)',
          animation:'fadeIn .2s ease'
        }}>{toast}</div>
      )}
    </div>
  )
}
