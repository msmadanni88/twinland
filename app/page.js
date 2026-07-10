'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, DEFAULT_MODE, buildC, loadPrefs, savePalette, saveMode } from './palettes'
import AuthGate from './AuthGate'
import { LEVELS, getLevelInfo, getSession, fetchLeaderboard, subscribeToProfile, subscribeToTables, fetchMyClans, fetchClanStandings, fetchClanMembers, clanLevel, fetchRegionLeaderboard, fetchRegionClans } from './gameSystem'

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

// LEVELS و getLevelInfo حالا از gameSystem.js میان (منبع واحد) — تعریف محلی حذف شد

// تبدیل ارقام فارسی/عربی به لاتین و استخراج فقط عددها (برای تطبیق نام منطقه)
function digitsOnly(s){
  if(!s) return ''
  const map={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}
  return String(s).replace(/[۰-۹٠-٩]/g,d=>map[d]||d).replace(/[^0-9]/g,'')
}

// نقطه داخل چندضلعی؟ (ray-casting). ring آرایه‌ای از [lng,lat] یا {lat,lng}
function pointInRing(lat,lng,ring){
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const yi=ring[i].lat, xi=ring[i].lng, yj=ring[j].lat, xj=ring[j].lng
    const intersect=((yi>lat)!==(yj>lat)) && (lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)
    if(intersect) inside=!inside
  }
  return inside
}
// کافه داخل یک لایه‌ی Leaflet (polygon/multipolygon)؟
function cafeInLayer(lat,lng,lyr){
  try{
    const gj=lyr.toGeoJSON()
    const geom=gj.geometry
    const polys = geom.type==='Polygon' ? [geom.coordinates] : geom.type==='MultiPolygon' ? geom.coordinates : []
    for(const poly of polys){
      const outer=poly[0].map(c=>({lng:c[0],lat:c[1]}))
      if(pointInRing(lat,lng,outer)) return true
    }
  }catch(e){}
  return false
}

// (آرایه‌ی mockup قدیمی MISSIONS حذف شد — تب ماموریت‌ها حالا از quests واقعی می‌خونه)

// رنگ‌ها (C) حالا داخل کامپوننت از پالت فعال ساخته می‌شوند — به palettes.js نگاه کن

const MAP_MODES = [
  { key:'normal',  label:'🗺 معمولی', filter:'none' },
  { key:'game',    label:'🎮 گیم',    filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.88)' },
  { key:'dark',    label:'🌙 تاریک',  filter:'brightness(0.25) saturate(0.3) hue-rotate(200deg)' },
  { key:'cartoon', label:'🎨 کارتون', filter:'saturate(2.2) contrast(1.3) brightness(1.05)' },
]

const ZONES = [
  { key:'all',    label:'همه' },
  { key:'north',  label:'شمال', lat:35.766, lng:51.41 },
  { key:'south',  label:'جنوب', lat:35.635, lng:51.42 },
  { key:'center', label:'مرکز', lat:35.703, lng:51.41 },
  { key:'east',   label:'شرق',  lat:35.721, lng:51.50 },
  { key:'west',   label:'غرب',  lat:35.728, lng:51.34 },
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
// شعاع خوشه‌بندی بر اساس شدت انتخابی کاربر
function clusterRadiusOf(level){
  return level==='off'?0 : level==='low'?30 : level==='high'?90 : 55  // medium=55
}
// ساخت گروه خوشه‌بندی با شعاع دلخواه
function makeClusterGroup(L,radius){
  return L.markerClusterGroup({
    chunkedLoading:true,
    maxClusterRadius:radius>0?radius:1,        // ۰ عملاً یعنی بدون خوشه
    spiderfyOnMaxZoom:true,
    showCoverageOnHover:false,
    disableClusteringAtZoom:radius>0?17:1,
    iconCreateFunction:(cluster)=>{
      const count=cluster.getChildCount()
      const size=count<10?38:count<100?46:56
      const bg=count<10?'#3b82f6':count<100?'#f97316':'#ef4444'
      return L.divIcon({
        html:'<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+bg+';border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:'+(count<100?14:12)+'px;font-family:inherit">'+count.toLocaleString('fa')+'</div>',
        className:'',iconSize:[size,size]
      })
    }
  })
}

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
  {id:'c9',name:'کافه ری',    lat:35.5920,lng:51.4380,description:'شهرری، جنوب تهران',   zone:'south', is_top:false,tags:['سنتی','دنج']},
  {id:'c10',name:'کافه نازی', lat:35.6420,lng:51.4020,description:'نازی‌آباد، جنوب تهران',zone:'south', is_top:true, tags:['خانگی','صبحانه']},
]

const BP = { mobile:640, tablet:1024 }

