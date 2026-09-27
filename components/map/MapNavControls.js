'use client'
// کنترل‌های جابه‌جایی و زوم نقشه — جداشده از TwinLand.js
import { CITIES } from '@/lib/constants'

export function MapNavControls({ C, city, mapInst, navOpen, panMap, panelOpen, setNavOpen, showBoundary, showCity, showMapSettings, showMenu, showMode, showPalette, showRegionFilter, showRegionResults, showXP }) {
  return (<>
        {/* nav controls — بیرون از لایه‌ی نقشه. هنگام باز بودن هر پاپ‌آپ مخفی می‌شه */}
        {!(showRegionFilter||showRegionResults||showXP||showMenu||showCity||showMode||showBoundary||showPalette||showMapSettings||panelOpen) && (
        <div style={{position:'absolute',bottom:14,left:0,zIndex:18,display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8}}>
          <div style={{overflow:'hidden',opacity:navOpen?0.7:0,maxHeight:navOpen?180:0,transform:navOpen?'translateY(0) scale(1)':'translateY(14px) scale(.85)',transformOrigin:'bottom left',pointerEvents:navOpen?'auto':'none',transition:'opacity .3s ease, max-height .34s ease, transform .34s cubic-bezier(.34,1.45,.5,1)',display:'flex',flexDirection:'column',gap:5}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,32px)',gap:3}}>
              {[{e:1},{l:'↑',fn:()=>panMap(0,-80)},{e:1},{l:'←',fn:()=>panMap(80,0)},{l:'⌖',fn:()=>{const c=CITIES[city];mapInst.current?.flyTo([c.lat,c.lng],c.zoom)}},{l:'→',fn:()=>panMap(-80,0)},{e:1},{l:'↓',fn:()=>panMap(0,80)},{e:1}].map((b,i)=>
                b.e?<div key={i}/>:<button key={i} onClick={b.fn} style={{background:C.glass,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',border:'1px solid '+C.border,borderRadius:9,width:32,height:32,fontSize:b.l==='⌖'?10:15,color:C.text,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,.08)'}}>{b.l}</button>
              )}
            </div>
            <div style={{display:'flex',gap:3}}>
              {[['＋',()=>mapInst.current?.zoomIn()],['－',()=>mapInst.current?.zoomOut()]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{background:C.glass,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',border:'1px solid '+C.border,borderRadius:9,width:32,height:32,fontSize:18,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,.08)'}}>{l}</button>
              ))}
            </div>
          </div>
          <button data-tut="map-nav" onClick={()=>setNavOpen(v=>!v)} title={navOpen?'مخفی کردن کنترل‌ها':'نمایش کنترل‌ها'} style={{width:32,height:32,borderRadius:9,border:navOpen?'1px solid '+C.border:'none',cursor:'pointer',fontFamily:'inherit',background:navOpen?C.glass:C.grad,backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',boxShadow:navOpen?'0 2px 6px rgba(0,0,0,.08)':'0 6px 22px '+C.accent+'99',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .3s ease, box-shadow .3s ease, transform .18s cubic-bezier(.34,1.6,.5,1)',animation:navOpen?'none':'tlNavPulse 2s ease-in-out infinite'}} onMouseDown={e=>e.currentTarget.style.transform='scale(.86)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
            <span style={{display:'inline-block',fontSize:16,fontWeight:900,lineHeight:1,color:navOpen?C.text:'#fff',transition:'transform .4s cubic-bezier(.34,1.7,.4,1)',transform:navOpen?'rotate(0deg)':'rotate(180deg)'}}>▾</span>
          </button>
        </div>
        )}
  </>)
}
