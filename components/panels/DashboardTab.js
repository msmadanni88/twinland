'use client'
import { useEffect, useRef, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { ICON, L, ROUTE } from '@/lib/theme/labels'
import { hscroll, isDarkC, onColor, useDragScroll } from '@/lib/theme/ui'
import { fetchLeaderboard, getSession, subscribeToChanges } from '@/lib/game/gameSystem'
import { QUICK_FILTERS } from '@/lib/constants'

export function DashboardTab({C,cafes,filtered,live,totalLive,showToast,setSearch,checkedIn,xp,levelInfo,streak,setShowXP}) {
  const [topPlayers,setTopPlayers]=useState([])
  const [hotEvents,setHotEvents]=useState([])
  const [newIds,setNewIds]=useState(new Set())   // رویدادهایی که همین الان اضافه شدن → درخشش «جدید»
  const seenRef=useRef(null)
  const tilesRef=useDragScroll()                 // نوار کاشی‌ها — قابل کشیدن با ماوس
  const dark=isDarkC(C)
  useEffect(()=>{
    const sess=getSession()
    let alive=true
    const load=()=>fetchLeaderboard(sess).then(list=>{ if(alive) setTopPlayers(list.slice(0,3)) })
    load()
    const unsub=subscribeToChanges(['profiles'],()=>load())
    return ()=>{ alive=false; unsub() }
  },[])
  useEffect(()=>{
    let alive=true
    // فید زنده: با هر تغییر، رویدادهای تازه علامت «جدید» می‌گیرن و با
    // انیمیشن وارد می‌شن. seenRef اولین بار null‌ه تا لودِ اولیه کل لیست رو
    // «جدید» علامت نزنه.
    const loadEvents=()=>fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,cafes(name,district),collectible_defs(icon,rarity)&order=created_at.desc&limit=6',
      {headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}}).then(r=>r.json()).then(rows=>{
        if(!alive) return
        const list=Array.isArray(rows)?rows:[]
        if(seenRef.current){
          const fresh=new Set(list.filter(x=>!seenRef.current.has(x.id)).map(x=>x.id))
          if(fresh.size){ setNewIds(fresh); setTimeout(()=>{ if(alive) setNewIds(new Set()) },4000) }
        }
        seenRef.current=new Set(list.map(x=>x.id))
        setHotEvents(list)
      }).catch(()=>{})
    loadEvents()
    const unsub=subscribeToChanges(['quests'],()=>loadEvents())
    return ()=>{ alive=false; unsub() }
  },[])
  const medals={1:'🥇',2:'🥈',3:'🥉'}
  return <div>
    <div style={{margin:'14px 12px 0',background:'linear-gradient(135deg,'+levelInfo.current.color+'22,'+levelInfo.current.color+'08)',border:'1.5px solid '+levelInfo.current.color+'33',borderRadius:18,padding:'14px',cursor:'pointer'}} onClick={()=>setShowXP(true)}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:36}}>{levelInfo.current.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.sub}}>لول {levelInfo.current.level} — {levelInfo.current.name}</div>
          <div style={{fontSize:22,fontWeight:900,color:levelInfo.current.color}}>{xp.toLocaleString('fa')} XP</div>
        </div>
        {streak>=2&&<div style={{textAlign:'center',background:'rgba(255,107,53,.12)',borderRadius:12,padding:'8px 10px'}}>
          <div style={{fontSize:20}}>🔥</div>
          <div style={{fontSize:16,fontWeight:900,color:C.accent}}>{streak}</div>
          <div style={{fontSize:9,color:C.sub}}>روز</div>
        </div>}
      </div>
      {levelInfo.next&&<div style={{marginTop:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:10,color:C.sub}}>تا {levelInfo.next.icon} {levelInfo.next.name}</span>
          <span style={{fontSize:10,fontWeight:700,color:levelInfo.current.color}}>{levelInfo.next.minXP-xp} XP مانده</span>
        </div>
        <div style={{height:8,background:C.chip,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:levelInfo.progress+'%',background:'linear-gradient(90deg,'+levelInfo.current.color+','+C.accent+')',borderRadius:99,transition:'width .6s'}}/>
        </div>
      </div>}
    </div>
    <div style={{padding:'12px 12px 0'}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>آمار زنده</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {[{icon:'☕',val:cafes.length,lbl:'کافه'},{icon:'👥',val:totalLive,lbl:'آنلاین'},{icon:'⭐',val:cafes.filter((c)=>c.is_top).length,lbl:'برتر'},{icon:'✅',val:checkedIn.size,lbl:'رفتم'}].map((item)=>(
          <div key={item.lbl} className="tl-tile" style={{background:C.chip,border:'1px solid '+C.border,borderRadius:12,padding:'10px'}}>
            <div style={{fontSize:16}}>{item.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:C.text,marginTop:2}}>{item.val}</div>
            <div style={{fontSize:9,color:C.sub,marginTop:1}}>{item.lbl}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)',marginTop:12}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>فیلتر سریع</div>
      {QUICK_FILTERS.map(f=>(
        <button key={f.tag} className="tl-row" onClick={()=>{setSearch(f.tag);showToast('🔍 '+f.tag)}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',padding:'8px 4px',borderRadius:8,color:C.text,fontSize:13,fontFamily:'inherit',fontWeight:500}}>
          <span style={{fontSize:17,width:24,textAlign:'center'}}>{f.icon}</span>{f.tag}
        </button>
      ))}
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:10,color:C.sub,letterSpacing:.7,fontWeight:600}}>🎉 رویدادهای داغ<span style={{color:C.green}}> ●</span></div>
        <a href={ROUTE.quests} className="tl-press" style={{fontSize:10,color:C.accent,fontWeight:700,textDecoration:'none'}}>همه ›</a>
      </div>
      {hotEvents.length===0
        ? <div style={{fontSize:11,color:C.sub,padding:'8px 2px'}}>الان رویداد فعالی نیست. کافه‌دارها به‌زودی چیزی منتشر می‌کنن.</div>
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {hotEvents.map((ev,i)=>{
              const cd=ev.collectible_defs
              const cafeName=ev.cafes?ev.cafes.name:''
              // 🐞 قبلاً رنگ‌ها ثابت بودن (#FFF9F0 و #E65100) و توی تم تیره
              // متنِ روشن روی کارتِ کِرِمی می‌افتاد و اصلاً دیده نمی‌شد.
              // حالا رنگ از پالت میاد و متن با onColor خودکار خوانا می‌شه.
              const warm = C.gold || '#FF9F0A'
              const cardBg = warm + (dark?'1c':'12')
              const isNew = newIds.has(ev.id)
              return <a key={ev.id} href={ROUTE.quests} className={'tl-tile '+(isNew?'tl-new':'tl-in')}
                style={{display:'block',textDecoration:'none',background:cardBg,border:'1px solid '+warm+'55',borderRadius:14,padding:'11px 12px',animationDelay:Math.min(i*60,400)+'ms'}}>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <span style={{fontSize:20,flexShrink:0}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:800,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.title}</div>
                    <div style={{fontSize:10,color:C.sub,marginTop:2}}>{cafeName}{ev.cafes&&ev.cafes.district?' · '+ev.cafes.district:''}</div>
                  </div>
                  {isNew&&<span style={{fontSize:8.5,fontWeight:900,background:warm,color:onColor(warm),borderRadius:99,padding:'2px 7px',flexShrink:0}}>جدید</span>}
                </div>
                <div style={{fontSize:11,color:warm,fontWeight:800,marginTop:6}}>🎁 {ev.reward_label}{ev.reward_xp>0?' · +'+ev.reward_xp+' XP':''}</div>
              </a>
            })}
          </div>}
      <div ref={tilesRef} className="tl-hscroll" style={{...hscroll,marginTop:4,paddingBottom:2}}>
        {[
          {icon:ICON.gallery,label:L.gallery,href:ROUTE.gallery,color:'#8b5cf6'},
          {icon:ICON.leaderboard,label:L.leaderboard,href:ROUTE.leaderboard,color:'#f59e0b'},
          {icon:ICON.clans,label:L.clans,href:ROUTE.clans,color:'#3b82f6'},
          {icon:ICON.quests,label:L.quests,href:ROUTE.quests,color:'#10b981'},
          {icon:ICON.profile,label:L.profile,href:ROUTE.profile,color:'#ec4899'},
        ].map(t=>(
          <a key={t.href} href={t.href} className="tl-tile" style={{textDecoration:'none',background:t.color+(dark?'22':'14'),border:'1px solid '+t.color+'44',borderRadius:14,padding:'10px 12px',minWidth:112,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:C.text}}>{t.label}</span>
            <span style={{fontSize:9,color:t.color,fontWeight:700}}>مشاهده کامل ›</span>
          </a>
        ))}
      </div>
    </div>
    <div style={{padding:'12px',borderTop:'1px solid rgba(0,0,0,.06)',paddingBottom:24}}>
      <div style={{fontSize:10,color:C.sub,letterSpacing:.7,marginBottom:8,fontWeight:600}}>برترین‌ها</div>
      {topPlayers.map(p=>(
        <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid '+C.border}}>
          <span style={{fontSize:18}}>{medals[p.rank]}</span>
          <div style={{flex:1}}><div style={{fontSize:12,color:C.text,fontWeight:700,display:'flex',alignItems:'center',gap:5}}>{p.name}{p.me&&<span style={{fontSize:8,background:C.accent,color:onColor(C.accent),borderRadius:99,padding:'0 6px'}}>تو</span>}</div></div>
          <div style={{fontSize:12,color:C.accent,fontWeight:800}}>{p.xp.toLocaleString('fa')} XP</div>
        </div>
      ))}
    </div>
  </div>
}
