'use client'
// ردیف منطقه‌ها زیر نوار بالا — نسخه v4.0
// روی دسکتاپ از کنار ستون ابزار شروع می‌شود؛ در موبایل جستجو اول همین ردیف است.
import { useState } from 'react'
import { ZONES } from '@/lib/constants'
import { L } from '@/lib/theme/labels'
import { useDragScroll } from '@/lib/theme/ui'
import { Icon } from '@/components/v4/icons'

export function ZoneChipsV4({ C, T, Lay, compact = false, goZone, isMobile, leftInset, open = true, rightInset, search, setSearch, zone }) {
  const ref = useDragScroll()
  const [focus, setFocus] = useState(false)
  const h = compact ? 32 : Lay.chipsH - 4
  const chip = (on) => ({
    flexShrink: 0, height: h, padding: compact ? '0 12px' : '0 15px', borderRadius: T.radius.pill, cursor: 'pointer', fontFamily: 'inherit',
    border: '1px solid ' + (on ? 'transparent' : T.hair),
    background: on ? C.accent : T.glass, color: on ? T.onAccent : C.text,
    backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
    fontSize: compact ? 12 : 12.5, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap', boxShadow: T.shadow1,
  })
  const wide = focus || !!search
  if (compact && !open) return null
  return (
    <div ref={ref} className="tl2-noscroll tl2-fade-x"
      style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.chipsTop + 'px)', right: compact ? rightInset + 52 : rightInset, left: leftInset != null ? leftInset : Lay.gap, height: Lay.chipsH, zIndex: 290,
        display: 'flex', alignItems: 'center', gap: 7, overflowX: 'auto', padding: '0 2px 0 22px', transition: 'right .35s ease, left .28s cubic-bezier(.2,.9,.3,1)', animation: 'tl2Drop .5s .05s both cubic-bezier(.2,.9,.3,1)' }}>
      {isMobile && (
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', right: 11, pointerEvents: 'none', color: C.sub }}><Icon name="search" size={15} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            placeholder={L.cafe + '…'} aria-label={'جستجوی ' + L.cafe}
            style={{ height: h, width: wide ? 170 : (compact ? 110 : 96), borderRadius: T.radius.pill, border: '1px solid ' + (search ? C.accent : T.hair), fontFamily: 'inherit',
              background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, color: C.text, fontSize: compact ? 12 : 13,
              padding: '0 32px 0 12px', outline: 'none', boxShadow: T.shadow1, transition: 'width .25s ease' }} />
          {search && (
            <button className="tl4-btn" aria-label="پاک کردن جستجو" onMouseDown={e => e.preventDefault()} onClick={() => setSearch('')}
              style={{ position: 'absolute', left: 6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.hairStrong, color: C.text, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={11} stroke={2.4} />
            </button>
          )}
        </div>
      )}
      {ZONES.map(z => (
        <button key={z.key} className="tl4-press" onClick={() => goZone(z)} aria-pressed={zone === z.key} style={{ ...chip(zone === z.key), display: 'flex', alignItems: 'center', gap: 5 }}>
          {z.key === 'top' && <Icon name="star" size={13} stroke={2} />}{String(z.label).replace(/^[^\u0600-\u06FFA-Za-z0-9]+\s*/, '')}
        </button>
      ))}
    </div>
  )
}
