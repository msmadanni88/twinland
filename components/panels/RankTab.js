'use client'
import { useEffect, useState } from 'react'
import { onColor } from '@/lib/theme/ui'
import { fetchLeaderboard, getSession, subscribeToChanges } from '@/lib/game/gameSystem'

// ── RANK TAB (خلاصه — داده واقعی از gameSystem، نسخه کامل در /leaderboard) ──────
// demoRows اختیاری است: حالت نمایشی نسخه v3.0 فهرست ساختگی خودش را می‌دهد و برچسب می‌زند
export function RankTab({C, demoRows}) {
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  const [realRows,setRows]=useState([])
  const rows=demoRows||realRows
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    const load=()=>fetchLeaderboard(sess).then(list=>{ if(alive) setRows(list.slice(0,5)) })
    load()
    // با هر تغییر XP هر کاربری، لیدربورد لحظه‌ای به‌روز شه (کانال سبک با debounce)
    const unsub=subscribeToChanges(['profiles'],()=>load())
    return ()=>{ alive=false; unsub() }
  },[])
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>برترین‌های این هفته 🏆</div>
    <div style={{fontSize:11,color:demoRows?C.danger:C.sub,fontWeight:demoRows?800:400,marginBottom:14}}>{demoRows?'🎬 حالت نمایشی — این جدول ساختگی است':'رتبه خودت رو بین بقیه ببین'}</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {rows.map((p)=>{
        const rank=p.rank
        return <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,background:p.me?C.accentL:C.card,border:p.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:24,textAlign:'center',fontSize:rank<=3?18:14,fontWeight:800,color:rank<=3?C.text:C.sub}}>{medals[rank]||rank.toLocaleString('fa')}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+C.accent+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{p.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{p.name}{p.me&&<span style={{fontSize:9,background:C.accent,color:onColor(C.accent),borderRadius:99,padding:'1px 7px'}}>تو</span>}{p.sample&&<span style={{fontSize:9,background:C.chip,color:C.sub,border:'1px solid '+C.border,borderRadius:99,padding:'1px 6px'}}>نمونه</span>}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{p.xp.toLocaleString('fa')} XP</div>
        </div>
      })}
    </div>
    <a href="/leaderboard" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:onColor(C.accent),borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده جدول کامل ›</a>
  </div>
}
