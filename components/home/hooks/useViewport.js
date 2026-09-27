'use client'
// اندازه‌ی پنجره و نقطه‌های شکست موبایل/دسکتاپ — جداشده از TwinLand.js
import { useEffect, useState } from 'react'
import { BP } from '@/lib/constants'

export function useViewport() {
  const [vw,         setVw]         = useState(800)

  useEffect(()=>{
    const check=()=>setVw(window.innerWidth)
    check()
    window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[])

  const isMobile  = vw < BP.mobile
  const isDesktop = vw >= BP.tablet
  return { isDesktop, isMobile }
}
