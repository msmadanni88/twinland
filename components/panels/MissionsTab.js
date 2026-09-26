'use client'
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { ICON, L, ROUTE } from '@/lib/theme/labels'
import { onColor } from '@/lib/theme/ui'
import { getSession, subscribeToChanges, subscribeToTables } from '@/lib/game/gameSystem'

// ── MISSIONS TAB — حالا کاملاً واقعی: از quests واقعی می‌خونه، claim تکراری امکان نداره ──
export function MissionsTab({C, cafes, setSelCafe, showToast}) {
  const [quests, setQuests] = useState([])
  const [progress, setProgress] = useState({})
  const [redemptions, setRedemptions] = useState({})
  const sess = getSession()
  const uid = sess && sess.user && sess.user.id

  const load = useCallback(()=>{
    const h={apikey:SB_KEY,Authorization:'Bearer '+((sess&&sess.access_token)||SB_KEY)}
    fetch(SB_URL+'/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=*,cafes(name,district)&order=created_at.desc&limit=30',{headers:h})
      .then(r=>r.json()).then(rows=>{ if(Array.isArray(rows)) setQuests(rows) }).catch(()=>{})
    if(uid){
      fetch(SB_URL+'/rest/v1/quest_progress?user_id=eq.'+uid+'&select=*',{headers:h})
        .then(r=>r.json()).then(rows=>{ const m={}; (Array.isArray(rows)?rows:[]).forEach(p=>{m[p.quest_id]=p}); setProgress(m) }).catch(()=>{})
      fetch(SB_URL+'/rest/v1/redemptions?user_id=eq.'+uid+'&select=*',{headers:h})
        .then(r=>r.json()).then(rows=>{ const m={}; (Array.isArray(rows)?rows:[]).forEach(r=>{m[r.quest_id]=r}); setRedemptions(m) }).catch(()=>{})
    }
  },[uid])

  useEffect(()=>{ load() },[load])
  useEffect(()=>{
    // رویدادها (عمومی، پرحجم) → کانال سبک مشترک با debounce
    const unsubLight=subscribeToChanges(['quests'],()=>load())
    // پیشرفت/جوایزِ خودِ کاربر (شخصی، کم‌حجم) → اتصال فیلترشده‌ی معمولی
    let unsubPersonal=()=>{}
    if(uid){
      unsubPersonal=subscribeToTables([
        {table:'quest_progress',event:'*',filter:'user_id=eq.'+uid},
        {table:'redemptions',event:'*',filter:'user_id=eq.'+uid},
      ],()=>load())
    }
    return ()=>{ unsubLight(); unsubPersonal() }
  },[load,uid])

  function openCafe(q){
    const cafe=cafes.find(c=>c.id===q.cafe_id)
    if(cafe) setSelCafe(cafe)
    else showToast && showToast('این کافه الان روی نقشه لود نشده، از /quests امتحان کن','warn')
  }

  if(quests.length===0){
    return <div style={{padding:'50px 16px',textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:10}}>🎯</div>
      <div style={{fontWeight:800,color:C.text,marginBottom:4}}>الان {L.questsShort}/رویداد فعالی نیست</div>
      <div style={{fontSize:12,color:C.sub,marginBottom:14}}>کافه‌دارها به‌زودی چیزی منتشر می‌کنن — همین‌جا لحظه‌ای میاد.</div>
      <a href={ROUTE.quests} className="tl-press" style={{display:'inline-flex',alignItems:'center',gap:6,background:C.chip,color:C.text,borderRadius:12,padding:'9px 16px',fontSize:12,fontWeight:800,textDecoration:'none'}}>
        {ICON.quests} مشاهده‌ی کامل {L.quests} ‹
      </a>
    </div>
  }

  return <div style={{padding:'12px 12px 32px'}}>
    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>{L.quests} و {L.events} فعال</div>
    <div style={{fontSize:11,color:C.sub,marginBottom:10}}>واقعی و لحظه‌ای — همین الان کافه‌دارها منتشرشون کردن</div>
    {/* راه مستقیم به صفحه‌ی کامل — قبلاً فقط از ته «رویدادهای داغ» داشبورد پیدا می‌شد */}
    <a href={ROUTE.quests} className="tl-press" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:C.accent,color:onColor(C.accent),borderRadius:12,padding:'10px',fontSize:12.5,fontWeight:800,textDecoration:'none',marginBottom:14}}>
      {ICON.quests} مشاهده‌ی کامل {L.quests} و {L.events} ‹
    </a>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {quests.map(q=>{
        const prog=progress[q.id]
        const cur=prog?prog.progress:0
        const isDone=!!(prog&&prog.completed)
        const pct=Math.min(100,Math.round((cur/(q.target_count||1))*100))
        const red=redemptions[q.id]
        const cafeName=q.cafes?q.cafes.name:'کافه'
        return <div key={q.id} style={{background:isDone?C.green+'18':C.card,border:'1px solid '+(isDone?C.green+'55':C.border),borderRadius:14,padding:12}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:isDone?C.green+'20':C.accent+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{isDone?'✅':(q.icon||'🎯')}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{q.title}</div>
                {q.reward_xp>0 && <div style={{fontSize:11,fontWeight:800,color:C.accent,flexShrink:0}}>+{q.reward_xp} XP</div>}
              </div>
              <div style={{fontSize:11,color:C.sub,marginTop:2}}>{cafeName}{q.cafes&&q.cafes.district?' · '+q.cafes.district:''}</div>
              {q.target_count>1 && <div style={{marginTop:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:10,color:isDone?C.green:C.sub,fontWeight:isDone?700:400}}>{isDone?'تکمیل شد! ✓':(cur+' از '+q.target_count)}</span>
                  <span style={{fontSize:10,color:C.sub}}>{pct}%</span>
                </div>
                <div style={{height:5,background:C.chip,borderRadius:99,overflow:'hidden'}}>
                  <div className="mission-bar" style={{height:'100%',width:pct+'%',background:isDone?'linear-gradient(90deg,'+C.green+',#5AC96C)':'linear-gradient(90deg,'+C.accent+','+C.accent+'aa)',borderRadius:99}}/>
                </div>
              </div>}
            </div>
          </div>
          {isDone
            ? <div style={{marginTop:10,background:C.green+'15',border:'1px dashed '+C.green,borderRadius:10,padding:'8px 10px',textAlign:'center'}}>
                <span style={{fontSize:11.5,color:C.green,fontWeight:800}}>🎁 {q.reward_label}{red?' — کد: '+red.code:''}</span>
              </div>
            : <button onClick={()=>openCafe(q)} style={{marginTop:10,width:'100%',background:C.accent,border:'none',borderRadius:10,padding:'8px',fontSize:12,color:onColor(C.accent),fontWeight:700,fontFamily:'inherit'}}>📍 برو به {cafeName} و چک‌این کن</button>}
        </div>
      })}
    </div>
  </div>
}
