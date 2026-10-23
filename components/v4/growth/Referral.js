'use client'
// ─────────────────────────────────────────────────────────────
//  دعوت دوست — نسخه v4.0
//  پیوند دعوت همان‌جا دیده می‌شود و با یک ضربه فرستاده یا کپی می‌شود؛ لازم نیست پنجره دیگری باز شود.
//  کد از تابع my_referral می‌آید و چند دقیقه در حافظه می‌ماند. مقدار جایزه هم از همان تابع می‌آید،
//  پس اگر جایزه در سرور عوض شود، همه نوشته‌ها خودکار درست می‌شوند.
//  قاعده‌های ضدتقلب در سرور است: claim_referral. از 23 اکتبر 2026 جایزه همان لحظه ثبت‌نام به هر دو نفر می‌رسد
//  و دعوت‌کننده با 1، 3، 5، 10 و 25 دعوت موفق نشان پله‌ای می‌گیرد — lib/growth/referralTiers.js
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/game/gameSystem'
import { inviteLink } from '@/lib/growth/entry'
import { rpc } from '@/lib/profile/people'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Stat } from '@/components/v4/kit/kit'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { ReferralTierRow } from '@/components/v4/growth/ReferralBadge'

const fa = (n) => Number(n || 0).toLocaleString('fa')
let cache = null, cacheAt = 0, inflight = null
const BUST = 'tl-referral-bust'

// کارت دعوت را همه‌جا تازه می‌کند؛ مثلاً وقتی دوستی با پیوند آمد
export function bustReferral() {
  cache = null; cacheAt = 0
  try { window.dispatchEvent(new Event(BUST)) } catch (e) {}
}

function loadReferral() {
  if (!inflight) {
    inflight = rpc('my_referral', {}).then(r => {
      inflight = null
      cache = r && r.ok ? r : { ok: false, error: (r && r.error) || 'network' }
      cacheAt = Date.now()
      return cache
    })
  }
  return inflight
}

export function useReferral(enabled = true) {
  const [d, setD] = useState(cache)
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    const f = () => setNonce(n => n + 1)
    window.addEventListener(BUST, f)
    return () => window.removeEventListener(BUST, f)
  }, [])
  useEffect(() => {
    if (!enabled) return
    let alive = true
    const s = getSession()
    if (!s || !s.access_token) { setD({ ok: false, error: 'auth' }); return }
    if (cache && cache.ok && Date.now() - cacheAt < 5 * 60e3) { setD(cache); return }
    if (cache && !cache.ok) cache = null
    loadReferral().then(v => { if (alive) setD(v) })
    return () => { alive = false }
  }, [enabled, nonce])
  const retry = () => { cache = null; cacheAt = 0; setD(null); setNonce(n => n + 1) }
  return d ? { ...d, retry } : d
}

export const inviteText = (reward) => 'بیا با هم کافه‌ها را روی نقشه TwinLand بگردیم. با این پیوند ثبت‌نام کن تا همان لحظه هر دو ' + fa(reward || 150) + ' امتیاز بگیریم:'

export function inviteHeadline(reward) {
  return 'دوستت را دعوت کن و هر دو ' + fa(reward || 150) + ' امتیاز بگیرید'
}

async function shareInvite(link, reward, showToast) {
  const text = inviteText(reward)
  track('invite_share', { via: typeof navigator !== 'undefined' && navigator.share ? 'native' : 'copy', ui: 'v4' })
  try { if (navigator.share) { await navigator.share({ title: 'TwinLand', text, url: link }); return } } catch (e) { return }
  await copyInvite(link, reward, showToast)
}
async function copyInvite(link, reward, showToast) {
  try { await navigator.clipboard.writeText(inviteText(reward) + ' ' + link); showToast && showToast('پیوند دعوت کپی شد') }
  catch (e) { showToast && showToast('کپی نشد؛ پیوند را نگه دار و دستی کپی کن', 'warn') }
}

