'use client'
// انتخاب شهر — جداشده از TwinLand.js
import { CITIES } from '@/lib/constants'
import { onColor } from '@/lib/theme/ui'

export function CityPicker({ C, city, setCity, setShowCity, showCity, showToast }) {
  return (<>
      {showCity&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.4)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowCity(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 20px 44px',width:'100%',maxWidth:540,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',maxHeight:'75dvh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 18px'}}/>
            <div style={{fontSize:17,fontWeight:800,color:C.text,textAlign:'center',marginBottom:16}}>🏙️ انتخاب شهر</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(CITIES).map(([k,v])=>(
                <button key={k} onClick={()=>{setCity(k);setShowCity(false);showToast('✈️ '+v.name)}} style={{background:city===k?C.accent:C.chip,border:'none',borderRadius:12,padding:'12px 6px',fontSize:12,fontWeight:city===k?800:500,color:city===k?onColor(C.accent):C.text,fontFamily:'inherit'}}>{v.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}
  </>)
}
