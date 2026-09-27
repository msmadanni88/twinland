'use client'
// لایه‌ی نقشه: جای Leaflet، پاپ‌آپ فیلتر و نتایج منطقه، حالت تاریک و اسکلت بارگذاری — جداشده از TwinLand.js
import { RegionFilterPopup } from '@/components/map/RegionFilterPopup'
import { RegionResultsPanel } from '@/components/map/RegionResultsPanel'

export function MapLayer({ C, applyRegionFilter, mapLoading, mapMode, mapRef, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults }) {
  return (<>
        {/* MAP */}
        <div style={{position:'absolute',inset:0,zIndex:1}}>
          <div ref={mapRef} style={{position:'absolute',inset:0,zIndex:1,isolation:'isolate'}}/>

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
  </>)
}
