'use client'
// روی نقشه: شمارنده‌ی کافه و حاضرین، نوار رویدادها، استریک و دکمه‌های فیلتر منطقه — جداشده از TwinLand.js
import { EventBanner } from '@/components/map/EventBanner'
import { onColor } from '@/lib/theme/ui'

export function MapOverlays({ C, PANEL_W, cafes, checkedIn, clearRegionFilter, filterApplied, filtered, isDesktop, panelOpen, regionResults, selectedRegions, setActiveEventCafeId, setSelCafe, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults, streak, totalLive }) {
  return (<>
        {/* live pill + streak — بیرون از لایه‌ی نقشه تا همیشه بالای نقشه دیده بشن */}
        <div data-tut="live-pill" style={{position:'absolute',top:10,right:(isDesktop&&panelOpen)?PANEL_W+14:10,zIndex:18,transition:'right .35s ease',height:25,boxSizing:'border-box',background:C.glass,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+C.border,borderRadius:99,padding:'0 13px',display:'flex',gap:8,alignItems:'center',fontSize:11,color:C.sub,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
          <span style={{color:C.text,fontWeight:700}}>☕ {filtered.length}</span>
          <span style={{color:C.border}}>|</span>
          <span><span style={{color:C.green,fontSize:8}}>●</span> {totalLive}</span>
          {checkedIn.size>0&&<><span style={{color:C.border}}>|</span><span style={{color:C.green,fontWeight:700}}>✓ {checkedIn.size}</span></>}
        </div>
        <EventBanner C={C} cafes={cafes} setSelCafe={setSelCafe} onActiveCafeChange={setActiveEventCafeId}/>
        {streak>=2&&<div style={{position:'absolute',top:52,left:10,zIndex:18,height:25,boxSizing:'border-box',display:'flex',alignItems:'center',background:streak>=5?C.gold:C.accent,borderRadius:99,padding:'0 10px',fontSize:11,fontWeight:700,color:streak>=5?'#fff':onColor(C.accent),boxShadow:'0 2px 10px rgba(0,0,0,.15)'}}>🔥 {streak} روز</div>}

        {/* دکمه‌های فیلتر منطقه — بیرون از لایه‌ی نقشه و «زیرِ» نوار رویدادها، تا دیگه پشتش گم نشن */}
        {selectedRegions.length>0 && !showRegionFilter && (
          <div style={{position:'absolute',top:streak>=2?86:52,left:10,zIndex:18,display:'flex',flexDirection:'column',gap:7,alignItems:'stretch',width:170}}>
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
  </>)
}
