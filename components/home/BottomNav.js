'use client'
// نوار پایین صفحه — جداشده از TwinLand.js
import { NAV } from '@/lib/constants'

export function BottomNav({ BH, C, isMobile, setPanelOpen, setPanelTab, setTab, tab }) {
  return (<>
      {/* BOTTOM NAV */}
      <div data-tut="bottom-nav" style={{height:BH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:'1px solid '+C.border,display:'flex',alignItems:'stretch'}}>
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
  </>)
}
