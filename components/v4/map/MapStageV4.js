'use client'
// صحنه نقشه تمام‌صفحه — نسخه v4.0
// صفحه بارگذاری (MapLoaderV4) جداست و روی همه چیز می‌نشیند: نشان برند، یک نوار باریک پیشرفت و درصد.
// تا رسیدن همه تکه‌های دید اول می‌ماند و سقف کوتاهی دارد.
import { RegionFilterPopup } from '@/components/map/RegionFilterPopup'
import { RegionResultsPanel } from '@/components/map/RegionResultsPanel'
import { alpha } from '@/components/v2/theme'

export function MapStageV4({ C, T, applyRegionFilter, mapRef, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1, isolation: 'isolate' }} />

      {/* سایه بسیار نرم لبه بالا و پایین، فقط برای جدا شدن نوارهای شیشه‌ای */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(to bottom,' + alpha(T.mapBg, T.dark ? 0.5 : 0.35) + ' 0,' + alpha(T.mapBg, 0) + ' 120px),' +
                    'linear-gradient(to top,' + alpha(T.mapBg, T.dark ? 0.45 : 0.3) + ' 0,' + alpha(T.mapBg, 0) + ' 110px)' }} />

      {showRegionFilter && (
        <RegionFilterPopup C={C} regions={selectedRegions} value={regionFilter} setValue={setRegionFilter}
          onApply={applyRegionFilter} onClose={() => setShowRegionFilter(false)} />
      )}
      {showRegionResults && Array.isArray(regionResults) && regionResults.length > 0 && (
        <RegionResultsPanel C={C} pages={regionResults} onClose={() => setShowRegionResults(false)} />
      )}

    </div>
  )
}

export function MapLoaderV4({ C, T, show, progress = 0, monoLogo = true }) {
  if (!show) return null
  const pct = Math.round(Math.max(0.04, Math.min(1, progress)) * 100)
  return (
    <div role="status" aria-live="polite" aria-label="در حال آماده کردن نقشه"
      style={{ position: 'fixed', inset: 0, zIndex: 4000, background: T.mapBg, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tl4Fade .25s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: 200 }}>
        <img src="/twinland_logo.webp" alt="TwinLand" style={{ height: 46, width: 'auto', objectFit: 'contain', filter: monoLogo ? (T.dark ? 'grayscale(1) brightness(1.15)' : 'grayscale(1) contrast(1.1)') : 'none' }} />
        <div style={{ width: '100%', height: 3, borderRadius: 99, background: T.hairStrong, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: C.text, borderRadius: 99, transition: 'width .35s ease' }} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, fontVariantNumeric: 'tabular-nums', display: 'flex', gap: 6 }}>
          <span>{pct < 35 ? 'آماده کردن نقشه' : 'رسیدن تکه‌های نقشه'}</span><span>{pct.toLocaleString('fa')}٪</span>
        </div>
      </div>
    </div>
  )
}