function TwinLand({ session, onLogout }) {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mksRef   = useRef({})
  const clusterRef = useRef(null)   // گروه خوشه‌بندی مارکرها

  const [cafes,      setCafes]      = useState([])
  const [city,       setCity]       = useState('tehran')
  const [mapMode,    setMapMode]    = useState('normal')
  const [zone,       setZone]       = useState('all')
  const [search,     setSearch]     = useState('')
  const logoTapRef = useRef({count:0,timer:null})
  const [selCafe,    setSelCafe]    = useState(null)
  const [activeEventCafeId, setActiveEventCafeId] = useState(null)
  const [tab,        setTab]        = useState('map')
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [panelTab,   setPanelTab]   = useState('dashboard')
  const [showMenu,   setShowMenu]   = useState(false)
  const [showCity,   setShowCity]   = useState(false)
  const [showMode,   setShowMode]   = useState(false)
  const [showXP,     setShowXP]     = useState(false)
  const [showNotif,  setShowNotif]  = useState(false)
  const [notifications, setNotifications] = useState([])
  const [tutorialSeen, setTutorialSeen] = useState({})
  const [toast,      setToast]      = useState(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [live,       setLive]       = useState({})
  const [checkedIn,  setCheckedIn]  = useState(new Set())
  const [favs,       setFavs]       = useState(new Set())
  const [xp,         setXp]         = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [coins,      setCoins]      = useState(0)
  const [userName,   setUserName]   = useState('')
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [accountType, setAccountType] = useState('user')
  const [navOpen,    setNavOpen]    = useState(false)
  const [xpAnim,     setXpAnim]     = useState(null)
  const [vw,         setVw]         = useState(800)
  const [boundaryMode, setBoundaryMode] = useState('off') // 'off' | 'province' | 'district'
  const [showBoundary, setShowBoundary] = useState(false)
  const [showMapSettings, setShowMapSettings] = useState(false)
  // تنظیمات نمایش نقشه (ذخیره در localStorage)
  const [mapDisplay, setMapDisplay] = useState(()=>{
    if(typeof window==='undefined') return {markerMode:'pin',cluster:'auto',regionCluster:'off',dotColor:'#3b82f6',dotSize:8}
    try{ const s=JSON.parse(localStorage.getItem('tl_mapDisplay')||'{}')
      return {markerMode:s.markerMode||'pin',cluster:s.cluster||'auto',regionCluster:s.regionCluster||'off',dotColor:s.dotColor||'#3b82f6',dotSize:s.dotSize||8}
    }catch(e){ return {markerMode:'pin',cluster:'auto',regionCluster:'off',dotColor:'#3b82f6',dotSize:8} }
  })
  useEffect(()=>{ try{ localStorage.setItem('tl_mapDisplay',JSON.stringify(mapDisplay)) }catch(e){} },[mapDisplay])
  // ── فیلتر منطقه‌ای ──
  const [selectedRegions, setSelectedRegions] = useState([])   // نام مناطق انتخاب‌شده روی نقشه
  const [showRegionFilter, setShowRegionFilter] = useState(false) // پاپ‌آپ فیلتر
  const [regionFilter, setRegionFilter] = useState({            // انتخاب‌های کاربر در پاپ‌آپ
    categories: ['cafe','restaurant'], showClans:false, showLeaderboard:false, showHeatmap:false,
  })
  const [filterApplied, setFilterApplied] = useState(false)
  const regionLayersRef = useRef({})   // نگاشت نام منطقه → لایه Leaflet (برای زوم)
  const [regionResults, setRegionResults] = useState(null) // {leaderboard:[], clans:[], region:'1'} یا null
  const [showRegionResults, setShowRegionResults] = useState(false)
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

  // پروفایل واقعی کاربر + چک‌این‌های قبلی رو از دیتابیس بخون
  useEffect(()=>{
    if(!session||!session.user||!session.access_token) return
    const uid=session.user.id
    const h={'apikey':SB_KEY,'Authorization':'Bearer '+session.access_token}
    fetch(SB_URL+'/rest/v1/profiles?id=eq.'+uid+'&select=*',{headers:h})
      .then(r=>r.json()).then(rows=>{ const p=Array.isArray(rows)&&rows[0]; if(p){ setXp(p.xp||0); setStreak(p.streak||0); setCoins(p.coins||0); setUserName(p.display_name||''); setIsAdmin(!!p.is_admin); setAccountType(p.account_type||'user'); setTutorialSeen(p.tutorial_seen||{}) } }).catch(()=>{})
    fetch(SB_URL+'/rest/v1/checkins?user_id=eq.'+uid+'&select=cafe_id',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setCheckedIn(new Set(rows.map(x=>x.cafe_id))) }).catch(()=>{})
    fetch(SB_URL+'/rest/v1/notifications?user_id=eq.'+uid+'&select=*&order=created_at.desc&limit=40',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setNotifications(rows) }).catch(()=>{})
  },[session])

  // realtime: تغییرات لحظه‌ای پروفایل خودم + چک‌این‌های خودم (بدون رفرش)
  useEffect(()=>{
    if(!session||!session.user||!session.user.id) return
    const uid=session.user.id
    const unsub = subscribeToTables([
      { table:'profiles', event:'UPDATE', filter:'id=eq.'+uid },
      { table:'checkins', event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'notifications', event:'INSERT', filter:'user_id=eq.'+uid },
    ],(p)=>{
      if(p.table==='profiles' && p.record){
        const r=p.record
        if(r.xp!=null) setXp(r.xp)
        if(r.streak!=null) setStreak(r.streak)
        if(r.coins!=null) setCoins(r.coins)
      }
      if(p.table==='checkins' && p.record && p.record.cafe_id){
        setCheckedIn(prev=>{ const s=new Set(prev); s.add(p.record.cafe_id); return s })
      }
      if(p.table==='notifications' && p.record){
        setNotifications(prev=>[p.record, ...prev].slice(0,60))
      }
    })
    return ()=>unsub()
  },[session])

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

    const onResize=()=>{ try{ mapInst.current&&mapInst.current.invalidateSize() }catch(e){} }
    window.addEventListener('resize',onResize)
    window.addEventListener('orientationchange',onResize)

    const timer=setTimeout(()=>{
      if(!mounted||!mapRef.current) return

      const loadLeaflet=(cb)=>{
        if(window.L&&window.L.markerClusterGroup){ cb(); return }
        const loadCluster=()=>{
          if(window.L&&window.L.markerClusterGroup){ cb(); return }
          // CSS خوشه‌بندی
          const cc=document.createElement('link'); cc.rel='stylesheet'
          cc.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css'
          document.head.appendChild(cc)
          const cjs=document.createElement('script')
          cjs.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js'
          cjs.onload=cb
          cjs.onerror=cb  // اگه نشد، بدون خوشه‌بندی ادامه بده
          document.head.appendChild(cjs)
        }
        if(window.L){ loadCluster(); return }
        const css=document.createElement('link'); css.rel='stylesheet'
        css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        document.head.appendChild(css)
        const js=document.createElement('script')
        js.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
        js.onload=loadCluster
        js.onerror=()=>{
          const js2=document.createElement('script')
          js2.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          js2.onload=loadCluster; document.head.appendChild(js2)
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

          // ── گروه خوشه‌بندی: پین‌های نزدیک رو جمع می‌کنه (برای مقیاس ده‌ها هزار) ──
          if(L.markerClusterGroup){
            const radius=clusterRadiusOf(mapDisplay.cluster==='auto'?'medium':mapDisplay.cluster)
            clusterRef.current=makeClusterGroup(L,radius)
            m.addLayer(clusterRef.current)
          }

          // iOS Safari fix: نقشه اول با ارتفاع اشتباه ساخته میشه؛ بعد از settle شدن layout چند بار اصلاح کن
          ;[120,350,700,1300].forEach(d=>setTimeout(()=>{ if(mounted&&mapInst.current){ try{ mapInst.current.invalidateSize() }catch(e){} } },d))
          setTimeout(()=>{ if(mounted&&mapInst.current){ try{ mapInst.current.invalidateSize(); mapInst.current.setView([c.lat,c.lng],c.zoom) }catch(e){} } },500)
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
    const mode=mapDisplay.markerMode  // 'pin' | 'dot' | 'auto'
    // اگه حالت نمایش عوض شده، همه‌ی مارکرهای قبلی رو پاک کن و از نو بساز
    Object.values(mksRef.current).forEach(mk=>{
      try{ if(clusterRef.current) clusterRef.current.removeLayer(mk); else mapInst.current.removeLayer(mk) }catch(e){}
    })
    mksRef.current={}

    cafes.forEach(cafe=>{
      const color=getColor(cafe.name); const n=live[cafe.id]||0; const isChecked=checkedIn.has(cafe.id)
      let mk
      if(mode==='dot'){
        // حالت نقطه: circleMarker روی canvas — خیلی سبک برای تعداد زیاد
        mk=L.circleMarker([cafe.lat,cafe.lng],{
          radius:mapDisplay.dotSize||8,
          fillColor:isChecked?C.green:mapDisplay.dotColor||'#3b82f6',
          color:(mapDisplay.dotColor==='#ffffff'||mapDisplay.dotColor==='#9ca3af')?'#374151':'#fff',
          weight:1.5,fillOpacity:0.9,
        })
      }else{
        // حالت پین (default) — آیکون کامل فنجان
        const html=`<div style="position:relative;width:44px;height:52px;cursor:pointer;filter:drop-shadow(0 4px 8px ${color}55)">
          <div style="background:${isChecked?C.green:color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15)">
            <span style="transform:rotate(45deg);font-size:18px">${isChecked?'✓':'☕'}</span>
          </div>
          ${cafe.is_top?'<div style="position:absolute;top:-10px;right:-4px;font-size:14px">⭐</div>':''}
          <div id="lv-${cafe.id}" style="position:absolute;top:-6px;left:-4px;background:#FF3B30;color:white;border:2px solid white;border-radius:99px;font-size:9px;font-weight:800;min-width:18px;height:18px;display:${n>0?'flex':'none'};align-items:center;justify-content:center;padding:0 3px">${n>0?n:''}</div>
        </div>`
        const icon=L.divIcon({html,iconSize:[44,52],iconAnchor:[22,52],className:''})
        mk=L.marker([cafe.lat,cafe.lng],{icon})
      }
      mk.on('click',()=>setSelCafe(cafe))
      if(clusterRef.current) clusterRef.current.addLayer(mk)
      else mk.addTo(mapInst.current)
      mksRef.current[cafe.id]=mk
    })
  },[mapReady,cafes,checkedIn,mapDisplay.markerMode,mapDisplay.dotColor,mapDisplay.dotSize])

  // هایلایت کافه‌ای که الان توی اسلایدشوی رویدادها نشون داده می‌شه — دوربین حرکت نمی‌کنه
  // برای هر دو حالت (پین/نقطه) یه حلقه‌ی پالس مستقل (divIcon واقعی) دقیقاً روی مختصات کافه اضافه می‌کنیم؛
  // این کار مستقل از نوع رندر مارکر زیرینه (پین=DOM، نقطه=canvas مشترک با preferCanvas) و همیشه کار می‌کنه.
  useEffect(()=>{
    if(!activeEventCafeId || !mapReady || !window.L || !mapInst.current) return
    const L=window.L
    const cafe = cafes.find(c=>c.id===activeEventCafeId)
    if(!cafe) return
    const icon=L.divIcon({html:'<div class="tl-event-pulse-ring"></div>',iconSize:[26,26],iconAnchor:[13,13],className:''})
    const ghost=L.marker([cafe.lat,cafe.lng],{icon,interactive:false,zIndexOffset:9999})
    try{ ghost.addTo(mapInst.current) }catch(e){}
    return ()=>{ try{ mapInst.current.removeLayer(ghost) }catch(e){} }
  },[activeEventCafeId, mapReady, cafes])

  // بازسازی گروه خوشه‌بندی وقتی شدت cluster یا حالت فیلتر منطقه عوض شه
  useEffect(()=>{
    if(!mapReady||!window.L||!window.L.markerClusterGroup||!mapInst.current) return
    const L=window.L
    // در حالت فیلتر منطقه از regionCluster، وگرنه از cluster استفاده کن
    const level = filterApplied
      ? (mapDisplay.regionCluster==='auto'?'off':mapDisplay.regionCluster)
      : (mapDisplay.cluster==='auto'?'medium':mapDisplay.cluster)
    const radius=clusterRadiusOf(level)
    const old=clusterRef.current
    const next=makeClusterGroup(L,radius)
    // مارکرهای فعلی رو به گروه جدید منتقل کن
    const current=Object.values(mksRef.current).filter(mk=>{
      try{ return old?old.hasLayer(mk):mapInst.current.hasLayer(mk) }catch(e){ return false }
    })
    if(old){ try{ mapInst.current.removeLayer(old) }catch(e){} }
    current.forEach(mk=>next.addLayer(mk))
    mapInst.current.addLayer(next)
    clusterRef.current=next
  },[mapDisplay.cluster,mapDisplay.regionCluster,filterApplied,mapReady])

  const filtered=cafes.filter(c=>{
    const zOk=zone==='all'||c.zone===zone||(zone==='top'&&c.is_top)
    const sOk=!search||c.name.includes(search)
    // فیلتر منطقه‌ای اعمال‌شده
    let rOk=true
    if(filterApplied && selectedRegions.length){
      // تشخیص منطقه از روی مختصات GPS کافه (نقطه داخل چندضلعی منطقه)
      // این برای همه‌ی کافه‌ها کار می‌کنه، حتی اونایی که district ندارن، و برای هر ۲۲ منطقه
      const lat=Number(c.lat), lng=Number(c.lng)
      let inRegion=false
      if(!isNaN(lat)&&!isNaN(lng)){
        inRegion=selectedRegions.some(rn=>{
          const lyr=regionLayersRef.current[rn]
          return lyr && cafeInLayer(lat,lng,lyr)
        })
      }
      const catOk=!regionFilter.categories.length || regionFilter.categories.includes(c.category||'cafe')
      rOk=inRegion&&catOk
    }
    return zOk&&sOk&&rOk
  })

  useEffect(()=>{
    if(!mapReady||!mapInst.current) return
    const cluster=clusterRef.current
    Object.entries(mksRef.current).forEach(([id,mk])=>{
      const show=filtered.find(c=>c.id===id)
      try{
        if(cluster){
          if(show){ if(!cluster.hasLayer(mk)) cluster.addLayer(mk) }
          else cluster.removeLayer(mk)
        } else {
          if(show){ if(!mapInst.current.hasLayer(mk)) mk.addTo(mapInst.current) }
          else mapInst.current.removeLayer(mk)
        }
      }catch(e){}
    })
  },[zone,search,mapReady,filtered,filterApplied,selectedRegions,regionFilter])

  // اعمال فیلتر منطقه: زوم روی مناطق انتخابی + محو بقیه
  function applyRegionFilter(){
    setFilterApplied(true)
    setShowRegionFilter(false)
    const L=window.L
    if(L&&mapInst.current&&selectedRegions.length){
      // محو کردن مناطق انتخاب‌نشده، پررنگ‌کردن انتخابی‌ها، و زوم
      let bounds=null
      Object.entries(regionLayersRef.current).forEach(([name,lyr])=>{
        const on=selectedRegions.includes(name)
        try{
          lyr.setStyle(on
            ?{color:'#000',weight:2.5,fillColor:'#000',fillOpacity:0.12,opacity:0.95}
            :{color:'#8E8E93',weight:0.5,fillColor:'#8E8E93',fillOpacity:0,opacity:0.15})
          if(on){ const b=lyr.getBounds?.(); if(b){ bounds=bounds?bounds.extend(b):b } }
        }catch(e){}
      })
      if(bounds) mapInst.current.flyToBounds(bounds,{padding:[40,40],maxZoom:15})
    }
    // اگه لیدربورد یا کلن منطقه روشنه، برای همه‌ی مناطق انتخابی داده بگیر
    if(regionFilter.showLeaderboard || regionFilter.showClans){
      const sess=getSession()
      const regionNums=selectedRegions.map(r=>digitsOnly(r)).filter(Boolean)
      Promise.all(regionNums.map(region=>
        Promise.all([
          regionFilter.showLeaderboard?fetchRegionLeaderboard(sess,region):Promise.resolve([]),
          regionFilter.showClans?fetchRegionClans(sess,region):Promise.resolve([]),
        ]).then(([lb,cl])=>({region,leaderboard:lb,clans:cl}))
      )).then(pages=>{
        setRegionResults(pages)   // آرایه‌ای از صفحات، هر کدوم یک منطقه
        setShowRegionResults(true)
      })
    } else {
      setRegionResults(null); setShowRegionResults(false)
    }
    showToast('✅ فیلتر اعمال شد')
  }
  function clearRegionFilter(){
    setFilterApplied(false); setSelectedRegions([]); setShowRegionFilter(false)
    setRegionResults(null); setShowRegionResults(false)
    Object.values(regionLayersRef.current).forEach(lyr=>{
      try{ lyr.setStyle({color:'#8E8E93',weight:1.3,fillColor:'#8E8E93',fillOpacity:0,opacity:0.5}) }catch(e){}
    })
    const c=CITIES[city]; if(mapInst.current&&c) mapInst.current.flyTo([c.lat,c.lng],c.zoom)
  }

  function panMap(x,y){ mapInst.current?.panBy([x,y],{animate:true}) }

  // ── ادمین: پرکردن district همه‌ی کافه‌های بدون منطقه (point-in-polygon) ──────
  const [backfilling,setBackfilling]=useState(false)
  async function backfillDistricts(){
    if(backfilling) return
    // مرزهای مناطق باید لود باشن
    const layers=regionLayersRef.current
    if(!layers || Object.keys(layers).length===0){
      showToast('اول لایه‌ی مناطق تهران رو روشن کن')
      return
    }
    setBackfilling(true)
    try{
      const s=getSession(); const token=(s&&s.access_token)||SB_KEY
      const h={'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'}
      // کافه‌های بدون district که مختصات دارن
      const rows=await fetch(SB_URL+'/rest/v1/cafes?district=is.null&select=id,lat,lng&limit=5000',{headers:h}).then(r=>r.json())
      if(!Array.isArray(rows)||rows.length===0){ showToast('همه‌ی کافه‌ها منطقه دارن ✅'); setBackfilling(false); return }
      let done=0, skipped=0
      for(const c of rows){
        const lat=Number(c.lat), lng=Number(c.lng)
        if(isNaN(lat)||isNaN(lng)){ skipped++; continue }
        // پیدا کردن منطقه‌ای که این نقطه داخلشه
        let regionName=null
        for(const [name,lyr] of Object.entries(layers)){
          if(cafeInLayer(lat,lng,lyr)){ regionName=name; break }
        }
        if(!regionName){ skipped++; continue }
        // ذخیره: فرمت «منطقه X» (با عدد نرمال) تا با region_num لیدربورد سازگار باشه
        const num=digitsOnly(regionName)
        const district='منطقه '+num
        await fetch(SB_URL+'/rest/v1/cafes?id=eq.'+c.id,{
          method:'PATCH',headers:{...h,'Prefer':'return=minimal'},
          body:JSON.stringify({district})
        })
        done++
      }
      showToast('✅ '+done.toLocaleString('fa')+' کافه منطقه گرفت'+(skipped?('، '+skipped.toLocaleString('fa')+' رد شد'):''))
    }catch(e){ showToast('خطا در پردازش') }
    setBackfilling(false)
  }

  // تپ روی لوگو: ۱ بار = صفحه اصلی، ۳ بار = XP مخفی (فقط یک‌بار برای هر کاربر)
  async function onLogoTap(){
    const t=logoTapRef.current
    t.count++
    clearTimeout(t.timer)
    if(t.count>=3){
      t.count=0
      claimSecretXP()
      return
    }
    t.timer=setTimeout(()=>{
      if(t.count===1){
        // یک تپ: برو صفحه اصلی (بستن پنل‌ها و رفتن به نمای نقشه)
        setPanelOpen(false); setTab('map')
        const c=CITIES[city]; if(mapInst.current&&c) mapInst.current.flyTo([c.lat,c.lng],c.zoom)
      }
      t.count=0
    },450)
  }

  async function claimSecretXP(){
    const s=getSession(); const token=s&&s.access_token; const uid=s&&s.user&&s.user.id
    if(!uid) return
    try{
      const res=await fetch(SB_URL+'/rest/v1/rpc/claim_secret_xp',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+(token||SB_KEY),'Content-Type':'application/json'},
        body:'{}'
      }).then(r=>r.json())
      const row=Array.isArray(res)?res[0]:res
      if(row&&row.ok){
        if(row.xp!=null) setXp(row.xp)
        showToast('🧠 آفرین زرنگ! ۱۰۰ XP گرفتی!')
      } else if(row&&row.error==='already_claimed'){
        showToast('🎁 قبلاً جایزه‌ی زرنگ رو گرفتی!')
      } else {
        showToast('یه مشکلی پیش اومد')
      }
    }catch(e){ showToast('یه مشکلی پیش اومد') }
  }
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
      regionLayersRef.current={}
      const layer=L.geoJSON(data,{
        style:()=>styleFor(0),
        onEachFeature:(feature,lyr)=>{
          const name=feature.properties.name||'—'
          regionState[name]=0
          regionLayersRef.current[name]=lyr
          lyr.bindTooltip(name,{sticky:true,direction:'top',className:'boundary-tip'})
          lyr.on('click',(e)=>{
            L.DomEvent.stopPropagation(e)
            regionState[name]=regionState[name]?0:1
            lyr.setStyle(styleFor(regionState[name]))
            // به‌روزرسانی state ری‌اکت برای نمایش دکمه فیلتر
            setSelectedRegions(prev=>{
              if(regionState[name]>0) return prev.includes(name)?prev:[...prev,name]
              return prev.filter(n=>n!==name)
            })
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

  const tokenRef      = useRef(session?.access_token)
  const tokenExpRef   = useRef(session?.expires_at||0)
  const refreshTokRef = useRef(session?.refresh_token)
  const refreshingRef = useRef(null)
  async function freshToken(){
    if(tokenRef.current && (tokenExpRef.current - Date.now() > 60000)) return tokenRef.current
    if(!refreshTokRef.current) return tokenRef.current
    if(!refreshingRef.current){
      refreshingRef.current = fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:refreshTokRef.current})
      }).then(r=>r.json()).then(d=>{
        refreshingRef.current=null
        if(d&&d.access_token){
          tokenRef.current=d.access_token
          tokenExpRef.current=Date.now()+((d.expires_in||3600)*1000)
          if(d.refresh_token) refreshTokRef.current=d.refresh_token
          try{ localStorage.setItem('tl_session',JSON.stringify({access_token:tokenRef.current,refresh_token:refreshTokRef.current,expires_at:tokenExpRef.current,user:(d.user||(session&&session.user))})) }catch(e){}
        }
        return tokenRef.current
      }).catch(()=>{ refreshingRef.current=null; return tokenRef.current })
    }
    return refreshingRef.current
  }

  async function markNotifRead(id){
    setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n))
    const token=await freshToken()
    fetch(SB_URL+'/rest/v1/notifications?id=eq.'+id,{
      method:'PATCH',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({read:true})
    }).catch(()=>{})
  }

  async function markAllNotifRead(){
    const unreadIds=notifications.filter(n=>!n.read).map(n=>n.id)
    if(unreadIds.length===0) return
    setNotifications(prev=>prev.map(n=>({...n,read:true})))
    const token=await freshToken()
    fetch(SB_URL+'/rest/v1/notifications?user_id=eq.'+(session&&session.user&&session.user.id),{
      method:'PATCH',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({read:true})
    }).catch(()=>{})
  }

  async function resetMe(){
    if(!session||!session.access_token) return
    const token=await freshToken()
    try{
      const r=await fetch(SB_URL+'/rest/v1/rpc/reset_me',{method:'POST',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:'{}'}).then(r=>r.json())
      if(r&&r.ok){ setXp(0);setStreak(0);setCoins(0);setCheckedIn(new Set()); showToast('حساب ریست شد ♻️','xp') }
      else showToast('ریست نشد','warn')
    }catch(e){ showToast('ریست نشد','warn') }
  }

  async function doCheckin(cafe){
    if(!isAdmin && checkedIn.has(cafe.id)){ showToast('قبلاً اینجا بودی!','warn'); return }
    if(!session||!session.access_token){ showToast('اول وارد شو','warn'); return }
    setSelCafe(null)
    const prevLevel=getLevelInfo(xp).current.level
    const token=await freshToken()
    let res=null
    try{
      res=await fetch(SB_URL+'/rest/v1/rpc/do_checkin',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({p_cafe_id:cafe.id})
      }).then(r=>r.json())
    }catch(e){ res=null }
    if(!res||!res.ok){
      const err=res&&res.error
      if(err==='cooldown') showToast('همین الان اینجا چک‌این کردی!','warn')
      else if(err==='not_authenticated'||(res&&res.code==='PGRST301')) showToast('نشستت منقضی شد، یه‌بار خروج و ورود کن','warn')
      else showToast('چک‌این نشد: '+((res&&(res.message||res.error))||'خطای ناشناخته'),'warn')
      return
    }
    setXp(res.xp); setStreak(res.streak); setCoins(res.coins)
    setXpAnim({amount:res.awarded}); setTimeout(()=>setXpAnim(null),1800)
    setCheckedIn(prev=>new Set([...prev,cafe.id]))
    if(res.level>prevLevel) setTimeout(()=>showToast(`🎉 لول آپ! ${getLevelInfo(res.xp).current.name}`,'level'),400)
    else showToast(res.is_new_cafe?`🎉 کافه‌ی جدید! +${res.awarded} XP`:`✅ چک‌این! +${res.awarded} XP`,'xp')

    // Quest دوطرفه + نگارخانه: پیشرفت/جایزه (silent روی خطا، تجربه‌ی چک‌این رو کند نمی‌کنه)
    try{
      const uid=session.user && session.user.id
      if(uid){
        fetch(SB_URL+'/rest/v1/rpc/quest_progress_checkin',{
          method:'POST',
          headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({p_user:uid,p_cafe:cafe.id})
        }).then(r=>r.json()).then(qr=>{
          if(qr&&qr.ok&&Array.isArray(qr.completed)&&qr.completed.length>0){
            qr.completed.forEach((c,i)=>{
              setTimeout(()=>{
                const giftTxt=c.collectible?(' + '+(c.collectible.icon||'🎁')+' '+c.collectible.title):''
                showToast('🎯 Quest تمام شد: '+c.title+' — کد: '+c.code+giftTxt,'xp')
              },900+i*1400)
            })
          }
        }).catch(()=>{})
        fetch(SB_URL+'/rest/v1/rpc/sync_platform_collectibles',{
          method:'POST',
          headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({p_user:uid})
        }).catch(()=>{})
      }
    }catch(e){}
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
        @keyframes tlNavPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        input::placeholder{color:#AEAEB2}
        .leaflet-container{background:#E8E4DC !important}
        .leaflet-control-attribution{display:none !important}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpFloat{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-44px) scale(1.2)}100%{opacity:0;transform:translateY(-70px) scale(.9)}}
        @keyframes shimmer{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
        @keyframes ledScroll{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        @keyframes evSlide{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes coachPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes tlRingPulse{0%{transform:scale(.5);opacity:1}70%{transform:scale(1.9);opacity:0}100%{transform:scale(1.9);opacity:0}}
        .tl-event-pulse-ring{width:26px;height:26px;border-radius:50%;border:3px solid #FF9500;box-shadow:0 0 14px #FF9500;animation:tlRingPulse 1.2s ease-out infinite}
        .xp-float{animation:xpFloat 1.8s ease forwards}
        .mission-bar{transition:width .8s ease}
        .boundary-tip{background:rgba(28,28,30,.88)!important;color:#fff!important;border:none!important;border-radius:8px!important;font-family:'Vazirmatn',sans-serif!important;font-size:11px!important;font-weight:600!important;padding:4px 9px!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important}
        .boundary-tip::before{display:none!important}
      `}}/>

      {/* TOPBAR */}
      <div style={{height:TH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid '+C.border,padding:'0 12px',display:'flex',alignItems:'center',gap:8,zIndex:300,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        <button onClick={()=>setShowMenu(v=>!v)} style={{background:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:C.text}}>☰</button>
        <img src="/twinland_logo.webp" alt="TwinLand" onClick={onLogoTap} style={{height:isMobile?32:38,width:'auto',flexShrink:0,objectFit:'contain',display:'block',cursor:'pointer'}}/>

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

        <button onClick={()=>setShowNotif(v=>!v)} style={{position:'relative',background:showNotif?C.accent:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:showNotif?'#fff':C.text}}>
          🔔
          {notifications.some(n=>!n.read) && (
            <span style={{position:'absolute',top:4,left:4,width:8,height:8,borderRadius:'50%',background:'#ef4444',border:'1.5px solid '+C.bg}}/>
          )}
        </button>

        <button onClick={()=>setPanelOpen(v=>!v)} style={{background:panelOpen?C.accent:C.chip,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:panelOpen?'white':C.sub,fontFamily:'inherit',fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
          {panelOpen?<span style={{fontSize:15,fontWeight:800}}>✕</span>:<img src="/dashboard@256.png" alt="داشبورد" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>}{!isMobile&&<span>{panelOpen?'بستن':'پنل'}</span>}
        </button>
        <button onClick={()=>setShowMode(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>
          <img src="/map_style@256.png" alt="استایل نقشه" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>
        </button>
        <button onClick={()=>setShowBoundary(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src="/boundaries@256.png" alt="مرزبندی" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span> مرزها</span>}
        </button>
        <button onClick={()=>setShowPalette(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:14,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src="/theme@256.png" alt="پالت" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span style={{fontSize:12}}> پالت</span>}
        </button>
        <button onClick={()=>setShowCity(true)} style={{background:C.accent,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:'white',fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
          {CITIES[city].name} ▾
        </button>
      </div>

      {/* FILTER BAR */}
      <div style={{height:46,flexShrink:0,display:'flex',alignItems:'center',gap:7,padding:'0 12px',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',background:C.glassDark,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border}}>
        {ZONES.map(z=>(
          <button key={z.key} onClick={()=>goZone(z)} style={{flexShrink:0,background:zone===z.key?C.accent:C.chip,border:'none',borderRadius:99,padding:'8px 17px',fontSize:13.5,fontWeight:zone===z.key?800:600,color:zone===z.key?'white':C.text,whiteSpace:'nowrap',fontFamily:'inherit',transition:'all .2s'}}>{z.label}</button>
        ))}
        <div style={{width:1,height:24,background:C.border,flexShrink:0,margin:'0 2px'}}/>
        <div style={{position:'relative',display:'flex',alignItems:'center',flexShrink:0}}>
          <span style={{position:'absolute',right:12,fontSize:13,pointerEvents:'none',opacity:0.6}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی کافه..."
            style={{background:search?C.accentL:C.chip,border:'1.5px solid '+(search?C.accent:'transparent'),borderRadius:99,padding:'8px 34px 8px 30px',fontSize:12.5,fontFamily:'inherit',color:C.text,width:search?170:140,flexShrink:0,transition:'all .25s',outline:'none'}}/>
          {search&&(
            <button onClick={()=>setSearch('')} style={{position:'absolute',left:8,background:C.border,border:'none',borderRadius:'50%',width:18,height:18,fontSize:11,color:C.text,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>

        {/* MAP */}
        <div style={{position:'absolute',inset:0,zIndex:1}}>
          <div ref={mapRef} style={{position:'absolute',inset:0,zIndex:1,isolation:'isolate'}}/>

          {/* دکمه فیلتر منطقه — ظاهر شیشه‌ای هم‌سبک نوار آمار، هر سه هم‌اندازه */}
          {selectedRegions.length>0 && !showRegionFilter && (
            <div style={{position:'absolute',top:14,left:14,zIndex:20,display:'flex',flexDirection:'column',gap:7,alignItems:'stretch',width:170}}>
              <button onClick={()=>setShowRegionFilter(true)}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',
                  background:C.glass,opacity:0.95,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
                  color:C.text,border:'1px solid '+C.border,borderRadius:99,padding:'7px 14px',
                  fontSize:12.5,fontWeight:800,fontFamily:'inherit',cursor:'pointer',
                  boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}>
                فیلتر {selectedRegions.length.toLocaleString('fa')} منطقه
              </button>
              {filterApplied && (
                <button onClick={clearRegionFilter}
                  style={{width:'100%',background:C.glass,opacity:0.95,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
                    color:C.text,border:'1px solid '+C.border,borderRadius:99,
                    padding:'7px 14px',fontSize:12.5,fontWeight:700,fontFamily:'inherit',cursor:'pointer',
                    boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}>
                  پاک کردن فیلتر
                </button>
              )}
              {Array.isArray(regionResults) && regionResults.length>0 && !showRegionResults && (
                <button onClick={()=>setShowRegionResults(true)}
                  style={{width:'100%',background:C.glass,opacity:0.95,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
                    color:C.text,border:'1px solid '+C.border,borderRadius:99,
                    padding:'7px 14px',fontSize:12.5,fontWeight:700,fontFamily:'inherit',cursor:'pointer',
                    boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}>
                  نتایج منطقه
                </button>
              )}
            </div>
          )}

          {/* پاپ‌آپ فیلتر حرفه‌ای */}
          {showRegionFilter && (
            <RegionFilterPopup
              C={C} regions={selectedRegions} value={regionFilter} setValue={setRegionFilter}
              onApply={applyRegionFilter} onClose={()=>setShowRegionFilter(false)}
            />
          )}

          {/* پنل نتایج منطقه: لیدربورد و کلن‌های منطقه (چند-صفحه‌ای) */}
          {showRegionResults && Array.isArray(regionResults) && regionResults.length>0 && (
            <RegionResultsPanel C={C} pages={regionResults} onClose={()=>setShowRegionResults(false)} />
          )}

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

          {/* nav controls → moved outside the map layer so they always stay on top */}
        </div>

        {/* live pill + streak — بیرون از لایه‌ی نقشه تا همیشه بالای نقشه دیده بشن */}
        <div style={{position:'absolute',top:10,right:(isDesktop&&panelOpen)?PANEL_W+14:10,zIndex:18,transition:'right .35s ease',height:25,boxSizing:'border-box',background:C.glass,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+C.border,borderRadius:99,padding:'0 13px',display:'flex',gap:8,alignItems:'center',fontSize:11,color:C.sub,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
          <span style={{color:C.text,fontWeight:700}}>☕ {filtered.length}</span>
          <span style={{color:C.border}}>|</span>
          <span><span style={{color:C.green,fontSize:8}}>●</span> {totalLive}</span>
          {checkedIn.size>0&&<><span style={{color:C.border}}>|</span><span style={{color:C.green,fontWeight:700}}>✓ {checkedIn.size}</span></>}
        </div>
        <EventBanner C={C} cafes={cafes} setSelCafe={setSelCafe} onActiveCafeChange={setActiveEventCafeId}/>
        {streak>=2&&<div style={{position:'absolute',top:52,left:10,zIndex:18,height:25,boxSizing:'border-box',display:'flex',alignItems:'center',background:streak>=5?C.gold:C.accent,borderRadius:99,padding:'0 10px',fontSize:11,fontWeight:700,color:'white',boxShadow:'0 2px 10px rgba(0,0,0,.15)'}}>🔥 {streak} روز</div>}

        {/* nav controls — بیرون از لایه‌ی نقشه. هنگام باز بودن هر پاپ‌آپ مخفی می‌شه */}
        {!(showRegionFilter||showRegionResults||showXP||showMenu||showCity||showMode||showBoundary||showPalette||showMapSettings||panelOpen) && (
        <div style={{position:'absolute',bottom:14,left:0,zIndex:18,display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8}}>
          <div style={{overflow:'hidden',opacity:navOpen?0.7:0,maxHeight:navOpen?180:0,transform:navOpen?'translateY(0) scale(1)':'translateY(14px) scale(.85)',transformOrigin:'bottom left',pointerEvents:navOpen?'auto':'none',transition:'opacity .3s ease, max-height .34s ease, transform .34s cubic-bezier(.34,1.45,.5,1)',display:'flex',flexDirection:'column',gap:5}}>
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
          <button onClick={()=>setNavOpen(v=>!v)} title={navOpen?'مخفی کردن کنترل‌ها':'نمایش کنترل‌ها'} style={{width:32,height:32,borderRadius:9,border:navOpen?'1px solid '+C.border:'none',cursor:'pointer',fontFamily:'inherit',background:navOpen?C.glass:C.grad,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',boxShadow:navOpen?'0 2px 6px rgba(0,0,0,.08)':'0 6px 22px '+C.accent+'99',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .3s ease, box-shadow .3s ease, transform .18s cubic-bezier(.34,1.6,.5,1)',animation:navOpen?'none':'tlNavPulse 2s ease-in-out infinite'}} onMouseDown={e=>e.currentTarget.style.transform='scale(.86)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
            <span style={{display:'inline-block',fontSize:16,fontWeight:900,lineHeight:1,color:navOpen?C.text:'#fff',transition:'transform .4s cubic-bezier(.34,1.7,.4,1)',transform:navOpen?'rotate(0deg)':'rotate(180deg)'}}>▾</span>
          </button>
        </div>
        )}

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
                {panelTab==='missions'&&<MissionsTab C={C} cafes={cafes} setSelCafe={setSelCafe} showToast={showToast}/>}
                {panelTab==='rank'&&<RankTab C={C}/>}
                {panelTab==='clan'&&<ClanTab C={C}/>}
                {panelTab==='profile'&&<ProfileTab C={C} xp={xp} levelInfo={levelInfo} streak={streak} checkedIn={checkedIn} userName={userName} coins={coins}/>}
              </div>
            </div>
          </>
        )}
        <LedAdBar C={C} />
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

      {selCafe&&<CafePopup C={C} cafe={selCafe} live={live} favs={favs} setFavs={setFavs} checkedIn={checkedIn} isAdmin={isAdmin} onClose={()=>setSelCafe(null)} onCheckin={()=>doCheckin(selCafe)} showToast={showToast}/>}
      {showXP&&<XPPanel C={C} xp={xp} levelInfo={levelInfo} streak={streak} onClose={()=>setShowXP(false)}/>}
      {showNotif&&<NotificationPanel C={C} notifications={notifications} onMark={markNotifRead} onMarkAll={markAllNotifRead} onClose={()=>setShowNotif(false)}/>}
      <TutorialCoach C={C} session={session} accountType={accountType} tutorialSeen={tutorialSeen} setTutorialSeen={setTutorialSeen} isMobile={isMobile}/>

      {showMenu&&(
        <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.3)',backdropFilter:'blur(8px)'}} onClick={()=>setShowMenu(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:TH+8,right:14,left:14,maxHeight:'calc(100dvh - '+(TH+28)+'px)',overflowY:'auto',WebkitOverflowScrolling:'touch',background:C.glassDark,backdropFilter:'blur(24px)',borderRadius:18,border:'1px solid '+C.border,boxShadow:'0 8px 40px rgba(0,0,0,.15)',animation:'fadeIn .2s ease'}}>
            {[
              {key:'map',icon:'🗺',img:'/icon_map_active@2x.png',label:'نقشه',href:null},
              {key:'missions',icon:'📋',img:'/icon_mission_active@2x.png',label:'ماموریت‌ها',href:null},
              {key:'profile',icon:'👤',img:'/icon_profile_active@2x.png',label:'پروفایل',href:'/profile'},
              {key:'rank',icon:'🏆',img:'/icon_rank_active@2x.png',label:'رتبه‌بندی',href:'/leaderboard'},
              {key:'clans',icon:'🛡',img:'/icon_clan_active@2x.png',label:'کلن‌ها',href:'/clan'},
              {key:'quests',icon:'🎯',label:'رویدادها',href:'/quests'},
              {key:'gallery',icon:'💎',label:'نگارخانه',href:'/gallery'},
              {key:'business',icon:'🏪',label:'پنل کافه‌دار',href:'/business',smeOnly:true},
              {key:'admin',icon:'🛡️',label:'پنل ادمین',href:'/admin',adminOnly:true},
              {key:'xp',icon:'⭐',img:'/xp_coin@256-1.png',label:'سیستم XP',href:null},
              {key:'settings',icon:'⚙️',img:'/settings@256.png',label:'تنظیمات',href:null},
              {key:'reset',icon:'♻️',label:'ریست حساب (تست)',href:null,adminOnly:true},
              {key:'backfill',icon:'🗺️',label:'پرکردن منطقه کافه‌ها',href:null,adminOnly:true},
              {key:'logout',icon:'🚪',label:'خروج',href:null},
            ].filter(item=>(!item.adminOnly||isAdmin)&&(!item.smeOnly||accountType==='sme')).map((item,i,arr)=>{
              const style={width:'100%',display:'flex',alignItems:'center',gap:14,background:'transparent',border:'none',padding:'13px 18px',color:C.text,fontSize:14,fontFamily:'inherit',fontWeight:500,borderBottom:i<arr.length-1?'1px solid '+C.border:'none',textDecoration:'none'}
              if(item.href){
                return <a key={item.key} href={item.href} style={style}>
                  {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.label}
                  <span style={{marginRight:'auto',color:C.sub,fontSize:13}}>›</span>
                </a>
              }
              return <button key={item.key} onClick={()=>{if(item.key==='backfill'){backfillDistricts();return}setShowMenu(false);if(item.key==='reset'){resetMe();return}if(item.key==='logout'){onLogout&&onLogout();return}if(item.key==='xp'){setShowXP(true);return}if(item.key==='settings'){setShowMapSettings(true);return}if(item.key==='missions'){setPanelOpen(true);setPanelTab('missions');return}if(item.key==='map'){setTab('map');setPanelOpen(false);return}showToast('📣 '+item.label+' به زودی!')}} style={style}>
                {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.key==='backfill'&&backfilling?'در حال پردازش…':item.label}
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
            <div style={{fontSize:18,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:4}}><img src="/theme@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>پالت رنگی</div>
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

      {showMapSettings&&(
        <MapSettingsPopup C={C} value={mapDisplay} setValue={setMapDisplay} onClose={()=>setShowMapSettings(false)} />
      )}
      {showBoundary&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowBoundary(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}><img src="/boundaries@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>مرزهای جغرافیایی</div>
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
            <div style={{fontSize:17,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16}}><img src="/map_style@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>استایل نقشه</div>
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
// ── پاپ‌آپ فیلتر منطقه‌ای ──────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { key:'cafe',       icon:'☕', label:'کافه' },
  { key:'restaurant', icon:'🍽️', label:'رستوران' },
  { key:'beauty',     icon:'💇', label:'سالن زیبایی', soon:true },
  { key:'gym',        icon:'🏋️', label:'باشگاه', soon:true },
  { key:'academy',    icon:'📚', label:'آموزشگاه', soon:true },
  { key:'flower',     icon:'🌷', label:'گل‌فروشی', soon:true },
]
const REGION_VIEW_OPTIONS = [
  { key:'showClans',       icon:'🛡️', label:'کلن‌های فعال منطقه' },
  { key:'showLeaderboard', icon:'🏆', label:'لیدربورد منطقه' },
  { key:'showHeatmap',     icon:'🔥', label:'Heatmap منطقه' },
]
function RegionFilterPopup({ C, regions, value, setValue, onApply, onClose }) {
  const toggleCat=(k)=>setValue(v=>({...v, categories: v.categories.includes(k)?v.categories.filter(x=>x!==k):[...v.categories,k]}))
  const toggleView=(k)=>setValue(v=>({...v, [k]: !v[k]}))
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:40,background:'rgba(0,0,0,.45)',backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'82%',overflowY:'auto',boxShadow:'0 -8px 40px rgba(0,0,0,.3)'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>فیلتر منطقه</div>
        <div style={{fontSize:12,color:C.sub,marginBottom:18}}>{regions.join('، ')}</div>

        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>روی نقشه چی ببینم؟</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:20}}>
          {CATEGORY_OPTIONS.map(o=>{
            const on=value.categories.includes(o.key)
            return (
              <button key={o.key} disabled={o.soon} onClick={()=>toggleCat(o.key)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',borderRadius:14,
                  border:'2px solid '+(on?C.accent:C.border),background:on?C.accentL:C.card,
                  color:o.soon?C.sub:C.text,fontSize:13.5,fontWeight:700,fontFamily:'inherit',
                  cursor:o.soon?'default':'pointer',opacity:o.soon?0.55:1,textAlign:'right'}}>
                <span style={{fontSize:18}}>{o.icon}</span>
                <span style={{flex:1}}>{o.label}</span>
                {o.soon&&<span style={{fontSize:9,background:C.chip,color:C.sub,borderRadius:99,padding:'2px 6px'}}>به‌زودی</span>}
                {on&&!o.soon&&<span style={{color:C.accent,fontWeight:800}}>✓</span>}
              </button>
            )
          })}
        </div>

        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>اطلاعات منطقه</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
          {REGION_VIEW_OPTIONS.map(o=>{
            const on=value[o.key]
            return (
              <button key={o.key} onClick={()=>toggleView(o.key)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,
                  border:'2px solid '+(on?C.accent:C.border),background:on?C.accentL:C.card,
                  color:C.text,fontSize:13.5,fontWeight:700,fontFamily:'inherit',cursor:'pointer',textAlign:'right'}}>
                <span style={{fontSize:18}}>{o.icon}</span>
                <span style={{flex:1}}>{o.label}</span>
                <span style={{width:38,height:22,borderRadius:99,background:on?C.accent:C.chip,position:'relative',transition:'.2s',flexShrink:0}}>
                  <span style={{position:'absolute',top:2,left:on?18:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'.2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={onApply}
          style={{width:'100%',padding:15,borderRadius:14,border:'none',background:C.accent,color:'#fff',
            fontSize:15,fontWeight:800,fontFamily:'inherit',cursor:'pointer',boxShadow:'0 6px 20px '+C.accent+'55'}}>
          نمایش نتایج
        </button>
      </div>
    </div>
  )
}

// ── پنل نتایج منطقه: چند-صفحه‌ای (هر منطقه یک صفحه، قابل اسلاید) ──────────────
function RegionResultsPanel({ C, pages, onClose }) {
  const [idx,setIdx]=useState(0)
  const [tab,setTab]=useState('lb')
  const touchX=useRef(null)
  const data=pages[idx]||{region:'',leaderboard:[],clans:[]}
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  const hasLb=data.leaderboard.length>0
  const hasClan=data.clans.length>0
  const multi=pages.length>1

  function onTouchStart(e){ touchX.current=e.touches[0].clientX }
  function onTouchEnd(e){
    if(touchX.current==null) return
    const dx=e.changedTouches[0].clientX-touchX.current
    if(Math.abs(dx)>40){
      // RTL: سوایپ به راست → صفحه‌ی بعد، سوایپ به چپ → صفحه‌ی قبل
      if(dx>0 && idx<pages.length-1) setIdx(idx+1)
      if(dx<0 && idx>0) setIdx(idx-1)
    }
    touchX.current=null
  }

  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:39,background:'rgba(0,0,0,.4)',backdropFilter:'blur(2px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'78%',overflowY:'auto',boxShadow:'0 -8px 40px rgba(0,0,0,.3)'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>

        {/* هدر + ناوبری بین مناطق */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontSize:18,fontWeight:800,color:C.text}}>منطقه {Number(data.region).toLocaleString('fa')}</div>
          {multi&&(
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setIdx(Math.min(pages.length-1,idx+1))} disabled={idx===pages.length-1}
                style={{border:'none',background:idx===pages.length-1?C.chip:C.accent,color:idx===pages.length-1?C.sub:'#fff',width:30,height:30,borderRadius:'50%',fontSize:16,cursor:idx===pages.length-1?'default':'pointer',fontFamily:'inherit'}}>‹</button>
              <span style={{fontSize:12,color:C.sub,fontWeight:700}}>{(idx+1).toLocaleString('fa')} / {pages.length.toLocaleString('fa')}</span>
              <button onClick={()=>setIdx(Math.max(0,idx-1))} disabled={idx===0}
                style={{border:'none',background:idx===0?C.chip:C.accent,color:idx===0?C.sub:'#fff',width:30,height:30,borderRadius:'50%',fontSize:16,cursor:idx===0?'default':'pointer',fontFamily:'inherit'}}>›</button>
            </div>
          )}
        </div>
        <div style={{fontSize:12,color:C.sub,marginBottom:16}}>رتبه‌بندی بر اساس فعالیت در این منطقه{multi&&' · برای جابه‌جایی اسلاید کن'}</div>

        {hasLb&&hasClan&&(
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <button onClick={()=>setTab('lb')} style={{flex:1,padding:10,borderRadius:12,border:'none',background:tab==='lb'?C.accent:C.chip,color:tab==='lb'?'#fff':C.sub,fontWeight:700,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>🏆 برترین‌ها</button>
            <button onClick={()=>setTab('clan')} style={{flex:1,padding:10,borderRadius:12,border:'none',background:tab==='clan'?C.accent:C.chip,color:tab==='clan'?'#fff':C.sub,fontWeight:700,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>🛡️ کلن‌ها</button>
          </div>
        )}

        {((tab==='lb'||!hasClan)&&hasLb)&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {data.leaderboard.map(u=>(
              <div key={u.user_id} style={{display:'flex',alignItems:'center',gap:12,background:u.me?C.accentL:C.card,border:u.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 14px'}}>
                <div style={{width:26,textAlign:'center',fontSize:u.rank<=3?18:14,fontWeight:800,color:u.rank<=3?C.text:C.sub}}>{medals[u.rank]||u.rank.toLocaleString('fa')}</div>
                <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+C.accent+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{u.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{u.name}{u.me&&<span style={{fontSize:9,background:C.accent,color:'#fff',borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
                  <div style={{fontSize:11,color:C.sub}}>{u.checkins.toLocaleString('fa')} چک‌این در منطقه</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{u.xp.toLocaleString('fa')} XP</div>
              </div>
            ))}
          </div>
        )}

        {((tab==='clan'&&hasClan))&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {data.clans.map(c=>(
              <div key={c.clan_id} style={{display:'flex',alignItems:'center',gap:12,background:C.card,border:'1px solid '+C.border,borderRadius:14,padding:'10px 14px'}}>
                <div style={{width:26,textAlign:'center',fontSize:c.rank<=3?18:14,fontWeight:800,color:c.rank<=3?C.text:C.sub}}>{medals[c.rank]||c.rank.toLocaleString('fa')}</div>
                <div style={{width:40,height:40,borderRadius:12,background:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.emblem}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>{c.name}</div>
                  <div style={{fontSize:11,color:C.sub}}>{c.members.toLocaleString('fa')} عضو فعال در منطقه</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{c.xp.toLocaleString('fa')} XP</div>
              </div>
            ))}
          </div>
        )}

        {!hasLb&&!hasClan&&(
          <div style={{textAlign:'center',color:C.sub,fontSize:13,padding:'30px 0'}}>هنوز فعالیتی در این منطقه ثبت نشده</div>
        )}

        {/* نقطه‌های صفحه (اندیکاتور) */}
        {multi&&(
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:18}}>
            {pages.map((_,i)=>(
              <span key={i} onClick={()=>setIdx(i)} style={{width:i===idx?20:7,height:7,borderRadius:99,background:i===idx?C.accent:C.border,transition:'.2s',cursor:'pointer'}}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── تنظیمات نمایش نقشه ─────────────────────────────────────────────────────
function MapSettingsPopup({ C, value, setValue, onClose }) {
  const set=(k,v)=>setValue(prev=>({...prev,[k]:v}))
  const Seg=({label,options,val,onPick})=>(
    <div style={{marginBottom:18}}>
      <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>{label}</div>
      <div style={{display:'flex',gap:6}}>
        {options.map(o=>(
          <button key={o.k} onClick={()=>onPick(o.k)} style={{flex:1,padding:'9px 4px',borderRadius:11,border:'2px solid '+(val===o.k?C.accent:C.border),background:val===o.k?C.accent:C.card,color:val===o.k?'#fff':C.text,fontSize:12,fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>{o.l}</button>
        ))}
      </div>
    </div>
  )
  const dotColors=['#3b82f6','#ef4444','#10b981','#f97316','#8b5cf6','#ec4899','#eab308','#14b8a6','#f43f5e','#6366f1','#000000','#ffffff','#9ca3af','#6b7280','#78350f']
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:3100,background:'rgba(0,0,0,.4)',backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'85%',overflowY:'auto',direction:'rtl'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:16}}>نمایش نقشه</div>

        <Seg label="حالت نمایش SME" val={value.markerMode} onPick={v=>set('markerMode',v)}
          options={[{k:'pin',l:'پین'},{k:'dot',l:'نقطه'},{k:'auto',l:'خودکار'}]} />

        <Seg label="خوشه‌بندی (نمای کل شهر)" val={value.cluster} onPick={v=>set('cluster',v)}
          options={[{k:'off',l:'خاموش'},{k:'low',l:'کم'},{k:'medium',l:'متوسط'},{k:'high',l:'زیاد'}]} />

        <Seg label="خوشه‌بندی هنگام فیلتر منطقه" val={value.regionCluster} onPick={v=>set('regionCluster',v)}
          options={[{k:'off',l:'خاموش'},{k:'low',l:'کم'},{k:'medium',l:'متوسط'},{k:'high',l:'زیاد'}]} />

        {value.markerMode==='dot'&&(
          <>
            <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>رنگ نقطه</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
              {dotColors.map(c=>(
                <button key={c} onClick={()=>set('dotColor',c)} style={{width:34,height:34,borderRadius:'50%',background:c,border:value.dotColor===c?'3px solid '+C.text:'3px solid transparent',cursor:'pointer'}}/>
              ))}
            </div>
            <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>اندازه نقطه: {value.dotSize.toLocaleString('fa')}</div>
            <input type="range" min={4} max={16} value={value.dotSize} onChange={e=>set('dotSize',Number(e.target.value))} style={{width:'100%',marginBottom:18,accentColor:C.accent}}/>
          </>
        )}

        <button onClick={onClose} style={{width:'100%',padding:14,borderRadius:14,border:'none',background:C.accent,color:'#fff',fontSize:15,fontWeight:800,fontFamily:'inherit',cursor:'pointer'}}>تمام</button>
      </div>
    </div>
  )
}

// ── نوار LED سبک تابلوی واقعی: پیکسل‌های مربعی sharp + grid (بدون glow) ────────
// ورودی هر اسلاید می‌تونه متن یا ویدیو باشه. ویدیو خودکار پیکسلی می‌شه.
const LED_ADS = [
  { type:'video', src:'/ads/led-1.mp4' },
  { type:'video', src:'/ads/led-2.mp4' },
  { type:'video', src:'/ads/led-3.mp4' },
  { type:'video', src:'/ads/led-4.mp4' },
  { type:'video', src:'/ads/led-5.mp4' },
]
function LedAdBar({ C }) {
  const [visible, setVisible] = useState(false)
  useEffect(()=>{
    let hideTimer
    const VISIBLE_MS = LED_ADS.length*15000   // دقیقاً کافی برای نمایش کامل هر ۵ ویدیو
    const INTERVAL_MS = 10*60*1000            // هر ۱۰ دقیقه یک‌بار
    function trigger(){ setVisible(true); hideTimer=setTimeout(()=>setVisible(false),VISIBLE_MS) }
    trigger()                                  // بلافاصله با رفرش/ورود، بدون تأخیر
    const intervalTimer=setInterval(trigger,INTERVAL_MS)
    return ()=>{ clearTimeout(hideTimer); clearInterval(intervalTimer) }
  },[])
  if(!visible) return null
  return <LedAdBarInner C={C}/>
}
function LedAdBarInner({ C }) {
  const canvasRef=useRef(null)
  const srcRef=useRef(null)
  const videoRef=useRef(null)
  const [idx,setIdx]=useState(0)
  const idxRef=useRef(0)

  useEffect(()=>{
    let t
    const schedule=()=>{
      const cur=LED_ADS[idxRef.current]
      const dur=15000  // ۱۵ ثانیه برای هر اسلاید
      t=setTimeout(()=>{ idxRef.current=(idxRef.current+1)%LED_ADS.length; setIdx(idxRef.current); schedule() },dur)
    }
    schedule()
    return ()=>clearTimeout(t)
  },[])

  useEffect(()=>{
    const cv=canvasRef.current; if(!cv) return
    const ctx=cv.getContext('2d')
    if(!srcRef.current) srcRef.current=document.createElement('canvas')
    const src=srcRef.current; const sctx=src.getContext('2d')
    sctx.imageSmoothingEnabled=true          // منبع صاف (تا رنگ‌ها خوب نمونه‌برداری شن)
    let raf, curIdx=-1, lastFrame=0
    const dpr=Math.min(window.devicePixelRatio||1,2)

    let COLS=0, ROWS=0, CELL=0   // تعداد ستون/ردیف و اندازه‌ی خانه (device px صحیح)

    function resize(){
      const w=cv.clientWidth||cv.parentElement.clientWidth, h=cv.clientHeight||cv.parentElement.clientHeight
      ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled=false
      CELL=Math.max(2,Math.round(2*dpr))
      // عرض/ارتفاع بوم را دقیقاً مضرب CELL کن تا همه خانه‌ها یک‌اندازه باشن
      COLS=Math.ceil((w*dpr)/CELL)   // ceil تا کل عرض پوشش داده شه (چند px آخر پشت لبه)
      ROWS=Math.round((h*dpr)/CELL)
      cv.width=COLS*CELL; cv.height=ROWS*CELL
      // اندازه‌ی CSS دقیقاً برابر device px تقسیم بر dpr → بدون کش‌دادن (grid یکنواخت)
      cv.style.width=(cv.width/dpr)+'px'
      cv.style.height='100%'
      src.width=COLS; src.height=ROWS
    }
    resize(); window.addEventListener('resize',resize)

    function renderTextSource(ad){
      const sw=src.width, sh=src.height
      sctx.clearRect(0,0,sw,sh); sctx.fillStyle='#000'; sctx.fillRect(0,0,sw,sh)
      sctx.textBaseline='middle'; sctx.direction='rtl'; sctx.textAlign='right'
      sctx.font='800 '+Math.round(sh*0.62)+'px Estedad, sans-serif'
      sctx.fillStyle=ad.accent; sctx.fillText(ad.title, sw-2, sh*0.5)
      const tw=sctx.measureText(ad.title).width
      sctx.font='700 '+Math.round(sh*0.5)+'px Estedad, sans-serif'
      sctx.fillStyle='#fff'; sctx.fillText('· '+ad.sub, sw-tw-8, sh*0.5)
    }

    function draw(now){
      raf=requestAnimationFrame(draw)
      if(now-lastFrame<40) return
      lastFrame=now
      const ad=LED_ADS[idxRef.current]

      // ۱) محتوا را روی منبع کوچک (COLS×ROWS) بکش
      if(ad.type==='video'){
        const v=videoRef.current
        if(v&&v.readyState>=2){
          const sw=src.width, sh=src.height
          sctx.fillStyle='#000'; sctx.fillRect(0,0,sw,sh)
          const vr=v.videoWidth/v.videoHeight, sr=sw/sh
          let dw=sw,dh=sh,dx=0,dy=0
          if(vr>sr){ dh=sh; dw=sh*vr; dx=(sw-dw)/2 } else { dw=sw; dh=sw/vr; dy=(sh-dh)/2 }
          try{ sctx.drawImage(v,dx,dy,dw,dh) }catch(e){}
        }
      } else if(curIdx!==idxRef.current){ renderTextSource(ad) }
      curIdx=idxRef.current

      // ۲) منبع کوچک را با nearest-neighbor بزرگ کن (پیکسل‌های تیز، بدون moiré)
      ctx.fillStyle='#050506'; ctx.fillRect(0,0,cv.width,cv.height)
      ctx.imageSmoothingEnabled=false
      try{ ctx.drawImage(src,0,0,COLS,ROWS,0,0,COLS*CELL,ROWS*CELL) }catch(e){ return }

      // ۳) شبکه‌ی grid تیره را با خطوط دقیق ۱px روی خانه‌ها بکش (یکنواخت)
      ctx.fillStyle='rgba(0,0,0,0.55)'
      for(let x=0;x<=COLS;x++){ ctx.fillRect(x*CELL,0,1,ROWS*CELL) }
      for(let y=0;y<=ROWS;y++){ ctx.fillRect(0,y*CELL,COLS*CELL,1) }
    }
    raf=requestAnimationFrame(draw)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  },[])

  const cur=LED_ADS[idx]
  return (
    <div style={{position:'absolute',left:'50%',bottom:10,transform:'translateX(-50%)',zIndex:18,width:'min(260px, calc(100vw - 100px))'}}>
      <div style={{height:30,position:'relative',borderRadius:99,overflow:'hidden',background:'#050506'}}>
        {/* ویدیوی پنهان (منبع افکت) — فقط وقتی اسلاید ویدیویی فعاله */}
        {cur&&cur.type==='video'&&(
          <video key={idx} ref={videoRef} src={cur.src} autoPlay loop muted playsInline
            style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}}/>
        )}
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block',imageRendering:'pixelated'}}/>
        <div style={{position:'absolute',bottom:2,left:8,display:'flex',gap:3}}>
          {LED_ADS.map((_,i)=>(
            <span key={i} style={{width:i===idx?10:4,height:2.5,borderRadius:2,background:i===idx?'#fff':'rgba(255,255,255,.3)',transition:'.3s'}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardTab({C,cafes,filtered,live,totalLive,showToast,setSearch,checkedIn,xp,levelInfo,streak,setShowXP}) {
  const [topPlayers,setTopPlayers]=useState([])
  const [hotEvents,setHotEvents]=useState([])
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    const load=()=>fetchLeaderboard(sess).then(list=>{ if(alive) setTopPlayers(list.slice(0,3)) })
    load()
    const unsub=subscribeToTables([{table:'profiles',event:'UPDATE'}],()=>load())
    return ()=>{ alive=false; unsub() }
  },[])
  useEffect(()=>{
    let alive=true
    const loadEvents=()=>fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,cafes(name,district),collectible_defs(icon,rarity)&order=created_at.desc&limit=5',
      {headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}}).then(r=>r.json()).then(rows=>{ if(alive) setHotEvents(Array.isArray(rows)?rows:[]) }).catch(()=>{})
    loadEvents()
    const unsub=subscribeToTables([{table:'quests',event:'*'}],()=>loadEvents())
    return ()=>{ alive=false; unsub() }
  },[])
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  return <div>
    <div style={{margin:'14px 12px 0',background:'linear-gradient(135deg,'+levelInfo.current.color+'22,'+levelInfo.current.color+'08)',border:'1.5px solid '+levelInfo.current.color+'33',borderRadius:18,padding:'14px',cursor:'pointer'}} onClick={()=>setShowXP(true)}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:36}}>{levelInfo.current.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.sub}}>لول {levelInfo.current.level} — {levelInfo.current.name}</div>
          <div style={{fontSize:22,fontWeight:900,color:levelInfo.current.color}}>{xp.toLocaleString('fa')} XP</div>
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
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:10,color:C.sub,letterSpacing:.7,fontWeight:600}}>🎉 رویدادهای داغ<span style={{color:C.green}}> ●</span></div>
        <a href="/quests" style={{fontSize:10,color:C.accent,fontWeight:700,textDecoration:'none'}}>همه ›</a>
      </div>
      {hotEvents.length===0
        ? <div style={{fontSize:11,color:C.sub,padding:'8px 2px'}}>الان رویداد فعالی نیست. کافه‌دارها به‌زودی چیزی منتشر می‌کنن.</div>
        : hotEvents.map(ev=>{
            const cd=ev.collectible_defs
            const cafeName=ev.cafes?ev.cafes.name:''
            return <a key={ev.id} href="/quests" style={{display:'block',textDecoration:'none',background:'#FFF9F0',border:'1px solid #FFE0B2',borderRadius:14,padding:'11px 12px',marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <span style={{fontSize:20}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:800,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.title}</div>
                  <div style={{fontSize:10,color:C.sub,marginTop:2}}>{cafeName}{ev.cafes&&ev.cafes.district?' · '+ev.cafes.district:''}</div>
                </div>
              </div>
              <div style={{fontSize:11,color:'#E65100',fontWeight:700,marginTop:6}}>🎁 {ev.reward_label}{ev.reward_xp>0?' · +'+ev.reward_xp+' XP':''}</div>
            </a>
          })}
      <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none',marginTop:4,paddingBottom:2}}>
        {[
          {icon:'💎',label:'نگارخانه',href:'/gallery',color:'#8b5cf6'},
          {icon:'🏆',label:'رتبه‌بندی',href:'/leaderboard',color:'#f59e0b'},
          {icon:'🛡️',label:'کلن‌ها',href:'/clan',color:'#3b82f6'},
        ].map(s=>(
          <a key={s.href} href={s.href} style={{flexShrink:0,textDecoration:'none',background:s.color+'14',border:'1px solid '+s.color+'33',borderRadius:14,padding:'10px 12px',minWidth:110,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
            <span style={{fontSize:20}}>{s.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:C.text}}>{s.label}</span>
            <span style={{fontSize:9,color:s.color,fontWeight:700}}>مشاهده کامل ›</span>
          </a>
        ))}
      </div>
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)',paddingBottom:24}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>برترین‌ها</div>
      {topPlayers.map(p=>(
        <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid '+C.border}}>
          <span style={{fontSize:18}}>{medals[p.rank]}</span>
          <div style={{flex:1}}><div style={{fontSize:12,color:C.text,fontWeight:700,display:'flex',alignItems:'center',gap:5}}>{p.name}{p.me&&<span style={{fontSize:8,background:C.accent,color:'#fff',borderRadius:99,padding:'0 6px'}}>تو</span>}</div></div>
          <div style={{fontSize:12,color:C.accent,fontWeight:800}}>{p.xp.toLocaleString('fa')} XP</div>
        </div>
      ))}
    </div>
  </div>
}

// ── MISSIONS TAB — حالا کاملاً واقعی: از quests واقعی می‌خونه، claim تکراری امکان نداره ──
function MissionsTab({C, cafes, setSelCafe, showToast}) {
  const [quests, setQuests] = useState([])
  const [progress, setProgress] = useState({})
  const [redemptions, setRedemptions] = useState({})
  const sess = getSession()
  const uid = sess && sess.user && sess.user.id

  const load = useCallback(()=>{
    const h={apikey:SB_KEY,Authorization:'Bearer '+((sess&&sess.access_token)||SB_KEY)}
    fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=*,cafes(name,district)&order=created_at.desc&limit=30',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setQuests(rows) }).catch(()=>{})
    if(uid){
      fetch(SB_URL+'/rest/v1/quest_progress?user_id=eq.'+uid+'&select=*',{headers:h})
        .then(r=>r.json()).then(rows=>{ const m={}; (Array.isArray(rows)?rows:[]).forEach(p=>{m[p.quest_id]=p}); setProgress(m) }).catch(()=>{})
      fetch(SB_URL+'/rest/v1/redemptions?user_id=eq.'+uid+'&select=*',{headers:h})
        .then(r=>r.json()).then(rows=>{ const m={}; (Array.isArray(rows)?rows:[]).forEach(r=>{m[r.quest_id]=r}); setRedemptions(m) }).catch(()=>{})
    }
  },[uid])

  useEffect(()=>{ load() },[load])
  useEffect(()=>{
    const subs=[{table:'quests',event:'*'}]
    if(uid){ subs.push({table:'quest_progress',event:'*',filter:'user_id=eq.'+uid}); subs.push({table:'redemptions',event:'*',filter:'user_id=eq.'+uid}) }
    const unsub=subscribeToTables(subs,()=>load())
    return ()=>unsub()
  },[load,uid])

  function openCafe(q){
    const cafe=cafes.find(c=>c.id===q.cafe_id)
    if(cafe) setSelCafe(cafe)
    else showToast && showToast('این کافه الان روی نقشه لود نشده، از /quests امتحان کن','warn')
  }

  if(quests.length===0){
    return <div style={{padding:'50px 16px',textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:10}}>🎯</div>
      <div style={{fontWeight:800,color:C.text,marginBottom:4}}>الان ماموریت/رویداد فعالی نیست</div>
      <div style={{fontSize:12,color:C.sub}}>کافه‌دارها به‌زودی چیزی منتشر می‌کنن — همین‌جا لحظه‌ای میاد.</div>
    </div>
  }

  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>ماموریت‌ها و رویدادهای فعال</div>
    <div style={{fontSize:11,color:C.sub,marginBottom:14}}>واقعی و لحظه‌ای — همین الان کافه‌دارها منتشرشون کردن</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {quests.map(q=>{
        const prog=progress[q.id]
        const cur=prog?prog.progress:0
        const isDone=!!(prog&&prog.completed)
        const pct=Math.min(100,Math.round((cur/(q.target_count||1))*100))
        const red=redemptions[q.id]
        const cafeName=q.cafes?q.cafes.name:'کافه'
        return <div key={q.id} style={{background:isDone?C.green+'18':C.card,border:'1px solid '+(isDone?C.green+'55':C.border),borderRadius:14,padding:12}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:isDone?C.green+'20':C.accent+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{isDone?'✅':(q.icon||'🎯')}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{q.title}</div>
                {q.reward_xp>0 && <div style={{fontSize:11,fontWeight:800,color:C.accent,flexShrink:0}}>+{q.reward_xp} XP</div>}
              </div>
              <div style={{fontSize:11,color:C.sub,marginTop:2}}>{cafeName}{q.cafes&&q.cafes.district?' · '+q.cafes.district:''}</div>
              {q.target_count>1 && <div style={{marginTop:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:10,color:isDone?C.green:C.sub,fontWeight:isDone?700:400}}>{isDone?'تکمیل شد! ✓':(cur+' از '+q.target_count)}</span>
                  <span style={{fontSize:10,color:C.sub}}>{pct}%</span>
                </div>
                <div style={{height:5,background:C.chip,borderRadius:99,overflow:'hidden'}}>
                  <div className="mission-bar" style={{height:'100%',width:pct+'%',background:isDone?'linear-gradient(90deg,'+C.green+',#5AC96C)':'linear-gradient(90deg,'+C.accent+','+C.accent+'aa)',borderRadius:99}}/>
                </div>
              </div>}
            </div>
          </div>
          {isDone
            ? <div style={{marginTop:10,background:C.green+'15',border:'1px dashed '+C.green,borderRadius:10,padding:'8px 10px',textAlign:'center'}}>
                <span style={{fontSize:11.5,color:C.green,fontWeight:800}}>🎁 {q.reward_label}{red?' — کد: '+red.code:''}</span>
              </div>
            : <button onClick={()=>openCafe(q)} style={{marginTop:10,width:'100%',background:C.accent,border:'none',borderRadius:10,padding:'8px',fontSize:12,color:'white',fontWeight:700,fontFamily:'inherit'}}>📍 برو به {cafeName} و چک‌این کن</button>}
        </div>
      })}
    </div>
  </div>
}

// ── RANK TAB (خلاصه — داده واقعی از gameSystem، نسخه کامل در /leaderboard) ──────
function RankTab({C}) {
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  const [rows,setRows]=useState([])
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    const load=()=>fetchLeaderboard(sess).then(list=>{ if(alive) setRows(list.slice(0,5)) })
    load()
    // با هر تغییر XP هر کاربری، لیدربورد لحظه‌ای به‌روز شه
    const unsub=subscribeToTables([{table:'profiles',event:'UPDATE'}],()=>load())
    return ()=>{ alive=false; unsub() }
  },[])
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>برترین‌های این هفته 🏆</div>
    <div style={{fontSize:11,color:C.sub,marginBottom:14}}>رتبه خودت رو بین بقیه ببین</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {rows.map((p)=>{
        const rank=p.rank
        return <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,background:p.me?C.accentL:C.card,border:p.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:24,textAlign:'center',fontSize:rank<=3?18:14,fontWeight:800,color:rank<=3?C.text:C.sub}}>{medals[rank]||rank.toLocaleString('fa')}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+C.accent+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{p.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{p.name}{p.me&&<span style={{fontSize:9,background:C.accent,color:'#fff',borderRadius:99,padding:'1px 7px'}}>تو</span>}{p.sample&&<span style={{fontSize:9,background:C.chip,color:C.sub,border:'1px solid '+C.border,borderRadius:99,padding:'1px 6px'}}>نمونه</span>}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{p.xp.toLocaleString('fa')} XP</div>
        </div>
      })}
    </div>
    <a href="/leaderboard" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:'#fff',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده جدول کامل ›</a>
  </div>
}

// ── CLAN TAB (خلاصه — داده واقعی از gameSystem، نسخه کامل در /clan) ─────────────
function ClanTab({C}) {
  const [clan,setClan]=useState(null)       // {clans, role, ...}
  const [standing,setStanding]=useState(null)
  const [members,setMembers]=useState([])
  const [loaded,setLoaded]=useState(false)
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    ;(async()=>{
      const [mine,stand]=await Promise.all([fetchMyClans(sess),fetchClanStandings(sess)])
      if(!alive) return
      const active=mine.find(m=>m.is_active)||mine[0]||null
      setClan(active)
      if(active){
        setStanding(stand.find(s=>s.id===active.clan_id)||null)
        const mem=await fetchClanMembers(sess,active.clan_id)
        if(alive) setMembers(mem.slice(0,5))
      }
      setLoaded(true)
    })()
    return ()=>{ alive=false }
  },[])

  if(!loaded) return <div style={{padding:'30px 12px',textAlign:'center',color:C.sub,fontSize:13}}>در حال بارگذاری…</div>

  if(!clan) return <div style={{padding:'30px 16px',textAlign:'center'}}>
    <div style={{fontSize:40,marginBottom:8}}>🛡️</div>
    <div style={{fontWeight:800,color:C.text,marginBottom:4}}>هنوز عضو کلنی نیستی</div>
    <div style={{fontSize:12,color:C.sub,marginBottom:14}}>یه کلن بساز یا به یکی بپیوند</div>
    <a href="/clan" style={{display:'inline-block',background:C.accent,color:'#fff',borderRadius:12,padding:'10px 20px',fontSize:13,fontWeight:700,textDecoration:'none'}}>رفتن به کلن‌ها ›</a>
  </div>

  const c=clan.clans
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:'linear-gradient(135deg,'+c.color+','+c.color+'cc)',borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <div style={{fontSize:38}}>{c.emblem}</div>
      <div style={{fontSize:19,fontWeight:800,marginTop:2}}>{c.name}</div>
      {standing&&<div style={{fontSize:12,opacity:.9,marginTop:3}}>سطح {clanLevel(standing.xp_total).toLocaleString('fa')} · رتبه {standing.rank.toLocaleString('fa')} · {Number(standing.xp_total).toLocaleString('fa')} XP</div>}
    </div>
    <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:8}}>اعضای برتر</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {members.map((m,i)=>(
        <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:12,background:m.me?C.accentL:C.card,border:m.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:22,textAlign:'center',fontWeight:800,color:C.sub,fontSize:14}}>{(i+1).toLocaleString('fa')}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+c.color+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{m.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{m.name}{m.me&&<span style={{fontSize:9,background:C.accent,color:'#fff',borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
            <div style={{fontSize:11,color:C.sub}}>{m.role==='leader'?'رهبر':m.role==='officer'?'افسر':'عضو'}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{m.xp.toLocaleString('fa')} XP</div>
        </div>
      ))}
    </div>
    <a href="/clan" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:'#fff',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده کامل کلن ›</a>
  </div>
}

// ── PROFILE TAB (خلاصه — نسخه کامل در /profile) ────────────────────────────────
function ProfileTab({C,xp,levelInfo,streak,checkedIn,userName,coins}) {
  const stats = [
    { icon:'🔥', value:streak,        label:'استریک' },
    { icon:'☕', value:checkedIn.size, label:'کافه' },
    { icon:'🪙', value:coins,         label:'سکه' },
    { icon:'⭐', value:levelInfo?.current?.level||1, label:'لِوِل' },
  ]
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:C.grad,borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <img src="/icon_profile_active@2x.png" alt="پروفایل" width={64} height={64} style={{objectFit:'contain',display:'block',margin:'0 auto 6px'}}/>
      <div style={{fontSize:19,fontWeight:800}}>{userName||'کاربر'}</div>
      <div style={{fontSize:12,opacity:.9,marginTop:2}}>☕ {levelInfo?.current?.name||'کافه‌گرد'} · {xp.toLocaleString('fa')} XP</div>
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

// ── پیل شیشه‌ای رویدادها روی نقشه (هم‌استایل پیل آمار زنده، بدون بک‌گراند مجزا) ──
function EventBanner({C, cafes, setSelCafe, onActiveCafeChange}) {
  const [events, setEvents] = useState([])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const touchXRef = useRef(null)

  const load = useCallback(()=>{
    fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,discount_pct,cafe_id,cafes(name,district),collectible_defs(icon,rarity)&order=created_at.desc&limit=20',
      {headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setEvents(rows) }).catch(()=>{})
  },[])

  useEffect(()=>{ load() },[load])
  useEffect(()=>{
    const unsub=subscribeToTables([{table:'quests',event:'INSERT'}],()=>{ load(); setIdx(0) })
    return ()=>unsub()
  },[load])

  useEffect(()=>{
    if(events.length<2) return
    clearInterval(timerRef.current)
    timerRef.current=setInterval(()=>setIdx(i=>(i+1)%events.length),4500)
    return ()=>clearInterval(timerRef.current)
  },[events.length])

  const safeIdx = events.length ? (idx % events.length) : 0
  const ev = events.length ? events[safeIdx] : null

  // به پدر بگو الان کدوم کافه رو باید روی نقشه هایلایت کنه (بدون حرکت دوربین)
  useEffect(()=>{
    onActiveCafeChange && onActiveCafeChange(ev ? ev.cafe_id : null)
    return ()=>{ onActiveCafeChange && onActiveCafeChange(null) }
  },[ev && ev.id])

  if(!ev) return null
  const cd = ev.collectible_defs

  function go(delta){
    clearInterval(timerRef.current)
    setIdx(i=>(i+delta+events.length)%events.length)
  }
  function onClickBanner(){
    const cafe = cafes.find(c=>c.id===ev.cafe_id)
    if(cafe) setSelCafe(cafe)
    else if(typeof window!=='undefined') window.location.href='/quests'
  }
  function onTouchStart(e){ touchXRef.current = e.touches[0].clientX }
  function onTouchEnd(e){
    if(touchXRef.current==null) return
    const dx = e.changedTouches[0].clientX - touchXRef.current
    if(Math.abs(dx) > 40) go(dx>0 ? -1 : 1)
    touchXRef.current = null
  }

  return (
    <div style={{position:'absolute',top:10,left:10,zIndex:18,display:'flex',flexDirection:'column',gap:5,alignItems:'flex-start',maxWidth:280}}>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={onClickBanner}
        style={{height:25,boxSizing:'border-box',background:C.glass,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+C.border,borderRadius:99,padding:'0 8px',display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.sub,boxShadow:'0 2px 8px rgba(0,0,0,.08)',cursor:'pointer',minWidth:0}}>
        <button onClick={(e)=>{e.stopPropagation();go(1)}} style={{background:'none',border:'none',color:C.sub,fontSize:12,padding:'0 1px',flexShrink:0,fontFamily:'inherit',lineHeight:1}}>‹</button>
        <span key={ev.id} style={{display:'flex',alignItems:'center',gap:5,minWidth:0,animation:'evSlide .3s ease'}}>
          <span style={{fontSize:11,flexShrink:0,lineHeight:1}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
          <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontWeight:700,color:C.text,lineHeight:1}}>{ev.cafes?ev.cafes.name:'کافه'}: {ev.title}</span>
        </span>
        <button onClick={(e)=>{e.stopPropagation();go(-1)}} style={{background:'none',border:'none',color:C.sub,fontSize:12,padding:'0 1px',flexShrink:0,fontFamily:'inherit',lineHeight:1}}>›</button>
      </div>
      {events.length>1 && (
        <div style={{display:'flex',gap:3,paddingRight:8}}>
          {events.map((e,i)=>(
            <button key={e.id} onClick={()=>{ clearInterval(timerRef.current); setIdx(i) }}
              style={{flexShrink:0,width:i===safeIdx?12:4,height:4,borderRadius:99,border:'none',background:i===safeIdx?C.accent:C.border,transition:'all .3s',padding:0}}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── پنل نوتیفیکیشن‌ها ────────────────────────────────────────────────────────
function faAgo(iso){
  const mins=Math.floor((Date.now()-new Date(iso).getTime())/60000)
  if(mins<1) return 'همین الان'
  if(mins<60) return mins.toLocaleString('fa')+' دقیقه پیش'
  const hrs=Math.floor(mins/60)
  if(hrs<24) return hrs.toLocaleString('fa')+' ساعت پیش'
  return Math.floor(hrs/24).toLocaleString('fa')+' روز پیش'
}
function NotificationPanel({C, notifications, onMark, onMarkAll, onClose}) {
  return <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,maxHeight:'80dvh',overflowY:'auto',background:C.card,borderRadius:'24px 24px 0 0',border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',padding:'0 0 30px'}}>
      <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'14px auto 12px'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px 14px',borderBottom:'1px solid '+C.border}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text}}>🔔 اعلان‌ها</div>
        {notifications.some(n=>!n.read) && <button onClick={onMarkAll} style={{background:'none',border:'none',color:C.accent,fontSize:12,fontWeight:700,fontFamily:'inherit'}}>خواندن همه</button>}
      </div>
      <div style={{padding:'10px 18px 0'}}>
        {notifications.length===0
          ? <div style={{textAlign:'center',color:C.sub,fontSize:13,padding:'40px 0'}}>اعلانی نداری. با چک‌این و شرکت توی رویدادها این‌جا پر می‌شه.</div>
          : notifications.map(n=>(
            <a key={n.id} href={n.link||'#'} onClick={()=>onMark(n.id)}
              style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',padding:'11px 4px',borderBottom:'1px solid '+C.border,opacity:n.read?0.55:1}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:C.chip,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{n.icon||'🔔'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:n.read?600:800,color:C.text}}>{n.title}</div>
                {n.body && <div style={{fontSize:11.5,color:C.sub,marginTop:2}}>{n.body}</div>}
                <div style={{fontSize:10,color:C.sub,marginTop:3}}>{faAgo(n.created_at)}</div>
              </div>
              {!n.read && <span style={{width:8,height:8,borderRadius:'50%',background:C.accent,flexShrink:0}}/>}
            </a>
          ))}
      </div>
    </div>
  </div>
}

// ── تیوتوریال داینامیک: کارت راهنمای کوچیک context-aware، وضعیت سمت سرور ────
const TUTORIAL_STEPS = [
  { key:'welcome_map', forRole:'any', title:'به TwinLand خوش اومدی! ☕', text:'روی هر کافه‌ی نقشه بزن تا چک‌این کنی و XP بگیری.' },
  { key:'event_banner', forRole:'any', title:'رویدادهای زنده 🎉', text:'این نوار بالای نقشه هر چیزی که کافه‌دارها همین الان منتشر می‌کنن رو نشون می‌ده — روش بزن تا بری به کافه‌ش.' },
  { key:'gallery_intro', forRole:'any', title:'نگارخانه‌ی کلکسیون 💎', text:'با چک‌این و شرکت در رویدادها، آیتم‌های کمیاب جمع می‌کنی. از منو برو «نگارخانه» تا ببینیشون.' },
  { key:'business_intro', forRole:'sme', title:'پنل کافه‌دار 🏪', text:'از تب «کمپین‌ها» می‌تونی رویداد/تخفیف/آیتم کلکسیونی منتشر کنی تا همون لحظه رو نقشه‌ی همه بیاد.' },
]
function TutorialCoach({C, session, accountType, tutorialSeen, setTutorialSeen, isMobile}) {
  const [dismissing, setDismissing] = useState(false)
  if(!session || !session.user) return null
  const step = TUTORIAL_STEPS.find(s => !tutorialSeen[s.key] && (s.forRole==='any' || s.forRole===accountType))
  if(!step) return null

  async function dismiss(){
    setDismissing(true)
    setTutorialSeen(prev=>({...prev,[step.key]:true}))
    const token=(session&&session.access_token)||SB_KEY
    fetch(SB_URL+'/rest/v1/rpc/mark_tutorial_seen',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_key:step.key})
    }).catch(()=>{})
    setTimeout(()=>setDismissing(false),50)
  }

  return (
    <div style={{position:'fixed',left:14,right:14,bottom:isMobile?76:20,zIndex:1500,animation:'coachPop .3s ease'}}>
      <div style={{background:C.card,border:'1.5px solid '+C.accent+'55',borderRadius:18,padding:'14px 16px',boxShadow:'0 8px 30px rgba(0,0,0,.18)',maxWidth:420,margin:'0 auto',display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{fontSize:24,flexShrink:0}}>💡</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:800,color:C.text,marginBottom:3}}>{step.title}</div>
          <div style={{fontSize:12,color:C.sub,lineHeight:1.7}}>{step.text}</div>
          <button onClick={dismiss} style={{marginTop:10,background:C.accent,color:'#fff',border:'none',borderRadius:10,padding:'7px 16px',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>فهمیدم</button>
        </div>
        <button onClick={dismiss} style={{background:'none',border:'none',color:C.sub,fontSize:14,flexShrink:0}}>✕</button>
      </div>
    </div>
  )
}

// ── CAFE POPUP ────────────────────────────────────────────────────────────────
// ── مدیریت مستقیم توسط صاحب اپ (بدون تأیید) ──────────────────────────────────
async function ownerClaimDirect(cafe, showToast){
  const s=getSession(); const token=(s&&s.access_token)||SB_KEY; const uid=s&&s.user&&s.user.id
  if(!uid){ showToast('اول وارد شو'); return }
  try{
    const res=await fetch(SB_URL+'/rest/v1/rpc/owner_claim_direct',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_cafe_id:cafe.id})
    }).then(r=>r.json())
    const row=Array.isArray(res)?res[0]:res
    if(row&&row.ok){ showToast('✅ این کافه به پنل کافه‌دارت اضافه شد! برو /business'); }
    else if(row&&row.error==='not_owner'){ showToast('این قابلیت فقط برای صاحب اپه') }
    else { showToast('خطا: '+((row&&row.error)||'نامشخص')) }
  }catch(e){ showToast('خطا در ارتباط') }
}

// ── claim کردن کافه توسط صاحب احتمالی ────────────────────────────────────────
async function claimCafe(cafe, showToast){
  const note=typeof window!=='undefined'?window.prompt('برای تأیید مالکیت، یه توضیح کوتاه بنویس (مثلاً نام روی پروانه کسب، شماره تماس کافه):'):''
  if(note===null) return  // لغو
  const s=getSession(); const token=(s&&s.access_token)||SB_KEY; const uid=s&&s.user&&s.user.id
  if(!uid){ showToast('اول وارد شو'); return }
  try{
    const res=await fetch(SB_URL+'/rest/v1/rpc/claim_cafe',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_cafe_id:cafe.id,p_note:note||null})
    }).then(r=>r.json())
    const row=Array.isArray(res)?res[0]:res
    if(row&&row.ok){ showToast('✅ درخواست ثبت شد. بعد از تأیید ادمین فعال می‌شه.') }
    else if(row&&row.error==='already_owned'){ showToast('این کافه قبلاً صاحب تأییدشده داره') }
    else if(row&&row.error==='already_claimed_by_you'){ showToast('قبلاً درخواست دادی، منتظر تأییده') }
    else if(row&&row.error==='claim_pending_other'){ showToast('یه نفر دیگه هم درخواست داده، در حال بررسیه') }
    else { showToast('خطا در ثبت درخواست') }
  }catch(e){ showToast('خطا در ارتباط') }
}

function CafePopup({C,cafe,live,favs,setFavs,checkedIn,isAdmin,onClose,onCheckin,showToast}) {
  const color=getColor(cafe.name); const isChecked=checkedIn.has(cafe.id); const isFav=favs.has(cafe.id)
  const xpAmount=cafe.is_top?XP_CONFIG.checkin_top:XP_CONFIG.checkin
  const [cafeEvents,setCafeEvents]=useState([])
  const [evLoading,setEvLoading]=useState(true)
  useEffect(()=>{
    let alive=true
    const loadEvents=()=>fetch(SB_URL+'/rest/v1/quests?cafe_id=eq.'+cafe.id+'&active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,discount_pct,collectible_defs(icon,title,rarity)&order=created_at.desc&limit=6',
      {headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}})
      .then(r=>r.json()).then(rows=>{ if(alive) setCafeEvents(Array.isArray(rows)?rows:[]) }).catch(()=>{})
      .finally(()=>{ if(alive) setEvLoading(false) })
    setEvLoading(true)
    loadEvents()
    const unsub=subscribeToTables([{table:'quests',event:'*',filter:'cafe_id=eq.'+cafe.id}],()=>loadEvents())
    return ()=>{ alive=false; unsub() }
  },[cafe.id])
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

        {/* رویدادها/آیتم‌های فعال این کافه — واقعی و لحظه‌ای */}
        {!evLoading&&cafeEvents.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11.5,fontWeight:700,color:C.sub,marginBottom:8}}>🎉 رویدادهای فعال این کافه</div>
            {cafeEvents.map(ev=>{
              const cd=ev.collectible_defs
              return <div key={ev.id} style={{background:'#FFF9F0',border:'1px solid #FFE0B2',borderRadius:14,padding:'11px 13px',display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <span style={{fontSize:22}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#E65100'}}>{ev.title}{cd?' — '+cd.title:''}</div>
                  <div style={{fontSize:11,color:C.sub,marginTop:2}}>🎁 {ev.reward_label}{ev.reward_xp>0?' · +'+ev.reward_xp+' XP':''}</div>
                </div>
              </div>
            })}
          </div>
        )}

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
        <button onClick={()=>isAdmin?ownerClaimDirect(cafe,showToast):claimCafe(cafe,showToast)} style={{width:'100%',marginTop:10,background:'transparent',color:C.sub,border:'1.5px dashed '+C.border,borderRadius:14,padding:12,fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>
          {isAdmin?'🏪 مدیریت مستقیم این کافه (صاحب اپ)':'🏪 صاحب این کافه هستید؟'}
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

export default function Page(){
  const [session,   setSession]   = useState(null)
  const [authReady, setAuthReady] = useState(false)
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('tl_session')
      if(raw){ const s = JSON.parse(raw); if(s && s.access_token && (!s.expires_at || s.expires_at > Date.now())) setSession(s); else localStorage.removeItem('tl_session') }
    }catch(e){}
    setAuthReady(true)
  },[])
  if(!authReady) return <div style={{position:'fixed',inset:0,background:'#0b0714'}}/>
  if(!session) return <AuthGate onAuthed={setSession}/>
  return <TwinLand session={session} onLogout={()=>{try{localStorage.removeItem('tl_session')}catch(e){}setSession(null)}}/>
}
