'use client'
// انتخاب لایه‌ی مرزهای جغرافیایی — جداشده از TwinLand.js
import { BOUNDARY_SOURCES } from '@/components/map/mapLayers'
import { onColor } from '@/lib/theme/ui'

export function BoundaryPicker({ C, boundaryMode, setBoundaryMode, setShowBoundary, showBoundary, showToast }) {
  return (<>
      {showBoundary&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowBoundary(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}><img src="/boundaries@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>مرزهای جغرافیایی</div>
            <div style={{fontSize:11,color:C.sub,textAlign:'center',marginBottom:16,lineHeight:1.6}}>روی هر منطقه روی نقشه بزن تا رنگش عوض بشه یا خاموش شه</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[{key:'off',label:'❌ خاموش'},{key:'province',label:'🇮🇷 استان‌های ایران'},{key:'district',label:'🏙️ مناطق ۲۲گانه تهران'}].map(o=>(
                <button key={o.key} onClick={()=>{setBoundaryMode(o.key);setShowBoundary(false);if(o.key!=='off')showToast(BOUNDARY_SOURCES[o.key]?.label+' فعال شد')}} style={{background:boundaryMode===o.key?C.accent:C.chip,border:boundaryMode===o.key?'none':'1.5px solid '+C.border,borderRadius:14,padding:'14px',fontSize:14,fontWeight:boundaryMode===o.key?800:500,color:boundaryMode===o.key?onColor(C.accent):C.text,fontFamily:'inherit',textAlign:'right'}}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
  </>)
}
