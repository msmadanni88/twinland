'use client'
import { LEVELS } from '@/lib/game/gameSystem'
import { XP_CONFIG } from '@/lib/constants'

// ── XP PANEL ──────────────────────────────────────────────────────────────────
export function XPPanel({C,xp,levelInfo,streak,onClose}) {
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
