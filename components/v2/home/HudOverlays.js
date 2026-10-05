'use client'
// لایه اطلاعات روی نقشه — نسخه v2.0
// آمار زنده، نوار رویدادها، استریک و دکمه‌های فیلتر منطقه؛ همه زیر ردیف منطقه‌ها.
import { EventBanner } from '@/components/map/EventBanner'
import { L, ICON } from '@/lib/theme/labels'
import { onColor } from '@/lib/theme/ui'
import { alpha } from '@/components/v2/theme'

// compact و filtersOpen فقط در چیدمان تازه موبایل نسخه v3.0 داده می‌شوند
// bannerBottom: 'mobile' یا 'desktop' یعنی نوار رویدادها پایین صفحه بنشیند، جای نوار LED
export function HudOverlays({ C, T, Lay, bannerBottom = null, compact = false, filtersOpen = false, cafes, checkedIn, clearRegionFilter, filterApplied, filtered, isMobile, regionResults, rightInset, selectedRegions, setActiveEventCafeId, setSelCafe, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults, streak, totalLive }) {
  // جمع‌وجور: آمار زنده کنار دکمه فیلتر می‌نشیند؛ وقتی ردیف جستجو باز است یک ردیف پایین‌تر
  const top = 'calc(env(safe-area-inset-top, 0px) + ' + (compact ? (filtersOpen ? Lay.hudTop : Lay.chipsTop + 6) : Lay.hudTop) + 'px)'
  // در موبایل جا کم است: آمار زنده ردیف اول، نوار رویدادها ردیف دوم
  const bannerTop = Lay.hudTop + (isMobile ? 40 : 0)
  const regionTop = compact ? (filtersOpen ? Lay.hudTop + 40 : Lay.chipsTop + 44) : bannerTop + 46
  const pill = {
    height: 32, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
    borderRadius: T.radius.pill, background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
    border: '1px solid ' + T.hair, boxShadow: T.shadow1, fontSize: 12, color: C.sub, whiteSpace: 'nowrap',
  }
  const regionBtn = {
    ...pill, width: '100%', justifyContent: 'center', color: C.text, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
  }
  return (<>
    {/* آمار زنده و استریک — بالا سمت راست */}
    <div style={{ position: 'absolute', top, right: compact ? rightInset + 52 : rightInset, zIndex: 40, display: 'flex', gap: 6, alignItems: 'center', transition: 'right .35s ease', animation: 'tl2Fade .5s .15s both' }}>
      {!compact && streak >= 2 && (
        <div style={{ ...pill, background: streak >= 5 ? C.gold : C.accent, color: onColor(streak >= 5 ? C.gold : C.accent), border: 'none', fontWeight: 900, boxShadow: T.glow(streak >= 5 ? C.gold : C.accent) }}>
          {ICON.streak} {Number(streak).toLocaleString('fa')} روز
        </div>
      )}
      <div data-tut="live-pill" style={pill}>
        <span style={{ color: C.text, fontWeight: 900 }}>{ICON.cafe} {filtered.length.toLocaleString('fa')}</span>
        <span style={{ width: 1, height: 14, background: T.hairStrong }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 3px ' + alpha(C.green, 0.2) }} />
          <b style={{ color: C.text }}>{Number(totalLive || 0).toLocaleString('fa')}</b> آنلاین
        </span>
        {checkedIn.size > 0 && <>
          <span style={{ width: 1, height: 14, background: T.hairStrong }} />
          <span style={{ color: C.green, fontWeight: 900 }}>✓ {checkedIn.size.toLocaleString('fa')}</span>
        </>}
      </div>
    </div>

    {/* نوار رویدادها — بالا سمت چپ؛ جزء مشترک، فقط جایش در v2 عوض شده */}
    <div style={bannerBottom === 'desktop'
      ? { position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock + 52) + 'px)', left: 0, right: rightInset, height: 0, zIndex: 40, transition: 'right .35s ease', animation: 'tl2Fade .5s .2s both' }
      : bannerBottom === 'mobile'
      ? { position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock + 50) + 'px)', left: Lay.gap + 52 - 10, width: 'calc(100vw - ' + (Lay.gap * 2 + 52) + 'px)', height: 0, zIndex: 40, animation: 'tl2Fade .5s .2s both' }
      : { position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + (bannerTop - 10) + 'px)', left: Lay.gap - 10, width: isMobile ? 'calc(100vw - ' + Lay.gap + 'px)' : 'min(62vw, 420px)', height: 0, zIndex: 40, animation: 'tl2Fade .5s .2s both' }}>
      <EventBanner C={C} cafes={cafes} setSelCafe={setSelCafe} onActiveCafeChange={setActiveEventCafeId}
        rootStyle={bannerBottom === 'desktop' ? { left: '50%', transform: 'translateX(-50%)', alignItems: 'center', maxWidth: 'min(620px, 46vw)', width: 'max-content' } : null} />
    </div>

    {/* دکمه‌های فیلتر منطقه */}
    {selectedRegions.length > 0 && !showRegionFilter && (
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + regionTop + 'px)', left: Lay.gap, zIndex: 40, width: 176, display: 'flex', flexDirection: 'column', gap: 7, animation: 'tl2Slide .3s both' }}>
        <button className="tl2-press" onClick={() => setShowRegionFilter(true)} style={{ ...regionBtn, background: C.accent, color: T.onAccent, border: 'none', boxShadow: T.glow(C.accent) }}>
          فیلتر {selectedRegions.length.toLocaleString('fa')} منطقه
        </button>
        {filterApplied && <button className="tl2-press" onClick={clearRegionFilter} style={regionBtn}>پاک کردن فیلتر</button>}
        {Array.isArray(regionResults) && regionResults.length > 0 && !showRegionResults && (
          <button className="tl2-press" onClick={() => setShowRegionResults(true)} style={regionBtn}>نتایج منطقه · {L.leaderboardShort}</button>
        )}
      </div>
    )}
  </>)
}
