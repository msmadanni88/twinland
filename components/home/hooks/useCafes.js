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
    const h={'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    // ویترین هر کافه: اسم آیتم ویژه (از روی featured_menu_item_id) + یک کمپین/ماموریت
    // فعال — برای حباب‌های شناور روی نقشه. یک‌جا برای همه‌ی کافه‌ها، نه به‌ازای هر hover.
    const enrich=(rows)=>{
      const withFeatured=rows.filter(c=>c.featured_menu_item_id!=null).map(c=>c.featured_menu_item_id)
      const ids=rows.map(c=>c.id)
      const p1 = withFeatured.length
        ? fetch(SB_URL+'/rest/v1/cafe_menu_items?id=in.('+withFeatured.join(',')+')&select=id,name',{headers:h}).then(r=>r.ok?r.json():[]).catch(()=>[])
        : Promise.resolve([])
      // کمپین‌های فعال همه مکان‌ها یک‌جا گرفته می‌شود؛ با بیش از هزار مکان، فهرست شناسه‌ها در نشانی جا نمی‌شود
      const p2 = ids.length
        ? fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,cafe_id,title,icon&order=created_at.desc&limit=1000',{headers:h}).then(r=>r.ok?r.json():[]).catch(()=>[])
        : Promise.resolve([])
      Promise.all([p1,p2]).then(([items,quests])=>{
        if(!alive) return
        const itemName={}; (Array.isArray(items)?items:[]).forEach(i=>{ itemName[i.id]=i.name })
        const questByCafe={}; (Array.isArray(quests)?quests:[]).forEach(q=>{ if(!questByCafe[q.cafe_id]) questByCafe[q.cafe_id]=q })
        setCafes(rows.map(c=>({
          ...c,
          featured_item_name: c.featured_menu_item_id!=null ? (itemName[c.featured_menu_item_id]||null) : null,
          active_quest: questByCafe[c.id]||null,
        })))
      })
    }
    const load=(attempt=0)=>{
      // سرور در هر پاسخ حداکثر 1000 ردیف می‌دهد؛ مکان‌ها صفحه‌صفحه گرفته می‌شوند تا هیچ‌کدام جا نماند
      const PAGE=1000
      const page=(from,acc)=>fetch(SB_URL+'/rest/v1/cafes?select=*&is_active=eq.true&order=id.asc&limit='+PAGE+'&offset='+from,{ headers:h }
      ).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json() }).then(rows=>{
        if(!Array.isArray(rows)) throw new Error('bad response')
        const all=acc.concat(rows)
        return rows.length===PAGE && all.length<20000 ? page(from+PAGE,all) : all
      })
      page(0,[]).then(d=>{
        if(alive && Array.isArray(d)){ setCafes(d); enrich(d) }
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
