'use client'
// توکن ورود همیشه تازه: قبل از انقضا با refresh_token تمدید می‌شود — جداشده از TwinLand.js
import { useRef } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'

export function useFreshToken({ session }) {
  const tokenRef      = useRef(session?.access_token)
  const tokenExpRef   = useRef(session?.expires_at||0)
  const refreshTokRef = useRef(session?.refresh_token)
  const refreshingRef = useRef(null)
  async function freshToken(){
    if(tokenRef.current && (tokenExpRef.current - Date.now() > 60000)) return tokenRef.current
    if(!refreshTokRef.current) return tokenRef.current
    if(!refreshingRef.current){
      refreshingRef.current = fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:refreshTokRef.current})
      }).then(r=>r.json()).then(d=>{
        refreshingRef.current=null
        if(d&&d.access_token){
          tokenRef.current=d.access_token
          tokenExpRef.current=Date.now()+((d.expires_in||3600)*1000)
          if(d.refresh_token) refreshTokRef.current=d.refresh_token
          try{ localStorage.setItem('tl_session',JSON.stringify({access_token:tokenRef.current,refresh_token:refreshTokRef.current,expires_at:tokenExpRef.current,user:(d.user||(session&&session.user))})) }catch(e){}
        }
        return tokenRef.current
      }).catch(()=>{ refreshingRef.current=null; return tokenRef.current })
    }
    return refreshingRef.current
  }
  return { freshToken }
}
