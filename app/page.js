'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SUPABASE_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SUPABASE_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:  { name:'تهران',   lat:35.7219, lng:51.3979, zoom:12 },
  isfahan: { name:'اصفهان',  lat:32.6539, lng:51.6660, zoom:12 },
  shiraz:  { name:'شیراز',   lat:29.5918, lng:52.5837, zoom:12 },
  mashhad: { name:'مشهد',    lat:36.2972, lng:59.6067, zoom:12 },
  tabriz:  { name:'تبریز',   lat:38.0962, lng:46.2738, zoom:12 },
  karaj:   { name:'کرج',     lat:35.8400, lng:50.9391, zoom:12 },
}

const THEMES = {
  pastel:  { bg:'#FFF8F0', accent:'#FF8FA3', card:'#FFD9B7', text:'#6B4226', muted:'#A08C8C' },
  dark:    { bg:'#1a1a2e', accent:'#e94560', card:'#16213e', text:'#eaeaea', muted:'#888' },
  nature:  { bg:'#f0faf0', accent:'#2d8a4e', card:'#b5ead7', text:'#1a4a2e', muted:'#5a8a6e' },
  ocean:   { bg:'#e8f4fd', accent:'#1a6fb5', card:'#b8e0ff', text:'#0a2a4a', muted:'#4a7fa5' },
}