// ردیف پیوند: آدرس دعوت، دکمه کپی و دکمه ارسال
export function ReferralLink({ d, showToast, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  if (!d || !d.ok) return null
  const link = inviteLink(d.code)
  const shown = link.replace(/^https?:\/\//, '')
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...style }}>
      <button type="button" className="tl4-press" onClick={() => copyInvite(link, d.reward, showToast)} aria-label={'کپی پیوند دعوت ' + shown}
        style={{ flex: 1, minWidth: 0, height: 42, borderRadius: R.box, border: '1px dashed ' + T.hairStrong, background: T.chip, color: C.text, fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 12.5, fontWeight: 700, direction: 'ltr', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', cursor: 'pointer' }}>
        <Icon name="link" size={16} color={C.sub} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{shown}</span>
        <Icon name="copy" size={16} />
      </button>
      <Btn icon="share" onClick={() => shareInvite(link, d.reward, showToast)} C={C} T={T}>ارسال</Btn>
    </div>
  )
}

// کارت کامل دعوت: عنوان با مقدار جایزه، توضیح کوتاه و پیوند
export function ReferralInline({ showToast, compact = false, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const d = useReferral(true)
  // حساب کسب‌وکار کد دعوت ندارد؛ برای خطای دیگر کارت خالی نمی‌ماند و دکمه دوباره دارد
  if (d && !d.ok && (d.error === 'business' || d.error === 'auth')) return null
  if (d && !d.ok) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
        <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="gift" size={18} /></span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: C.sub, lineHeight: 1.8 }}>پیوند دعوت گرفته نشد.</div>
        <Btn kind="ghost" size="sm" icon="refresh" onClick={d.retry} C={C} T={T}>دوباره</Btn>
      </div>
    )
  }
  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="gift" size={18} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.text, lineHeight: 1.6 }}>{inviteHeadline(d && d.reward)}</div>
          {!compact && <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.7 }}>دوستت که با پیوند تو ثبت‌نام کند، همان لحظه جایزه به هر دو نفر می‌رسد.</div>}
        </div>
      </div>
      {d ? <ReferralLink d={d} showToast={showToast} C={C} T={T} /> : <div style={{ height: 42, borderRadius: R.box, background: T.chip, animation: 'tl4Pulse 1.4s ease-in-out infinite' }} />}
      {d && d.invited > 0 && (
        <div style={{ fontSize: 11, color: C.sub, marginTop: 8 }}>
          {fa(d.invited)} نفر با پیوندت آمده‌اند{d.rewarded ? ' · ' + fa(d.rewarded) + ' جایزه گرفته‌ای' : ''}
        </div>
      )}
    </div>
  )
}

// پنجره دعوت از منو؛ همان محتوا با کد بزرگ و شمار دعوت‌ها
export function ReferralSheetV4({ open = true, onClose, showToast }) {
  const { C, T } = useV4()
  const d = useReferral(open)
  useEffect(() => { if (open) track('invite_open', { ui: 'v4' }) }, [open])
  const err = d && !d.ok ? (d.error === 'business' ? 'حساب کسب‌وکار کد دعوت ندارد' : d.error === 'auth' ? 'برای دعوت اول وارد شو' : 'کد دعوت گرفته نشد؛ دوباره امتحان کن') : ''
  return (
    <SheetV4 open={open} onClose={onClose} title="دعوت دوست" icon="gift" maxWidth={480}>
      <div style={{ fontSize: 13, lineHeight: 2, color: C.sub, marginBottom: 14 }}>
        {inviteHeadline(d && d.reward)}. دوستت با پیوند تو ثبت‌نام می‌کند و همان لحظه جایزه به هر دو نفر می‌رسد. هر چه دوستان بیشتری بیایند، نشان دعوتت ارزشمندتر می‌شود.
      </div>
      {err && <div style={{ fontSize: 13, color: C.text, textAlign: 'center', padding: 12, borderRadius: R.box, background: T.chip }}>{err}</div>}
      {!err && !d && <div style={{ height: 120, borderRadius: R.box, background: T.chip, animation: 'tl4Pulse 1.4s ease-in-out infinite' }} />}
      {d && d.ok && <>
        <div style={{ borderRadius: R.box, padding: 16, textAlign: 'center', background: T.chip, border: '1px dashed ' + T.hairStrong, marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>کد دعوت تو</div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, direction: 'ltr', marginTop: 4, fontFamily: 'ui-monospace, Menlo, monospace' }}>{d.code}</div>
        </div>
        <ReferralLink d={d} showToast={showToast} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 14 }}>
          <Stat value={Number(d.invited) || 0} label="دوست آمده" />
          <Stat value={(Number(d.rewarded) || 0) * (Number(d.reward) || 150)} label="امتیاز دعوت" />
        </div>
        <div style={{ marginTop: 14, padding: '12px 8px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
          <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 10, textAlign: 'center' }}>نشان‌های دعوت</div>
          <ReferralTierRow count={Number(d.invited) || 0} size={50} />
        </div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.9, marginTop: 12 }}>کد فقط برای حساب‌های تازه کار می‌کند و جایزه همان لحظه ثبت‌نام به هر دو نفر داده می‌شود. هر ۳۰ روز حداکثر ۲۰ جایزه دعوت.</div>
      </>}
    </SheetV4>
  )
}
