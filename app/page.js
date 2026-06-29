'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

const CITIES: Record<string, {name:string,lat:number,lng:number,zoom:number}> = {
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

function getLevelInfo(xp:number) {
  let current = LEVELS[0], next: typeof LEVELS[0]|null = LEVELS[1]
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

const C = {
  bg:'#F2F1F6', card:'#FFFFFF', border:'rgba(0,0,0,.09)',
  text:'#1C1C1E', sub:'#8E8E93', accent:'#FF6B35', accentL:'#FF6B3518',
  green:'#34C759', blue:'#007AFF', purple:'#AF52DE',
  gold:'#FFD60A', chip:'rgba(0,0,0,.06)', danger:'#FF3B30',
  glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.90)',
}

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
  { key:'map',      icon:'🗺',  label:'نقشه'    },
  { key:'missions', icon:'📋', label:'ماموریت' },
  { key:'clan',     icon:'🛡',  label:'کلن'     },
  { key:'rank',     icon:'🏆', label:'رتبه'    },
  { key:'profile',  icon:'👤', label:'پروفایل' },
]

const QUICK_FILTERS = [
  {tag:'صبحانه',icon:'🌅'},{tag:'شبانه',icon:'🌙'},
  {tag:'کتاب',icon:'📚'},{tag:'موسیقی',icon:'🎵'},
  {tag:'دنج',icon:'🛋'},{tag:'اسپشالتی',icon:'☕'},
]

const CAFE_COLORS = ['#FF6B35','#E84393','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']
function getColor(name:string) {
  let h=0; for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h)
  return CAFE_COLORS[Math.abs(h)%CAFE_COLORS.length]
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
  const mapRef   = useRef<HTMLDivElement>(null)
  const mapInst  = useRef<any>(null)
  const mksRef   = useRef<Record<string,any>>({})

  const [cafes,      setCafes]      = useState<any[]>([])
  const [city,       setCity]       = useState('tehran')
  const [mapMode,    setMapMode]    = useState('normal')
  const [zone,       setZone]       = useState('all')
  const [search,     setSearch]     = useState('')
  const [selCafe,    setSelCafe]    = useState<any>(null)
  const [tab,        setTab]        = useState('map')
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [panelTab,   setPanelTab]   = useState('dashboard')
  const [showMenu,   setShowMenu]   = useState(false)
  const [showCity,   setShowCity]   = useState(false)
  const [showMode,   setShowMode]   = useState(false)
  const [showXP,     setShowXP]     = useState(false)
  const [toast,      setToast]      = useState<{msg:string,type:string}|null>(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [live,       setLive]       = useState<Record<string,number>>({})
  const [checkedIn,  setCheckedIn]  = useState<Set<string>>(new Set())
  const [favs,       setFavs]       = useState<Set<string>>(new Set())
  const [xp,         setXp]         = useState(340)
  const [streak,     setStreak]     = useState(3)
  const [xpAnim,     setXpAnim]     = useState<{amount:number}|null>(null)
  const [vw,         setVw]         = useState(800)

  useEffect(()=>{ setVw(window.innerWidth); const fn=()=>setVw(window.innerWidth); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn) },[])

  const isMobile  = vw < BP.mobile
  const isDesktop = vw >= BP.tablet
  const levelInfo = getLevelInfo(xp)

  useEffect(()=>{ if(isDesktop) setPanelOpen(true) },[isDesktop])

  const showToast = useCallback((msg:string,type='info')=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),2800)
  },[])

  const gainXP = useCallback((amount:number)=>{
    setXp(prev=>prev+amount); setXpAnim({amount}); setTimeout(()=>setXpAnim(null),1800)
  },[])

  useEffect(()=>{
    fetch(SB_URL+'/rest/v1/cafes?select=*&is_active=eq.true',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{ setCafes(Array.isArray(d)&&d.length?d:MOCK_CAFES) })
    .catch(()=>setCafes(MOCK_CAFES))
  },[])

  useEffect(()=>{
    if(!cafes.length) return
    const update=()=>{ const c:Record<string,number>={}; cafes.forEach(cafe=>{c[cafe.id]=Math.floor(Math.random()*12)}); setLive(c) }
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

      const loadLeaflet=(cb:()=>void)=>{
        if((window as any).L){ cb(); return }
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
          const L=(window as any).L
          const c=CITIES.tehran
          const m=L.map(mapRef.current,{
            center:[c.lat,c.lng],zoom:c.zoom,
            zoomControl:false,attributionControl:false,preferCanvas:true
          })

          // ── TILE از proxy خودمون ──
          // اگه روی localhost هستی از CDN مستقیم میاد، روی Vercel از proxy
          const mainLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            { maxZoom:19, subdomains:'abcd' }
          )
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
    const pane=document.querySelector('.leaflet-tile-pane') as HTMLElement|null
    if(pane){ const mode=MAP_MODES.find(m=>m.key===mapMode); pane.style.filter=mode?mode.filter:'none'; pane.style.transition='filter .5s' }
  })

  useEffect(()=>{
    if(!mapInst.current) return
    const c=CITIES[city]; mapInst.current.flyTo([c.lat,c.lng],c.zoom,{duration:1.2})
  },[city])

  useEffect(()=>{
    if(!mapReady||!cafes.length||!(window as any).L||!mapInst.current) return
    const L=(window as any).L
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

  function panMap(x:number,y:number){ mapInst.current?.panBy([x,y],{animate:true}) }
  function goZone(z:any){
    setZone(z.key)
    if(z.lat&&mapInst.current) mapInst.current.flyTo([z.lat,z.lng],13)
    else if(z.key==='all'&&mapInst.current){ const c=CITIES[city]; mapInst.current.flyTo([c.lat,c.lng],c.zoom) }
  }

  function doCheckin(cafe:any){
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
    <div style={{height:'100dvh',width:'100vw',display:'flex',flexDirection:'column',fontFamily:"'Vazirmatn',system-ui,sans-serif",direction:'rtl',background:C.bg,overflow:'hidden',position:'fixed',inset:0}}>
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
      `}}/>

      {/* TOPBAR */}
      <div style={{height:TH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid '+C.border,padding:'0 12px',display:'flex',alignItems:'center',gap:8,zIndex:300}}>
        <button onClick={()=>setShowMenu(v=>!v)} style={{background:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:C.text}}>☰</button>
        <div style={{fontSize:isMobile?14:17,fontWeight:900,color:C.text,flexShrink:0,letterSpacing:-.5}}>🏙️ Twin<span style={{color:C.accent}}>Land</span></div>

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
          {panelOpen?'✕':'📊'}{!isMobile&&<span>{panelOpen?'بستن':'پنل'}</span>}
        </button>
        <button onClick={()=>setShowMode(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
          {MAP_MODES.find(m=>m.key===mapMode)!.label.split(' ')[0]}
        </button>
        <button onClick={()=>setShowCity(true)} style={{background:C.accent,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:'white',fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
          {CITIES[city].name} ▾
        </button>
      </div>

      {/* FILTER BAR */}
      <div style={{height:38,flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'0 12px',overflowX:'auto',scrollbarWidth:'none',background:'rgba(255,255,255,.80)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border}}>
        {ZONES.map(z=>(
          <button key={z.key} onClick={()=>goZone(z)} style={{flexShrink:0,background:zone===z.key?C.accent:C.chip,border:'none',borderRadius:99,padding:'4px 13px',fontSize:11,fontWeight:zone===z.key?700:400,color:zone===z.key?'white':C.text,whiteSpace:'nowrap',fontFamily:'inherit',transition:'all .2s'}}>{z.label}</button>
        )
