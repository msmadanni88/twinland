'use client'
import { faAgo } from '@/lib/format'

export function NotificationPanel({C, notifications, onMark, onMarkAll, onClose}) {
  return <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,maxHeight:'80dvh',overflowY:'auto',background:C.card,borderRadius:'24px 24px 0 0',border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',padding:'0 0 30px'}}>
      <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'14px auto 12px'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px 14px',borderBottom:'1px solid '+C.border}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text}}>🔔 اعلان‌ها</div>
        {notifications.some(n=>!n.read) && <button onClick={onMarkAll} style={{background:'none',border:'none',color:C.accent,fontSize:12,fontWeight:700,fontFamily:'inherit'}}>خواندن همه</button>}
      </div>
      <div style={{padding:'10px 18px 0'}}>
        {notifications.length===0
          ? <div style={{textAlign:'center',color:C.sub,fontSize:13,padding:'40px 0'}}>اعلانی نداری. با چک‌این و شرکت توی رویدادها این‌جا پر می‌شه.</div>
          : notifications.map(n=>(
            <a key={n.id} href={n.link||'#'} onClick={()=>onMark(n.id)}
              style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',padding:'11px 4px',borderBottom:'1px solid '+C.border,opacity:n.read?0.55:1}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:C.chip,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{n.icon||'🔔'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:n.read?600:800,color:C.text}}>{n.title}</div>
                {n.body && <div style={{fontSize:11.5,color:C.sub,marginTop:2}}>{n.body}</div>}
                <div style={{fontSize:10,color:C.sub,marginTop:3}}>{faAgo(n.created_at)}</div>
              </div>
              {!n.read && <span style={{width:8,height:8,borderRadius:'50%',background:C.accent,flexShrink:0}}/>}
            </a>
          ))}
      </div>
    </div>
  </div>
}
