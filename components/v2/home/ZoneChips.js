'use client'
// ردیف شناور منطقه‌ها زیر نوار فرمان — نسخه v2.0
// در موبایل، جستجو هم اول همین ردیف است.
import { useState } from 'react'
import { ZONES } from '@/lib/constants'
import { L } from '@/lib/theme/labels'
import { useDragScroll } from '@/lib/theme/ui'

export function ZoneChips({ C, T, Lay, goZone, isMobile, rightInset, search, setSearch, zone }) {
  const ref = useDragScroll()
  const [focus, setFocus] = useState(false)
  const chip = (on) => ({
    flexShrink: 0, height: Lay.chipsH - 4, padding: '0 15px', borderRadius: T.radius.pill,
    border: '1px solid ' + (on ? 'transparent' : T.hair),
    background: on ? C.accent : T.glass, color: on ? T.onAccent : C.text,
    backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
    fontSize: 13, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap',
    boxShadow: on ? T.glow(C.accent, 0.55) : T.shadow1,
  })
  const wide = focus || !!search
  return (
    <div ref={ref} className="tl2-noscroll tl2-fade-x"
      style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.chipsTop + 'px)', right: rightInset, left: Lay.gap, height: Lay.chipsH, zIndex: 290,
        display: 'flex', alignItems: 'center', gap: 7, overflowX: 'auto', padding: '0 2px 0 22px', transition: 'right .35s ease', animation: 'tl2Drop .5s .05s both cubic-bezier(.2,.9,.3,1)' }}>
      {isMobile && (
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', right: 12, fontSize: 12, opacity: 0.6, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            placeholder={L.cafe + '…'}
            style={{ height: Lay.chipsH - 4, width: wide ? 170 : 96, borderRadius: T.radius.pill, border: '1px solid ' + (search ? C.accent : T.hair),
              background: search ? T.accentSoft : T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, color: C.text, fontSize: 13,
              padding: '0 32px 0 12px', outline: 'none', boxShadow: T.shadow1, transition: 'width .25s ease' }} />
          {search && (
            <button className="tl2-press" aria-label="پاک کردن جستجو" onMouseDown={e => e.preventDefault()} onClick={() => setSearch('')}
              style={{ position: 'absolute', left: 6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.hairStrong, color: C.text, fontSize: 10, padding: 0 }}>✕</button>
          )}
        </div>
      )}
      {ZONES.map(z => (
        <button key={z.key} className="tl2-press" onClick={() => goZone(z)} style={chip(zone === z.key)}>{z.label}</button>
      ))}
    </div>
  )
}
