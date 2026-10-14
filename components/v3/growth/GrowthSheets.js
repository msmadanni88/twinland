'use client'
// دو برگه کوچک که از منوی اصلی باز می‌شوند:
//  • دعوت دوست: کد و پیوند دعوت، اشتراک، و شمار دعوت‌ها. هر دو نفر بعد از اولین چک‌این واقعی دوست 150 امتیاز می‌گیرند.
//  • نصب و اعلان: نصب اپ روی صفحه اصلی گوشی، و روشن کردن اعلان روی گوشی وقتی سرور آماده باشد.
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { inviteLink } from '@/lib/growth/entry'
import { canPromptInstall, isIOS, isStandalone, onPwaChange, promptInstall, pushDisable, pushEnable, pushState } from '@/lib/pwa/pwa'
import { track } from '@/lib/analytics'

const fa = (n) => Number(n || 0).toLocaleString('fa')

function Shell({ C, title, icon, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3100, background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label={title}
        style={{ width: 'min(480px, 100%)', maxHeight: '88dvh', overflowY: 'auto', boxSizing: 'border-box', background: C.card || C.bg, color: C.text, borderRadius: '24px 24px 0 0', padding: '18px 18px calc(22px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -10px 40px rgba(0,0,0,.25)', animation: 'fadeIn .2s ease', direction: 'rtl' }}>
        <div style={{ width: 42, height: 5, borderRadius: 9, background: C.border, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 26 }}>{icon}</span>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 900 }}>{title}</div>
          <button onClick={onClose} aria-label="بستن" style={{ width: 34, height: 34, borderRadius: 11, border: 'none', background: C.chip, color: C.text, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ReferralSheet({ C, onClose, showToast }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    const s = getSession()
    if (!s || !s.access_token) { setErr('برای دعوت اول وارد شو'); return }
    fetch(SB_URL + '/rest/v1/rpc/my_referral', { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => (r.ok ? r.json() : null))
      .then(r => { if (r && r.ok) setD(r); else setErr(r && r.error === 'business' ? 'حساب کسب‌وکار کد دعوت ندارد' : 'کد دعوت گرفته نشد؛ دوباره امتحان کن') })
      .catch(() => setErr('کد دعوت گرفته نشد؛ دوباره امتحان کن'))
    track('invite_open')
  }, [])
  const link = d ? inviteLink(d.code) : ''
  const text = 'بیا با هم کافه‌های تهران را روی نقشه TwinLand بگردیم. با این پیوند بیا و اولین چک‌اینت را بزن تا هر دو جایزه بگیریم:'
  async function share() {
    track('invite_share', { via: navigator.share ? 'native' : 'copy' })
    try { if (navigator.share) { await navigator.share({ title: 'TwinLand', text, url: link }); return } } catch (e) { return }
    copy()
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text + ' ' + link); showToast && showToast('پیوند دعوت کپی شد') } catch (e) { showToast && showToast('کپی نشد؛ پیوند را دستی بردار', 'warn') }
  }
  return (
    <Shell C={C} title="دعوت دوست" icon="🎁" onClose={onClose}>
      <div style={{ fontSize: 13.5, lineHeight: 2.1, color: C.sub, marginBottom: 14 }}>
        دوستت با پیوند تو ثبت‌نام کند و اولین چک‌این واقعی‌اش را در یک کافه بزند؛ آن وقت <b style={{ color: C.text }}>هر دو نفر ۱۵۰ امتیاز</b> می‌گیرید.
      </div>
      {err && <div style={{ fontSize: 13, color: C.danger || '#d03b3b', textAlign: 'center', padding: 12 }}>{err}</div>}
      {!err && !d && <div style={{ height: 120, borderRadius: 18, background: C.chip, opacity: 0.6 }} />}
      {d && <>
        <div style={{ borderRadius: 18, padding: 16, textAlign: 'center', background: 'linear-gradient(140deg, ' + C.accent + '22, transparent)', border: '1px dashed ' + C.accent }}>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>کد دعوت تو</div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, direction: 'ltr', marginTop: 4, fontFamily: 'ui-monospace, Menlo, monospace' }}>{d.code}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={share} style={{ flex: 1, height: 46, border: 'none', borderRadius: 14, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>اشتراک پیوند دعوت</button>
          <button onClick={copy} style={{ height: 46, padding: '0 16px', border: '1px solid ' + C.border, borderRadius: 14, background: C.chip, color: C.text, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>کپی</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[['دعوت‌شده', d.invited], ['جایزه گرفته', d.rewarded], ['منتظر چک‌این', d.pending]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, borderRadius: 14, background: C.chip, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{fa(v)}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginTop: 12 }}>کد فقط برای حساب‌های تازه کار می‌کند و جایزه بعد از چک‌این واقعی داخل کافه داده می‌شود. حداکثر ۲۰ جایزه دعوت در هر ۳۰ روز.</div>
      </>}
    </Shell>
  )
}

