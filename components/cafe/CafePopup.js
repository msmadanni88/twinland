'use client'
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { onColor } from '@/lib/theme/ui'
import { getSession, subscribeToChanges, subscribeToTables } from '@/lib/game/gameSystem'
import { claimCafe, ownerClaimDirect } from '@/components/cafe/cafeClaims'
import { XP_CONFIG, getColor } from '@/lib/constants'
import { CafeGallery } from '@/components/cafe/CafeGallery'
import { CafeMenu } from '@/components/cafe/CafeMenu'
import { CafeMyRewards } from '@/components/cafe/CafeMyRewards'

// صفحه‌های پنجره‌ی کافه. «درباره» همان محتوای قبلی است؛ بقیه فقط با باز شدن بار می‌شوند.
const CAFE_PAGES = [['about','درباره'],['gallery','گالری'],['menu','منو'],['rewards','جایزه‌های من']]

export function CafePopup({C,cafe,live,favs,setFavs,checkedIn,isAdmin,onClose,onCheckin,showToast}) {
  const color=getColor(cafe.name); const isChecked=checkedIn.has(cafe.id); const isFav=favs.has(cafe.id)
  // صفحه‌ی پهن (دسکتاپ/مانیتور) → مودال وسط‌چین به‌جای شیتِ تمام‌عرض
  const [isWide,setIsWide]=useState(false)
  useEffect(()=>{
    const check=()=>setIsWide(typeof window!=='undefined' && window.innerWidth>=760)
    check(); window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[])
  const xpAmount=cafe.is_top?XP_CONFIG.checkin_top:XP_CONFIG.checkin
  const [cafeEvents,setCafeEvents]=useState([])
  const [evLoading,setEvLoading]=useState(true)
  const [evProgress,setEvProgress]=useState({})   // quest_id -> progress row
  const [joiningId,setJoiningId]=useState(null)
  const sess=getSession()
  const uid=sess&&sess.user&&sess.user.id
  const [page,setPage]=useState('about')
  useEffect(()=>{ setPage('about') },[cafe.id])

  useEffect(()=>{
    let alive=true
    const h={apikey:SB_KEY,Authorization:'Bearer '+((sess&&sess.access_token)||SB_KEY)}
    const loadEvents=()=>{
      fetch(SB_URL+'/rest/v1/quests?cafe_id=eq.'+cafe.id+'&active=eq.true&or=(ends_at.is.null,ends_at.gt.'+new Date().toISOString()+')&select=id,title,icon,reward_label,reward_xp,discount_pct,target_count,collectible_defs(icon,title,rarity)&order=created_at.desc&limit=6',{headers:h})
        .then(r=>r.json()).then(rows=>{ if(alive) setCafeEvents(Array.isArray(rows)?rows:[]) }).catch(()=>{})
        .finally(()=>{ if(alive) setEvLoading(false) })
      if(uid){
        fetch(SB_URL+'/rest/v1/quest_progress?user_id=eq.'+uid+'&select=quest_id,progress,completed',{headers:h})
          .then(r=>r.json()).then(rows=>{ if(!alive)return; const m={}; (Array.isArray(rows)?rows:[]).forEach(p=>{m[p.quest_id]=p}); setEvProgress(m) }).catch(()=>{})
      }
    }
    setEvLoading(true)
    loadEvents()
    const unsubLight=subscribeToChanges(['quests'],()=>loadEvents())
    let unsubPersonal=()=>{}
    if(uid){
      unsubPersonal=subscribeToTables([{table:'quest_progress',event:'*',filter:'user_id=eq.'+uid}],()=>loadEvents())
    }
    return ()=>{ alive=false; unsubLight(); unsubPersonal() }
  },[cafe.id,uid])

  async function joinEvent(ev){
    if(!sess||!sess.access_token){ showToast('اول وارد شو','warn'); return }
    setJoiningId(ev.id)
    const res=await fetch(SB_URL+'/rest/v1/rpc/join_quest',{
      method:'POST',
      headers:{apikey:SB_KEY,Authorization:'Bearer '+sess.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({p_quest_id:ev.id})
    }).then(r=>r.json()).catch(()=>null)
    setJoiningId(null)
    // شرکت = فقط ثبت‌نام. جایزه فقط با چک‌این واقعی در خود کافه باز می‌شه.
    if(res&&res.ok){
      if(res.already_completed){ showToast('این رویداد رو قبلاً کامل کردی ✅','warn') }
      else{
        const left=Math.max(0,(res.target||1)-(res.progress||0))
        showToast('🎯 ثبت شد! برای گرفتن جایزه برو به کافه و چک‌این کن'+(left>1?(' — '+left.toLocaleString('fa')+' بار'):''),'xp')
        setEvProgress(prev=>({...prev,[ev.id]:{quest_id:ev.id,progress:res.progress||0,completed:false}}))
      }
    }else{
      const em={quest_not_active:'این رویداد دیگه فعال نیست',not_new_customer:'این رویداد فقط مخصوص مشتری‌های جدیده',quest_full:'ظرفیت جایزه‌های این رویداد تموم شده',not_authenticated:'اول وارد شو'}
      showToast(em[res&&res.error]||'خطا در شرکت','warn')
    }
  }
  // ── ابعاد ─────────────────────────────────────────────────────────────
  // موبایل: شیت از پایین (مثل قبل).
  // دسکتاپ/مانیتور بزرگ: مودال وسط‌چین با عرض ثابت — قبلاً تمام عرض صفحه رو
  // می‌گرفت و روی مانیتور بزرگ بی‌قواره می‌شد.
  const sheetStyle = isWide
    ? {position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,440px)',maxHeight:'86dvh',overflowY:'auto',background:C.card,borderRadius:24,border:'1px solid '+C.border,boxShadow:'0 24px 70px rgba(0,0,0,.4)',animation:'cpZoom .28s cubic-bezier(.2,.9,.3,1)'}
    : {position:'absolute',bottom:0,left:0,right:0,maxHeight:'88dvh',overflowY:'auto',background:C.card,borderRadius:'24px 24px 0 0',border:'1px solid '+C.border,borderBottom:'none',animation:'slideUp .3s ease'}

  return <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.45)',backdropFilter:'blur(10px)'}} onClick={onClose}>
    <div onClick={(e)=>e.stopPropagation()} style={sheetStyle}>
      {isWide
        ? <button onClick={onClose} style={{position:'sticky',top:10,float:'left',marginRight:10,marginTop:10,zIndex:5,background:C.chip,border:'none',borderRadius:99,width:32,height:32,fontSize:15,color:C.text,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
        : <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:'14px auto'}}/>}
      <div style={{padding:'0 18px 16px',display:'flex',alignItems:'center',gap:14,borderBottom:'1px solid '+C.border}}>
        <div style={{width:60,height:60,borderRadius:18,background:color+'18',border:'2.5px solid '+(isChecked?C.green:color)+'66',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0}}>{isChecked?'✅':'☕'}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:19,fontWeight:800,color:C.text}}>{cafe.name}</div>
          <div style={{fontSize:12,color:C.accent,marginTop:3}}>📍 {cafe.description}</div>
          <div style={{color:'#FF9500',fontSize:14,marginTop:3}}>{cafe.is_top?'★★★★★':'★★★☆☆'}</div>
        </div>
        <div style={{textAlign:'center',flexShrink:0}}>
          <div style={{fontSize:26,fontWeight:900,color:C.green}}>{live[cafe.id]||0}</div>
          <div style={{fontSize:9,color:C.sub,marginTop:1}}>الان اینجا</div>
        </div>
      </div>
      {/* صفحه‌های پنجره‌ی کافه */}
      <div style={{display:'flex',gap:6,padding:'12px 18px 0',overflowX:'auto'}}>
        {CAFE_PAGES.map(([k,label])=>(
          <button key={k} onClick={()=>setPage(k)} style={{flexShrink:0,padding:'7px 13px',borderRadius:10,border:'none',background:page===k?C.accent:C.chip,color:page===k?onColor(C.accent):C.sub,fontSize:12,fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>{label}</button>
        ))}
      </div>
      <div style={{padding:'16px 18px'}}>
        {page==='gallery'&&<div style={{marginBottom:14}}><CafeGallery C={C} cafeId={cafe.id} canManageHint={isAdmin}/></div>}
        {page==='menu'&&<div style={{marginBottom:14}}><CafeMenu C={C} cafeId={cafe.id} canManageHint={isAdmin}/></div>}
        {page==='rewards'&&<div style={{marginBottom:14}}><CafeMyRewards C={C} cafeId={cafe.id} uid={uid} token={sess&&sess.access_token} showToast={showToast}/></div>}
        {page==='about'&&<>
        {cafe.tags?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>{cafe.tags.map((t)=><span key={t} style={{background:C.chip,borderRadius:99,fontSize:11,color:C.text,padding:'3px 11px',fontWeight:500}}>{t}</span>)}</div>}

        {/* رویدادها/آیتم‌های فعال این کافه — واقعی، لحظه‌ای و قابل شرکت */}
        {!evLoading&&cafeEvents.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11.5,fontWeight:700,color:C.sub,marginBottom:8}}>🎉 رویدادهای فعال این کافه</div>
            {cafeEvents.map(ev=>{
              const cd=ev.collectible_defs
              const prog=evProgress[ev.id]
              const joined=!!(prog&&prog.completed)
              const enrolled=!!prog&&!joined
              const busy=joiningId===ev.id
              return <div key={ev.id} style={{background:C.accentL,border:'1px solid '+C.accent+'44',borderRadius:14,padding:'11px 13px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22}}>{(cd&&cd.icon)||ev.icon||'🎉'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.text}}>{ev.title}{cd?' — '+cd.title:''}</div>
                    <div style={{fontSize:11,color:C.sub,marginTop:2}}>🎁 {ev.reward_label}{ev.reward_xp>0?' · +'+ev.reward_xp+' XP':''}{ev.discount_pct>0?' · 🏷️'+ev.discount_pct+'٪':''}</div>
                  </div>
                </div>
                <button onClick={()=>joinEvent(ev)} disabled={joined||enrolled||busy} style={{width:'100%',marginTop:9,background:joined?C.green:enrolled?C.chip:C.accent,color:joined?onColor(C.green):enrolled?C.text:onColor(C.accent),border:'none',borderRadius:10,padding:'8px',fontSize:12,fontWeight:800,fontFamily:'inherit',opacity:busy?.6:1}}>
                  {joined?'✅ جایزه‌ت رو گرفتی'
                    :enrolled?('📍 ثبت‌نام شدی — چک‌این '+(prog.progress||0).toLocaleString('fa')+' از '+(ev.target_count||1).toLocaleString('fa'))
                    :busy?'...':'🎯 شرکت در رویداد'}
                </button>
              </div>
            })}
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
          {[['☕',isChecked?'رفتی!':'+'+xpAmount+' XP','چک‌این'],['⏰','۸ص–۱۰ش','ساعات'],['🏅',cafe.is_top?'طلایی':'نقره','رتبه']].map(([icon,val,lbl])=>(
            <div key={lbl} style={{background:C.chip,borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
              <div style={{fontSize:18}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:lbl==='چک‌این'&&isChecked?C.green:C.text,marginTop:4}}>{val}</div>
              <div style={{fontSize:9,color:C.sub,marginTop:2}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:14}}>
          {[{icon:'❤️',lbl:'علاقه',active:isFav,fn:async()=>{
            // آپدیت خوش‌بینانه + ثبت واقعی سمت سرور (جدول favorites)
            const wasFav=isFav
            const n=new Set(favs); wasFav?n.delete(cafe.id):n.add(cafe.id); setFavs(n)
            try{
              const r=await fetch(SB_URL+'/rest/v1/rpc/toggle_favorite',{
                method:'POST',
                headers:{apikey:SB_KEY,Authorization:'Bearer '+((sess&&sess.access_token)||SB_KEY),'Content-Type':'application/json'},
                body:JSON.stringify({p_cafe_id:cafe.id})
              }).then(x=>x.json())
              if(r&&r.ok){
                showToast(r.fav?('❤️ ذخیره شد — '+(r.count||1).toLocaleString('fa')+' نفر این کافه رو دوست دارن'):'از علاقه‌مندی‌ها حذف شد')
              }else{
                // سرور قبول نکرد → برگرد به حالت قبل
                const back=new Set(favs); wasFav?back.add(cafe.id):back.delete(cafe.id); setFavs(back)
                showToast(r&&r.error==='not_authenticated'?'اول وارد شو':'ثبت نشد، دوباره بزن','warn')
              }
            }catch(e){
              const back=new Set(favs); wasFav?back.add(cafe.id):back.delete(cafe.id); setFavs(back)
              showToast('خطا در ارتباط','warn')
            }
          }},{icon:'📤',lbl:'اشتراک',active:false,fn:()=>showToast('🔗 کپی شد!')},{icon:'🗺',lbl:'مسیر',active:false,fn:()=>window.open('https://www.google.com/maps?q='+cafe.lat+','+cafe.lng,'_blank')},{icon:'💬',lbl:'نظر',active:false,fn:()=>showToast('💬 به زودی!')}].map((item)=>(
            <button key={item.lbl} onClick={item.fn} style={{background:item.active?C.accent+'18':C.chip,border:'1.5px solid '+(item.active?C.accent:'transparent'),borderRadius:12,padding:'9px 4px',color:C.text,fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:20}}>{item.icon}</span>
              <span style={{fontSize:9,color:item.active?C.accent:C.sub,fontWeight:item.active?700:400}}>{item.lbl}</span>
            </button>
          ))}
        </div>
        </>}
        <button onClick={onCheckin} disabled={isChecked} style={{width:'100%',background:isChecked?C.green:C.accent,color:isChecked?'#fff':onColor(C.accent),border:'none',borderRadius:14,padding:15,fontSize:15,fontWeight:700,fontFamily:'inherit',boxShadow:'0 4px 18px '+(isChecked?C.green:C.accent)+'44',opacity:isChecked?.85:1,transition:'all .3s'}}>
          {isChecked?'✅ چک‌این شد!':'📍 چک‌این — +'+xpAmount+' XP'}
        </button>
        <button onClick={()=>isAdmin?ownerClaimDirect(cafe,showToast):claimCafe(cafe,showToast)} style={{width:'100%',marginTop:10,background:'transparent',color:C.sub,border:'1.5px dashed '+C.border,borderRadius:14,padding:12,fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>
          {isAdmin?'🏪 مدیریت مستقیم این کافه (صاحب اپ)':'🏪 صاحب این کافه هستید؟'}
        </button>
      </div>
    </div>
  </div>
}
