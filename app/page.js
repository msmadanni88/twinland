'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, DEFAULT_MODE, buildC, loadPrefs, savePalette, saveMode } from './palettes'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES = {
  tehran:  { name:'تهران',  lat:35.7219, lng:51.3979, zoom:12 },
  mashhad: { name:'مشهد',   lat:36.2972, lng:59.6067, zoom:12 },
  isfahan: { name:'اصفهان', lat:32.6539, lng:51.6660, zoom:12 },
  shiraz:  { name:'شیراز',  lat:29.5918, lng:52.5837, zoom:12 },
  tabriz:  { name:'تبریز',  lat:38.0962, lng:46.2738, zoom:12 },
  karaj:   { name:'کرج',    lat:35.8400, lng:50.9391, zoom:12 },
  rasht:   { name:'رشت',    lat:37.2809, lng:49.5831, zoom:12 },
  kish:    { name:'کیش',    lat:26.5267, lng:53.9800, zoom:13 },
}

const XP_CONFIG = {
  checkin:20, checkin_top:30, checkin_first:50, streak_bonus:10, event_bonus:40,
}

const LEVELS = [
  { level:1, name:'تازه‌وارد',  minXP:0,    icon:'🌱', color:'#8BC34A' },
  { level:2, name:'کافه‌رو',    minXP:100,  icon:'☕', color:'#FF9800' },
  { level:3, name:'کاشف',      minXP:300,  icon:'🔍', color:'#2196F3' },
  { level:4, name:'ماجراجو',   minXP:600,  icon:'⚡', color:'#9C27B0' },
  { level:5, name:'اسطوره',    minXP:1000, icon:'🏆', color:'#FF5722' },
  { level:6, name:'افسانه‌ای', minXP:2000, icon:'👑', color:'#FFD700' },
]

function getLevelInfo(xp) {
  let current = LEVELS[0], next = LEVELS[1]
  for (let i=0;i<LEVELS.length;i++) {
    if (xp>=LEVELS[i].minXP) { current=LEVELS[i]; next=LEVELS[i+1]||null }
  }
  const progress = next ? ((xp-current.minXP)/(next.minXP-current.minXP))*100 : 100
  return { current, next, progress: Math.min(progress,100) }
}

const MISSIONS = [
  { id:'m1',icon:'☕',title:'اولین قدم',     desc:'اولین چک‌این خود را ثبت کن',          xp:50,  total:1, done:0, type:'daily'  },
  { id:'m2',icon:'🔥',title:'استریک ۳ روزه', desc:'۳ روز پشت‌هم چک‌این کن',              xp:80,  total:3, done:2, type:'streak' },
  { id:'m3',icon:'⭐',title:'کافه‌های برتر',  desc:'۵ کافه طلایی را کشف کن',              xp:120, total:5, done:1, type:'weekly' },
  { id:'m4',icon:'🗺',title:'کاشف شمال',     desc:'تمام کافه‌های شمال تهران را ببین',     xp:150, total:8, done:3, type:'weekly' },
  { id:'m5',icon:'👥',title:'اجتماعی',       desc:'با ۳ نفر هم‌زمان چک‌این کن',          xp:100, total:3, done:0, type:'social' },
  { id:'m6',icon:'⚔️',title:'رویداد گریفیندور',desc:'در رویداد ویژه شرکت کن',           xp:200, total:1, done:0, type:'event'  },
  { id:'m7',icon:'🌙',title:'شب‌گرد',        desc:'۳ بار بعد از ۱۰ شب چک‌این کن',       xp:90,  total:3, done:1, type:'daily'  },
  { id:'m8',icon:'📚',title:'کتاب‌خوان',     desc:'۲ بار در کافه کتاب چک‌این کن',        xp:70,  total:2, done:2, type:'weekly' },
]

// رنگ‌ها (C) حالا داخل کامپوننت از پالت فعال ساخته می‌شوند — به palettes.js نگاه کن

const MAP_MODES = [
  { key:'normal',  label:'🗺 معمولی', filter:'none' },
  { key:'game',    label:'🎮 گیم',    filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.88)' },
  { key:'dark',    label:'🌙 تاریک',  filter:'brightness(0.25) saturate(0.3) hue-rotate(200deg)' },
  { key:'cartoon', label:'🎨 کارتون', filter:'saturate(2.2) contrast(1.3) brightness(1.05)' },
]

const ZONES = [
  { key:'all',    label:'همه' },
  { key:'north',  label:'⬆ شمال', lat:35.766, lng:51.41 },
  { key:'center', label:'⬛ مرکز', lat:35.703, lng:51.41 },
  { key:'east',   label:'➡ شرق',  lat:35.721, lng:51.50 },
  { key:'west',   label:'⬅ غرب',  lat:35.728, lng:51.34 },
  { key:'top',    label:'⭐ برتر' },
]

const NAV = [
  { key:'map',      img:'icon_map',     label:'نقشه'    },
  { key:'missions', img:'icon_mission', label:'ماموریت' },
  { key:'clan',     img:'icon_clan',    label:'کلن'     },
  { key:'rank',     img:'icon_rank',    label:'رتبه'    },
  { key:'profile',  img:'icon_profile', label:'پروفایل' },
]

const QUICK_FILTERS = [
  {tag:'صبحانه',icon:'🌅'},{tag:'شبانه',icon:'🌙'},
  {tag:'کتاب',icon:'📚'},{tag:'موسیقی',icon:'🎵'},
  {tag:'دنج',icon:'🛋'},{tag:'اسپشالتی',icon:'☕'},
]

const CAFE_COLORS = ['#FF6B35','#E84393','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']
function getColor(name) {
  let h=0; for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h)
  return CAFE_COLORS[Math.abs(h)%CAFE_COLORS.length]
}

// ── BOUNDARY LAYERS (استان‌ها / مناطق تهران) ───────────────────────────────────
const BOUNDARY_SOURCES = {
  province: { url:'/iran_provinces.json', label:'استان‌ها' },
  district: { url:'/tehran_districts.json', label:'مناطق تهران' },
}

const MOCK_CAFES = [
  {id:'c1',name:'کافه نادری', lat:35.6992,lng:51.4165,description:'خیابان نادری، مرکز',  zone:'center',is_top:true, tags:['کلاسیک','صبحانه']},
  {id:'c2',name:'کافه فرانسه',lat:35.7580,lng:51.4080,description:'تجریش، شمال تهران',   zone:'north', is_top:true, tags:['فرانسوی','دنج','اسپشالتی']},
  {id:'c3',name:'دیوار قهوه', lat:35.7450,lng:51.3750,description:'ولنجک، شمال تهران',   zone:'north', is_top:false,tags:['مدرن','کتاب']},
  {id:'c4',name:'کافه بام',   lat:35.7600,lng:51.3700,description:'درکه، شمال تهران',    zone:'north', is_top:true, tags:['روباز','موسیقی','شبانه']},
  {id:'c5',name:'کافه پانیذ', lat:35.7100,lng:51.4600,description:'میدان آرژانتین',      zone:'center',is_top:false,tags:['صبحانه','خانگی']},
  {id:'c6',name:'اسپرسو لاو', lat:35.7300,lng:51.5100,description:'تهرانپارس، شرق',      zone:'east',  is_top:false,tags:['اسپشالتی']},
  {id:'c7',name:'کافه ژاله',  lat:35.7050,lng:51.3200,description:'ستارخان، غرب تهران',  zone:'west',  is_top:false,tags:['دنج','شبانه']},
  {id:'c8',name:'تریا سبز',   lat:35.6890,lng:51.3850,description:'انقلاب، مرکز تهران',  zone:'center',is_top:true, tags:['کتاب','دانشجویی']},
]

