'use client'
// نوار بالای صفحه: منو، لوگو، شهر، استایل نقشه، مرزها، پالت، اعلان‌ها و امتیاز — جداشده از TwinLand.js
import { CITIES } from '@/lib/constants'
import { onColor } from '@/lib/theme/ui'

export function TopBar({ C, TH, city, isMobile, levelInfo, notifications, onLogoTap, panelOpen, setPanelOpen, setShowBoundary, setShowCity, setShowMenu, setShowMode, setShowNotif, setShowPalette, setShowXP, showNotif, xp }) {
  return (<>
      {/* TOPBAR */}
      <div style={{height:TH,flexShrink:0,background:C.glassDark,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid '+C.border,padding:'0 12px',display:'flex',alignItems:'center',gap:8,zIndex:300,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        <button data-tut="menu-btn" onClick={()=>setShowMenu(v=>!v)} style={{background:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:C.text}}>☰</button>
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

        <button data-tut="notif-btn" onClick={()=>setShowNotif(v=>!v)} style={{position:'relative',background:showNotif?C.accent:C.chip,border:'none',borderRadius:10,width:36,height:36,fontSize:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:showNotif?onColor(C.accent):C.text}}>
          🔔
          {notifications.some(n=>!n.read) && (
            <span style={{position:'absolute',top:4,left:4,width:8,height:8,borderRadius:'50%',background:'#ef4444',border:'1.5px solid '+C.bg}}/>
          )}
        </button>

        <button onClick={()=>setPanelOpen(v=>!v)} style={{background:panelOpen?C.accent:C.chip,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:panelOpen?onColor(C.accent):C.sub,fontFamily:'inherit',fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
          {panelOpen?<span style={{fontSize:15,fontWeight:800}}>✕</span>:<img src="/dashboard@256.png" alt="داشبورد" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>}{!isMobile&&<span>{panelOpen?'بستن':'پنل'}</span>}
        </button>
        <button onClick={()=>setShowMode(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>
          <img src="/map_style@256.png" alt="استایل نقشه" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>
        </button>
        <button data-tut="boundary-btn" onClick={()=>setShowBoundary(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:12,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src="/boundaries@256.png" alt="مرزبندی" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span> مرزها</span>}
        </button>
        <button onClick={()=>setShowPalette(true)} style={{background:C.chip,border:'none',borderRadius:10,padding:'0 9px',height:36,fontSize:14,color:C.text,fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
          <img src="/theme@256.png" alt="پالت" width={24} height={24} style={{objectFit:'contain',display:'block'}}/>{!isMobile&&<span style={{fontSize:12}}> پالت</span>}
        </button>
        <button onClick={()=>setShowCity(true)} style={{background:C.accent,border:'none',borderRadius:10,padding:'0 11px',height:36,fontSize:12,color:onColor(C.accent),fontFamily:'inherit',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
          {CITIES[city].name} ▾
        </button>
      </div>
  </>)
}
