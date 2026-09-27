'use client'
import { useEffect, useState } from 'react'
import { useUiVersion } from '@/components/ui/UiVersionProvider'
import { resolveSurface } from '@/lib/ui/surfaces'

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
  useEffect(()=>{ recheck() },[session, recheck])   // پیش‌نمایش ظاهر فقط برای مالک، پس بعد از ورود دوباره چک شود

  const AuthGate = resolveSurface('auth', active)
  const TwinLand = resolveSurface('home', active)
  if(!authReady) return <div style={{position:'fixed',inset:0,background:'#0b0714'}}/>
  if(!session) return <AuthGate onAuthed={setSession}/>
  return <TwinLand session={session} onLogout={()=>{try{localStorage.removeItem('tl_session')}catch(e){}setSession(null)}}/>
}
