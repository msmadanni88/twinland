'use client'
// نوار فیلتر محله‌ها و جست‌وجوی کافه — جداشده از TwinLand.js
import { ZONES } from '@/lib/constants'
import { onColor } from '@/lib/theme/ui'

export function FilterBar({ C, goZone, search, setSearch, zone }) {
  return (<>
      {/* FILTER BAR */}
      <div style={{height:46,flexShrink:0,display:'flex',alignItems:'center',gap:7,padding:'0 12px',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',background:C.glassDark,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border}}>
        {ZONES.map(z=>(
          <button key={z.key} onClick={()=>goZone(z)} style={{flexShrink:0,background:zone===z.key?C.accent:C.chip,border:'none',borderRadius:99,padding:'8px 17px',fontSize:13.5,fontWeight:zone===z.key?800:600,color:zone===z.key?onColor(C.accent):C.text,whiteSpace:'nowrap',fontFamily:'inherit',transition:'all .2s'}}>{z.label}</button>
        ))}
        <div style={{width:1,height:24,background:C.border,flexShrink:0,margin:'0 2px'}}/>
        <div style={{position:'relative',display:'flex',alignItems:'center',flexShrink:0}}>
          <span style={{position:'absolute',right:12,fontSize:13,pointerEvents:'none',opacity:0.6}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی کافه..."
            style={{background:search?C.accentL:C.chip,border:'1.5px solid '+(search?C.accent:'transparent'),borderRadius:99,padding:'8px 34px 8px 30px',fontSize:12.5,fontFamily:'inherit',color:C.text,width:search?170:140,flexShrink:0,transition:'all .25s',outline:'none'}}/>
          {search&&(
            <button onClick={()=>setSearch('')} style={{position:'absolute',left:8,background:C.border,border:'none',borderRadius:'50%',width:18,height:18,fontSize:11,color:C.text,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
          )}
        </div>
      </div>
  </>)
}