export default function Home() {
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const markersRef = useRef({})

  const [cafes,    setCafes]    = useState([])
  const [city,     setCity]     = useState('tehran')
  const [theme,    setTheme]    = useState('pastel')
  const [zone,     setZone]     = useState('all')
  const [search,   setSearch]   = useState('')
  const [selCafe,  setSelCafe]  = useState(null)
  const [favs,     setFavs]     = useState(new Set())
  const [likes,    setLikes]    = useState(new Set())
  const [tab,      setTab]      = useState('map')
  const [showCity, setShowCity] = useState(false)
  const [showTheme,setShowTheme]= useState(false)
  const [toast,    setToast]    = useState(null)
  const [mapReady, setMapReady] = useState(false)

  const T = THEMES[theme]

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // fetch cafes
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/cafes?select=*&is_active=eq.true`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).then(d => setCafes(Array.isArray(d) ? d : []))
  }, [])

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
      const m = L.map(mapRef.current, { center:[c.lat,c.lng], zoom:c.zoom, zoomControl:false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(m)
      mapInst.current = m
      setMapReady(true)
    }
    document.head.appendChild(js)
  }, [])

  // fly to city
  useEffect(() => {
    if (!mapInst.current) return
    const c = CITIES[city]
    mapInst.current.flyTo([c.lat, c.lng], c.zoom, { duration: 1 })
  }, [city])

  // add markers
  useEffect(() => {
    if (!mapReady || !cafes.length) return
    const interval = setInterval(() => {
      if (!window.L) return
      clearInterval(interval)
      const L = window.L
      cafes.forEach(c => {
        if (markersRef.current[c.id]) return
        const color = c.is_top ? '#FFE66D' : T.accent
        const icon = L.divIcon({
          html: `<div style="position:relative;width:40px;height:48px">
            <div style="background:white;border:3px solid ${color};border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 12px rgba(0,0,0,.2);cursor:pointer">☕</div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin:0 auto"></div>
          </div>`,
          iconSize:[40,48], iconAnchor:[20,48], className:''
        })
        const marker = L.marker([c.lat, c.lng], { icon })
          .on('click', () => setSelCafe(c))
          .addTo(mapInst.current)
        markersRef.current[c.id] = marker
      })
    }, 200)
    return () => clearInterval(interval)
  }, [mapReady, cafes])

  const filtered = cafes.filter(c => {
    const zoneOk = zone === 'all' || c.zone === zone
    const searchOk = !search || c.name.includes(search)
    return zoneOk && searchOk
  })

  useEffect(() => {
    if (!mapReady || !window.L) return
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const show = filtered.find(c => c.id === id)
      if (show) { if (!mapInst.current.hasLayer(m)) m.addTo(mapInst.current) }
      else mapInst.current.removeLayer(m)
    })
  }, [filtered, mapReady])

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', fontFamily:'Vazirmatn,sans-serif', direction:'rtl', background:T.bg, overflow:'hidden', position:'relative' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap'); * { box-sizing:border-box; margin:0; padding:0 }`}</style>

      {/* TOPBAR */}
      <div style={{ background:'white', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:`2px solid ${T.card}`, boxShadow:'0 2px 8px rgba(0,0,0,.08)', zIndex:100, flexShrink:0 }}>
        <div style={{ fontSize:17, fontWeight:700, color:T.text, flex:1 }}>🏙️ Twin<span style={{ color:T.accent }}>Land</span></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو..." style={{ border:`1.5px solid ${T.card}`, borderRadius:99, padding:'5px 12px', fontSize:13, fontFamily:'inherit', outline:'none', width:120, background:T.bg, color:T.text }} />
        <button onClick={()=>setShowTheme(true)} style={{ background:T.card, border:'none', borderRadius:99, padding:'6px 10px', cursor:'pointer', fontSize:14 }}>🎨</button>
        <button onClick={()=>setShowCity(true)} style={{ background:T.accent, border:'none', borderRadius:99, padding:'6px 12px', cursor:'pointer', fontSize:12, color:'white', fontFamily:'inherit', fontWeight:600 }}>{CITIES[city].name} ▾</button>
      </div>

      {/* FILTER BAR */}
      <div style={{ display:'flex', gap:6, padding:'7px 12px', overflowX:'auto', background:T.bg, flexShrink:0, scrollbarWidth:'none' }}>
        {[['all','🗺 همه'],['north','⬆ شمال'],['center','⬛ مرکز'],['east','➡ شرق'],['west','⬅ غرب']].map(([z,l]) => (
          <button key={z} onClick={()=>setZone(z)} style={{ flexShrink:0, background:zone===z?T.accent:'white', border:`1.5px solid ${zone===z?T.accent:T.card}`, borderRadius:99, padding:'5px 12px', fontSize:12, color:zone===z?'white':T.muted, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>{l}</button>
        ))}
      </div>

      {/* MAP */}
      <div style={{ flex:1, position:'relative', minHeight:0 }}>
        <div ref={mapRef} style={{ position:'absolute', inset:0 }} />

        {/* NAV CONTROLS */}
        <div style={{ position:'absolute', bottom:14, left:14, zIndex:400, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,34px)', gap:3 }}>
            {[
              null, {l:'⬆️',a:()=>mapInst.current?.panBy([0,-80])}, null,
              {l:'⬅️',a:()=>mapInst.current?.panBy([80,0])},
              {l:'⌖', a:()=>{const c=CITIES[city];mapInst.current?.flyTo([c.lat,c.lng],c.zoom)}},
              {l:'➡️',a:()=>mapInst.current?.panBy([-80,0])},
              null, {l:'⬇️',a:()=>mapInst.current?.panBy([0,80])}, null,
            ].map((b,i) => b ? (
              <button key={i} onClick={b.a} style={{ background:'white', border:`1.5px solid ${T.card}`, borderRadius:10, width:34, height:34, fontSize:b.l==='⌖'?11:14, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>{b.l}</button>
            ) : <div key={i}/>)}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {[['＋',()=>mapInst.current?.zoomIn()],['－',()=>mapInst.current?.zoomOut()]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{ background:'white', border:`1.5px solid ${T.card}`, borderRadius:10, width:34, height:34, fontSize:19, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:T.text }}>{l}</button>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ position:'absolute', top:10, right:10, zIndex:400, background:'white', borderRadius:12, padding:'6px 12px', boxShadow:'0 2px 8px rgba(0,0,0,.1)', fontSize:12, color:T.muted }}>
          ☕ {filtered.length} کافه
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div style={{ background:'white', borderTop:`2px solid ${T.card}`, display:'flex', flexShrink:0 }}>
        {[['🗺','نقشه','map'],['📋','ماموریت','missions'],['🛡','کلن','clan'],['🏆','رتبه','rank'],['👤','پروفایل','profile']].map(([icon,lbl,key])=>(
          <button key={key} onClick={()=>{ setTab(key); if(key!=='map') showToast(`📣 ${lbl} به زودی!`) }} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, background:'none', border:'none', cursor:'pointer', color:tab===key?T.accent:T.muted, fontSize:10, padding:'10px 0', position:'relative', fontFamily:'inherit' }}>
            <span style={{ fontSize:21 }}>{icon}</span>{lbl}
            {tab===key && <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:3, background:T.accent, borderRadius:'3px 3px 0 0' }}/>}
          </button>
        ))}
      </div>

      {/* CAFE SHEET */}
      {selCafe && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.3)', backdropFilter:'blur(4px)' }} onClick={()=>setSelCafe(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderRadius:'24px 24px 0 0', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, background:T.card, borderRadius:99, margin:'14px auto 0' }}/>
            <div style={{ background:`linear-gradient(135deg,${T.card},${T.accent}33)`, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginTop:10 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, boxShadow:'0 2px 8px rgba(0,0,0,.1)', flexShrink:0 }}>☕</div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:T.text }}>{selCafe.name}</div>
                <div style={{ fontSize:12, color:T.accent, marginTop:3 }}>📍 {selCafe.description}</div>
                <div style={{ color:'#FFE66D', fontSize:13, marginTop:2 }}>{selCafe.is_top?'★★★★★':'★★★☆☆'}</div>
              </div>
            </div>
            <div style={{ padding:'12px 16px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                {selCafe.tags?.map(t=><span key={t} style={{ background:T.bg, border:`1px solid ${T.card}`, borderRadius:99, fontSize:11, color:T.text, padding:'2px 9px' }}>{t}</span>)}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
                {[['☕','چک‌این','—'],['⭐','امتیاز',selCafe.is_top?'۳۰':'۲۰'],['👥','الان اینجا','—']].map(([icon,lbl,val])=>(
                  <div key={lbl} style={{ background:T.bg, borderRadius:11, padding:'8px 4px', textAlign:'center' }}>
                    <div style={{ fontSize:16 }}>{icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{val}</div>
                    <div style={{ fontSize:9, color:T.muted }}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:7, marginBottom:12 }}>
                {[
                  {icon:'👍', label:'لایک', set:likes, setFn:setLikes},
                  {icon:'❤️', label:'عشق', set:loves, setFn:()=>{}},
                  {icon:'🔖', label:'ذخیره', set:favs, setFn:setFavs},
                ].map(({icon,label,set,setFn})=>{
                  const on = set.has(selCafe.id)
                  return <button key={label} onClick={()=>{ const n=new Set(set); on?n.delete(selCafe.id):n.add(selCafe.id); setFn(n); showToast(on?'حذف شد':`${icon} ثبت شد`) }} style={{ flex:1, background:on?T.accent+'22':'white', border:`1.5px solid ${on?T.accent:T.card}`, borderRadius:10, padding:'8px 4px', fontSize:12, cursor:'pointer', color:T.text, fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>{on?'✓':label}
                  </button>
                })}
                <button onClick={()=>showToast('🔗 لینک کپی شد!')} style={{ background:'white', border:`1.5px solid ${T.card}`, borderRadius:10, padding:'8px 12px', fontSize:18, cursor:'pointer' }}>📤</button>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={{ flex:1, background:`linear-gradient(135deg,${T.accent},${T.card})`, color:'white', border:'none', borderRadius:12, padding:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={()=>{ showToast('✅ چک‌این ثبت شد! +'+( selCafe.is_top?30:20)+' XP'); setSelCafe(null) }}>📍 چک‌این</button>
                <a href={`https://www.google.com/maps?q=${selCafe.lat},${selCafe.lng}`} target="_blank" style={{ background:T.bg, border:`1.5px solid ${T.card}`, borderRadius:12, padding:'12px 14px', fontSize:16, textDecoration:'none' }}>🗺</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CITY PICKER */}
      {showCity && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setShowCity(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:480 }}>
            <div style={{ width:40, height:4, background:T.card, borderRadius:99, margin:'0 auto 16px' }}/>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, textAlign:'center', marginBottom:16 }}>انتخاب شهر 🏙️</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {Object.entries(CITIES).map(([k,v])=>(
                <button key={k} onClick={()=>{ setCity(k); setShowCity(false); showToast(`✈️ رفتیم ${v.name}!`) }} style={{ background:city===k?T.accent:T.bg, border:`2px solid ${city===k?T.accent:T.card}`, borderRadius:14, padding:'14px', fontSize:15, fontWeight:city===k?700:400, color:city===k?'white':T.text, cursor:'pointer', fontFamily:'inherit' }}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THEME PICKER */}
      {showTheme && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setShowTheme(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:480 }}>
            <div style={{ width:40, height:4, background:T.card, borderRadius:99, margin:'0 auto 16px' }}/>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, textAlign:'center', marginBottom:16 }}>تم سایت 🎨</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['pastel','🌸 پاستل'],['dark','🌙 تاریک'],['nature','🌿 طبیعت'],['ocean','🌊 اقیانوس']].map(([k,l])=>(
                <button key={k} onClick={()=>{ setTheme(k); setShowTheme(false); showToast('🎨 تم تغییر کرد!') }} style={{ background:THEMES[k].bg, border:`2px solid ${theme===k?THEMES[k].accent:THEMES[k].card}`, borderRadius:14, padding:'14px', fontSize:14, fontWeight:theme===k?700:400, color:THEMES[k].text, cursor:'pointer', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', zIndex:3000, background:T.text, color:'white', borderRadius:99, padding:'10px 22px', fontSize:13, fontWeight:600, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
