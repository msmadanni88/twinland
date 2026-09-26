'use client'
import { useEffect, useState } from 'react'
import AuthGate from '@/components/auth/AuthGate'
import { TwinLand } from '@/components/home/TwinLand'

export default function Page(){
  const [session,   setSession]   = useState(null)
  const [authReady, setAuthReady] = useState(false)
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('tl_session')
      if(raw){ const s = JSON.parse(raw); if(s && s.access_token && (!s.expires_at || s.expires_at > Date.now())) setSession(s); else localStorage.removeItem('tl_session') }
    }catch(e){}
    setAuthReady(true)
  },[])
  if(!authReady) return <div style={{position:'fixed',inset:0,background:'#0b0714'}}/>
  if(!session) return <AuthGate onAuthed={setSession}/>
  return <TwinLand session={session} onLogout={()=>{try{localStorage.removeItem('tl_session')}catch(e){}setSession(null)}}/>
}
