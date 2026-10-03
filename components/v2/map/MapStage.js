'use client'
// صحنه نقشه تمام‌صفحه — نسخه v2.0
// نقشه پشت همه اجزای شناور است؛ بارگذاری و سایه لبه‌ها هم‌رنگ پالت.
import { RegionFilterPopup } from '@/components/map/RegionFilterPopup'
import { RegionResultsPanel } from '@/components/map/RegionResultsPanel'
import { alpha } from '@/components/v2/theme'

export function MapStage({ C, T, applyRegionFilter, mapLoading, mapRef, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1, isolation: 'isolate' }} />

      {/* سایه نرم لبه‌ها تا اجزای شناور روی نقشه بنشینند */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(to bottom,' + alpha(C.bg, T.dark ? 0.55 : 0.35) + ' 0,' + alpha(C.bg, 0) + ' 150px),' +
                    'linear-gradient(to top,' + alpha(C.bg, T.dark ? 0.5 : 0.3) + ' 0,' + alpha(C.bg, 0) + ' 130px)' }} />

      {showRegionFilter && (
        <RegionFilterPopup C={C} regions={selectedRegions} value={regionFilter} setValue={setRegionFilter}
          onApply={applyRegionFilter} onClose={() => setShowRegionFilter(false)} />
      )}
      {showRegionResults && Array.isArray(regionResults) && regionResults.length > 0 && (
        <RegionResultsPanel C={C} pages={regionResults} onClose={() => setShowRegionResults(false)} />
      )}

      {mapLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: T.mapBg, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tl2Fade .3s' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.6 }}>
            <div style={{ position: 'absolute', inset: '-50%', background: 'linear-gradient(100deg,transparent 40%,' + alpha(C.text, 0.06) + ' 50%,transparent 60%)', animation: 'shimmer 1.8s infinite' }} />
          </div>
          <div style={{ zIndex: 2, background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderRadius: T.radius.xl,
            padding: '22px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: T.shadow2 }}>
            <div style={{ fontSize: 34, animation: 'tl2Breath 1.6s ease-in-out infinite' }}>🗺️</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>در حال آماده کردن نقشه…</div>
            <div style={{ width: 150, height: 5, background: T.hair, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '40%', background: T.grad, borderRadius: 99, animation: 'shimmer 1.4s ease infinite' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
