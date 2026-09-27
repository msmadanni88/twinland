'use client'
// فهرست کافه‌ها از دیتابیس و شمارش واقعی «الان اینجا» — جداشده از TwinLand.js
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'

export function useCafes({ showToast }) {
  const [cafes,      setCafes]      = useState([])
  const [live,       setLive]       = useState({})

  // کافه‌ها فقط از دیتابیس — بدون دادهٔ ساختگی. اگه لود نشد، پیام واقعی + تلاش دوباره.
  useEffect(()=>{
    let alive=true, retry=null
    const load=(attempt=0)=>{
      fetch(SB_URL+'/rest/v1/cafes?select=*&is_active=eq.true',{
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
      }).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json() }).then(d=>{
        if(alive && Array.isArray(d)) setCafes(d)
      }).catch(()=>{
        if(!alive) return
        if(attempt===0) showToast('کافه‌ها لود نشدن — دوباره تلاش می‌کنم…','warn')
        retry=setTimeout(()=>load(attempt+1), Math.min(30000, 3000*(attempt+1)))
      })
    }
    load()
    return ()=>{ alive=false; clearTimeout(retry) }
  },[])

  // «الان اینجا»: تعداد واقعی آدم‌هایی که در ۲ ساعت اخیر در هر کافه چک‌این کردن
  // (ویوی cafe_live_counts — فقط عدد، بدون هویت). هر ۶۰ ثانیه تازه می‌شه.
  useEffect(()=>{
    if(!cafes.length) return
    let alive=true
    const update=()=>{
      fetch(SB_URL+'/rest/v1/cafe_live_counts?select=cafe_id,live_count',{
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
      }).then(r=>r.ok?r.json():[]).then(rows=>{
        if(!alive||!Array.isArray(rows)) return
        const c={}; rows.forEach(r=>{ c[r.cafe_id]=r.live_count||0 }); setLive(c)
      }).catch(()=>{})
    }
    update(); const t=setInterval(update,60000)
    return ()=>{ alive=false; clearInterval(t) }
  },[cafes])
  return { cafes, live }
}
