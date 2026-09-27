'use client'
// ابزارهای مالک اپ و حساب کاربر: پرکردن منطقه‌ها، XP مخفی، حالت نمایش، ریست حساب — جداشده از TwinLand.js
import { useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

export function useOwnerTools({ freshToken, session, setViewAsUser, setXp, showToast, viewAsUser }) {
  // ── ادمین: پرکردن district همه‌ی کافه‌های بدون منطقه (point-in-polygon) ──────
  const [backfilling,setBackfilling]=useState(false)
  async function backfillDistricts(){
    if(backfilling) return
    // منطقه‌ی هر کافه رو خود دیتابیس با PostGIS حساب می‌کنه (تریگر trg_cafe_district).
    // این دکمه فقط از سرور می‌خواد کافه‌های بدون منطقه رو دوباره حساب کنه — فقط برای مالک اپ.
    setBackfilling(true)
    try{
      const token=await freshToken()
      const r=await fetch(SB_URL+'/rest/v1/rpc/admin_backfill_districts',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:'{}'
      }).then(x=>x.json())
      if(r&&r.ok){
        const missing=r.still_missing||0
        showToast(missing===0
          ?'همه‌ی کافه‌ها منطقه دارن ✅'
          :('✅ بررسی شد — '+missing.toLocaleString('fa')+' کافه بیرون از مرز مناطق تهرانه'))
      }else{
        showToast(r&&r.error==='not_owner'?'این ابزار فقط برای مالک اپه':'خطا در پردازش','warn')
      }
    }catch(e){ showToast('خطا در پردازش','warn') }
    setBackfilling(false)
  }

  async function claimSecretXP(){
    const s=getSession(); const token=s&&s.access_token; const uid=s&&s.user&&s.user.id
    if(!uid) return
    try{
      const res=await fetch(SB_URL+'/rest/v1/rpc/claim_secret_xp',{
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+(token||SB_KEY),'Content-Type':'application/json'},
        body:'{}'
      }).then(r=>r.json())
      const row=Array.isArray(res)?res[0]:res
      if(row&&row.ok){
        if(row.xp!=null) setXp(row.xp)
        showToast('🧠 آفرین زرنگ! ۱۰۰ XP گرفتی!')
      } else if(row&&row.error==='already_claimed'){
        showToast('🎁 قبلاً جایزه‌ی زرنگ رو گرفتی!')
      } else {
        showToast('یه مشکلی پیش اومد')
      }
    }catch(e){ showToast('یه مشکلی پیش اومد') }
  }

  async function toggleViewMode(){
    const next=!viewAsUser
    setViewAsUser(next)   // فوری اعمال شه، سرور پشتش تایید می‌کنه
    try{
      const sess=getSession()
      const r=await fetch(SB_URL+'/rest/v1/rpc/set_view_mode',{
        method:'POST',
        headers:{apikey:SB_KEY,Authorization:'Bearer '+((sess&&sess.access_token)||SB_KEY),'Content-Type':'application/json'},
        body:JSON.stringify({p_user_view:next})
      }).then(x=>x.json())
      if(!(r&&r.ok)){
        setViewAsUser(!next)   // سرور قبول نکرد → برگرد
        showToast(r&&r.error==='not_owner'?'این قابلیت فقط برای مالک اپه':'ثبت نشد','warn')
      }else{
        showToast(next?'👤 حالا سایت رو مثل یه کاربر عادی می‌بینی':'👑 برگشتی به حالت مالک')
      }
    }catch(e){ setViewAsUser(!next); showToast('خطا در ارتباط','warn') }
  }

  async function resetMe(){
    if(!session||!session.access_token) return
    if(typeof window!=='undefined' && !window.confirm('کل پروفایلت به حالت تازه‌وارد برمی‌گرده و همه‌ی XP، مدال، کلکسیون، رویداد، نوتیف و تاریخچه‌ات پاک می‌شه. مطمئنی؟')) return
    const token=await freshToken()
    try{
      const r=await fetch(SB_URL+'/rest/v1/rpc/reset_me',{method:'POST',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:'{}'}).then(r=>r.json())
      if(r&&r.ok){
        showToast('حساب ریست شد ♻️ در حال تازه‌سازی…','xp')
        // رفرش کامل صفحه تا همه‌ی بخش‌ها (مدال، کلکسیون، نوتیف، پروفایل) از نو و خالی لود بشن
        setTimeout(()=>{ if(typeof window!=='undefined') window.location.reload() }, 900)
      }
      else showToast('ریست نشد'+(r&&r.error?': '+r.error:''),'warn')
    }catch(e){ showToast('ریست نشد','warn') }
  }
  return { backfillDistricts, backfilling, claimSecretXP, resetMe, toggleViewMode }
}
