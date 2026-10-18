'use client'
// ─────────────────────────────────────────────────────────────
//  قاب صفحه‌های جدا در نسخه v4.0: پروفایل، رتبه‌بندی، گالری و صفحه‌های بعدی
//  همان رنگ، فونت، شیشه و گوشه‌های صفحه اصلی را می‌دهد، با نوار بالای ثابت:
//  دکمه برگشت، عنوان، دکمه‌های اختیاری و کلید حالت روشن و تیره.
//  back: نشانی برگشت، یا 'history' برای برگشت به صفحه قبلی همین سایت (اگر نبود، صفحه اصلی).
//  هر صفحه تازه فقط محتوایش را داخل این قاب می‌گذارد.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { UIStyles } from '@/lib/theme/ui'
import { V2Styles } from '@/components/v2/V2Styles'
import { V4Styles } from '@/components/v4/V4Styles'
import { useV4Theme } from '@/components/v4/useV4Theme'
import { V4Provider } from '@/components/v4/kit/context'
import { IconBtn } from '@/components/v4/kit/kit'
import { R } from '@/components/v4/theme'

export function V4Page({ title, back = '/', backLabel = 'برگشت به نقشه', actions, maxWidth = 560, children, openPerson }) {
  const { C, T, themeMode, toggleMode } = useV4Theme()
  useEffect(() => {
    try {
      let m = document.querySelector('meta[name="theme-color"]')
      if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m) }
      m.setAttribute('content', C.bg)
      document.body.style.background = C.bg
    } catch (e) {}
  }, [C.bg])
  return (
    <V4Provider C={C} T={T} openPerson={openPerson}>
      <div className="tl2 tl4" data-mode={themeMode}
        style={{ minHeight: '100dvh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Estedad','Vazirmatn',system-ui,sans-serif", colorScheme: themeMode === 'dark' ? 'dark' : 'light' }}>
        <UIStyles />
        <V2Styles C={C} T={T} />
        <V4Styles C={C} T={T} />
        <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 12px 10px' }}>
          <div style={{ maxWidth: maxWidth - 24, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', boxSizing: 'border-box',
            background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderRadius: R.box, boxShadow: T.shadow1 + ',' + T.highlight }}>
            {back
              ? <a href={back === 'history' ? '/' : back} aria-label={backLabel} title={backLabel} className="tl4-btn"
                  onClick={back === 'history' ? (e) => { try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back() } } catch (x) {} } : undefined}
                  style={{ width: 40, height: 40, borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
                </a>
              : <span style={{ width: 40 }} />}
            <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
            {actions}
            <IconBtn icon={themeMode === 'dark' ? 'moon' : 'sun'} label={themeMode === 'dark' ? 'حالت تیره' : 'حالت روشن'} onClick={toggleMode} C={C} T={T} />
          </div>
        </header>
        <main style={{ maxWidth, margin: '0 auto', padding: '6px 12px calc(env(safe-area-inset-bottom, 0px) + 40px)', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    </V4Provider>
  )
}
