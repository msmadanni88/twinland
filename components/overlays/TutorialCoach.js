'use client'
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { ICON, L } from '@/lib/theme/labels'

// ── تیوتوریال تعاملی: صفحه تیره می‌شه، اسپات‌لایت فسفری می‌ره روی خودِ المان ──
// فقط بار اول برای هر تازه‌وارد (وضعیت سمت سرور در profiles.tutorial_seen).
// از منو → «آموزش» هم می‌شه دوباره دیدش (replay، بدون ثبت مجدد).
const TUT_NEON='#CCFF00'

// مسیر آموزش: از «اینجا کجاست» شروع می‌شه، کاربر رو قدم‌به‌قدم تا اولین
// چک‌این و بعد بقیه‌ی بخش‌ها می‌بره. هر مرحله به المان واقعیِ خودش می‌چسبه.
// اسم بخش‌ها از labels.js میاد تا اگه اسمی عوض شد اینجا هم خودکار درست بشه.
const TUTORIAL_STEPS = [
  { key:'welcome', forRole:'any', target:null, emoji:'👋',
    title:'خوش اومدی به '+L.app+'!',
    text:'اینجا کافه‌گردی تبدیل می‌شه به بازی. هر بار که به یه کافه سر می‌زنی، امتیاز و جایزه‌ی واقعی می‌گیری. ۳۰ ثانیه وقت بده تا کل مسیر رو نشونت بدم.' },

  { key:'map_intro', forRole:'any', target:null, emoji:'🗺️',
    title:'این نقشه‌ی توئه',
    text:'هر نشان روی نقشه یه کافه‌ی واقعی توی شهره. با انگشت بکش و بزرگ‌نمایی کن تا کافه‌های اطرافت رو ببینی.' },

  { key:'map_controls', forRole:'any', target:'[data-tut="map-nav"]', emoji:'🎮',
    title:'کنترل نقشه',
    text:'اگه نمی‌خوای با انگشت جابه‌جا کنی، این دکمه رو بزن: کلیدهای بالا/پایین/چپ/راست و بزرگ‌نمایی باز می‌شن. دکمه‌ی وسط (⌖) هم برت می‌گردونه به مرکز شهر.' },

  { key:'first_checkin', forRole:'any', target:null, emoji:'☕',
    title:'قدم اول: یه کافه رو بزن',
    text:'روی هر کافه‌ی نقشه بزن تا پنجره‌ش باز بشه. اونجا دکمه‌ی بزرگ «'+ICON.checkin+' چک‌این» رو می‌زنی — همین کار بهت XP می‌ده و اسمت رو وارد جدول رتبه‌بندی می‌کنه. مهم: هر کافه روزی یک‌بار.' },

  { key:'cafe_actions', forRole:'any', target:null, emoji:'❤️',
    title:'داخل پنجره‌ی کافه چی هست؟',
    text:'کنار دکمه‌ی چک‌این چهار تا دکمه داری: «'+L.hearts+'» کافه رو ذخیره می‌کنه (کافه‌دار می‌بینه چندتا قلب گرفته)، «مسیر» مسیریابی باز می‌کنه، «اشتراک» و «نظر». اگه اون کافه رویداد فعال داشته باشه، همون بالا دکمه‌ی «شرکت در رویداد» رو می‌بینی.' },

  { key:'live_pill', forRole:'any', target:'[data-tut="live-pill"]', emoji:'📊',
    title:'آمار زنده',
    text:'اینجا لحظه‌ای می‌بینی چندتا کافه روی نقشه‌ست، چند نفر همین الان جایی چک‌این کردن، و خودت تا حالا چندتا کافه رفتی.' },

  { key:'event_banner', forRole:'any', target:'[data-tut="event-banner"]', emoji:'🎉',
    title:L.events+' زنده',
    text:'هر تخفیف یا رویدادی که کافه‌دارها همین الان منتشر می‌کنن اینجا می‌چرخه. روش بزنی مستقیم می‌ری به همون کافه. با کشیدن چپ/راست هم می‌تونی بعدی رو ببینی.' },

  { key:'boundary', forRole:'any', target:'[data-tut="boundary-btn"]', emoji:'📍',
    title:'مرزها و مناطق',
    text:'با این دکمه می‌تونی مرز مناطق شهر رو روی نقشه بیاری، منطقه‌ی دلخواهت رو انتخاب کنی و فقط کافه‌های همون‌جا رو ببینی. رتبه‌بندی همون منطقه هم برات باز می‌شه.' },

  { key:'bottom_nav', forRole:'any', target:'[data-tut="bottom-nav"]', emoji:'🧭',
    title:'پنج بخش اصلی',
    text:'از این نوار همه‌جا می‌ری: «'+L.map+'» · «'+L.questsShort+'» (کارهایی که جایزه دارن) · «'+L.clanShort+'» (با دوستات تیم بزن) · «'+L.leaderboardShort+'» (جایگاهت بین بقیه) · «'+L.profile+'».' },

  { key:'quests_intro', forRole:'any', target:'[data-tut="bottom-nav"]', emoji:ICON.quests,
    title:L.quests+' چطور کار می‌کنن؟',
    text:'کافه‌دارها ماموریت می‌سازن؛ مثلاً «۳ بار بیا، قهوه‌ی چهارم مهمون ما». هر چک‌این پیشرفتت رو جلو می‌بره و آخرش یه کد تخفیف واقعی می‌گیری که توی کافه نشونش می‌دی.' },

  { key:'gallery_intro', forRole:'any', target:'[data-tut="menu-btn"]', emoji:ICON.gallery,
    title:L.gallery,
    text:'با هر چک‌این و ماموریت، آیتم‌های کلکسیونی کمیاب جمع می‌کنی — از معمولی تا افسانه‌ای. از این منو برو «'+L.gallery+'» و روی هر کارت بزن تا بچرخه و بگه از کدوم کافه و کِی گرفتیش.' },

  { key:'notif_intro', forRole:'any', target:'[data-tut="notif-btn"]', emoji:'🔔',
    title:L.notifications,
    text:'هر وقت جایزه‌ای بگیری، رویداد جدیدی نزدیکت منتشر بشه یا رتبه‌ت عوض بشه، اینجا خبردار می‌شی. نقطه‌ی قرمز یعنی چیز جدیدی داری.' },

  { key:'menu_intro', forRole:'any', target:'[data-tut="menu-btn"]', emoji:'☰',
    title:'منوی کامل',
    text:'همه‌چیز از اینجا در دسترسه: '+L.gallery+'، '+L.leaderboard+'، '+L.clans+'، '+L.xpSystem+'، تم و پالت رنگی، و همین «'+L.tutorial+'» که هر وقت خواستی دوباره ببینیش.' },

  { key:'business_intro', forRole:'sme', target:'[data-tut="menu-btn"]', emoji:ICON.business,
    title:L.business,
    text:'تو حساب کافه‌داری داری! از منو → «'+L.business+'» می‌تونی رویداد، تخفیف و آیتم کلکسیونی منتشر کنی که همون لحظه روی نقشه‌ی همه‌ی کاربرها بیاد، و آمار مشتری‌هات رو ببینی.' },

  { key:'go', forRole:'any', target:null, emoji:'🚀',
    title:'آماده‌ای!',
    text:'حالا برو روی نقشه، نزدیک‌ترین کافه رو بزن و اولین چک‌اینت رو ثبت کن. اگه چیزی یادت رفت، از منو → «'+L.tutorial+'» دوباره همین راهنما رو باز کن.' },
]

