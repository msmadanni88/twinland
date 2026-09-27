'use client'
// انتخاب استایل نقشه — جداشده از TwinLand.js
import { MAP_MODES } from '@/components/map/mapLayers'
import { onColor } from '@/lib/theme/ui'

export function MapModePicker({ C, mapMode, setMapMode, setShowMode, showMode, showToast }) {
  return (<>
      {showMode&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowMode(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16}}><img src="/map_style@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>استایل نقشه</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {MAP_MODES.map(m=>(
                <button key={m.key} onClick={()=>{setMapMode(m.key);setShowMode(false);showToast(m.label+' فعال شد')}} style={{background:mapMode===m.key?C.accent:C.chip,border:mapMode===m.key?'none':'1.5px solid '+C.border,borderRadius:14,padding:'16px',fontSize:14,fontWeight:mapMode===m.key?800:500,color:mapMode===m.key?onColor(C.accent):C.text,fontFamily:'inherit'}}>{m.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
  </>)
}
