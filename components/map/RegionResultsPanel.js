'use client'
import { useRef, useState } from 'react'
import { onColor } from '@/lib/theme/ui'

// ── پنل نتایج منطقه: چند-صفحه‌ای (هر منطقه یک صفحه، قابل اسلاید) ──────────────
export function RegionResultsPanel({ C, pages, onClose }) {
  const [idx,setIdx]=useState(0)
  const [tab,setTab]=useState('lb')
  const touchX=useRef(null)
  const data=pages[idx]||{region:'',leaderboard:[],clans:[]}
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  const hasLb=data.leaderboard.length>0
  const hasClan=data.clans.length>0
  const multi=pages.length>1

  function onTouchStart(e){ touchX.current=e.touches[0].clientX }
  function onTouchEnd(e){
    if(touchX.current==null) return
    const dx=e.changedTouches[0].clientX-touchX.current
    if(Math.abs(dx)>40){
      // RTL: سوایپ به راست → صفحه‌ی بعد، سوایپ به چپ → صفحه‌ی قبل
      if(dx>0 && idx<pages.length-1) setIdx(idx+1)
      if(dx<0 && idx>0) setIdx(idx-1)
    }
    touchX.current=null
  }

  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:39,background:'rgba(0,0,0,.4)',backdropFilter:'blur(2px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'78%',overflowY:'auto',boxShadow:'0 -8px 40px rgba(0,0,0,.3)'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>

        {/* هدر + ناوبری بین مناطق */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontSize:18,fontWeight:800,color:C.text}}>منطقه {Number(data.region).toLocaleString('fa')}</div>
          {multi&&(
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setIdx(Math.min(pages.length-1,idx+1))} disabled={idx===pages.length-1}
                style={{border:'none',background:idx===pages.length-1?C.chip:C.accent,color:idx===pages.length-1?C.sub:'#fff',width:30,height:30,borderRadius:'50%',fontSize:16,cursor:idx===pages.length-1?'default':'pointer',fontFamily:'inherit'}}>‹</button>
              <span style={{fontSize:12,color:C.sub,fontWeight:700}}>{(idx+1).toLocaleString('fa')} / {pages.length.toLocaleString('fa')}</span>
              <button onClick={()=>setIdx(Math.max(0,idx-1))} disabled={idx===0}
                style={{border:'none',background:idx===0?C.chip:C.accent,color:idx===0?C.sub:'#fff',width:30,height:30,borderRadius:'50%',fontSize:16,cursor:idx===0?'default':'pointer',fontFamily:'inherit'}}>›</button>
            </div>
          )}
        </div>
        <div style={{fontSize:12,color:C.sub,marginBottom:16}}>رتبه‌بندی بر اساس فعالیت در این منطقه{multi&&' · برای جابه‌جایی اسلاید کن'}</div>

        {hasLb&&hasClan&&(
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <button onClick={()=>setTab('lb')} style={{flex:1,padding:10,borderRadius:12,border:'none',background:tab==='lb'?C.accent:C.chip,color:tab==='lb'?onColor(C.accent):C.sub,fontWeight:700,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>🏆 برترین‌ها</button>
            <button onClick={()=>setTab('clan')} style={{flex:1,padding:10,borderRadius:12,border:'none',background:tab==='clan'?C.accent:C.chip,color:tab==='clan'?onColor(C.accent):C.sub,fontWeight:700,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>🛡️ کلن‌ها</button>
          </div>
        )}

        {((tab==='lb'||!hasClan)&&hasLb)&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {data.leaderboard.map(u=>(
              <div key={u.user_id} style={{display:'flex',alignItems:'center',gap:12,background:u.me?C.accentL:C.card,border:u.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 14px'}}>
                <div style={{width:26,textAlign:'center',fontSize:u.rank<=3?18:14,fontWeight:800,color:u.rank<=3?C.text:C.sub}}>{medals[u.rank]||u.rank.toLocaleString('fa')}</div>
                <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+C.accent+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{u.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{u.name}{u.me&&<span style={{fontSize:9,background:C.accent,color:onColor(C.accent),borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
                  <div style={{fontSize:11,color:C.sub}}>{u.checkins.toLocaleString('fa')} چک‌این در منطقه</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{u.xp.toLocaleString('fa')} XP</div>
              </div>
            ))}
          </div>
        )}

        {((tab==='clan'&&hasClan))&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {data.clans.map(c=>(
              <div key={c.clan_id} style={{display:'flex',alignItems:'center',gap:12,background:C.card,border:'1px solid '+C.border,borderRadius:14,padding:'10px 14px'}}>
                <div style={{width:26,textAlign:'center',fontSize:c.rank<=3?18:14,fontWeight:800,color:c.rank<=3?C.text:C.sub}}>{medals[c.rank]||c.rank.toLocaleString('fa')}</div>
                <div style={{width:40,height:40,borderRadius:12,background:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.emblem}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>{c.name}</div>
                  <div style={{fontSize:11,color:C.sub}}>{c.members.toLocaleString('fa')} عضو فعال در منطقه</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{c.xp.toLocaleString('fa')} XP</div>
              </div>
            ))}
          </div>
        )}

        {!hasLb&&!hasClan&&(
          <div style={{textAlign:'center',color:C.sub,fontSize:13,padding:'30px 0'}}>هنوز فعالیتی در این منطقه ثبت نشده</div>
        )}

        {/* نقطه‌های صفحه (اندیکاتور) */}
        {multi&&(
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:18}}>
            {pages.map((_,i)=>(
              <span key={i} onClick={()=>setIdx(i)} style={{width:i===idx?20:7,height:7,borderRadius:99,background:i===idx?C.accent:C.border,transition:'.2s',cursor:'pointer'}}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
