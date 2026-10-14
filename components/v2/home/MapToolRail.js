'use client'
// ستون ابزار نقشه در لبه چپ — نسخه v2.0
// پوسته نقشه، مرزها، پالت، شهر در موبایل، و کنترل جابه‌جایی و بزرگ‌نمایی.
import { CITIES } from '@/lib/constants'

export function MapToolRail({ C, T, Lay, city, hidden, liftBy = 0, isMobile, follow = false, onToggleFollow = null, mapInst, navOpen, panMap, setNavOpen, setShowBoundary, setShowCity, setShowMode, setShowPalette }) {
  if (hidden) return null
  const btn = {
    width: 44, height: 44, borderRadius: 14, border: '1px solid ' + T.hair, padding: 0,
    background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, boxShadow: T.shadow1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 17, fontWeight: 800,
  }
  const img = (src, alt) => <img src={src} alt={alt} width={24} height={24} style={{ objectFit: 'contain', display: 'block' }} />
  const small = { ...btn, width: 38, height: 38, borderRadius: 12, fontSize: 15 }
  const recenter = () => { const c = CITIES[city]; mapInst.current?.flyTo([c.lat, c.lng], c.zoom) }
  return (
    <div style={{ position: 'absolute', left: Lay.gap, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock + liftBy) + 'px)', zIndex: 60, transition: 'bottom .3s cubic-bezier(.34,1.56,.64,1)',
      display: 'flex', alignItems: 'flex-end', gap: 8, animation: 'tl2Slide .5s .1s both cubic-bezier(.2,.9,.3,1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="tl2-press" title="پوسته نقشه" aria-label="پوسته نقشه" onClick={() => setShowMode(true)} style={btn}>{img('/map_skin.svg', 'پوسته نقشه')}</button>
        <button data-tut="boundary-btn" className="tl2-press" title="مرزها" aria-label="مرزها" onClick={() => setShowBoundary(true)} style={btn}>{img('/boundaries@256.png', 'مرزها')}</button>
        <button className="tl2-press" title="پالت رنگ" aria-label="پالت رنگ" onClick={() => setShowPalette(true)} style={btn}>{img('/theme@256.png', 'پالت')}</button>
        {isMobile && <button className="tl2-press" title="شهر" aria-label="شهر" onClick={() => setShowCity(true)} style={{ ...btn, fontSize: 10.5, lineHeight: 1.2, flexDirection: 'column' }}>📍<span>{CITIES[city].name}</span></button>}
        {onToggleFollow && (
          <button data-tut="map-follow" className="tl2-press" title={follow ? 'دنبال کردن رویداد روشن است' : 'دنبال کردن رویداد خاموش است'} aria-label="دنبال کردن رویداد" aria-pressed={follow} onClick={onToggleFollow}
            style={{ ...btn, background: follow ? C.accent : T.glass, color: follow ? T.onAccent : C.text, boxShadow: follow ? T.glow(C.accent) : T.shadow1 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" fill={follow ? 'currentColor' : 'none'} />
              <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
              {!follow && <path d="M4 4l16 16" strokeWidth="2.4" />}
            </svg>
          </button>
        )}
        <button data-tut="map-nav" className="tl2-press" title={navOpen ? 'بستن کنترل‌ها' : 'کنترل نقشه'} aria-label="کنترل نقشه" onClick={() => setNavOpen(v => !v)}
          style={{ ...btn, background: navOpen ? C.accent : T.glass, color: navOpen ? T.onAccent : C.text, boxShadow: navOpen ? T.glow(C.accent) : T.shadow1 }}>🎮</button>
      </div>
      {navOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 18, background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
          border: '1px solid ' + T.hair, boxShadow: T.shadow2, animation: 'tl2Slide .25s cubic-bezier(.2,.9,.3,1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,38px)', gap: 5 }}>
            <div /><button className="tl2-press" aria-label="بالا" onClick={() => panMap(0, -90)} style={small}>↑</button><div />
            <button className="tl2-press" aria-label="چپ" onClick={() => panMap(90, 0)} style={small}>←</button>
            <button className="tl2-press" aria-label="مرکز شهر" onClick={recenter} style={{ ...small, background: T.accentSoft, color: C.accent, fontSize: 13 }}>⌖</button>
            <button className="tl2-press" aria-label="راست" onClick={() => panMap(-90, 0)} style={small}>→</button>
            <div /><button className="tl2-press" aria-label="پایین" onClick={() => panMap(0, 90)} style={small}>↓</button><div />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="tl2-press" aria-label="بزرگ‌نمایی" onClick={() => mapInst.current?.zoomIn()} style={{ ...small, flex: 1, width: 'auto', fontSize: 19 }}>＋</button>
            <button className="tl2-press" aria-label="کوچک‌نمایی" onClick={() => mapInst.current?.zoomOut()} style={{ ...small, flex: 1, width: 'auto', fontSize: 19 }}>－</button>
          </div>
        </div>
      )}
    </div>
  )
}
