'use client'
import { onColor } from '@/lib/theme/ui'

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
// ── پاپ‌آپ فیلتر منطقه‌ای ──────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { key:'cafe',       icon:'☕', label:'کافه' },
  { key:'restaurant', icon:'🍽️', label:'رستوران' },
  { key:'beauty',     icon:'💇', label:'سالن زیبایی', soon:true },
  { key:'gym',        icon:'🏋️', label:'باشگاه', soon:true },
  { key:'academy',    icon:'📚', label:'آموزشگاه', soon:true },
  { key:'flower',     icon:'🌷', label:'گل‌فروشی', soon:true },
]

const REGION_VIEW_OPTIONS = [
  { key:'showClans',       icon:'🛡️', label:'کلن‌های فعال منطقه' },
  { key:'showLeaderboard', icon:'🏆', label:'لیدربورد منطقه' },
  { key:'showHeatmap',     icon:'🔥', label:'Heatmap منطقه' },
]

export function RegionFilterPopup({ C, regions, value, setValue, onApply, onClose }) {
  const toggleCat=(k)=>setValue(v=>({...v, categories: v.categories.includes(k)?v.categories.filter(x=>x!==k):[...v.categories,k]}))
  const toggleView=(k)=>setValue(v=>({...v, [k]: !v[k]}))
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:40,background:'rgba(0,0,0,.45)',backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'82%',overflowY:'auto',boxShadow:'0 -8px 40px rgba(0,0,0,.3)'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>فیلتر منطقه</div>
        <div style={{fontSize:12,color:C.sub,marginBottom:18}}>{regions.join('، ')}</div>

        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>روی نقشه چی ببینم؟</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:20}}>
          {CATEGORY_OPTIONS.map(o=>{
            const on=value.categories.includes(o.key)
            return (
              <button key={o.key} disabled={o.soon} onClick={()=>toggleCat(o.key)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',borderRadius:14,
                  border:'2px solid '+(on?C.accent:C.border),background:on?C.accentL:C.card,
                  color:o.soon?C.sub:C.text,fontSize:13.5,fontWeight:700,fontFamily:'inherit',
                  cursor:o.soon?'default':'pointer',opacity:o.soon?0.55:1,textAlign:'right'}}>
                <span style={{fontSize:18}}>{o.icon}</span>
                <span style={{flex:1}}>{o.label}</span>
                {o.soon&&<span style={{fontSize:9,background:C.chip,color:C.sub,borderRadius:99,padding:'2px 6px'}}>به‌زودی</span>}
                {on&&!o.soon&&<span style={{color:C.accent,fontWeight:800}}>✓</span>}
              </button>
            )
          })}
        </div>

        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>اطلاعات منطقه</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
          {REGION_VIEW_OPTIONS.map(o=>{
            const on=value[o.key]
            return (
              <button key={o.key} onClick={()=>toggleView(o.key)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,
                  border:'2px solid '+(on?C.accent:C.border),background:on?C.accentL:C.card,
                  color:C.text,fontSize:13.5,fontWeight:700,fontFamily:'inherit',cursor:'pointer',textAlign:'right'}}>
                <span style={{fontSize:18}}>{o.icon}</span>
                <span style={{flex:1}}>{o.label}</span>
                <span style={{width:38,height:22,borderRadius:99,background:on?C.accent:C.chip,position:'relative',transition:'.2s',flexShrink:0}}>
                  <span style={{position:'absolute',top:2,left:on?18:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'.2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={onApply}
          style={{width:'100%',padding:15,borderRadius:14,border:'none',background:C.accent,color:onColor(C.accent),
            fontSize:15,fontWeight:800,fontFamily:'inherit',cursor:'pointer',boxShadow:'0 6px 20px '+C.accent+'55'}}>
          نمایش نتایج
        </button>
      </div>
    </div>
  )
}
