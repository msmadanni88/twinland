'use client'
import { useEffect, useMemo } from 'react'

// ── انیمیشن جشن تمام‌صفحه (بعد از چک‌این / لِوِل‌آپ / تکمیل رویداد) ──────────
// کانفتی CSS خالص، بدون هیچ کتابخانه. داده از پاسخ do_checkin میاد.
const RARITY_GRAD = {
  common:    'linear-gradient(135deg,#8E8E93,#C7C7CC)',
  rare:      'linear-gradient(135deg,#0A84FF,#5AC8FA)',
  epic:      'linear-gradient(135deg,#7A3CFF,#BF5AF2)',
  legendary: 'linear-gradient(135deg,#FF9F0A,#FFD60A)',
}

const CONFETTI_COLORS = ['#FF6B35','#FFD60A','#34C759','#0A84FF','#BF5AF2','#FF2D55','#CCFF00','#5AC8FA']

export function CelebrationOverlay({C, data, onClose}) {
  // ۴۲ تکه کانفتی با موقعیت/تاخیر/سرعت تصادفی — یک‌بار ساخته می‌شن
  const confetti = useMemo(()=>Array.from({length:42}).map((_,i)=>({
    left: Math.random()*100,
    delay: Math.random()*1.6,
    dur: 2.6+Math.random()*2.4,
    size: 6+Math.random()*8,
    color: CONFETTI_COLORS[i%CONFETTI_COLORS.length],
    round: Math.random()>.5,
  })),[])

  // بعد از ۷ ثانیه خودش بسته می‌شه (با لمس هم بسته می‌شه)
  useEffect(()=>{
    const t=setTimeout(onClose, data.levelUp?9000:7000)
    return ()=>clearTimeout(t)
  },[])

  const grad = data.levelUp
    ? 'linear-gradient(150deg,'+(data.levelColor||C.accent)+'ee, #1c1030f2 70%)'
    : 'linear-gradient(150deg,'+C.accent+'22, rgba(20,18,26,.94) 60%)'
  const title = data.levelUp ? '🎉 لِوِل آپ!' : data.isNewCafe ? '🎉 کافه‌ی جدید کشف کردی!' : '✅ چک‌این شد!'

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:5000,background:'radial-gradient(ellipse at 50% 30%, rgba(60,40,120,.45), rgba(0,0,0,.72))',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .25s ease',overflow:'hidden'}}>
      {/* کانفتی */}
      {confetti.map((p,i)=>(
        <span key={i} style={{position:'absolute',top:0,left:p.left+'%',width:p.size,height:p.round?p.size:p.size*1.8,background:p.color,borderRadius:p.round?'50%':2,opacity:.95,animation:'tlConfetti '+p.dur+'s linear '+p.delay+'s infinite',willChange:'transform'}}/>
      ))}

      {/* کارت تبریک شیشه‌ای */}
      <div onClick={e=>e.stopPropagation()} style={{width:'min(88vw,380px)',background:grad,border:'1.5px solid rgba(255,255,255,.22)',borderRadius:28,padding:'26px 22px 20px',textAlign:'center',animation:'tlCelebPop .5s cubic-bezier(.34,1.5,.5,1), tlCelebGlow 2.4s ease-in-out infinite',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
        {data.levelUp ? (
          <>
            <div style={{fontSize:64,lineHeight:1,marginBottom:8,filter:'drop-shadow(0 0 18px '+(data.levelColor||'#fff')+'aa)'}}>{data.levelIcon||'🏆'}</div>
            <div style={{fontSize:22,fontWeight:900,color:'#fff'}}>{title}</div>
            <div style={{fontSize:15,fontWeight:800,marginTop:4,background:'linear-gradient(90deg,#FFD60A,#FF9F0A)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>به لولِ «{data.levelName}» رسیدی</div>
          </>
        ) : (
          <>
            <div style={{fontSize:48,lineHeight:1,marginBottom:8}}>{data.isNewCafe?'🗺️':'☕'}</div>
            <div style={{fontSize:20,fontWeight:900,color:'#fff'}}>{title}</div>
            <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:4}}>{data.cafeName}{data.district?' · منطقه '+data.district:''}</div>
          </>
        )}

        {/* آمارها */}
        <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:18,flexWrap:'wrap'}}>
          <div style={{background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.18)',borderRadius:14,padding:'9px 15px',minWidth:76}}>
            <div style={{fontSize:19,fontWeight:900,color:'#7CFF9B'}}>+{(data.awarded||0).toLocaleString('fa')}</div>
            <div style={{fontSize:9.5,color:'rgba(255,255,255,.65)',marginTop:1}}>XP</div>
          </div>
          {data.streak>=2&&(
            <div style={{background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.18)',borderRadius:14,padding:'9px 15px',minWidth:76}}>
              <div style={{fontSize:19,fontWeight:900,color:'#FFB340'}}>🔥 {data.streak.toLocaleString('fa')}</div>
              <div style={{fontSize:9.5,color:'rgba(255,255,255,.65)',marginTop:1}}>روز پشت هم</div>
            </div>
          )}
          {data.rank&&(
            <div style={{background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.18)',borderRadius:14,padding:'9px 15px',minWidth:76}}>
              <div style={{fontSize:19,fontWeight:900,color:'#5AC8FA'}}>#{Number(data.rank).toLocaleString('fa')}</div>
              <div style={{fontSize:9.5,color:'rgba(255,255,255,.65)',marginTop:1}}>رتبه‌ی الانت</div>
            </div>
          )}
        </div>

        {/* رویدادهای تکمیل‌شده + آیتم کلکسیونی با گرادیانت کمیابی */}
        {data.quests.length>0&&(
          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
            {data.quests.map((q,i)=>{
              const cd=q.collectible
              const rar=(cd&&cd.rarity)||'common'
              return (
                <div key={i} style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:16,padding:'11px 13px',textAlign:'right'}}>
                  <div style={{fontSize:12.5,fontWeight:800,color:'#fff'}}>🎯 «{q.title}» تکمیل شد!</div>
                  {q.code&&<div style={{fontSize:11.5,color:'#CCFF00',fontWeight:800,marginTop:4,letterSpacing:1,direction:'ltr',textAlign:'center',background:'rgba(0,0,0,.3)',borderRadius:8,padding:'5px 8px',border:'1px dashed #CCFF0066'}}>🎁 {q.code}</div>}
                  {cd&&(
                    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:7,background:RARITY_GRAD[rar]||RARITY_GRAD.common,borderRadius:12,padding:'7px 11px'}}>
                      <span style={{fontSize:22}}>{cd.icon||'💎'}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:900,color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,.35)'}}>{cd.title}</div>
                        <div style={{fontSize:9,color:'rgba(255,255,255,.85)'}}>به گنجینه‌ت اضافه شد 💎</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button onClick={onClose} style={{marginTop:18,width:'100%',background:'rgba(255,255,255,.95)',color:'#111',border:'none',borderRadius:14,padding:'12px',fontSize:14,fontWeight:900,fontFamily:'inherit',boxShadow:'0 4px 20px rgba(255,255,255,.25)'}}>ادامه بده 🚀</button>
      </div>
    </div>
  )
}
