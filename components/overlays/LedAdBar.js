'use client'
import { useEffect, useRef, useState } from 'react'

// ── نوار LED سبک تابلوی واقعی: پیکسل‌های مربعی sharp + grid (بدون glow) ────────
// ورودی هر اسلاید می‌تونه متن یا ویدیو باشه. ویدیو خودکار پیکسلی می‌شه.
const LED_ADS = [
  { type:'video', src:'/ads/led-1.mp4' },
  { type:'video', src:'/ads/led-2.mp4' },
  { type:'video', src:'/ads/led-3.mp4' },
  { type:'video', src:'/ads/led-4.mp4' },
  { type:'video', src:'/ads/led-5.mp4' },
]

export function LedAdBar({ C }) {
  const [visible, setVisible] = useState(false)
  useEffect(()=>{
    let hideTimer
    const VISIBLE_MS = LED_ADS.length*15000   // دقیقاً کافی برای نمایش کامل هر ۵ ویدیو
    const INTERVAL_MS = 10*60*1000            // هر ۱۰ دقیقه یک‌بار
    function trigger(){ setVisible(true); hideTimer=setTimeout(()=>setVisible(false),VISIBLE_MS) }
    trigger()                                  // بلافاصله با رفرش/ورود، بدون تأخیر
    const intervalTimer=setInterval(trigger,INTERVAL_MS)
    return ()=>{ clearTimeout(hideTimer); clearInterval(intervalTimer) }
  },[])
  if(!visible) return null
  return <LedAdBarInner C={C}/>
}

function LedAdBarInner({ C }) {
  const canvasRef=useRef(null)
  const srcRef=useRef(null)
  const videoRef=useRef(null)
  const [idx,setIdx]=useState(0)
  const idxRef=useRef(0)

  useEffect(()=>{
    let t
    const schedule=()=>{
      const cur=LED_ADS[idxRef.current]
      const dur=15000  // ۱۵ ثانیه برای هر اسلاید
      t=setTimeout(()=>{ idxRef.current=(idxRef.current+1)%LED_ADS.length; setIdx(idxRef.current); schedule() },dur)
    }
    schedule()
    return ()=>clearTimeout(t)
  },[])

  useEffect(()=>{
    const cv=canvasRef.current; if(!cv) return
    const ctx=cv.getContext('2d')
    if(!srcRef.current) srcRef.current=document.createElement('canvas')
    const src=srcRef.current; const sctx=src.getContext('2d')
    sctx.imageSmoothingEnabled=true          // منبع صاف (تا رنگ‌ها خوب نمونه‌برداری شن)
    let raf, curIdx=-1, lastFrame=0
    const dpr=Math.min(window.devicePixelRatio||1,2)

    let COLS=0, ROWS=0, CELL=0   // تعداد ستون/ردیف و اندازه‌ی خانه (device px صحیح)

    function resize(){
      const w=cv.clientWidth||cv.parentElement.clientWidth, h=cv.clientHeight||cv.parentElement.clientHeight
      ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled=false
      CELL=Math.max(2,Math.round(2*dpr))
      // عرض/ارتفاع بوم را دقیقاً مضرب CELL کن تا همه خانه‌ها یک‌اندازه باشن
      COLS=Math.ceil((w*dpr)/CELL)   // ceil تا کل عرض پوشش داده شه (چند px آخر پشت لبه)
      ROWS=Math.round((h*dpr)/CELL)
      cv.width=COLS*CELL; cv.height=ROWS*CELL
      // اندازه‌ی CSS دقیقاً برابر device px تقسیم بر dpr → بدون کش‌دادن (grid یکنواخت)
      cv.style.width=(cv.width/dpr)+'px'
      cv.style.height='100%'
      src.width=COLS; src.height=ROWS
    }
    resize(); window.addEventListener('resize',resize)

    function renderTextSource(ad){
      const sw=src.width, sh=src.height
      sctx.clearRect(0,0,sw,sh); sctx.fillStyle='#000'; sctx.fillRect(0,0,sw,sh)
      sctx.textBaseline='middle'; sctx.direction='rtl'; sctx.textAlign='right'
      sctx.font='800 '+Math.round(sh*0.62)+'px Estedad, sans-serif'
      sctx.fillStyle=ad.accent; sctx.fillText(ad.title, sw-2, sh*0.5)
      const tw=sctx.measureText(ad.title).width
      sctx.font='700 '+Math.round(sh*0.5)+'px Estedad, sans-serif'
      sctx.fillStyle='#fff'; sctx.fillText('· '+ad.sub, sw-tw-8, sh*0.5)
    }

    function draw(now){
      raf=requestAnimationFrame(draw)
      if(now-lastFrame<40) return
      lastFrame=now
      const ad=LED_ADS[idxRef.current]

      // ۱) محتوا را روی منبع کوچک (COLS×ROWS) بکش
      if(ad.type==='video'){
        const v=videoRef.current
        if(v&&v.readyState>=2){
          const sw=src.width, sh=src.height
          sctx.fillStyle='#000'; sctx.fillRect(0,0,sw,sh)
          const vr=v.videoWidth/v.videoHeight, sr=sw/sh
          let dw=sw,dh=sh,dx=0,dy=0
          if(vr>sr){ dh=sh; dw=sh*vr; dx=(sw-dw)/2 } else { dw=sw; dh=sw/vr; dy=(sh-dh)/2 }
          try{ sctx.drawImage(v,dx,dy,dw,dh) }catch(e){}
        }
      } else if(curIdx!==idxRef.current){ renderTextSource(ad) }
      curIdx=idxRef.current

      // ۲) منبع کوچک را با nearest-neighbor بزرگ کن (پیکسل‌های تیز، بدون moiré)
      ctx.fillStyle='#050506'; ctx.fillRect(0,0,cv.width,cv.height)
      ctx.imageSmoothingEnabled=false
      try{ ctx.drawImage(src,0,0,COLS,ROWS,0,0,COLS*CELL,ROWS*CELL) }catch(e){ return }

      // ۳) شبکه‌ی grid تیره را با خطوط دقیق ۱px روی خانه‌ها بکش (یکنواخت)
      ctx.fillStyle='rgba(0,0,0,0.55)'
      for(let x=0;x<=COLS;x++){ ctx.fillRect(x*CELL,0,1,ROWS*CELL) }
      for(let y=0;y<=ROWS;y++){ ctx.fillRect(0,y*CELL,COLS*CELL,1) }
    }
    raf=requestAnimationFrame(draw)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  },[])

  const cur=LED_ADS[idx]
  return (
    <div style={{position:'absolute',left:'50%',bottom:10,transform:'translateX(-50%)',zIndex:18,width:'min(260px, calc(100vw - 100px))'}}>
      <div style={{height:30,position:'relative',borderRadius:99,overflow:'hidden',background:'#050506'}}>
        {/* ویدیوی پنهان (منبع افکت) — فقط وقتی اسلاید ویدیویی فعاله */}
        {cur&&cur.type==='video'&&(
          <video key={idx} ref={videoRef} src={cur.src} autoPlay loop muted playsInline
            style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}}/>
        )}
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block',imageRendering:'pixelated'}}/>
        <div style={{position:'absolute',bottom:2,left:8,display:'flex',gap:3}}>
          {LED_ADS.map((_,i)=>(
            <span key={i} style={{width:i===idx?10:4,height:2.5,borderRadius:2,background:i===idx?'#fff':'rgba(255,255,255,.3)',transition:'.3s'}}/>
          ))}
        </div>
      </div>
    </div>
  )
}
