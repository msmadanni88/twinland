'use client'
// پیام کوتاه پایین صفحه — جداشده از TwinLand.js
import { useCallback, useState } from 'react'

export function useToast() {
  const [toast,      setToast]      = useState(null)

  const showToast = useCallback((msg,type='info')=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),2800)
  },[])
  return { showToast, toast }
}
