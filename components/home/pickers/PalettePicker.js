'use client'
// انتخاب پالت رنگ و حالت روز/شب — جداشده از TwinLand.js
import { PALETTES, PALETTE_ORDER } from '@/lib/theme/palettes'
import { onColor } from '@/lib/theme/ui'

export function PalettePicker({ C, paletteKey, pickPalette, setShowPalette, showPalette, themeMode, toggleMode }) {
  return (<>
      {showPalette&&(
        <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowPalette(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'24px 24px 0 0',padding:'20px 18px 40px',width:'100%',maxWidth:480,border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
            <div style={{fontSize:18,fontWeight:800,color:C.text,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:4}}><img src="/theme@256.png" alt="" width={30} height={30} style={{objectFit:'contain'}}/>پالت رنگی</div>
            <div style={{fontSize:11,color:C.sub,textAlign:'center',marginBottom:16}}>تم دلخواهت رو انتخاب کن — ذخیره می‌شه</div>

            {/* سوییچ روز / شب */}
            <div style={{display:'flex',background:C.chip,borderRadius:12,padding:4,marginBottom:18}}>
              <button onClick={()=>themeMode!=='light'&&toggleMode()} style={{flex:1,padding:'9px',borderRadius:9,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:800,background:themeMode==='light'?C.accent:'transparent',color:themeMode==='light'?onColor(C.accent):C.sub}}>☀️ روز</button>
              <button onClick={()=>themeMode!=='dark'&&toggleMode()} style={{flex:1,padding:'9px',borderRadius:9,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:800,background:themeMode==='dark'?C.accent:'transparent',color:themeMode==='dark'?onColor(C.accent):C.sub}}>🌙 شب</button>
            </div>

            {/* لیست پالت‌ها */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {PALETTE_ORDER.map(key=>{
                const p=PALETTES[key]
                const pc=p[themeMode]
                const active=paletteKey===key
                return (
                  <button key={key} onClick={()=>pickPalette(key)} style={{textAlign:'right',background:pc.card,border:active?'2.5px solid '+pc.accent:'1.5px solid '+pc.border,borderRadius:16,padding:'12px',fontFamily:'inherit',cursor:'pointer',position:'relative'}}>
                    <div style={{display:'flex',gap:5,marginBottom:9}}>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.grad||pc.accent,display:'inline-block'}}/>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.chip,display:'inline-block',border:'1px solid '+pc.border}}/>
                      <span style={{width:22,height:22,borderRadius:7,background:pc.bg,display:'inline-block',border:'1px solid '+pc.border}}/>
                    </div>
                    <div style={{fontSize:13,fontWeight:800,color:pc.text}}>{p.emoji} {p.name}</div>
                    {active&&<div style={{position:'absolute',top:8,left:8,width:20,height:20,borderRadius:99,background:pc.accent,color:pc.accentText,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>✓</div>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
  </>)
}
