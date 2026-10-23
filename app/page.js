'use client'
import { useEffect, useState } from 'react'
import { useUiVersion } from '@/components/ui/UiVersionProvider'
import { resolveSurface } from '@/lib/ui/surfaces'
import { SB_KEY, SB_URL } from '@/lib/config'
import { claimPendingReferral, rememberEntryParams } from '@/lib/growth/entry'
import { bindSession, isFresh, readSession, refreshSession } from '@/lib/auth/session'

export default function Page(){
  const [session,   setSession]   = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const { active, recheck } = useUiVersion()   // نسخه ظاهر فعال — lib/ui/versions.js
  useEffect(()=>{
    // پیوند دعوت ?ref= و پیوند مستقیم کافه ?cafe= پیش از ورود نگه داشته می‌شوند تا بعد از ورود به کار بیایند
    rememberEntryParams()
    // نشست تمام‌شده دیگر پاک نمی‌شود: اول با توکن تمدید، تازه می‌شود و فقط اگر سرور ردش کرد، کاربر دوباره وارد می‌شود
    let alive=true
    const s0 = readSession()
    if(!s0){ setAuthReady(true); return }
    const use = (s)=>{ if(!alive) return; if(s&&s.access_token){ bindSession(s); setSession(s) } else { try{localStorage.removeItem('tl_session')}catch(e){} } setAuthReady(true) }
    if(isFresh(s0, 60*1000) || !s0.refresh_token){ use(isFresh(s0) ? s0 : null); return ()=>{ alive=false } }
    // بی‌اینترنت نشست همان‌طور می‌ماند و با برگشت اینترنت تمدید می‌شود؛ فقط رد صریح سرور null برمی‌گرداند
    refreshSession().then(s=>use(s), ()=>use(s0))
    return ()=>{ alive=false }
  },[])
  // وقتی سرور توکن تمدید را دیگر نپذیرد، صفحه ورود نشان داده می‌شود
  useEffect(()=>{
    const dead=()=>{ try{localStorage.removeItem('tl_session')}catch(e){} bindSession(null); setSession(null) }
    window.addEventListener('tl-session-dead',dead)
    return ()=>window.removeEventListener('tl-session-dead',dead)
  },[])
  useEffect(()=>{ recheck() },[session, recheck])
  // کد دعوت فقط یک بار و فقط بعد از ورود ثبت می‌شود؛ قاعده‌ها سمت سرور است
  useEffect(()=>{ if(session&&session.access_token) claimPendingReferral(session) },[session])

  // حساب کافه‌دار جای بازی، مستقیم به پنل کافه‌دار می‌رود. اگر خودش از پنل «نقشه» را بزند (/?play=1)
  // در همین تب بازی را می‌بیند. مالک اپ همیشه بازی را می‌بیند. این فقط مسیر است، نه امنیت.
  useEffect(()=>{
    if(!session||!session.user||!session.access_token) return
    try{
      const sp=new URLSearchParams(window.location.search)
      if(sp.get('play')==='1') sessionStorage.setItem('tl_play','1')
      if(sessionStorage.getItem('tl_play')==='1') return
    }catch(e){}
    if(String(session.user.email||'').toLowerCase()==='msmadani88@gmail.com') return
    let alive=true
    fetch(SB_URL+'/rest/v1/profiles?id=eq.'+session.user.id+'&select=account_type',{headers:{apikey:SB_KEY,Authorization:'Bearer '+session.access_token}})
      .then(r=>r.json()).then(rows=>{ if(alive&&Array.isArray(rows)&&rows[0]&&rows[0].account_type==='sme') window.location.replace('/business') }).catch(()=>{})
    return ()=>{ alive=false }
  },[session])   // پیش‌نمایش ظاهر فقط برای مالک، پس بعد از ورود دوباره چک شود

  const AuthGate = resolveSurface('auth', active)
  const TwinLand = resolveSurface('home', active)
  if(!authReady) return <div style={{position:'fixed',inset:0,background:'#0b0714'}}/>
  if(!session) return <AuthGate onAuthed={(s)=>{ bindSession(s); setSession(s) }}/>
  return <TwinLand session={session} onLogout={()=>{try{localStorage.removeItem('tl_session')}catch(e){}bindSession(null);setSession(null)}}/>
}