export function TutorialCoach({C, session, accountType, tutorialSeen, setTutorialSeen, tutorialLoaded, replay, onReplayEnd, isMobile}) {
  const [replayIdx, setReplayIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const roleSteps = TUTORIAL_STEPS.filter(s => s.forRole==='any' || s.forRole===accountType)

  // مرحله‌ی فعلی — یک ایندکس واحد برای هر دو حالت (اولین‌بار و replay)
  const firstUnseen = tutorialLoaded ? roleSteps.findIndex(s => !tutorialSeen[s.key]) : -1
  const stepIdx = replay ? replayIdx : firstUnseen
  const step = stepIdx >= 0 ? (roleSteps[stepIdx] || null) : null
  const stepNum = stepIdx + 1

  // موقعیت المان هدف رو پیدا کن (و با تغییر سایز صفحه به‌روز نگه دار)
  useEffect(()=>{
    if(!step){ setRect(null); return }
    function measure(){
      if(!step.target){ setRect(null); return }
      const el = typeof document!=='undefined' ? document.querySelector(step.target) : null
      if(el){
        const r=el.getBoundingClientRect()
        // اگه المان بیرون از دیده، نرم بیارش تو
        if(r.top<0 || r.bottom>window.innerHeight){ try{ el.scrollIntoView({block:'center',behavior:'smooth'}) }catch(e){} }
        setRect({top:r.top,left:r.left,width:r.width,height:r.height})
      }
      else setRect(null)
    }
    measure()
    window.addEventListener('resize',measure)
    const iv=setInterval(measure,600) // اگه المان دیر رندر شد یا جابه‌جا شد
    return ()=>{ window.removeEventListener('resize',measure); clearInterval(iv) }
  },[step && step.key])

  // اگه در حالت replay مرحله‌ای نموند، بیرون از رندر تمومش کن
  useEffect(()=>{
    if(replay && !step && onReplayEnd) onReplayEnd()
  },[replay, step && step.key])

  if(!session || !session.user) return null
  if(!step) return null

  const isLast = stepIdx >= roleSteps.length - 1

  // «قبلی»: در replay فقط ایندکس عقب می‌ره؛ در حالت اولین‌بار، مرحله‌ی قبلی
  // رو دوباره ندیده علامت می‌زنیم تا کاربر بتونه برگرده و مرور کنه.
  function prev(){
    if(stepIdx<=0) return
    if(replay){ setReplayIdx(i=>Math.max(0,i-1)); return }
    const pk = roleSteps[stepIdx-1].key
    setTutorialSeen(prevSeen=>{ const n={...prevSeen}; delete n[pk]; return n })
  }

  function next(){
    if(replay){
      if(replayIdx>=roleSteps.length-1){ setReplayIdx(0); onReplayEnd&&onReplayEnd() }
      else setReplayIdx(i=>i+1)
      return
    }
    setTutorialSeen(prev=>({...prev,[step.key]:true}))
    const token=(session&&session.access_token)||SB_KEY
    fetch(SB_URL+'/rest/v1/rpc/mark_tutorial_seen',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_key:step.key})
    }).catch(()=>{})
  }
  function skipAll(){
    if(replay){ setReplayIdx(0); onReplayEnd&&onReplayEnd(); return }
    const token=(session&&session.access_token)||SB_KEY
    roleSteps.filter(s=>!tutorialSeen[s.key]).forEach(s=>{
      fetch(SB_URL+'/rest/v1/rpc/mark_tutorial_seen',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({p_key:s.key})
      }).catch(()=>{})
    })
    setTutorialSeen(prev=>{ const n={...prev}; roleSteps.forEach(s=>{n[s.key]=true}); return n })
  }

  // جای کارت: اگه هدف بالای صفحه‌ست کارت میاد زیرش، وگرنه بالاش؛ بدون هدف → وسط
  const vh = typeof window!=='undefined' ? window.innerHeight : 700
  const cardBelow = rect ? (rect.top + rect.height/2 < vh/2) : false
  const cardStyle = rect
    ? (cardBelow
        ? {position:'fixed',left:14,right:14,top:Math.min(rect.top+rect.height+18, vh-220),zIndex:4002}
        : {position:'fixed',left:14,right:14,bottom:Math.max(vh-rect.top+18, 90),zIndex:4002})
    : {position:'fixed',left:14,right:14,top:'50%',transform:'translateY(-50%)',zIndex:4002}

  return (
    <>
      {/* پس‌زمینه‌ی تیره — اگه اسپات‌لایت هست، سوراخِ نورش با box-shadow ساخته می‌شه */}
      {!rect && <div style={{position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,.62)',animation:'fadeIn .25s ease'}}/>}
      {rect && (
        <div style={{position:'fixed',top:rect.top-7,left:rect.left-7,width:rect.width+14,height:rect.height+14,zIndex:4001,borderRadius:16,pointerEvents:'none',animation:'tlSpotPulse 1.6s ease-in-out infinite'}}/>
      )}
      <div style={{...cardStyle,animation:'coachPop .32s ease'}}>
        <div style={{background:'rgba(18,18,22,.97)',border:'2px solid '+TUT_NEON,borderRadius:20,padding:'15px 17px',boxShadow:'0 0 26px '+TUT_NEON+'55, 0 12px 40px rgba(0,0,0,.45)',maxWidth:430,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
            <span style={{fontSize:24,flexShrink:0}}>{step.emoji||'💡'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:900,color:TUT_NEON,lineHeight:1.4}}>{step.title}</div>
              <div style={{fontSize:9.5,color:'rgba(255,255,255,.45)',marginTop:1}}>قدم {(stepNum).toLocaleString('fa')} از {roleSteps.length.toLocaleString('fa')}</div>
            </div>
          </div>
          <div style={{fontSize:12.5,color:'#EDEDEF',lineHeight:1.85}}>{step.text}</div>
          <div style={{display:'flex',gap:7,marginTop:14,alignItems:'center'}}>
            {stepNum>1 && <button onClick={prev} style={{background:'none',border:'1px solid rgba(255,255,255,.25)',color:'#ccc',borderRadius:12,padding:'9px 13px',fontSize:12,fontWeight:800,fontFamily:'inherit',flexShrink:0}}>→ قبلی</button>}
            <button onClick={next} style={{flex:1,background:TUT_NEON,color:'#111',border:'none',borderRadius:12,padding:'10px 16px',fontSize:13,fontWeight:900,fontFamily:'inherit'}}>{isLast?'بزن بریم! 🚀':'بعدی ←'}</button>
            <button onClick={skipAll} style={{background:'none',border:'1px solid rgba(255,255,255,.2)',color:'#999',borderRadius:12,padding:'9px 12px',fontSize:11.5,fontWeight:700,fontFamily:'inherit',flexShrink:0}}>رد شو</button>
          </div>
          <div style={{display:'flex',gap:3,justifyContent:'center',marginTop:12,flexWrap:'wrap'}}>
            {roleSteps.map((st,i)=>{
              const active = i===stepIdx
              const done = i<stepIdx
              return <span key={st.key} style={{width:active?14:4,height:4,borderRadius:99,background:active?TUT_NEON:done?TUT_NEON+'66':'rgba(255,255,255,.2)',transition:'all .3s'}}/>
            })}
          </div>
        </div>
      </div>
    </>
  )
}
