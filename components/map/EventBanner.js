'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { sortEventsByDistance, subscribeToChanges } from '@/lib/game/gameSystem'

// ── پیل شیشه‌ای رویدادها روی نقشه (هم‌استایل پیل آمار زنده، بدون بک‌گراند مجزا) ──
// rootStyle اختیاری است: نسخه‌های تازه با آن جا و پهنای نوار را عوض می‌کنند. بدون آن همان قبلی است.
export function EventBanner({C, cafes, setSelCafe, onActiveCafeChange, mapCenterRef, rootStyle}) {
  const [rawEvents, setRawEvents] = useState([])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const touchXRef = useRef(null)
  // «زیرنویس روان»: اگه متن از عرض نوار بلندتر بود، آروم رفت‌وبرگشتی حرکت کنه تا کلش دیده بشه
  const textWrapRef = useRef(null)
  const textRef = useRef(null)
  const [marquee, setMarquee] = useState({on:false, shift:0, dur:8})

  const load = useCallback(()=>{
    fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,discount_pct,cafe_id,cafes(name,district),collectible_defs(icon,rarity)&order=created_at.desc&limit=30',
      {headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setRawEvents(rows) }).catch(()=>{})
  },[])

  useEffect(()=>{ load() },[load])
  // اشتراک سبک مشترک با debounce — به‌جای باز کردن WebSocket جدا و گوش‌دادن به هر INSERT
  useEffect(()=>{
    const unsub=subscribeToChanges(['quests'],()=>{ load(); setIdx(0) })
    return ()=>unsub()
  },[load])

  // مرتب‌سازی: نزدیک‌ترین رویداد به مرکز فعلی نقشه اول. مختصات هر رویداد از روی cafes.
  const events = (()=>{
    const withCoords = rawEvents.map(ev=>{
      const cf = cafes.find(c=>c.id===ev.cafe_id)
      return cf ? { ...ev, cafe_lat:cf.lat, cafe_lng:cf.lng } : ev
    })
    const center = mapCenterRef && mapCenterRef.current
    return center ? sortEventsByDistance(withCoords, center.lat, center.lng) : withCoords
  })()

  const safeIdx = events.length ? (idx % events.length) : 0
  const ev = events.length ? events[safeIdx] : null

  // اندازه‌گیری سرریز متن: بعد از هر تغییر رویداد، اگه متن جا نشد marquee روشن می‌شه
  useEffect(()=>{
    const wrap=textWrapRef.current, txt=textRef.current
    if(!wrap||!txt){ setMarquee({on:false,shift:0,dur:8}); return }
    const t=setTimeout(()=>{
      const overflow=txt.scrollWidth-wrap.clientWidth
      if(overflow>6){
        // RTL: بخش پنهان متن سمت چپه؛ با translateX مثبت میاد تو دید
        setMarquee({on:true, shift:overflow, dur:Math.max(3, overflow/28)})
      }else{
        setMarquee({on:false, shift:0, dur:8})
      }
    },350) // بعد از انیمیشن evSlide اندازه بگیر
    return ()=>clearTimeout(t)
  },[ev&&ev.id])

  useEffect(()=>{
    if(events.length<2) return
    clearInterval(timerRef.current)
    // اگه متن بلنده، قبل از رفتن به رویداد بعدی صبر کن یه رفت‌وبرگشت کامل دیده بشه
    const delay = marquee.on ? Math.max(4500, (marquee.dur*2+3)*1000) : 4500
    timerRef.current=setInterval(()=>setIdx(i=>(i+1)%events.length),delay)
    return ()=>clearInterval(timerRef.current)
  },[events.length, marquee.on, marquee.dur])

  // به پدر بگو الان کدوم کافه رو باید روی نقشه هایلایت کنه (بدون حرکت دوربین)
  useEffect(()=>{
    onActiveCafeChange && onActiveCafeChange(ev ? ev.cafe_id : null)
    return ()=>{ onActiveCafeChange && onActiveCafeChange(null) }
  },[ev && ev.id])

  if(!ev) return null
  const cd = ev.collectible_defs

  function go(delta){
    clearInterval(timerRef.current)
    setIdx(i=>(i+delta+events.length)%events.length)
  }
  function onClickBanner(){
    const cafe = cafes.find(c=>c.id===ev.cafe_id)
    if(cafe) setSelCafe(cafe)
    else if(typeof window!=='undefined') window.location.href='/quests'
  }
  function onTouchStart(e){ touchXRef.current = e.touches[0].clientX }
  function onTouchEnd(e){
    if(touchXRef.current==null) return
    const dx = e.changedTouches[0].clientX - touchXRef.current
    if(Math.abs(dx) > 40) go(dx>0 ? -1 : 1)
    touchXRef.current = null
  }

  return (
    <div data-tut="event-banner" style={{position:'absolute',top:10,left:10,zIndex:18,display:'flex',flexDirection:'column',gap:5,alignItems:'flex-start',maxWidth:'min(64vw,400px)',...(rootStyle||{})}}>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={onClickBanner}
        style={{height:27,boxSizing:'border-box',background:C.glass,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+C.border,borderRadius:99,padding:'0 9px',display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.sub,boxShadow:'0 2px 8px rgba(0,0,0,.08)',cursor:'pointer',minWidth:0,maxWidth:'100%'}}>
        <button onClick={(e)=>{e.stopPropagation();go(1)}} style={{background:'none',border:'none',color:C.sub,fontSize:12,padding:'0 1px',flexShrink:0,fontFamily:'inherit',lineHeight:1}}>‹</button>
        <span key={ev.id} style={{display:'flex',alignItems:'center',gap:5,minWidth:0,animation:'evSlide .3s ease'}}>
          <span style={{fontSize:11,flexShrink:0,lineHeight:1}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
          <span ref={textWrapRef} style={{whiteSpace:'nowrap',overflow:'hidden',minWidth:0,lineHeight:1}}>
            <span ref={textRef} className={marquee.on?'tl-shuttle':''} style={{display:'inline-block',fontWeight:700,color:C.text,lineHeight:1,'--shift':marquee.shift+'px','--dur':marquee.dur+'s'}}>{ev.cafes?ev.cafes.name:'کافه'}: {ev.title}</span>
          </span>
        </span>
        <button onClick={(e)=>{e.stopPropagation();go(-1)}} style={{background:'none',border:'none',color:C.sub,fontSize:12,padding:'0 1px',flexShrink:0,fontFamily:'inherit',lineHeight:1}}>›</button>
      </div>
      {events.length>1 && (
        <div style={{display:'flex',gap:3,paddingRight:8}}>
          {events.map((e,i)=>(
            <button key={e.id} onClick={()=>{ clearInterval(timerRef.current); setIdx(i) }}
              style={{flexShrink:0,width:i===safeIdx?12:4,height:4,borderRadius:99,border:'none',background:i===safeIdx?C.accent:C.border,transition:'all .3s',padding:0}}/>
          ))}
        </div>
      )}
    </div>
  )
}
