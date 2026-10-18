'use client'
// پیام کوتاه پایین صفحه برای صفحه‌های جدای v4.0 (صفحه اصلی Toast خودش را دارد)
import { useCallback, useRef, useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'

export function useToastV4() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const showToast = useCallback((msg, kind) => {
    clearTimeout(timer.current)
    setToast({ msg, kind: kind || 'ok', at: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])
  return { toast, showToast }
}

export function ToastV4({ toast, bottom = 24 }) {
  const { C, T } = useV4()
  if (!toast) return null
  return (
    <div role="status" aria-live="polite" key={toast.at}
      style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + bottom + 'px)', zIndex: 5000,
        maxWidth: 'min(92vw, 420px)', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: R.box, direction: 'rtl',
        background: T.glassMenu, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow2, color: C.text,
        fontSize: 12.5, fontWeight: 800, animation: 'tl4Pop .2s ease' }}>
      <Icon name={toast.kind === 'warn' ? 'help' : 'check'} size={16} />
      <span>{toast.msg}</span>
    </div>
  )
}
