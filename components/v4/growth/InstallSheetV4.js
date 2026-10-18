'use client'
// نصب روی گوشی و اعلان — نسخه v4.0: همان رفتار InstallSheet نسخه v3.0 با قاب برگه و کیت v4
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/game/gameSystem'
import { canPromptInstall, isIOS, isStandalone, onPwaChange, promptInstall, pushDisable, pushEnable, pushState } from '@/lib/pwa/pwa'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Toggle } from '@/components/v4/kit/kit'
import { SheetV4 } from '@/components/v4/ui/Sheet'

export function InstallSheetV4({ onClose, showToast }) {
  const { C, T } = useV4()
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
    track('install_open', { ui: 'v4' })
    return off
  }, [])
  async function install() {
    const r = await promptInstall()
    track('install_prompt', { outcome: r })
    if (r === 'accepted') showToast && showToast('TwinLand روی گوشی نصب شد')
  }
  async function togglePush() {
    const s = getSession()
    if (!s || !s.access_token) return
    setBusy(true)
    const r = push && push.on ? await pushDisable(s.access_token) : await pushEnable(s.access_token)
    setBusy(false)
    track('push_toggle', { on: !(push && push.on), ok: !!(r && r.ok) })
    if (r && r.ok) showToast && showToast(push && push.on ? 'اعلان روی گوشی خاموش شد' : 'اعلان روی گوشی روشن شد')
    else if (r && r.error === 'denied') showToast && showToast('اجازه اعلان داده نشد. از تنظیمات مرورگر می‌شود روشنش کرد', 'warn')
    else showToast && showToast('اعلان روشن نشد؛ دوباره امتحان کن', 'warn')
    pushState().then(setPush).catch(() => {})
  }
  const Step = ({ n, children }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 2, marginBottom: 6 }}>
      <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', border: '1.5px solid ' + C.text, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, marginTop: 3 }}>{n}</span>
      <span>{children}</span>
    </div>
  )
  return (
    <SheetV4 open onClose={onClose} title="نصب روی گوشی" icon="phone" maxWidth={480}>
      {standalone ? (
        <div style={{ fontSize: 13, lineHeight: 2, color: C.text, background: T.chip, border: '1px solid ' + T.hair, borderRadius: R.box, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={17} />TwinLand همین الان به شکل اپ روی این دستگاه باز است.</div>
      ) : canInstall ? (
        <>
          <div style={{ fontSize: 13, lineHeight: 2, color: C.sub, marginBottom: 12 }}>با یک ضربه، TwinLand مثل یک اپ روی صفحه اصلی گوشی می‌نشیند و تمام‌صفحه باز می‌شود.</div>
          <Btn block size="lg" icon="download" onClick={install}>نصب TwinLand</Btn>
        </>
      ) : ios ? (
        <div>
          <Step n="۱">پایین صفحه در Safari دکمه اشتراک را بزن؛ مربعی با فلش رو به بالا</Step>
          <Step n="۲">در فهرست، «افزودن به صفحه اصلی» یا Add to Home Screen را بزن</Step>
          <Step n="۳">بالای صفحه Add را بزن تا آیکون TwinLand روی صفحه اصلی بیاید</Step>
        </div>
      ) : (
        <div>
          <Step n="۱">منوی سه‌نقطه مرورگر را باز کن</Step>
          <Step n="۲">«نصب برنامه» یا «افزودن به صفحه اصلی» را بزن</Step>
        </div>
      )}
      {push && push.supported && push.ready && (
        <div style={{ marginTop: 18, borderTop: '1px solid ' + T.hair, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bell" size={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 900 }}>اعلان روی گوشی</div>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>جایزه، جواب کافه به نظرت، لیگ هفتگی و ماموریت تازه</div>
            </div>
            <Toggle on={!!push.on} onChange={togglePush} disabled={busy} label="اعلان روی گوشی" />
          </div>
          {ios && !standalone && <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8, marginTop: 8 }}>در آیفون، اعلان فقط بعد از نصب روی صفحه اصلی کار می‌کند.</div>}
        </div>
      )}
    </SheetV4>
  )
}
