'use client'
import { useEffect, useState } from 'react'
import { useUiVersion } from '@/components/ui/UiVersionProvider'
import { resolveSurface } from '@/lib/ui/surfaces'
import { SB_KEY, SB_URL } from '@/lib/config'

export default function Page(){
  const [session,   setSession]   = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const { active, recheck } = useUiVersion()   // نسخه ظاهر فعال — lib/ui/versions.js
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('tl_session')
      if(raw){ const s = JSON.parse(raw); if(s && s.access_token && (!s.expires_at || s.expires_at > Date.now())) setSession(s); else localStorage.removeItem('tl_session') }
    }catch(e){}
    setAuthReady(true)
  },[])
  useEffect(()=>{ recheck() },[session, recheck])

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
  if(!session) return <AuthGate onAuthed={setSession}/>
  return <TwinLand session={session} onLogout={()=>{try{localStorage.removeItem('tl_session')}catch(e){}setSession(null)}}/>
}
