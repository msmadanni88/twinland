'use client'
import { onColor } from '@/lib/theme/ui'

// ── تنظیمات نمایش نقشه ─────────────────────────────────────────────────────
export function MapSettingsPopup({ C, value, setValue, onClose }) {
  const set=(k,v)=>setValue(prev=>({...prev,[k]:v}))
  const Seg=({label,options,val,onPick})=>(
    <div style={{marginBottom:18}}>
      <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>{label}</div>
      <div style={{display:'flex',gap:6}}>
        {options.map(o=>(
          <button key={o.k} onClick={()=>onPick(o.k)} style={{flex:1,padding:'9px 4px',borderRadius:11,border:'2px solid '+(val===o.k?C.accent:C.border),background:val===o.k?C.accent:C.card,color:val===o.k?onColor(C.accent):C.text,fontSize:12,fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>{o.l}</button>
        ))}
      </div>
    </div>
  )
  const dotColors=['#3b82f6','#ef4444','#10b981','#f97316','#8b5cf6','#ec4899','#eab308','#14b8a6','#f43f5e','#6366f1','#000000','#ffffff','#9ca3af','#6b7280','#78350f']
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:3100,background:'rgba(0,0,0,.4)',backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 18px 28px',maxHeight:'85%',overflowY:'auto',direction:'rtl'}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'0 auto 16px'}}/>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:16}}>نمایش نقشه</div>

        <Seg label="حالت نمایش SME" val={value.markerMode} onPick={v=>set('markerMode',v)}
          options={[{k:'pin',l:'پین'},{k:'dot',l:'نقطه'},{k:'auto',l:'خودکار'}]} />

        <Seg label="خوشه‌بندی (نمای کل شهر)" val={value.cluster} onPick={v=>set('cluster',v)}
          options={[{k:'off',l:'خاموش'},{k:'low',l:'کم'},{k:'medium',l:'متوسط'},{k:'high',l:'زیاد'}]} />

        <Seg label="خوشه‌بندی هنگام فیلتر منطقه" val={value.regionCluster} onPick={v=>set('regionCluster',v)}
          options={[{k:'off',l:'خاموش'},{k:'low',l:'کم'},{k:'medium',l:'متوسط'},{k:'high',l:'زیاد'}]} />

        {value.markerMode==='dot'&&(
          <>
            <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>رنگ نقطه</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
              {dotColors.map(c=>(
                <button key={c} onClick={()=>set('dotColor',c)} style={{width:34,height:34,borderRadius:'50%',background:c,border:value.dotColor===c?'3px solid '+C.text:'3px solid transparent',cursor:'pointer'}}/>
              ))}
            </div>
            <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:8}}>اندازه نقطه: {value.dotSize.toLocaleString('fa')}</div>
            <input type="range" min={4} max={16} value={value.dotSize} onChange={e=>set('dotSize',Number(e.target.value))} style={{width:'100%',marginBottom:18,accentColor:C.accent}}/>
          </>
        )}

        <button onClick={onClose} style={{width:'100%',padding:14,borderRadius:14,border:'none',background:C.accent,color:onColor(C.accent),fontSize:15,fontWeight:800,fontFamily:'inherit',cursor:'pointer'}}>تمام</button>
      </div>
    </div>
  )
}
