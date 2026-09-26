'use client'
import { onColor } from '@/lib/theme/ui'

// ── PROFILE TAB (خلاصه — نسخه کامل در /profile) ────────────────────────────────
export function ProfileTab({C,xp,levelInfo,streak,checkedIn,userName,coins}) {
  const stats = [
    { icon:'🔥', value:streak,        label:'استریک' },
    { icon:'☕', value:checkedIn.size, label:'کافه' },
    { icon:'🪙', value:coins,         label:'سکه' },
    { icon:'⭐', value:levelInfo?.current?.level||1, label:'لِوِل' },
  ]
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:C.grad,borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <img src="/icon_profile_active@2x.png" alt="پروفایل" width={64} height={64} style={{objectFit:'contain',display:'block',margin:'0 auto 6px'}}/>
      <div style={{fontSize:19,fontWeight:800}}>{userName||'کاربر'}</div>
      <div style={{fontSize:12,opacity:.9,marginTop:2}}>☕ {levelInfo?.current?.name||'کافه‌گرد'} · {xp.toLocaleString('fa')} XP</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
      {stats.map((s,i)=>(
        <div key={i} style={{background:C.card,border:'1px solid '+C.border,borderRadius:14,padding:'10px 4px',textAlign:'center'}}>
          <div style={{fontSize:18}}>{s.icon}</div>
          <div style={{fontSize:15,fontWeight:800,color:C.text,marginTop:2}}>{Number(s.value).toLocaleString('fa')}</div>
          <div style={{fontSize:10,color:C.sub,marginTop:1}}>{s.label}</div>
        </div>
      ))}
    </div>
    <a href="/profile" style={{display:'block',textAlign:'center',background:C.accent,color:onColor(C.accent),borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده پروفایل کامل ›</a>
  </div>
}
