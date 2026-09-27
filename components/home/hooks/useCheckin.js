'use client'
// چک‌این با بررسی موقعیت در سرور، و داده‌ی انیمیشن جشن بعد از آن — جداشده از TwinLand.js
import { useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getLevelInfo } from '@/lib/game/gameSystem'
import { getUserPosition } from '@/lib/geo'

export function useCheckin({ checkedIn, effAdmin, freshToken, isOwner, session, setCheckedIn, setCoins, setSelCafe, setStreak, setXp, showToast, xp }) {
  const [celebration, setCelebration] = useState(null)          // دیتای انیمیشن جشن بعد از چک‌این

  async function doCheckin(cafe){
    if(!effAdmin && checkedIn.has(cafe.id)){ showToast('قبلاً اینجا بودی!','warn'); return }
    if(!session||!session.access_token){ showToast('اول وارد شو','warn'); return }
    setSelCafe(null)
    const prevLevel=getLevelInfo(xp).current.level
    // ── موقعیت کاربر ──
    // سرور فاصله‌ی کاربر تا کافه را می‌سنجد و بیشتر از 200 متر را قبول نمی‌کند.
    // مالک اپ برای تست معاف است، پس اگر موقعیتش پیدا نشد بدون مختصات ادامه می‌دهد.
    showToast('📍 در حال پیدا کردن موقعیتت…')
    const pos=await getUserPosition()
    if(pos.error && !isOwner){
      showToast(pos.error==='denied'?'برای چک‌این باید اجازه‌ی موقعیت مکانی را بدهی'
        :pos.error==='unsupported'?'این مرورگر موقعیت مکانی را پشتیبانی نمی‌کند'
        :'موقعیتت پیدا نشد — GPS گوشی را روشن کن و دوباره امتحان کن','warn')
      return
    }
    const body={p_cafe_id:cafe.id}
    if(!pos.error){ body.p_lat=pos.lat; body.p_lng=pos.lng; body.p_accuracy=Math.round(pos.accuracy||0) }
    const token=await freshToken()
    let res=null
    try{
      res=await fetch(SB_URL+'/rest/v1/rpc/do_checkin',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify(body)
      }).then(r=>r.json())
    }catch(e){ res=null }
    if(!res||!res.ok){
      const err=res&&res.error
      if(err==='cooldown') showToast('همین الان اینجا چک‌این کردی!','warn')
      else if(err==='too_far') showToast('برای چک‌این باید در کافه باشی — الان حدود '+Number(res.distance_m||0).toLocaleString('fa')+' متر فاصله داری'+((pos.accuracy||0)>100?'؛ GPS را روشن کن':''),'warn')
      else if(err==='location_required'||err==='invalid_location') showToast('موقعیتت درست خوانده نشد — دوباره امتحان کن','warn')
      else if(err==='not_authenticated'||(res&&res.code==='PGRST301')) showToast('نشستت منقضی شد، یه‌بار خروج و ورود کن','warn')
      else showToast('چک‌این نشد: '+((res&&(res.message||res.error))||'خطای ناشناخته'),'warn')
      return
    }
    setXp(res.xp); setStreak(res.streak); setCoins(res.coins)
    setCheckedIn(prev=>new Set([...prev,cafe.id]))

    // ── انیمیشن جشن تمام‌صفحه ────────────────────────────────────────────────
    // به‌جای toastهای پراکنده، همه‌ی نتیجه‌ی چک‌این (XP، استریک، کافه‌ی جدید،
    // رویدادهای تکمیل‌شده، آیتم کلکسیونی، رتبه) یک‌جا توی کارت جشن نشون داده
    // می‌شه. ثبتِ واقعی همه‌چیز سمت سرور داخل do_checkin انجام شده — این فقط
    // نمایشه؛ اگه مرورگر همین‌جا قطع بشه چیزی از دست نمی‌ره (نوتیف جبران می‌کنه).
    const lvlInfo=getLevelInfo(res.xp)
    setCelebration({
      awarded: res.awarded||0,
      levelUp: res.level>prevLevel,
      levelName: lvlInfo.current.name,
      levelIcon: lvlInfo.current.icon,
      levelColor: lvlInfo.current.color,
      streak: res.streak||0,
      isNewCafe: !!res.is_new_cafe,
      cafeName: cafe.name,
      district: res.district||null,
      rank: res.rank||null,
      quests: Array.isArray(res.completed_quests)?res.completed_quests:[],
    })
  }
  return { celebration, doCheckin, setCelebration }
}
