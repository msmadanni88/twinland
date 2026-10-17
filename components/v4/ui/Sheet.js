'use client'
// برگه شیشه‌ای پایین‌رونده نسخه v4.0 — قاب مشترک همه انتخابگرها
import { Icon } from '@/components/v4/icons'

export function SheetV4({ C, T, open, onClose, title, icon, maxWidth = 540, children, label }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: T.dark ? 'rgba(0,0,0,.45)' : 'rgba(20,20,22,.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'tl4Fade .2s' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label={label || title}
        style={{ width: '100%', maxWidth, padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 22px)', borderRadius: '24px 24px 0 0', color: C.text,
          background: T.glassMenu, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderBottom: 'none', boxShadow: T.shadow2 + ',' + T.highlight,
          animation: 'tl2Sheet .3s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: T.hairStrong, margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {icon && <span style={{ width: 34, height: 34, borderRadius: 11, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></span>}
          <div style={{ flex: 1, fontSize: 16, fontWeight: 900 }}>{title}</div>
          <button className="tl4-btn" aria-label="بستن" onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 11, border: '1px solid ' + T.hair, background: T.chip, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
