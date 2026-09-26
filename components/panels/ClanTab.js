'use client'
import { useEffect, useState } from 'react'
import { ROUTE } from '@/lib/theme/labels'
import { onColor } from '@/lib/theme/ui'
import { clanLevel, fetchClanMembers, fetchClanStandings, fetchMyClans, getSession } from '@/lib/game/gameSystem'

// ── CLAN TAB (خلاصه — داده واقعی از gameSystem، نسخه کامل در /clan) ─────────────
export function ClanTab({C}) {
  const [clan,setClan]=useState(null)       // {clans, role, ...}
  const [standing,setStanding]=useState(null)
  const [members,setMembers]=useState([])
  const [loaded,setLoaded]=useState(false)
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    ;(async()=>{
      const [mine,stand]=await Promise.all([fetchMyClans(sess),fetchClanStandings(sess)])
      if(!alive) return
      const active=mine.find(m=>m.is_active)||mine[0]||null
      setClan(active)
      if(active){
        setStanding(stand.find(s=>s.id===active.clan_id)||null)
        const mem=await fetchClanMembers(sess,active.clan_id)
        if(alive) setMembers(mem.slice(0,5))
      }
      setLoaded(true)
    })()
    return ()=>{ alive=false }
  },[])

  if(!loaded) return <div style={{padding:'30px 12px',textAlign:'center',color:C.sub,fontSize:13}}>در حال بارگذاری…</div>

  if(!clan) return <div style={{padding:'30px 16px',textAlign:'center'}}>
    <div style={{fontSize:40,marginBottom:8}}>🛡️</div>
    <div style={{fontWeight:800,color:C.text,marginBottom:4}}>هنوز عضو کلنی نیستی</div>
    <div style={{fontSize:12,color:C.sub,marginBottom:14}}>یه کلن بساز یا به یکی بپیوند</div>
    <a href="/clan" style={{display:'inline-block',background:C.accent,color:onColor(C.accent),borderRadius:12,padding:'10px 20px',fontSize:13,fontWeight:700,textDecoration:'none'}}>رفتن به کلن‌ها ›</a>
  </div>

  const c=clan.clans
  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{background:'linear-gradient(135deg,'+c.color+','+c.color+'cc)',borderRadius:18,padding:'18px',textAlign:'center',color:'#fff',marginBottom:14}}>
      <div style={{fontSize:38}}>{c.emblem}</div>
      <div style={{fontSize:19,fontWeight:800,marginTop:2}}>{c.name}</div>
      {standing&&<div style={{fontSize:12,opacity:.9,marginTop:3}}>سطح {clanLevel(standing.xp_total).toLocaleString('fa')} · رتبه {standing.rank.toLocaleString('fa')} · {Number(standing.xp_total).toLocaleString('fa')} XP</div>}
    </div>
    <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:8}}>اعضای برتر</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {members.map((m,i)=>(
        <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:12,background:m.me?C.accentL:C.card,border:m.me?'2px solid '+C.accent:'1px solid '+C.border,borderRadius:14,padding:'10px 12px'}}>
          <div style={{width:22,textAlign:'center',fontWeight:800,color:C.sub,fontSize:14}}>{(i+1).toLocaleString('fa')}</div>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.card,border:'2px solid '+c.color+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{m.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:6}}>{m.name}{m.me&&<span style={{fontSize:9,background:C.accent,color:onColor(C.accent),borderRadius:99,padding:'1px 7px'}}>تو</span>}</div>
            <div style={{fontSize:11,color:C.sub}}>{m.role==='leader'?'رهبر':m.role==='officer'?'افسر':'عضو'}</div>
          </div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{m.xp.toLocaleString('fa')} XP</div>
        </div>
      ))}
    </div>
    <a href={ROUTE.clans} className="tl-press" style={{display:'block',marginTop:16,textAlign:'center',background:C.accent,color:onColor(C.accent),borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,textDecoration:'none'}}>مشاهده کامل کلن ›</a>
  </div>
}