const BP = { mobile:640, tablet:1024 }

export default function TwinLand() {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mksRef   = useRef({})

  const [cafes,      setCafes]      = useState([])
  const [city,       setCity]       = useState('tehran')
  const [mapMode,    setMapMode]    = useState('normal')
  const [zone,       setZone]       = useState('all')
  const [search,     setSearch]     = useState('')
  const [selCafe,    setSelCafe]    = useState(null)
  const [tab,        setTab]        = useState('map')
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [panelTab,   setPanelTab]   = useState('dashboard')
  const [showMenu,   setShowMenu]   = useState(false)
  const [showCity,   setShowCity]   = useState(false)
  const [showMode,   setShowMode]   = useState(false)
  const [showXP,     setShowXP]     = useState(false)
  const [toast,      setToast]      = useState(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [live,       setLive]       = useState({})
  const [checkedIn,  setCheckedIn]  = useState(new Set())
  const [favs,       setFavs]       = useState(new Set())
  const [xp,         setXp]         = useState(340)
  const [streak,     setStreak]     = useState(3)
  const [xpAnim,     setXpAnim]     = useState(null)
  const [vw,         setVw]         = useState(800)
  const [boundaryMode, setBoundaryMode] = useState('off') // 'off' | 'province' | 'district'
  const [showBoundary, setShowBoundary] = useState(false)
  const [paletteKey, setPaletteKey] = useState(DEFAULT_PALETTE)
  const [themeMode,  setThemeMode]  = useState(DEFAULT_MODE)
  const [showPalette, setShowPalette] = useState(false)

  // ساخت آبجکت رنگ از پالت فعال (هر بار که پالت یا حالت روز/شب عوض شه)
  const C = useMemo(()=>buildC(paletteKey, themeMode), [paletteKey, themeMode])

  // خواندن انتخاب ذخیره‌شده کاربر هنگام بازشدن
  useEffect(()=>{
    const p = loadPrefs()
    setPaletteKey(p.palette)
    setThemeMode(p.mode)
  },[])

  function pickPalette(key){ setPaletteKey(key); savePalette(key) }
  function toggleMode(){ const next = themeMode==='dark'?'light':'dark'; setThemeMode(next); saveMode(next) }
  const boundaryLayerRef = useRef(null)
  const boundaryDataRef  = useRef({})

  useEffect(()=>{
    const check=()=>setVw(window.innerWidth)
    check()
    window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[])

  const isMobile  = vw < BP.mobile
  const isDesktop = vw >= BP.tablet
  const levelInfo = getLevelInfo(xp)

  // فقط روی دسکتاپ واقعی (با ماوس) پنل auto-open بشه
  useEffect(()=>{
    if(typeof window==='undefined') return
    const hasMouse = window.matchMedia('(pointer:fine)').matches
    if(isDesktop && hasMouse) setPanelOpen(true)
  },[isDesktop])

  const showToast = useCallback((msg,type='info')=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),2800)
  },[])

  const gainXP = useCallback((amount)=>{
    setXp(prev=>prev+amount); setXpAnim({amount}); setTimeout(()=>setXpAnim(null),1800)
  },[])

  useEffect(()=>{
    fetch(SB_URL+'/rest/v1/cafes?select=*&is_active=eq.true',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{
      const list = (Array.isArray(d)&&d.length) ? d : MOCK_CAFES
      setCafes(list)
    }).catch(()=>setCafes(MOCK_CAFES))
  },[])

  // اگه بعد از ۲ ثانیه هنوز کافه‌ای نیومد، mock رو بذار
  useEffect(()=>{
    const t=setTimeout(()=>{ setCafes(prev=>prev.length?prev:MOCK_CAFES) },2000)
    return ()=>clearTimeout(t)
  },[])

  useEffect(()=>{
    if(!cafes.length) return
    const update=()=>{ const c={}; cafes.forEach(cafe=>{c[cafe.id]=Math.floor(Math.random()*12)}); setLive(c) }
    update(); const t=setInterval(update,4000); return ()=>clearInterval(t)
  },[cafes])

  useEffect(()=>{
    cafes.forEach(cafe=>{
      const el=document.getElementById('lv-'+cafe.id); if(!el) return
      const n=live[cafe.id]||0; el.textContent=n>0?String(n):''; el.style.display=n>0?'flex':'none'
    })
  },[live,cafes])

  // ── MAP INIT با proxy tile ──
  useEffect(()=>{
    if(mapInst.current||!mapRef.current) return
    let mounted=true

    const timer=setTimeout(()=>{
      if(!mounted||!mapRef.current) return

      const loadLeaflet=(cb)=>{
        if(window.L){ cb(); return }
        const css=document.createElement('link'); css.rel='stylesheet'
        css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        document.head.appendChild(css)
        const js=document.createElement('script')
        js.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
        js.onload=cb
        js.onerror=()=>{
          const js2=document.createElement('script')
          js2.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          js2.onload=cb; document.head.appendChild(js2)
        }
        document.head.appendChild(js)
      }

      loadLeaflet(()=>{
        if(!mounted||!mapRef.current||mapInst.current) return
        try {
          const L=window.L
          const c=CITIES.tehran
          const m=L.map(mapRef.current,{
            center:[c.lat,c.lng],zoom:c.zoom,
            zoomControl:false,attributionControl:false,preferCanvas:true
          })

          // ── TILE از proxy خودمون ──
          // اگه روی localhost هستی از CDN مستقیم میاد، روی Vercel از proxy
          const isLocal = typeof window!=='undefined' && (window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')

          const tileUrl = isLocal
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : '/api/tiles/{z}/{x}/{y}.png'

          const tileOpts = isLocal
            ? { maxZoom:19, subdomains:'abc' }
            : { maxZoom:19 }

          const mainLayer = L.tileLayer(tileUrl, tileOpts)
          let tileLoaded=false

          mainLayer.on('tileload',()=>{
            if(!tileLoaded){ tileLoaded=true; setMapLoading(false) }
          })
          mainLayer.on('tileerror',()=>{
            // fallback به CartoDB
            if(!tileLoaded) {
              mainLayer.remove()
              L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                {maxZoom:19,subdomains:'abcd'}
              ).addTo(m)
              setMapLoading(false)
            }
          })
          mainLayer.addTo(m)

          // اگه ۸ ثانیه tile نیومد loading رو ببند
          setTimeout(()=>{ if(!tileLoaded) setMapLoading(false) },8000)

          mapInst.current=m
          setMapReady(true)
        } catch(e){ setMapLoading(false) }
      })
    },150)

    return ()=>{ mounted=false; clearTimeout(timer) }
  },[])

  useEffect(()=>{
    const pane=document.querySelector('.leaflet-tile-pane') 
    if(pane){ const mode=MAP_MODES.find(m=>m.key===mapMode); pane.style.filter=mode?mode.filter:'none'; pane.style.transition='filter .5s' }
  })

  useEffect(()=>{
    if(!mapInst.current) return
    const c=CITIES[city]; mapInst.current.flyTo([c.lat,c.lng],c.zoom,{duration:1.2})
  },[city])

  useEffect(()=>{
    if(!mapReady||!cafes.length||!window.L||!mapInst.current) return
    const L=window.L
    cafes.forEach(cafe=>{
      if(mksRef.current[cafe.id]) return
      const color=getColor(cafe.name); const n=live[cafe.id]||0; const isChecked=checkedIn.has(cafe.id)
      const html=`<div style="position:relative;width:44px;height:52px;cursor:pointer;filter:drop-shadow(0 4px 8px ${color}55)">
        <div style="background:${isChecked?C.green:color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15)">
          <span style="transform:rotate(45deg);font-size:18px">${isChecked?'✓':'☕'}</span>
        </div>
        ${cafe.is_top?'<div style="position:absolute;top:-10px;right:-4px;font-size:14px">⭐</div>':''}
        <div id="lv-${cafe.id}" style="position:absolute;top:-6px;left:-4px;background:#FF3B30;color:white;border:2px solid white;border-radius:99px;font-size:9px;font-weight:800;min-width:18px;height:18px;display:${n>0?'flex':'none'};align-items:center;justify-content:center;padding:0 3px">${n>0?n:''}</div>
      </div>`
      const icon=L.divIcon({html,iconSize:[44,52],iconAnchor:[22,52],className:''})
      const mk=L.marker([cafe.lat,cafe.lng],{icon})
      mk.on('click',()=>setSelCafe(cafe)); mk.addTo(mapInst.current); mksRef.current[cafe.id]=mk
    })
  },[mapReady,cafes,checkedIn])

  const filtered=cafes.filter(c=>{
    const zOk=zone==='all'||c.zone===zone||(zone==='top'&&c.is_top)
    const sOk=!search||c.name.includes(search); return zOk&&sOk
  })

  useEffect(()=>{
    if(!mapReady||!mapInst.current) return
    Object.entries(mksRef.current).forEach(([id,mk])=>{
      const show=filtered.find(c=>c.id===id)
      try{ if(show){if(!mapInst.current.hasLayer(mk))mk.addTo(mapInst.current)} else mapInst.current.removeLayer(mk) }catch(e){}
    })
  },[zone,search,mapReady,filtered])

  function panMap(x,y){ mapInst.current?.panBy([x,y],{animate:true}) }
  function goZone(z){
    setZone(z.key)
    if(z.lat&&mapInst.current) mapInst.current.flyTo([z.lat,z.lng],13)
    else if(z.key==='all'&&mapInst.current){ const c=CITIES[city]; mapInst.current.flyTo([c.lat,c.lng],c.zoom) }
  }

  // ── BOUNDARY LAYER (استان‌ها / مناطق تهران) ──
  useEffect(()=>{
    if(!mapReady||!window.L||!mapInst.current) return
    const L=window.L
    if(boundaryLayerRef.current){
      mapInst.current.removeLayer(boundaryLayerRef.current)
      boundaryLayerRef.current=null
    }
    if(boundaryMode==='off') return
    let cancelled=false

    const styleFor=(idx)=>{
      const on=idx>0
      const color=on?'#000000':'#8E8E93'
      return {color,weight:on?2.5:1.3,fillColor:color,fillOpacity:on?0.32:0,opacity:on?0.95:0.5}
    }

    const render=(data)=>{
      if(cancelled||!mapInst.current) return
      const regionState={}
      const layer=L.geoJSON(data,{
        style:()=>styleFor(0),
        onEachFeature:(feature,lyr)=>{
          const name=feature.properties.name||'—'
          regionState[name]=0
          lyr.bindTooltip(name,{sticky:true,direction:'top',className:'boundary-tip'})
          lyr.on('click',(e)=>{
            L.DomEvent.stopPropagation(e)
            regionState[name]=regionState[name]?0:1
            lyr.setStyle(styleFor(regionState[name]))
            showToast(regionState[name]>0?'⬛ '+name:'⬜ '+name+' خاموش شد')
          })
        }
      })
      layer.addTo(mapInst.current)
      boundaryLayerRef.current=layer
    }

    if(boundaryDataRef.current[boundaryMode]){
      render(boundaryDataRef.current[boundaryMode])
    } else {
      fetch(BOUNDARY_SOURCES[boundaryMode].url).then(r=>r.json()).then(data=>{
        boundaryDataRef.current[boundaryMode]=data
        render(data)
      }).catch(()=>showToast('خطا در بارگذاری مرزها'))
    }
    return ()=>{ cancelled=true }
  },[boundaryMode,mapReady,showToast])

  function doCheckin(cafe){
    if(checkedIn.has(cafe.id)){ showToast('قبلاً اینجا بودی!','warn'); return }
    const isFirst=checkedIn.size===0
    const earned=(cafe.is_top?XP_CONFIG.checkin_top:XP_CONFIG.checkin)+(isFirst?XP_CONFIG.checkin_first:0)+(streak>=3?XP_CONFIG.streak_bonus:0)
    const prevLevel=getLevelInfo(xp).current.level
    gainXP(earned); setCheckedIn(prev=>new Set([...prev,cafe.id]))
    const newLevel=getLevelInfo(xp+earned).current.level
    if(newLevel>prevLevel) setTimeout(()=>showToast(`🎉 لول آپ! ${getLevelInfo(xp+earned).current.name}`,'level'),400)
    else showToast(`✅ چک‌این! +${earned} XP`,'xp')
    setSelCafe(null)
  }

  const TH=isMobile?52:56, BH=isMobile?58:62
  const PANEL_W=isDesktop?300:280
  const panelIsOverlay=!isDesktop
  const totalLive=Object.values(live).reduce((a,b)=>a+b,0)

  return (
    <div style={{height:'100dvh',width:'100vw',display:'flex',flexDirection:'column',fontFamily:"'Estedad','Vazirmatn',system-ui,sans-serif",direction:'rtl',background:C.bg,overflow:'hidden',position:'fixed',inset:0}}>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
        button{cursor:pointer;transition:opacity .15s,transform .1s}
        button:active{opacity:.75;transform:scale(.96)}
        input{outline:none}
        input::placeholder{color:#AEAEB2}
        .leaflet-container{background:#E8E4DC !important}
        .leaflet-control-attribution{display:none !important}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpFloat{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-44px) scale(1.2)}100%{opacity:0;transform:translateY(-70px) scale(.9)}}
        @keyframes shimmer{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
        .xp-float{animation:xpFloat 1.8s ease forwards}
        .mission-bar{transition:width .8s ease}
        .boundary-tip{background:rgba(28,28,30,.88)!important;color:#fff!important;border:none!important;border-radius:8px!important;font-family:'Vazirmatn',sans-serif!important;font-size:11px!important;font-weight:600!important;padding:4px 9px!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important}
        .boundary-tip::before{display:none!important}
      `}}/>

      {/* TOPBAR */}
      <div style={{height:TH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid '+C.border,padding:'0 12px',display:'flex',alignItems:'center',gap:8,zIndex:300}}>
        <button onClick={()=>setShowMenu(v=>!v)} style={{background:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:C.text}}>☰</button>
        <img src="/twinland_logo.webp" alt="TwinLand" style={{height:isMobile?32:38,width:'auto',flexShrink:0,objectFit:'contain',display:'block'}}/>

        {!isMobile&&(
          <button onClick={()=>setShowXP(true)} style={{flex:1,background:C.chip,border:'1.5px solid '+C.border,borderRadius:10,padding:'5px 10px',display:'flex',flexDirection:'column',gap:3,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:10,color:C.sub}}>{levelInfo.current.icon} {levelInfo.current.name}</span>
              <span style={{fontSize:10,fontWeight:700,color:C.accent}}>{xp} XP</span>
            </div>
            <div style={{height:5,background:C.border,borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:levelInfo.progress+'%',background:'linear-gradient(90deg,'+C.accent+',#FF9500)',borderRadius:99,transition:'width .6s'}}/>
            </div>
          </button>
        )}
        {isMobile&&<div style={{flex:1}}/>}

        <button onClick={()=>setPanelOpen(v=>!v)} style={{background:panelOpen?C.accent:C.chip,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:panelOpen?'white':C.sub,fontFamily:'inherit',fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
          {panelOpen?<span style={{fontSize:15,fontWeight:800}}>✕</span>:<img src="/dashboard@256.png" alt="داشبورد" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>}{!isMobile&&<span>{panelOpen?'بستن':'پنل'}</span>}
        </button>
        <button onClick={()=>setShowMode(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>
          <img src="/map_style@256.png" alt="استایل نقشه" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>
        </button>
        <button onClick={()=>setShowBoundary(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src={boundaryMode!=='off'?"/boundaries@256.png":"/boundaries@256_disabled.png"} alt="مرزبندی" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span> مرزها</span>}
        </button>
        <button onClick={()=>setShowPalette(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:14,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src="/theme@256.png" alt="پالت" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span style={{fontSize:12}}> پالت</span>}
        </button>
        <button onClick={()=>setShowCity(true)} style={{background:C.accent,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:'white',fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
          {CITIES[city].name} ▾
        </button>
      </div>

      {/* FILTER BAR */}
      <div style={{height:38,flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'0 12px',overflowX:'auto',scrollbarWidth:'none',background:C.glassDark,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border}}>
        {ZONES.map(z=>(
          <button key={z.key} onClick={()=>goZone(z)} style={{flexShrink:0,background:zone===z.key?C.accent:C.chip,border:'none',borderRadius:99,padding:'4px 13px',fontSize:11,fontWeight:zone===z.key?700:400,color:zone===z.key?'white':C.text,whiteSpace:'nowrap',fontFamily:'inherit',transition:'all .2s'}}>{z.label}</button>
        ))}
        <div style={{width:1,height:18,background:C.border,flexShrink:0,margin:'0 2px'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 جستجو..."
          style={{background:search?C.accentL:'transparent',border:'1.5px solid '+(search?C.accent:'transparent'),borderRadius:99,padding:'3px 12px',fontSize:11,fontFamily:'inherit',color:C.text,width:110,flexShrink:0,transition:'all .2s'}}/>
      </div>

      {/* BODY */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>

        {/* MAP */}
        <div style={{position:'absolute',inset:0,zIndex:1}}>
          <div ref={mapRef} style={{position:'absolute',inset:0}}/>

          {mapMode==='dark'&&<div style={{position:'absolute',inset:0,pointerEvents:'none',background:'rgba(4,8,28,.72)',zIndex:2}}/>}

          {/* LOADING SKELETON */}
          {mapLoading&&(
            <div style={{position:'absolute',inset:0,zIndex:5,background:'#E8E4DC',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
              <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
                {/* شبیه‌سازی tile‌های نقشه */}
                {Array.from({length:20}).map((_,i)=>(
                  <div key={i} style={{position:'absolute',width:256,height:256,left:(i%5)*256,top:Math.floor(i/5)*256,background:'#DDD9D0',border:'1px solid #C8C4BB',overflow:'hidden'}}>
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.4) 50%,transparent 100%)',animation:'shimmer 1.8s infinite',animationDelay:(i*0.1)+'s'}}/>
                  </div>
                ))}
              </div>
              <div style={{zIndex:2,background:'rgba(255,255,255,.9)',backdropFilter:'blur(12px)',borderRadius:20,padding:'20px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)'}}>
                <div style={{fontSize:40}}>🗺️</div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>در حال بارگذاری نقشه...</div>
                <div style={{width:160,height:6,background:C.border,borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,'+C.accent+',#FF9500)',borderRadius:99,animation:'shimmer 1.4s ease infinite'}}/>
                </div>
              </div>
            </div>
          )}

          {/* live pill */}
          <div style={{position:'absolute',top:10,right:(isDesktop&&panelOpen)?PANEL_W+14:10,zIndex:10,transition:'right .35s ease',background:C.glass,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+C.border,borderRadius:99,padding:'5px 13px',display:'flex',gap:8,alignItems:'center',fontSize:11,color:C.sub,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
            <span style={{color:C.text,fontWeight:700}}>☕ {filtered.length}</span>
            <span style={{color:C.border}}>|</span>
            <span><span style={{color:C.green,fontSize:8}}>●</span> {totalLive}</span>
            {checkedIn.size>0&&<><span style={{color:C.border}}>|</span><span style={{color:C.green,fontWeight:700}}>✓ {checkedIn.size}</span></>}
          </div>

          {streak>=2&&<div style={{position:'absolute',top:10,left:10,zIndex:10,background:streak>=5?C.gold:C.accent,borderRadius:12,padding:'5px 10px',fontSize:11,fontWeight:700,color:'white',boxShadow:'0 2px 10px rgba(0,0,0,.15)'}}>🔥 {streak} روز</div>}

          {/* nav controls */}
          <div style={{position:'absolute',bottom:14,left:12,zIndex:10,display:'flex',flexDirection:'column',gap:5}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,32px)',gap:3}}>
              {[{e:1},{l:'↑',fn:()=>panMap(0,-80)},{e:1},{l:'←',fn:()=>panMap(80,0)},{l:'⌖',fn:()=>{const c=CITIES[city];mapInst.current?.flyTo([c.lat,c.lng],c.zoom)}},{l:'→',fn:()=>panMap(-80,0)},{e:1},{l:'↓',fn:()=>panMap(0,80)},{e:1}].map((b,i)=>
                b.e?<div key={i}/>:<button key={i} onClick={b.fn} style={{background:C.glass,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',border:'1px solid '+C.border,borderRadius:9,width:32,height:32,fontSize:b.l==='⌖'?10:15,color:C.text,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,.08)'}}>{b.l}</button>
              )}
            </div>
            <div style={{display:'flex',gap:3}}>
              {[['＋',()=>mapInst.current?.zoomIn()],['－',()=>mapInst.current?.zoomOut()]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{background:C.glass,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',border:'1px solid '+C.border,borderRadius:9,width:32,height:32,fontSize:18,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,.08)'}}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* GLASS PANEL */}
        {panelOpen&&(
          <>
            {panelIsOverlay&&(
              <div onClick={()=>setPanelOpen(false)} style={{position:'absolute',inset:0,zIndex:19,background:'rgba(0,0,0,.25)',backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)'}}/>
            )}
            <div style={{position:'absolute',top:0,right:0,bottom:0,width:PANEL_W,zIndex:20,background:C.glassDark,backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',borderLeft:'1px solid '+C.border,boxShadow:'-4px 0 32px rgba(0,0,0,.12)',display:'flex',flexDirection:'column',animation:panelIsOverlay?'slideUp .3s ease':'fadeIn .2s ease'}}>
              {/* tabs */}
              <div style={{padding:'14px 12px 10px',display:'flex',gap:6,flexShrink:0,borderBottom:'1px solid '+C.border,overflowX:'auto',scrollbarWidth:'none'}}>
                {[{key:'dashboard',icon:'📊',img:null,imgActive:'/dashboard@256.png',imgInactive:'/dashboard@256_disabled.png',label:'داشبورد'},{key:'missions',icon:'📋',img:'icon_mission',label:'ماموریت'},{key:'rank',icon:'🏆',img:'icon_rank',label:'رتبه'},{key:'clan',icon:'🛡',img:'icon_clan',label:'کلن'},{key:'profile',icon:'👤',img:'icon_profile',label:'پروفایل'}].map(t=>(
                  <button key={t.key} onClick={()=>setPanelTab(t.key)} style={{flexShrink:0,background:panelTab===t.key?C.accent:C.chip,border:'none',borderRadius:10,padding:'8px 12px',fontSize:12,fontWeight:700,fontFamily:'inherit',color:panelTab===t.key?'white':C.sub,display:'flex',alignItems:'center',justifyContent:'center',gap:5,whiteSpace:'nowrap'}}>
                    {t.imgActive
                      ? <img src={panelTab===t.key?t.imgActive:t.imgInactive} alt={t.label} width={19} height={19} style={{objectFit:'contain',display:'block'}}/>
                      : t.img
                      ? <img src={'/'+t.img+(panelTab===t.key?'_active':'_inactive')+'_L.png'} alt={t.label} width={18} height={18} style={{objectFit:'contain',display:'block'}}/>
                      : <span>{t.icon}</span>}
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{flex:1,overflowY:'auto',scrollbarWidth:'none'}}>
                {panelTab==='dashboard'&&<DashboardTab C={C} cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} checkedIn={checkedIn} xp={xp} levelInfo={levelInfo} streak={streak} setShowXP={setShowXP}/>}
                {panelTab==='missions'&&<MissionsTab C={C} checkedIn={checkedIn} showToast={showToast}/>}
                {panelTab==='rank'&&<RankTab C={C}/>}
                {panelTab==='clan'&&<ClanTab C={C}/>}
                {panelTab==='profile'&&<ProfileTab C={C} xp={xp} levelInfo={levelInfo} streak={streak} checkedIn={checkedIn}/>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{height:BH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:'1px solid '+C.border,display:'flex',alignItems:'stretch'}}>
        {NAV.map(item=>{
          const active=tab===item.key
          const isz=isMobile?26:30
          const src='/'+item.img+(active?'_active':'_inactive')+'_L.png'
          return <button key={item.key} onClick={()=>{
            setTab(item.key)
            if(item.key==='map'){ setPanelOpen(false); return }
            if(item.key==='missions'){ setPanelOpen(true); setPanelTab('missions'); return }
            if(item.key==='clan'){ setPanelOpen(true); setPanelTab('clan'); return }
            if(item.key==='rank'){ setPanelOpen(true); setPanelTab('rank'); return }
            if(item.key==='profile'){ setPanelOpen(true); setPanelTab('profile'); return }
          }} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'none',border:'none',color:active?C.accent:C.sub,fontSize:isMobile?9:10,position:'relative',fontFamily:'inherit',fontWeight:active?700:400}}>
            <img src={src} alt={item.label} width={isz} height={isz} style={{objectFit:'contain',display:'block'}}/>
            {item.label}
            {active&&<div style={{position:'absolute',bottom:0,left:'20%',right:'20%',height:2.5,background:C.accent,borderRadius:'2px 2px 0 0'}}/>}
          </button>
        })}
      </div>

      {selCafe&&<CafePopup C={C} cafe={selCafe} live={live} favs={favs} setFavs={setFavs} checkedIn={checkedIn} onClose={()=>setSelCafe(null)} onCheckin={()=>doCheckin(selCafe)} showToast={showToast}/>}
      {showXP&&<XPPanel C={C} xp={xp} levelInfo={levelInfo} streak={streak} onClose={()=>setShowXP(false)}/>}

      {showMenu&&(
        <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.3)',backdropFilter:'blur(8px)'}} onClick={()=>setShowMenu(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:TH+8,right:14,left:14,background:C.glassDark,backdropFilter:'blur(24px)',borderRadius:18,border:'1px solid '+C.border,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,.15)',animation:'fadeIn .2s ease'}}>
            {[
              {key:'map',icon:'🗺',img:'/icon_map_active@2x.png',label:'نقشه',href:null},
              {key:'missions',icon:'📋',img:'/icon_mission_active@2x.png',label:'ماموریت‌ها',href:null},
              {key:'profile',icon:'👤',img:'/icon_profile_active@2x.png',label:'پروفایل',href:'/profile'},
              {key:'rank',icon:'🏆',img:'/icon_rank_active@2x.png',label:'رتبه‌بندی',href:'/leaderboard'},
              {key:'clans',icon:'🛡',img:'/icon_clan_active@2x.png',label:'کلن‌ها',href:'/clan'},
              {key:'xp',icon:'⭐',img:'/xp_coin@256-1.png',label:'سیستم XP',href:null},
              {key:'settings',icon:'⚙️',img:'/settings@256.png',label:'تنظیمات',href:null},
            ].map((item,i,arr)=>{
              const style={width:'100%',display:'flex',alignItems:'center',gap:14,background:'transparent',border:'none',padding:'13px 18px',color:C.text,fontSize:14,fontFamily:'inherit',fontWeight:500,borderBottom:i<arr.length-1?'1px solid '+C.border:'none',textDecoration:'none'}
              if(item.href){
                return <a key={item.key} href={item.href} style={style}>
                  {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.label}
                  <span style={{marginRight:'auto',color:C.sub,fontSize:13}}>›</span>
                </a>
              }
              return <button key={item.key} onClick={()=>{setShowMenu(false);if(item.key==='xp'){setShowXP(true);return}if(item.key==='missions'){setPanelOpen(true);setPanelTab('missions');return}if(item.key==='map'){setTab('map');setPanelOpen(false);return}showToast('📣 '+item.label+' به زودی!')}} style={style}>
                {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.label}
              </button>
            })}
          </div>
        </div>
      )}

      {showCity&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowCity(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:540,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',maxHeight:'75dvh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,textAlign:'center',marginBottom:16}}>🏙️ انتخاب شهر</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(CITIES).map(([k,v])=>(
                <button key={k} onClick={()=>{setCity(k);setShowCity(false);showToast('✈️ '+v.name)}} style={{background:city===k?C.accent:C.chip,border:'none',borderRadius:12,padding:'12px 6px',fontSize:12,fontWeight:city===k?800:500,color:city===k?'white':C.text,fontFamily:'inherit'}}>{v.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPalette&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowPalette(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 18px 40px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
            <div style={{fontSize:18,fontWeight:800,color:C.text,textAlign:'center',marginBottom:4}}>🎨 پالت رنگی</div>
            <div style={{fontSize:11,color:C.sub,textAlign:'center',marginBottom:16}}>تم دلخواهت رو انتخاب کن — ذخیره می‌شه</div>

            {/* سوییچ روز / شب */}
            <div style={{display:'flex',background:C.chip,borderRadius:12,padding:4,marginBottom:18}}>
              <button onClick={()=>themeMode!=='light'&&toggleMode()} style={{flex:1,padding:'9px',borderRadius:9,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:800,background:themeMode==='light'?C.accent:'transparent',color:themeMode==='light'?'#fff':C.sub}}>☀️ روز</button>
              <button onClick={()=>themeMode!=='dark'&&toggleMode()} style={{flex:1,padding:'9px',borderRadius:9,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:800,background:themeMode==='dark'?C.accent:'transparent',color:themeMode==='dark'?'#fff':C.sub}}>🌙 شب</button>
            </div>

            {/* لیست پالت‌ها */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {PALETTE_ORDER.map(key=>{
                const p=PALETTES[key]
                const pc=p[themeMode]
                const active=paletteKey===key
                return (
                  <button key={key} onClick={()=>pickPalette(key)} style={{textAlign:'right',background:pc.card,border:active?'2.5px solid '+pc.accent:'1.5px solid '+pc.border,borderRadius:16,padding:'12px',fontFamily:'inherit',cursor:'pointer',position:'relative'}}>
                    <div style={{display:'flex',gap:5,marginBottom:9}}>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.grad||pc.accent,display:'inline-block'}}/>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.chip,display:'inline-block',border:'1px solid '+pc.border}}/>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.bg,display:'inline-block',border:'1px solid '+pc.border}}/>
                    </div>
                    <div style={{fontSize:13,fontWeight:800,color:pc.text}}>{p.emoji} {p.name}</div>
                    {active&&<div style={{position:'absolute',top:8,left:8,width:20,height:20,borderRadius:99,background:pc.accent,color:'#fff',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>✓</div>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showBoundary&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowBoundary(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,textAlign:'center',marginBottom:6}}>🗺️ مرزهای جغرافیایی</div>
            <div style={{fontSize:11,color:C.sub,textAlign:'center',marginBottom:16,lineHeight:1.6}}>روی هر منطقه روی نقشه بزن تا رنگش عوض بشه یا خاموش شه</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[{key:'off',label:'❌ خاموش'},{key:'province',label:'🇮🇷 استان‌های ایران'},{key:'district',label:'🏙️ مناطق ۲۲گانه تهران'}].map(o=>(
                <button key={o.key} onClick={()=>{setBoundaryMode(o.key);setShowBoundary(false);if(o.key!=='off')showToast(BOUNDARY_SOURCES[o.key]?.label+' فعال شد')}} style={{background:boundaryMode===o.key?C.accent:C.chip,border:boundaryMode===o.key?'none':'1.5px solid '+C.border,borderRadius:14,padding:'14px',fontSize:14,fontWeight:boundaryMode===o.key?800:500,color:boundaryMode===o.key?'white':C.text,fontFamily:'inherit',textAlign:'right'}}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showMode&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowMode(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,textAlign:'center',marginBottom:16}}>🎨 استایل نقشه</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {MAP_MODES.map(m=>(
                <button key={m.key} onClick={()=>{setMapMode(m.key);setShowMode(false);showToast(m.label+' فعال شد')}} style={{background:mapMode===m.key?C.accent:C.chip,border:mapMode===m.key?'none':'1.5px solid '+C.border,borderRadius:14,padding:'16px',fontSize:14,fontWeight:mapMode===m.key?800:500,color:mapMode===m.key?'white':C.text,fontFamily:'inherit'}}>{m.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {xpAnim&&<div className="xp-float" style={{position:'fixed',top:'30%',left:'50%',transform:'translateX(-50%)',zIndex:9999,pointerEvents:'none',fontSize:28,fontWeight:900,color:C.accent,textShadow:'0 2px 12px rgba(0,0,0,.2)'}}>+{xpAnim.amount} XP ⭐</div>}

      {toast&&<div style={{position:'fixed',bottom:BH+14,left:'50%',transform:'translateX(-50%)',zIndex:4000,background:toast.type==='xp'?C.accent:toast.type==='level'?C.gold:toast.type==='warn'?'#FF9500':C.text,color:'white',borderRadius:99,padding:'10px 22px',fontSize:13,fontWeight:600,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.2)',animation:'fadeUp .2s ease'}}>{toast.msg}</div>}
    </div>
  )
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
function DashboardTab({C,cafes,filtered,live,totalLive,showToast,setSearch,checkedIn,xp,levelInfo,streak,setShowXP}) {
  return <div>
    <div style={{margin:'14px 12px 0',background:'linear-gradient(135deg,'+levelInfo.current.color+'22,'+levelInfo.current.color+'08)',border:'1.5px solid '+levelInfo.current.color+'33',borderRadius:18,padding:'14px',cursor:'pointer'}} onClick={()=>setShowXP(true)}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:36}}>{levelInfo.current.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.sub}}>لول {levelInfo.current.level} — {levelInfo.current.name}</div>
          <div style={{fontSize:22,fontWeight:900,color:levelInfo.current.color}}>{xp} XP</div>
        </div>
        {streak>=2&&<div style={{textAlign:'center',background:'rgba(255,107,53,.12)',borderRadius:12,padding:'8px 10px'}}>
          <div style={{fontSize:20}}>🔥</div>
          <div style={{fontSize:16,fontWeight:900,color:C.accent}}>{streak}</div>
          <div style={{fontSize:9,color:C.sub}}>روز</div>
        </div>}
      </div>
      {levelInfo.next&&<div style={{marginTop:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:10,color:C.sub}}>تا {levelInfo.next.icon} {levelInfo.next.name}</span>
          <span style={{fontSize:10,fontWeight:700,color:levelInfo.current.color}}>{levelInfo.next.minXP-xp} XP مانده</span>
        </div>
        <div style={{height:8,background:C.chip,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:levelInfo.progress+'%',background:'linear-gradient(90deg,'+levelInfo.current.color+','+C.accent+')',borderRadius:99,transition:'width .6s'}}/>
        </div>
      </div>}
    </div>
    <div style={{padding:'12px 12px 0'}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>آمار زنده</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {[{icon:'☕',val:cafes.length,lbl:'کافه'},{icon:'👥',val:totalLive,lbl:'آنلاین'},{icon:'⭐',val:cafes.filter((c)=>c.is_top).length,lbl:'برتر'},{icon:'✅',val:checkedIn.size,lbl:'رفتم'}].map((item)=>(
          <div key={item.lbl} style={{background:'rgba(0,0,0,.04)',borderRadius:12,padding:'10px'}}>
            <div style={{fontSize:16}}>{item.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:C.text,marginTop:2}}>{item.val}</div>
            <div style={{fontSize:9,color:C.sub,marginTop:1}}>{item.lbl}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)',marginTop:12}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>فیلتر سریع</div>
      {QUICK_FILTERS.map(f=>(
        <button key={f.tag} onClick={()=>{setSearch(f.tag);showToast('🔍 '+f.tag)}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',padding:'8px 4px',borderRadius:8,color:C.text,fontSize:13,fontFamily:'inherit',fontWeight:500}}>
          <span style={{fontSize:17,width:24,textAlign:'center'}}>{f.icon}</span>{f.tag}
        </button>
      ))}
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)'}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>رویداد فعال</div>
      <div style={{background:'#FFF9F0',border:'1px solid #FFE0B2',borderRadius:14,padding:'12px'}}>
        <div style={{fontSize:22,marginBottom:5}}>⚔️</div>
        <div style={{fontSize:13,fontWeight:800,color:C.text}}>شمشیر گریفیندور</div>
        <div style={{fontSize:11,color:C.sub,marginTop:3,lineHeight:1.5}}>کافه‌های غرب تهران • امروز</div>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,marginTop:4}}>+{XP_CONFIG.event_bonus} XP بونوس</div>
        <button onClick={()=>showToast('🎮 ورود به رویداد...')} style={{marginTop:10,width:'100%',background:C.accent,border:'none',borderRadius:10,padding:'8px',fontSize:12,color:'white',fontWeight:700,fontFamily:'inherit'}}>شرکت در رویداد</button>
      </div>
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)',paddingBottom:24}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>برترین‌ها</div>
      {[{r:'🥇',n:'کاشف_دانی',x:1240},{r:'🥈',n:'قهوه‌باز',x:980},{r:'🥉',n:'تهران‌گرد',x:840}].map(p=>(
        <div key={p.n} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid '+C.border}}>
          <span style={{fontSize:18}}>{p.r}</span>
          <div style={{flex:1}}><div style={{fontSize:12,color:C.text,fontWeight:700}}>{p.n}</div></div>
          <div style={{fontSize:12,color:C.accent,fontWeight:800}}>{p.x} XP</div>
        </div>
      ))}
    </div>
  </div>
}

// ── MISSIONS TAB ──────────────────────────────────────────────────────────────
function MissionsTab({C,checkedIn,showToast}) {
  const TYPE_LABELS = {daily:'روزانه',weekly:'هفتگی',streak:'استریک',social:'اجتماعی',event:'رویداد'}
  const TYPE_COLORS = {daily:C.blue,weekly:C.purple,streak:C.accent,social:C.green,event:'#FF9500'}

  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>ماموریت‌های فعال</div>
    <div style={{fontSize:11,color:C.sub,marginBottom:14}}>ماموریت‌ها رو انجام بده و XP بگیر</div>
    {['daily','streak','weekly','social','event'].map(type=>{
      const items=MISSIONS.filter(m=>m.type===type); if(!items.length) return null
      return <div key={type} style={{marginBottom:18}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:5,background:TYPE_COLORS[type]+'18',border:'1px solid '+TYPE_COLORS[type]+'44',borderRadius:99,padding:'3px 10px',fontSize:10,fontWeight:700,color:TYPE_COLORS[type],marginBottom:8}}>{TYPE_LABELS[type]}</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {items.map(m=>{
            const pct=Math.round((m.done/m.total)*100); const isDone=m.done>=m.total
            return <div key={m.id} style={{background:isDone?C.green+'22':C.card,border:'1px solid '+(isDone?C.green+'66':C.border),borderRadius:14,padding:'12px',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:isDone?C.green+'20':TYPE_COLORS[type]+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{isDone?'✅':m.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{m.title}</div>
                    <div style={{fontSize:11,fontWeight:800,color:C.accent,flexShrink:0}}>+{m.xp} XP</div>
                  </div>
                  <div style={{fontSize:11,color:C.sub,marginTop:2,lineHeight:1.4}}>{m.desc}</div>
                  <div style={{marginTop:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:10,color:isDone?C.green:C.sub,fontWeight:isDone?700:400}}>{isDone?'تکمیل شد! ✓':`${m.done} از ${m.total}`}</span>
                      <span style={{fontSize:10,color:C.sub}}>{pct}%</span>
                    </div>
                    <div style={{height:5,background:C.chip,borderRadius:99,overflow:'hidden'}}>
                      <div className="mission-bar" style={{height:'100%',width:pct+'%',background:isDone?'linear-gradient(90deg,'+C.green+',#5AC96C)':'linear-gradient(90deg,'+TYPE_COLORS[type]+','+TYPE_COLORS[type]+'aa)',borderRadius:99}}/>
                    </div>
                  </div>
                </div>
              </div>
              {isDone&&<button onClick={()=>showToast('🎁 +'+m.xp+' XP دریافت شد!','xp')} style={{marginTop:10,width:'100%',background:'linear-gradient(90deg,'+C.green+',#5AC96C)',border:'none',borderRadius:10,padding:'8px',fontSize:12,color:'white',fontWeight:700,fontFamily:'inherit',boxShadow:'0 3px 12px '+C.green+'44'}}>🎁 دریافت جایزه</button>}
            </div>
          })}
        </div>
      </div>
    })}
  </div>
}

// ── RANK TAB (خلاصه — نسخه کامل در /leaderboard) ───────────────────────────────
const RANK_PREVIEW = [
  { id:1, name:'سارا', avatar:'🦊', xp:1840 },
  { id:2, name:'نیما', avatar:'🐧', xp:1620 },
  { id:3, name:'دانی', avatar:'☕', xp:920, me:true },
  { id:4, name:'مهسا', avatar:'🐱', xp:880 },
  { id:5, name:'رضا',  avatar:'🦁', xp:760 },
]
function RankTab({C}) {
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>برترین‌های این هفته 🏆</div>
    <div style={{fontSize:11,color:C.sub,marginBottom:14}}>رتبه خودت رو بین بقیه ببین</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {RANK_PREVIEW.map((p,i)=>{
        const rank=i+1
        return <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,background:p.me?C.accentL:C.card,border:p.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:24,textAlign:'center',fontSize:rank<=3?18:14,fontWeight:800,color:rank<=3?C.text:C.sub}}>{medals[rank]||rank}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+C.accent+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{p.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{p.name}{p.me&&<span style={{fontSize:9,background:C.accent,color:'#fff',borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{p.xp} XP</div>
        </div>
      })}
    </div>
    <a href="/leaderboard" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:'#fff',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده جدول کامل ›</a>
  </div>
}

// ── CLAN TAB (خلاصه — نسخه کامل در /clan) ──────────────────────────────────────
const CLAN_PREVIEW = {
  name:'کافه‌نشینان', emblem:'⚔️', color:'#9C27B0', level:4, xp:24800, rank:2,
  members:[
    { id:1, name:'سارا', avatar:'🦊', xp:6200, role:'رهبر' },
    { id:2, name:'دانی', avatar:'☕', xp:4980, role:'افسر', me:true },
    { id:3, name:'نیما', avatar:'🐧', xp:4310, role:'عضو' },
  ],
}
function ClanTab({C}) {
  const c=CLAN_PREVIEW
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:'linear-gradient(135deg,'+c.color+','+c.color+'cc)',borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <div style={{fontSize:38}}>{c.emblem}</div>
      <div style={{fontSize:19,fontWeight:800,marginTop:2}}>{c.name}</div>
      <div style={{fontSize:12,opacity:.9,marginTop:3}}>سطح {c.level} · رتبه {c.rank} · {c.xp.toLocaleString('fa')} XP</div>
    </div>
    <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:8}}>اعضای برتر</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {c.members.map((m,i)=>(
        <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,background:m.me?C.accentL:C.card,border:m.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:22,textAlign:'center',fontWeight:800,color:C.sub,fontSize:14}}>{i+1}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+c.color+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{m.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{m.name}{m.me&&<span style={{fontSize:9,background:C.accent,color:'#fff',borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
            <div style={{fontSize:11,color:C.sub}}>{m.role}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{m.xp.toLocaleString('fa')} XP</div>
        </div>
      ))}
    </div>
    <a href="/clan" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:'#fff',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده کامل کلن ›</a>
  </div>
}

// ── PROFILE TAB (خلاصه — نسخه کامل در /profile) ────────────────────────────────
function ProfileTab({C,xp,levelInfo,streak,checkedIn}) {
  const stats = [
    { icon:'🔥', value:streak, label:'استریک' },
    { icon:'☕', value:11,     label:'کافه' },
    { icon:'📍', value:38,     label:'چک‌این' },
    { icon:'📅', value:47,     label:'روز فعال' },
  ]
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:C.grad,borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <img src="/icon_profile_active@2x.png" alt="پروفایل" width={64} height={64} style={{objectFit:'contain',display:'block',margin:'0 auto 6px'}}/>
      <div style={{fontSize:19,fontWeight:800}}>دانی</div>
      <div style={{fontSize:12,opacity:.9,marginTop:2}}>☕ {levelInfo?.name||'کافه‌گرد'} · {xp.toLocaleString('fa')} XP</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
      {stats.map((s,i)=>(
        <div key={i} style={{background:C.card,border:'1px solid '+C.border,borderRadius:14,padding:'10px 4px',textAlign:'center'}}>
          <div style={{fontSize:18}}>{s.icon}</div>
          <div style={{fontSize:15,fontWeight:800,color:C.text,marginTop:2}}>{Number(s.value).toLocaleString('fa')}</div>
          <div style={{fontSize:10,color:C.sub,marginTop:1}}>{s.label}</div>
        </div>
      ))}
    </div>
    <a href="/profile" style={{display:'block',textAlign:'center',background:C.accent,color:'#fff',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده پروفایل کامل ›</a>
  </div>
}

// ── CAFE POPUP ────────────────────────────────────────────────────────────────
function CafePopup({C,cafe,live,favs,setFavs,checkedIn,onClose,onCheckin,showToast}) {
  const color=getColor(cafe.name); const isChecked=checkedIn.has(cafe.id); const isFav=favs.has(cafe.id)
  const xpAmount=cafe.is_top?XP_CONFIG.checkin_top:XP_CONFIG.checkin
  return <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)'}} onClick={onClose}>
    <div onClick={(e)=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,maxHeight:'88dvh',overflowY:'auto',background:C.card,borderRadius:'24px 24px 0 0',border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
      <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'14px auto'}}/>
      <div style={{padding:'0 18px 16px',display:'flex',alignItems:'center',gap:14,borderBottom:'1px solid '+C.border}}>
        <div style={{width:60,height:60,borderRadius:18,background:color+'18',border:'2.5px solid '+(isChecked?C.green:color)+'66',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0}}>{isChecked?'✅':'☕'}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:19,fontWeight:800,color:C.text}}>{cafe.name}</div>
          <div style={{fontSize:12,color:C.accent,marginTop:3}}>📍 {cafe.description}</div>
          <div style={{color:'#FF9500',fontSize:14,marginTop:3}}>{cafe.is_top?'★★★★★':'★★★☆☆'}</div>
        </div>
        <div style={{textAlign:'center',flexShrink:0}}>
          <div style={{fontSize:26,fontWeight:900,color:C.green}}>{live[cafe.id]||0}</div>
          <div style={{fontSize:9,color:C.sub,marginTop:1}}>الان اینجا</div>
        </div>
      </div>
      <div style={{padding:'16px 18px'}}>
        {cafe.tags?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>{cafe.tags.map((t)=><span key={t} style={{background:C.chip,borderRadius:99,fontSize:11,color:C.text,padding:'3px 11px',fontWeight:500}}>{t}</span>)}</div>}
        {cafe.is_top&&<div style={{background:'#FFF9F0',border:'1px solid #FFE0B2',borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:14}}><span style={{fontSize:24}}>⚔️</span><div><div style={{fontSize:12,fontWeight:700,color:'#E65100'}}>آیتم فعال: شمشیر گریفیندور</div><div style={{fontSize:11,color:C.sub,marginTop:2}}>با سفارش ۱۰۰,۰۰۰ تومان شانس دریافت داری</div></div></div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
          {[['☕',isChecked?'رفتی!':'+'+xpAmount+' XP','چک‌این'],['⏰','۸ص–۱۰ش','ساعات'],['🏅',cafe.is_top?'طلایی':'نقره','رتبه']].map(([icon,val,lbl])=>(
            <div key={lbl} style={{background:C.chip,borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
              <div style={{fontSize:18}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:lbl==='چک‌این'&&isChecked?C.green:C.text,marginTop:4}}>{val}</div>
              <div style={{fontSize:9,color:C.sub,marginTop:2}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:14}}>
          {[{icon:'❤️',lbl:'علاقه',active:isFav,fn:()=>{const n=new Set(favs);isFav?n.delete(cafe.id):n.add(cafe.id);setFavs(n);showToast(isFav?'حذف شد':'❤️ ذخیره شد')}},{icon:'📤',lbl:'اشتراک',active:false,fn:()=>showToast('🔗 کپی شد!')},{icon:'🗺',lbl:'مسیر',active:false,fn:()=>window.open('https://www.google.com/maps?q='+cafe.lat+','+cafe.lng,'_blank')},{icon:'💬',lbl:'نظر',active:false,fn:()=>showToast('💬 به زودی!')}].map((item)=>(
            <button key={item.lbl} onClick={item.fn} style={{background:item.active?C.accent+'18':C.chip,border:'1.5px solid '+(item.active?C.accent:'transparent'),borderRadius:12,padding:'9px 4px',color:C.text,fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:20}}>{item.icon}</span>
              <span style={{fontSize:9,color:item.active?C.accent:C.sub,fontWeight:item.active?700:400}}>{item.lbl}</span>
            </button>
          ))}
        </div>
        <button onClick={onCheckin} disabled={isChecked} style={{width:'100%',background:isChecked?C.green:C.accent,color:'white',border:'none',borderRadius:14,padding:15,fontSize:15,fontWeight:700,fontFamily:'inherit',boxShadow:'0 4px 18px '+(isChecked?C.green:C.accent)+'44',opacity:isChecked?.85:1,transition:'all .3s'}}>
          {isChecked?'✅ چک‌این شد!':'📍 چک‌این — +'+xpAmount+' XP'}
        </button>
      </div>
    </div>
  </div>
}

// ── XP PANEL ──────────────────────────────────────────────────────────────────
function XPPanel({C,xp,levelInfo,streak,onClose}) {
  const {current,next,progress}=levelInfo
  return <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)'}} onClick={onClose}>
    <div onClick={(e)=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,maxHeight:'85dvh',overflowY:'auto',background:C.card,borderRadius:'24px 24px 0 0',border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',padding:'0 0 40px'}}>
      <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'14px auto 20px'}}/>
      <div style={{margin:'0 18px',background:'linear-gradient(135deg,'+current.color+'22,'+current.color+'08)',border:'1.5px solid '+current.color+'33',borderRadius:20,padding:'20px',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:52}}>{current.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:C.sub}}>لول {current.level}</div>
            <div style={{fontSize:22,fontWeight:900,color:C.text}}>{current.name}</div>
            <div style={{fontSize:26,fontWeight:900,color:current.color}}>{xp.toLocaleString()} XP</div>
          </div>
          {streak>=2&&<div style={{textAlign:'center',background:'rgba(255,107,53,.12)',borderRadius:14,padding:'10px 12px'}}><div style={{fontSize:24}}>🔥</div><div style={{fontSize:18,fontWeight:900,color:C.accent}}>{streak}</div><div style={{fontSize:9,color:C.sub}}>روز</div></div>}
        </div>
        {next&&<div style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,color:C.sub}}>تا {next.icon} {next.name}</span><span style={{fontSize:11,fontWeight:700,color:current.color}}>{next.minXP-xp} XP مانده</span></div>
          <div style={{height:10,background:C.border,borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:progress+'%',background:'linear-gradient(90deg,'+current.color+','+C.accent+')',borderRadius:99,transition:'width .8s'}}/></div>
        </div>}
      </div>
      <div style={{padding:'0 18px',marginBottom:18}}>
        <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:12,letterSpacing:.5}}>روش‌های کسب XP</div>
        {[{icon:'📍',label:'چک‌این عادی',xp:XP_CONFIG.checkin,note:'هر کافه'},{icon:'⭐',label:'کافه برتر',xp:XP_CONFIG.checkin_top,note:'کافه‌های طلایی'},{icon:'🌟',label:'اول روز',xp:XP_CONFIG.checkin_first,note:'بونوس روزانه'},{icon:'🔥',label:'استریک',xp:XP_CONFIG.streak_bonus,note:'۳+ روز پشت هم'},{icon:'⚔️',label:'رویداد',xp:XP_CONFIG.event_bonus,note:'رویدادهای ویژه'}].map(item=>(
          <div key={item.label} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid '+C.border}}>
            <span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.label}</div><div style={{fontSize:11,color:C.sub}}>{item.note}</div></div>
            <div style={{fontSize:14,fontWeight:800,color:C.accent}}>+{item.xp}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'0 18px'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:12,letterSpacing:.5}}>تمام لول‌ها</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {LEVELS.map(l=>{const isCurrent=l.level===current.level;const isPast=xp>=l.minXP;return(
            <div key={l.level} style={{background:isCurrent?l.color+'18':isPast?C.chip:C.bg,border:'1.5px solid '+(isCurrent?l.color+'66':C.border),borderRadius:14,padding:'12px',opacity:isPast?1:.5}}>
              <div style={{fontSize:24}}>{l.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:isCurrent?l.color:C.text,marginTop:4}}>{l.name}</div>
              <div style={{fontSize:10,color:C.sub,marginTop:2}}>{l.minXP.toLocaleString()} XP</div>
              {isCurrent&&<div style={{fontSize:9,color:l.color,fontWeight:700,marginTop:4}}>← الان اینجایی</div>}
            </div>
          )})}
        </div>
      </div>
    </div>
  </div>
}