export function InstallSheet({ C, onClose, showToast }) {
  const [canInstall, setCanInstall] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [ios, setIos] = useState(false)
  const [push, setPush] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const sync = () => { setCanInstall(canPromptInstall()); setStandalone(isStandalone()) }
    sync(); setIos(isIOS())
    const off = onPwaChange(sync)
    pushState().then(setPush).catch(() => setPush({ supported: false }))
    track('install_open')
    return off
  }, [])
  async function install() {
    const r = await promptInstall()
    track('install_prompt', { outcome: r })
    if (r === 'accepted') showToast && showToast('TwinLand روی گوشی نصب شد 🎉')
  }
  async function togglePush() {
    const s = getSession()
    if (!s || !s.access_token) return
    setBusy(true)
    const r = push && push.on ? await pushDisable(s.access_token) : await pushEnable(s.access_token)
    setBusy(false)
    track('push_toggle', { on: !(push && push.on), ok: !!(r && r.ok) })
    if (r && r.ok) { showToast && showToast(push && push.on ? 'اعلان روی گوشی خاموش شد' : 'اعلان روی گوشی روشن شد') }
    else if (r && r.error === 'denied') showToast && showToast('اجازه اعلان داده نشد. از تنظیمات مرورگر می‌شود روشنش کرد', 'warn')
    else showToast && showToast('اعلان روشن نشد؛ دوباره امتحان کن', 'warn')
    pushState().then(setPush).catch(() => {})
  }
  const step = { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 2, marginBottom: 6 }
  const num = { width: 24, height: 24, flexShrink: 0, borderRadius: 8, background: C.accent + '22', color: C.accent, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginTop: 4 }
  return (
    <Shell C={C} title="نصب روی گوشی" icon="📲" onClose={onClose}>
      {standalone ? (
        <div style={{ fontSize: 13.5, lineHeight: 2, color: C.sub, background: C.chip, borderRadius: 14, padding: 12 }}>TwinLand همین الان به شکل اپ روی این دستگاه باز است ✓</div>
      ) : canInstall ? (
        <>
          <div style={{ fontSize: 13.5, lineHeight: 2, color: C.sub, marginBottom: 12 }}>با یک لمس، TwinLand مثل یک اپ روی صفحه اصلی گوشی می‌نشیند و تمام‌صفحه باز می‌شود.</div>
          <button onClick={install} style={{ width: '100%', height: 48, border: 'none', borderRadius: 14, background: C.accent, color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>نصب TwinLand</button>
        </>
      ) : ios ? (
        <div>
          <div style={step}><span style={num}>۱</span><span>پایین صفحه در Safari دکمه اشتراک را بزن؛ مربعی با فلش رو به بالا</span></div>
          <div style={step}><span style={num}>۲</span><span>در فهرست، «Add to Home Screen» یا «افزودن به صفحه اصلی» را بزن</span></div>
          <div style={step}><span style={num}>۳</span><span>بالای صفحه «Add» را بزن تا آیکن TwinLand روی صفحه اصلی بیاید</span></div>
        </div>
      ) : (
        <div>
          <div style={step}><span style={num}>۱</span><span>منوی سه‌نقطه مرورگر را باز کن</span></div>
          <div style={step}><span style={num}>۲</span><span>«نصب برنامه» یا «افزودن به صفحه اصلی» را بزن</span></div>
        </div>
      )}

      {push && push.supported && push.ready && (
        <div style={{ marginTop: 18, borderTop: '1px solid ' + C.border, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>اعلان روی گوشی</div>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.8 }}>جایزه، جواب کافه به نظرت، لیگ هفتگی و ماموریت تازه</div>
            </div>
            <button onClick={togglePush} disabled={busy} aria-pressed={!!push.on}
              style={{ position: 'relative', width: 50, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0, background: push.on ? '#10b981' : C.chip, opacity: busy ? 0.6 : 1 }}>
              <span style={{ position: 'absolute', top: 3, right: push.on ? 25 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'right .25s ease' }} />
            </button>
          </div>
          {ios && !standalone && <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.8, marginTop: 8 }}>در آیفون، اعلان فقط بعد از نصب روی صفحه اصلی کار می‌کند.</div>}
        </div>
      )}
    </Shell>
  )
}
