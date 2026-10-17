'use client'
// ستون دکمه‌های مربعی بالا سمت راست در موبایل — نسخه v4.0
// جستجو و فیلتر، استریک رنگی با کمان روزها، کشف نقشه و ماموریت‌های فعال؛ همه روی یک شیشه.
import { useState } from 'react'
import { alpha } from '@/components/v2/theme'
import { ExploreRing } from '@/components/v3/map/ExploreProgress'
import { Icon } from '@/components/v4/icons'
import { V4_COLOR } from '@/components/v4/theme'
import { StreakPopover } from '@/components/v4/home/HudV4'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function HudSquaresV4({ C, T, Lay, checkinDays, filterActive, filtersOpen, hex, onExplore, onMissions, questCount, rightInset, setFiltersOpen, streak }) {
  const [arc, setArc] = useState(false)
  const p = hex && hex.progress
  const btn = {
    width: 42, height: 42, borderRadius: 12, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, color: C.text, position: 'relative',
  }
  const num = { fontSize: 10, fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }
  return (
    <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.chipsTop + 'px)', right: rightInset, zIndex: 291, animation: 'tl2Fade .5s .1s both' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 4, borderRadius: 16, background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow1 }}>
        <button className={'tl4-btn' + (filtersOpen || filterActive ? ' is-on' : '')} aria-label="جستجو و فیلتر منطقه" aria-expanded={!!filtersOpen} onClick={() => setFiltersOpen(v => !v)} style={btn}>
          <Icon name={filtersOpen ? 'x' : 'search'} size={19} />
        </button>
        <button className="tl4-press" aria-label={'استریک ' + fa(streak) + ' روز'} aria-expanded={arc} onClick={() => setArc(v => !v)}
          style={{ ...btn, background: streak >= 1 ? V4_COLOR.streakGrad : 'transparent', color: streak >= 1 ? '#FFFFFF' : C.text }}>
          <Icon name="flame" size={17} stroke={2} /><span style={num}>{fa(streak)}</span>
        </button>
        <button className="tl4-btn" aria-label="کشف نقشه" onClick={onExplore} style={btn}>
          <span style={{ position: 'absolute', inset: 3, pointerEvents: 'none' }}>
            <ExploreRing size={36} stroke={2} ring={p ? p.ring : 0} color={(hex && hex.ink) || C.text} track={alpha(C.text, 0.12)} />
          </span>
          <Icon name="compass" size={15} /><span style={num}>{p && p.district ? fa(p.seen) : '•'}</span>
        </button>
        <button className="tl4-btn" aria-label="ماموریت‌های فعال" onClick={onMissions} style={btn}>
          <Icon name="target" size={17} /><span style={num}>{fa(questCount)}</span>
        </button>
      </div>
      {arc && <StreakPopover C={C} T={T} days={checkinDays} streak={streak} onClose={() => setArc(false)} style={{ top: 0, right: 56 }} />}
    </div>
  )
}
