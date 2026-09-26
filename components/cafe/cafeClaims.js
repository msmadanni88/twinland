'use client'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

// ── CAFE POPUP ────────────────────────────────────────────────────────────────
// ── مدیریت مستقیم توسط صاحب اپ (بدون تأیید) ──────────────────────────────────
export async function ownerClaimDirect(cafe, showToast){
  const s=getSession(); const token=(s&&s.access_token)||SB_KEY; const uid=s&&s.user&&s.user.id
  if(!uid){ showToast('اول وارد شو'); return }
  try{
    const res=await fetch(SB_URL+'/rest/v1/rpc/owner_claim_direct',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_cafe_id:cafe.id})
    }).then(r=>r.json())
    const row=Array.isArray(res)?res[0]:res
    if(row&&row.ok){ showToast('✅ این کافه به پنل کافه‌دارت اضافه شد! برو /business'); }
    else if(row&&row.error==='not_owner'){ showToast('این قابلیت فقط برای صاحب اپه') }
    else { showToast('خطا: '+((row&&row.error)||'نامشخص')) }
  }catch(e){ showToast('خطا در ارتباط') }
}

// ── claim کردن کافه توسط صاحب احتمالی ────────────────────────────────────────
export async function claimCafe(cafe, showToast){
  const note=typeof window!=='undefined'?window.prompt('برای تأیید مالکیت، یه توضیح کوتاه بنویس (مثلاً نام روی پروانه کسب، شماره تماس کافه):'):''
  if(note===null) return  // لغو
  const s=getSession(); const token=(s&&s.access_token)||SB_KEY; const uid=s&&s.user&&s.user.id
  if(!uid){ showToast('اول وارد شو'); return }
  try{
    const res=await fetch(SB_URL+'/rest/v1/rpc/claim_cafe',{
      method:'POST',
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_cafe_id:cafe.id,p_note:note||null})
    }).then(r=>r.json())
    const row=Array.isArray(res)?res[0]:res
    if(row&&row.ok){ showToast('✅ درخواست ثبت شد. بعد از تأیید ادمین فعال می‌شه.') }
    else if(row&&row.error==='already_owned'){ showToast('این کافه قبلاً صاحب تأییدشده داره') }
    else if(row&&row.error==='already_claimed_by_you'){ showToast('قبلاً درخواست دادی، منتظر تأییده') }
    else if(row&&row.error==='claim_pending_other'){ showToast('یه نفر دیگه هم درخواست داده، در حال بررسیه') }
    else { showToast('خطا در ثبت درخواست') }
  }catch(e){ showToast('خطا در ارتباط') }
}
