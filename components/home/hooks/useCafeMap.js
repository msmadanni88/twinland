'use client'
// همه‌ی کار نقشه‌ی Leaflet: ساخت نقشه و کاشی‌ها، مارکرها، خوشه‌بندی، فیلتر منطقه و مرزها — جداشده از TwinLand.js
import { useEffect, useRef, useState } from 'react'
import { BOUNDARY_SOURCES, MAP_MODES, clusterRadiusOf, makeClusterGroup } from '@/components/map/mapLayers'
import { CITIES, getColor } from '@/lib/constants'
import { fetchRegionClans, fetchRegionLeaderboard, getSession } from '@/lib/game/gameSystem'
import { cafeInLayer, digitsOnly } from '@/lib/geo'

// pinStyle اختیاری است و فقط در نسخه‌های تازه ظاهر داده می‌شود: { renderPin, clusterIcon, pulseColor }
// بدون آن، پین، خوشه و حلقه رویداد دقیقاً همان نسخه v1.0 هستند.
// basemap و skinId هم اختیاری‌اند: basemap یک زیرنقشه جایگزین با تابع attach است (پوسته‌های برداری نسخه‌های تازه).
// بدون basemap، یا اگر زیرنقشه جایگزین بالا نیاید، همان کاشی‌های عکسی نسخه v1.0 نشان داده می‌شود.
export function useCafeMap({ C, activeEventCafeId, basemap, boundaryMode, cafes, checkedIn, city, live, mapDisplay, mapMode, pinStyle, search, setSelCafe, showToast, skinId, themeMode, zone }) {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mapCenterRef = useRef(null)
  const mksRef   = useRef({})
  const clusterRef = useRef(null)   // گروه خوشه‌بندی مارکرها
  const baseCtlRef = useRef(null)   // کنترل‌کننده زیرنقشه جایگزین، اگر باشد
  const baseArgsRef = useRef(null)
  baseArgsRef.current = { basemap, skinId, cafes, live }
  const [mapReady,   setMapReady]   = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
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
  const boundaryLayerRef = useRef(null)
  const boundaryDataRef  = useRef({})
  // رنگ مرزها در نسخه‌های تازه ظاهر؛ با ref خوانده می‌شود تا عوض شدن پالت انتخاب مناطق را پاک نکند
  const pinStyleRef = useRef(pinStyle)
  pinStyleRef.current = pinStyle
  const boundaryOn  = () => (pinStyleRef.current && pinStyleRef.current.boundaryOn)  || '#000000'
  const boundaryOff = () => (pinStyleRef.current && pinStyleRef.current.boundaryOff) || '#8E8E93'

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
            zoomControl:false,attributionControl:false,preferCanvas:true,
            maxZoom:19   // خوشه‌بندی سقف زوم لازم دارد؛ قبلاً از لایه کاشی می‌آمد، حالا زیرنقشه برداری لایه کاشی ندارد
          })
          // نام منبع نقشه طبق شرایط OpenStreetMap و CARTO باید دیده شود — کوچک، پایین سمت چپ
          L.control.attribution({position:'bottomleft',prefix:false}).addTo(m)
          const TILE_ATTR='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
          const OSM_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png'

          // ── TILE از proxy خودمون ──
          // روی Vercel کاشی‌ها از /api/tiles می‌آیند تا کلید CARTO در مرورگر دیده نشود
          // و CDN کش کند؛ روی localhost مستقیم از OpenStreetMap.
          // v=2: کاشی‌های واترمارک‌دار قدیمی را که مرورگرها کش کرده‌اند دور می‌زند.
          const isLocal = typeof window!=='undefined' && (window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')

          const tileUrl = isLocal ? OSM_URL : '/api/tiles/{z}/{x}/{y}.png?v=2'
          const tileOpts = { maxZoom:19, attribution:TILE_ATTR }

          const addRaster=()=>{
          const mainLayer = L.tileLayer(tileUrl, tileOpts)
          let tileLoaded=false

          mainLayer.on('tileload',()=>{
            if(!tileLoaded){ tileLoaded=true; setMapLoading(false) }
          })
          mainLayer.on('tileerror',()=>{
            // اگر proxy اصلاً جواب نداد، مستقیم از OpenStreetMap — CARTO بدون کلید واترمارک می‌گذارد
            if(!tileLoaded && !isLocal) {
              mainLayer.remove()
              L.tileLayer(OSM_URL,{maxZoom:19,attribution:TILE_ATTR}).addTo(m)
              setMapLoading(false)
            }
          })
          mainLayer.addTo(m)

          // اگه ۸ ثانیه tile نیومد loading رو ببند
          setTimeout(()=>{ if(!tileLoaded) setMapLoading(false) },8000)
          }

          // زیرنقشه جایگزین، اگر داده شده باشد؛ هر جا نشد، کاشی‌های عکسی
          const ba=baseArgsRef.current
          if(ba.basemap&&ba.basemap.attach){
            try{
              baseCtlRef.current=ba.basemap.attach({ L, map:m, skinId:ba.skinId, cafes:ba.cafes, live:ba.live,
                onReady:()=>{ if(mounted) setMapLoading(false) },
                onFail:()=>{ baseCtlRef.current=null; if(mounted) addRaster() } })
            }catch(e){ baseCtlRef.current=null; addRaster() }
          } else addRaster()

          mapInst.current=m
          setMapReady(true)

          // مرکز فعلی نقشه را ثبت کن تا نوار رویدادها «نزدیک‌ترین اول» را درست مرتب کند
          try{ const c=m.getCenter(); mapCenterRef.current={lat:c.lat,lng:c.lng} }catch(e){}
          m.on('moveend',()=>{ try{ const c=m.getCenter(); mapCenterRef.current={lat:c.lat,lng:c.lng} }catch(e){} })

          // ── گروه خوشه‌بندی: پین‌های نزدیک رو جمع می‌کنه (برای مقیاس ده‌ها هزار) ──
          if(L.markerClusterGroup){
            const radius=clusterRadiusOf(mapDisplay.cluster==='auto'?'medium':mapDisplay.cluster)
            clusterRef.current=makeClusterGroup(L,radius,pinStyle&&pinStyle.clusterIcon)
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

  // پوسته، کافه‌ها و حاضرین را به زیرنقشه جایگزین برسان
  useEffect(()=>{
    if(baseCtlRef.current) baseCtlRef.current.update({ skinId, cafes, live })
  },[skinId,cafes,live,mapReady])

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
      }else if(pinStyle&&pinStyle.renderPin){
        // پین نسخه‌های تازه ظاهر — المان lv-<id> برای شمارنده زنده باید در HTML باشد
        const p=pinStyle.renderPin(cafe,{color,isChecked,live:n})
        const icon=L.divIcon({html:p.html,iconSize:p.size,iconAnchor:p.anchor,className:''})
        mk=L.marker([cafe.lat,cafe.lng],{icon})
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
  },[mapReady,cafes,checkedIn,mapDisplay.markerMode,mapDisplay.dotColor,mapDisplay.dotSize,pinStyle])

  // هایلایت کافه‌ای که الان توی اسلایدشوی رویدادها نشون داده می‌شه — دوربین حرکت نمی‌کنه
  // برای هر دو حالت (پین/نقطه) یه حلقه‌ی پالس مستقل (divIcon واقعی) دقیقاً روی مختصات کافه اضافه می‌کنیم؛
  // این کار مستقل از نوع رندر مارکر زیرینه (پین=DOM، نقطه=canvas مشترک با preferCanvas) و همیشه کار می‌کنه.
  useEffect(()=>{
    if(!activeEventCafeId || !mapReady || !window.L || !mapInst.current) return
    const L=window.L
    const cafe = cafes.find(c=>c.id===activeEventCafeId)
    if(!cafe) return
    const ringColor = (pinStyle&&pinStyle.pulseColor) || (themeMode==='night' ? '#ffffff' : '#1a1a1a')
    const icon=L.divIcon({html:'<div class="tl-event-pulse-ring" style="--pulse-color:'+ringColor+'"></div>',iconSize:[36,36],iconAnchor:[18,18],className:''})
    const ghost=L.marker([cafe.lat,cafe.lng],{icon,interactive:false,zIndexOffset:9999})
    try{ ghost.addTo(mapInst.current) }catch(e){}
    return ()=>{ try{ mapInst.current.removeLayer(ghost) }catch(e){} }
  },[activeEventCafeId, mapReady, cafes, themeMode, pinStyle])

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
    const next=makeClusterGroup(L,radius,pinStyle&&pinStyle.clusterIcon)
    // مارکرهای فعلی رو به گروه جدید منتقل کن
    const current=Object.values(mksRef.current).filter(mk=>{
      try{ return old?old.hasLayer(mk):mapInst.current.hasLayer(mk) }catch(e){ return false }
    })
    if(old){ try{ mapInst.current.removeLayer(old) }catch(e){} }
    current.forEach(mk=>next.addLayer(mk))
    mapInst.current.addLayer(next)
    clusterRef.current=next
  },[mapDisplay.cluster,mapDisplay.regionCluster,filterApplied,mapReady,pinStyle])

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
            ?{color:boundaryOn(),weight:2.5,fillColor:boundaryOn(),fillOpacity:0.12,opacity:0.95}
            :{color:boundaryOff(),weight:0.5,fillColor:boundaryOff(),fillOpacity:0,opacity:0.15})
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
      try{ lyr.setStyle({color:boundaryOff(),weight:1.3,fillColor:boundaryOff(),fillOpacity:0,opacity:0.5}) }catch(e){}
    })
    const c=CITIES[city]; if(mapInst.current&&c) mapInst.current.flyTo([c.lat,c.lng],c.zoom)
  }

  function panMap(x,y){ mapInst.current?.panBy([x,y],{animate:true}) }

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
      const color=on?boundaryOn():boundaryOff()
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
  return { applyRegionFilter, clearRegionFilter, filterApplied, filtered, mapInst, mapLoading, mapRef, panMap, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults }
}
