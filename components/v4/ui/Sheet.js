'use client'
// برگه شیشه‌ای پایین‌رونده نسخه v4.0 — قاب مشترک همه انتخابگرها و پنجره‌ها
// روی دسکتاپ پهن وسط پایین صفحه می‌نشیند، روی گوشی تمام‌عرض. محتوای بلند داخل خودش اسکرول می‌شود.
import { useEffect } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'

export function SheetV4({ C: c, T: t, open, onClose, title, icon, maxWidth = 540, children, label, actions, zIndex = 2000 }) {
  const { C, T } = useV4({ C: c, T: t })
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex, background: T.dark ? 'rgba(0,0,0,.45)' : 'rgba(20,20,22,.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'tl4Fade .2s', direction: 'rtl' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={label || (typeof title === 'string' ? title : undefined)}
        style={{ width: '100%', maxWidth, maxHeight: '90dvh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderRadius: R.box + 'px ' + R.box + 'px 0 0', color: C.text,
          background: T.glassMenu, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderBottom: 'none', boxShadow: T.shadow2 + ',' + T.highlight,
          animation: 'tl2Sheet .3s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: T.hairStrong, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {icon && <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>}
            <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900 }}>{title}</div>
            {actions}
            <button className="tl4-btn" aria-label="بستن" onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
        <div className="tl-vscroll" style={{ overflowY: 'auto', padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 22px)', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
