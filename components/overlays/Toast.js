'use client'
// پیام کوتاه پایین صفحه — جداشده از TwinLand.js
import { onColor } from '@/lib/theme/ui'

export function Toast({ BH, C, toast }) {
  return (<>
      {toast&&(()=>{
        const bg = toast.type==='xp'?C.accent:toast.type==='level'?C.gold:toast.type==='warn'?'#FF9500':(C.isDarkBg?C.card:C.text)
        const fg = toast.type==='xp'?onColor(C.accent):(toast.type==='level'||toast.type==='warn')?'#1a1a1a':(C.isDarkBg?C.text:'#fff')
        return <div style={{position:'fixed',bottom:BH+14,left:'50%',transform:'translateX(-50%)',zIndex:4000,background:bg,color:fg,border:'1px solid '+C.border,borderRadius:99,padding:'10px 22px',fontSize:13,fontWeight:600,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.2)',animation:'fadeUp .2s ease'}}>{toast.msg}</div>
      })()}
  </>)
}
