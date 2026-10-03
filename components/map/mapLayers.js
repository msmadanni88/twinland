// Map layer settings: base-map visual modes, marker clustering and the boundary
// GeoJSON sources. makeClusterGroup receives Leaflet (window.L) as its first argument.

export const MAP_MODES = [
  { key:'normal',  label:'🗺 معمولی', filter:'none' },
  { key:'game',    label:'🎮 گیم',    filter:'saturate(1.8) contrast(1.1) hue-rotate(10deg) brightness(0.88)' },
  { key:'dark',    label:'🌙 تاریک',  filter:'brightness(0.25) saturate(0.3) hue-rotate(200deg)' },
  { key:'cartoon', label:'🎨 کارتون', filter:'saturate(2.2) contrast(1.3) brightness(1.05)' },
]

// ── BOUNDARY LAYERS (استان‌ها / مناطق تهران) ───────────────────────────────────
// شعاع خوشه‌بندی بر اساس شدت انتخابی کاربر
export function clusterRadiusOf(level){
  return level==='off'?0 : level==='low'?30 : level==='high'?90 : 55  // medium=55
}

// ساخت گروه خوشه‌بندی با شعاع دلخواه
// iconFn اختیاری است: هر نسخه ظاهر می‌تواند شکل خوشه را خودش بسازد؛ بدون آن همان شکل نسخه v1.0 است
export function makeClusterGroup(L,radius,iconFn){
  return L.markerClusterGroup({
    chunkedLoading:true,
    maxClusterRadius:radius>0?radius:1,        // ۰ عملاً یعنی بدون خوشه
    spiderfyOnMaxZoom:true,
    showCoverageOnHover:false,
    disableClusteringAtZoom:radius>0?17:1,
    iconCreateFunction:iconFn ? (cluster)=>{
      const r=iconFn(cluster.getChildCount())
      return L.divIcon({html:r.html,className:'',iconSize:r.size})
    } : (cluster)=>{
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

export const BOUNDARY_SOURCES = {
  province: { url:'/iran_provinces.json', label:'استان‌ها' },
  district: { url:'/tehran_districts.json', label:'مناطق تهران' },
}
