'use client'
// داده‌ی کاربر: پروفایل، امتیاز، علاقه‌مندی‌ها، چک‌این‌ها، اعلان‌ها و به‌روزرسانی لحظه‌ای — جداشده از TwinLand.js
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { subscribeToTables } from '@/lib/game/gameSystem'

export function useUserData({ freshToken, session }) {
  const [notifications, setNotifications] = useState([])
  const [tutorialSeen, setTutorialSeen] = useState({})
  const [tutorialLoaded, setTutorialLoaded] = useState(false)   // تا پروفایل نیومده، تیوتوریال نشون نده (رفع فلشِ هر لاگین)
  const [checkedIn,  setCheckedIn]  = useState(new Set())
  const [favs,       setFavs]       = useState(new Set())
  const [xp,         setXp]         = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [coins,      setCoins]      = useState(0)
  const [userName,   setUserName]   = useState('')
  const [isAdmin,    setIsAdmin]    = useState(false)
  // ── حالت نمایش مالک اپ ─────────────────────────────────────────────────
  // isOwner: فقط برای نمایشِ سوییچ در منو (امنیت واقعی سمت سروره — RPC
  // set_view_mode ایمیل رو از auth.users چک می‌کنه، نه از کلاینت).
  // viewAsUser: وقتی روشنه، سایت دقیقاً مثل یه کاربر عادی رفتار می‌کنه.
  const [isOwner,    setIsOwner]    = useState(false)
  const [viewAsUser, setViewAsUser] = useState(false)
  const effAdmin = isAdmin && !viewAsUser
  const [accountType, setAccountType] = useState('user')

  // پروفایل واقعی کاربر + چک‌این‌های قبلی رو از دیتابیس بخون
  useEffect(()=>{
    if(!session||!session.user||!session.access_token) return
    const uid=session.user.id
    const h={'apikey':SB_KEY,'Authorization':'Bearer '+session.access_token}
    fetch(SB_URL+'/rest/v1/profiles?id=eq.'+uid+'&select=*',{headers:h})
      .then(r=>r.json()).then(rows=>{ const p=Array.isArray(rows)&&rows[0]; if(p){ setXp(p.xp||0); setStreak(p.streak||0); setCoins(p.coins||0); setUserName(p.display_name||''); setIsAdmin(!!p.is_admin); setViewAsUser(!!p.view_as_user); setAccountType(p.account_type||'user'); setTutorialSeen(p.tutorial_seen||{}) } setTutorialLoaded(true) }).catch(()=>setTutorialLoaded(true))
    setIsOwner(!!(session.user.email && session.user.email.toLowerCase()==='msmadani88@gmail.com'))
    // علاقه‌مندی‌ها (قلب‌ها) — حالا واقعی و سمت سرور ذخیره می‌شن
    fetch(SB_URL+'/rest/v1/favorites?user_id=eq.'+uid+'&select=cafe_id',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setFavs(new Set(rows.map(x=>x.cafe_id))) }).catch(()=>{})
    fetch(SB_URL+'/rest/v1/checkins?user_id=eq.'+uid+'&select=cafe_id',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setCheckedIn(new Set(rows.map(x=>x.cafe_id))) }).catch(()=>{})
    fetch(SB_URL+'/rest/v1/notifications?user_id=eq.'+uid+'&select=*&order=created_at.desc&limit=40',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setNotifications(rows) }).catch(()=>{})
  },[session])

  // realtime: تغییرات لحظه‌ای پروفایل خودم + چک‌این‌های خودم (بدون رفرش)
  useEffect(()=>{
    if(!session||!session.user||!session.user.id) return
    const uid=session.user.id
    const unsub = subscribeToTables([
      { table:'profiles', event:'UPDATE', filter:'id=eq.'+uid },
      { table:'checkins', event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'notifications', event:'INSERT', filter:'user_id=eq.'+uid },
    ],(p)=>{
      if(p.table==='profiles' && p.record){
        const r=p.record
        if(r.xp!=null) setXp(r.xp)
        if(r.streak!=null) setStreak(r.streak)
        if(r.coins!=null) setCoins(r.coins)
      }
      if(p.table==='checkins' && p.record && p.record.cafe_id){
        setCheckedIn(prev=>{ const s=new Set(prev); s.add(p.record.cafe_id); return s })
      }
      if(p.table==='notifications' && p.record){
        setNotifications(prev=>[p.record, ...prev].slice(0,60))
      }
    })
    return ()=>unsub()
  },[session])

  async function markNotifRead(id){
    setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n))
    const token=await freshToken()
    fetch(SB_URL+'/rest/v1/notifications?id=eq.'+id,{
      method:'PATCH',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({read:true})
    }).catch(()=>{})
  }

  async function markAllNotifRead(){
    const unreadIds=notifications.filter(n=>!n.read).map(n=>n.id)
    if(unreadIds.length===0) return
    setNotifications(prev=>prev.map(n=>({...n,read:true})))
    const token=await freshToken()
    fetch(SB_URL+'/rest/v1/notifications?user_id=eq.'+(session&&session.user&&session.user.id),{
      method:'PATCH',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({read:true})
    }).catch(()=>{})
  }
  return { accountType, checkedIn, coins, effAdmin, favs, isOwner, markAllNotifRead, markNotifRead, notifications, setCheckedIn, setCoins, setFavs, setStreak, setTutorialSeen, setViewAsUser, setXp, streak, tutorialLoaded, tutorialSeen, userName, viewAsUser, xp }
}
