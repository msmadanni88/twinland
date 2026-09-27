'use client'
// تنظیمات نمایش نقشه — نوع مارکر، خوشه‌بندی، رنگ و اندازه‌ی نقطه — ذخیره در مرورگر — جداشده از TwinLand.js
import { useEffect, useState } from 'react'

export function useMapDisplay() {
  // تنظیمات نمایش نقشه (ذخیره در localStorage)
  const [mapDisplay, setMapDisplay] = useState(()=>{
    if(typeof window==='undefined') return {markerMode:'pin',cluster:'auto',regionCluster:'off',dotColor:'#3b82f6',dotSize:8}
    try{ const s=JSON.parse(localStorage.getItem('tl_mapDisplay')||'{}')
      return {markerMode:s.markerMode||'pin',cluster:s.cluster||'auto',regionCluster:s.regionCluster||'off',dotColor:s.dotColor||'#3b82f6',dotSize:s.dotSize||8}
    }catch(e){ return {markerMode:'pin',cluster:'auto',regionCluster:'off',dotColor:'#3b82f6',dotSize:8} }
  })
  useEffect(()=>{ try{ localStorage.setItem('tl_mapDisplay',JSON.stringify(mapDisplay)) }catch(e){} },[mapDisplay])
  return { mapDisplay, setMapDisplay }
}
