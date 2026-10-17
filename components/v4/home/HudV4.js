'use client'
// لایه اطلاعات روی نقشه — نسخه v4.0
// آمار زنده با آیکون خطی، قرص استریک رنگی که کمان روزها را باز می‌کند، نوار رویدادها و دکمه‌های فیلتر منطقه.
import { useEffect, useRef, useState } from 'react'
import { EventBanner } from '@/components/map/EventBanner'
import { EventDock } from '@/components/v3/events/EventDock'
import { L } from '@/lib/theme/labels'
import { alpha } from '@/components/v2/theme'
import { Icon } from '@/components/v4/icons'
import { V4_COLOR } from '@/components/v4/theme'
import { DayArc } from '@/components/v4/ui/DayArc'

const fa = (n) => Number(n || 0).toLocaleString('fa')

// قرص استریک: تنها چیز رنگی بالای نقشه کنار نشان لول
export function StreakPill({ streak, onClick, height = 32, open }) {
  return (
    <button className="tl4-press" onClick={onClick} aria-expanded={!!open} aria-label={'استریک ' + fa(streak) + ' روز، دیدن روزها'}
      style={{ height, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px 0 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
        background: V4_COLOR.streakGrad, color: '#FFFFFF', fontFamily: 'inherit', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
        boxShadow: '0 8px 20px -8px rgba(242,71,28,.7)', textShadow: '0 1px 1px rgba(120,30,0,.35)' }}>
      <Icon name="flame" size={15} stroke={2.1} />{fa(streak)} روز
    </button>
  )
}

// پنجره کوچک کمان روزها زیر قرص استریک
export function StreakPopover({ C, T, days, streak, onClose, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    const t = setTimeout(() => document.addEventListener('pointerdown', out), 0)
    document.addEventListener('keydown', esc)
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [onClose])
  return (
    <div ref={ref} role="dialog" aria-label="روزهای چک‌این"
      style={{ position: 'absolute', zIndex: 320, width: 320, maxWidth: 'calc(100vw - 20px)', padding: '14px 10px 12px', borderRadius: 22, color: C.text,
        background: T.glassMenu, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl4Pop .22s ease', ...style }}>
      <DayArc C={C} T={T} days={days} streak={streak} width={300} />
      <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 6, lineHeight: 1.7 }}>
        {streak >= 1 ? 'فردا هم یک چک‌این بزن تا شعله خاموش نشود.' : 'یک چک‌این امروز، استریکت را روشن می‌کند.'}
      </div>
    </div>
  )
}

export function HudV4({ C, T, Lay, bannerBottom = null, eventWidgets = false, getPos, compact = false, filtersOpen = false, cafes, checkedIn, checkinDays, clearRegionFilter, filterApplied, filtered, isMobile, leftInset, regionResults, rightInset, selectedRegions, setActiveEventCafeId, setSelCafe, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults, streak, totalLive }) {
  const [arcOpen, setArcOpen] = useState(false)
  const top = 'calc(env(safe-area-inset-top, 0px) + ' + (compact ? (filtersOpen ? Lay.hudTop : Lay.chipsTop + 6) : Lay.hudTop) + 'px)'
  const bannerTop = Lay.hudTop + (isMobile ? 40 : 0)
  const regionTop = compact ? (filtersOpen ? Lay.hudTop + 40 : Lay.chipsTop + 44) : bannerTop + 46
  const left = leftInset != null ? leftInset : Lay.gap
  const pill = {
    height: 32, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
    borderRadius: T.radius.pill, background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
    border: '1px solid ' + T.hair, boxShadow: T.shadow1, fontSize: 12, color: C.sub, whiteSpace: 'nowrap',
  }
  const regionBtn = { ...pill, width: '100%', justifyContent: 'center', color: C.text, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }
  return (<>
    <div style={{ position: 'absolute', top, right: compact ? rightInset + 52 : rightInset, zIndex: 40, display: 'flex', gap: 6, alignItems: 'center', transition: 'right .35s ease', animation: 'tl2Fade .5s .15s both' }}>
      {!compact && streak >= 1 && <div style={{ position: 'relative' }}>
        <StreakPill streak={streak} open={arcOpen} onClick={() => setArcOpen(v => !v)} />
        {arcOpen && <StreakPopover C={C} T={T} days={checkinDays} streak={streak} onClose={() => setArcOpen(false)} style={{ top: 40, right: 0 }} />}
      </div>}
      <div data-tut="live-pill" style={pill}>
        <span style={{ color: C.text, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="coffee" size={15} />{fa(filtered.length)}</span>
        <span style={{ width: 1, height: 14, background: T.hairStrong }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: V4_COLOR.pin, boxShadow: '0 0 0 3px ' + alpha(V4_COLOR.pin, 0.22) }} />
          <b style={{ color: C.text }}>{fa(totalLive)}</b> در کافه
        </span>
        {checkedIn.size > 0 && <>
          <span style={{ width: 1, height: 14, background: T.hairStrong }} />
          <span style={{ color: C.text, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={14} stroke={2.4} color={V4_COLOR.pin} />{fa(checkedIn.size)}</span>
        </>}
      </div>
    </div>

    {eventWidgets && bannerBottom ? (
      <EventDock C={C} T={T} Lay={Lay} cafes={cafes} getPos={getPos} isMobile={isMobile} onActiveCafeChange={setActiveEventCafeId} rightInset={rightInset} setSelCafe={setSelCafe} />
    ) : (
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + (bannerTop - 10) + 'px)', left: left - 10, width: isMobile ? 'calc(100vw - ' + Lay.gap + 'px)' : 'min(62vw, 420px)', height: 0, zIndex: 40, animation: 'tl2Fade .5s .2s both' }}>
        <EventBanner C={C} cafes={cafes} setSelCafe={setSelCafe} onActiveCafeChange={setActiveEventCafeId} />
      </div>
    )}

    {selectedRegions.length > 0 && !showRegionFilter && (
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + regionTop + 'px)', left, zIndex: 40, width: 176, display: 'flex', flexDirection: 'column', gap: 7, animation: 'tl2Slide .3s both', transition: 'left .28s ease' }}>
        <button className="tl4-press" onClick={() => setShowRegionFilter(true)} style={{ ...regionBtn, background: C.accent, color: T.onAccent, border: 'none' }}>
          فیلتر {fa(selectedRegions.length)} منطقه
        </button>
        {filterApplied && <button className="tl4-btn" onClick={clearRegionFilter} style={regionBtn}>پاک کردن فیلتر</button>}
        {Array.isArray(regionResults) && regionResults.length > 0 && !showRegionResults && (
          <button className="tl4-btn" onClick={() => setShowRegionResults(true)} style={regionBtn}>نتایج منطقه · {L.leaderboardShort}</button>
        )}
      </div>
    )}
  </>)
}
