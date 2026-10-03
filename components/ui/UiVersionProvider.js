'use client'
// نسخه ظاهر فعال را به همه صفحه‌ها می‌دهد.
// - نسخه سایت از سرور می‌آید (layout → fetchSiteUiVersion)
// - مالک اپ می‌تواند بدون تغییر سایت، نسخه دیگری را پیش‌نمایش کند: /?ui=v2.0 — خروج با /?ui=site
//   این فقط برای راحتی است، نه امنیت؛ قفل واقعی عوض کردن نسخه سایت در دیتابیس است.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isKnownUi, uiInfo } from '@/lib/ui/versions'
import { buildC, loadPrefs } from '@/lib/theme/palettes'

const OWNER_EMAIL = 'msmadani88@gmail.com'
const PREVIEW_KEY = 'tl_ui_preview'

const UiVersionContext = createContext({ site: null, active: null, preview: null, recheck: () => {} })

// نسخه‌های آزمایشی Vercel پشت ورود Vercel هستند؛ آنجا پیش‌نمایش برای آزمایش بدون حساب مالک هم باز است.
// دامنه‌های واقعی سایت مثل twinland.ir و twinland.vercel.app همیشه فقط برای مالک.
function isPreviewHost() {
  try {
    const h = window.location.hostname
    return h.endsWith('.vercel.app') && h !== 'twinland.vercel.app'
  } catch (e) { return false }
}

function storedSessionIsOwner() {
  if (isPreviewHost()) return true
  try {
    const s = JSON.parse(localStorage.getItem('tl_session') || 'null')
    const email = s && s.user && s.user.email
    return !!(email && String(email).toLowerCase() === OWNER_EMAIL)
  } catch (e) { return false }
}

function readPreviewParam() {
  // ?ui=v2.0 → ذخیره برای همین تب؛ ?ui=site → پاک کردن. بعد پارامتر از آدرس حذف می‌شود.
  try {
    const sp = new URLSearchParams(window.location.search)
    if (!sp.has('ui')) return
    const q = sp.get('ui')
    if (isKnownUi(q)) sessionStorage.setItem(PREVIEW_KEY, q)
    else sessionStorage.removeItem(PREVIEW_KEY)
    sp.delete('ui')
    const rest = sp.toString()
    window.history.replaceState(null, '', window.location.pathname + (rest ? '?' + rest : '') + window.location.hash)
  } catch (e) {}
}

export function UiVersionProvider({ site, children }) {
  const [preview, setPreview] = useState(null)

  const recheck = useCallback(() => {
    try {
      const p = sessionStorage.getItem(PREVIEW_KEY)
      setPreview(p && isKnownUi(p) && p !== site && storedSessionIsOwner() ? p : null)
    } catch (e) { setPreview(null) }
  }, [site])

  useEffect(() => { readPreviewParam(); recheck() }, [recheck])

  const active = preview || site
  useEffect(() => {
    try { document.documentElement.dataset.ui = active } catch (e) {}
  }, [active])

  const value = useMemo(() => ({ site, active, preview, recheck }), [site, active, preview, recheck])
  return (
    <UiVersionContext.Provider value={value}>
      {children}
      {preview && <PreviewBadge preview={preview} site={site} />}
    </UiVersionContext.Provider>
  )
}

export function useUiVersion() {
  return useContext(UiVersionContext)
}

function PreviewBadge({ preview, site }) {
  const p = loadPrefs()
  const C = buildC(p.palette, p.mode)
  const info = uiInfo(preview)
  return (
    <a href="?ui=site" title="خروج از پیش‌نمایش"
      style={{ position: 'fixed', left: '50%', top: 'calc(env(safe-area-inset-top, 0px) + 1px)', transform: 'translateX(-50%)', zIndex: 100000,
        display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap',
        background: C.glassDark, color: C.text, border: '1px solid ' + C.border, fontSize: 10, fontWeight: 700,
        textDecoration: 'none', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', direction: 'rtl' }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: C.gold }} />
      پیش‌نمایش ظاهر {preview}{info ? ' · ' + info.name : ''}
      <span style={{ color: C.sub, fontWeight: 600 }}>— سایت روی {site} · خروج</span>
    </a>
  )
}
