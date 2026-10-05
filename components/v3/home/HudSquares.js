'use client'
// ستون دکمه‌های مربعی بالا سمت راست — چیدمان تازه موبایل در نسخه v3.0
// هم‌شکل دکمه‌های میله ابزار پایین چپ: فیلتر، استریک، کشف نقشه و ماموریت‌های فعال.
export function HudSquares({ C, T, Lay, filterActive, filtersOpen, hex, onExplore, onMissions, onStreak, questCount, rightInset, setFiltersOpen, streak }) {
  const fa = (n) => Number(n || 0).toLocaleString('fa')
  const btn = {
    width: 44, height: 44, borderRadius: 14, border: '1px solid ' + T.hair, padding: 0,
    background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, boxShadow: T.shadow1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
    color: C.text, fontSize: 16, lineHeight: 1.1, fontWeight: 800,
  }
  const num = { fontSize: 10.5, fontWeight: 900, lineHeight: 1.15 }
  const on = { ...btn, background: C.accent, color: T.onAccent, border: '1px solid transparent', boxShadow: T.glow(C.accent) }
  const hot = streak >= 5
  return (
    <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.chipsTop + 'px)', right: rightInset, zIndex: 291,
      display: 'flex', flexDirection: 'column', gap: 8, animation: 'tl2Fade .5s .1s both' }}>
      <button className="tl2-press" aria-label="جستجو و فیلتر منطقه" title="جستجو و فیلتر منطقه" onClick={() => setFiltersOpen(v => !v)}
        style={filtersOpen || filterActive ? on : btn}>{filtersOpen ? '✕' : '🔍'}</button>
      <button className="tl2-press" aria-label="استریک" title="استریک" onClick={onStreak}
        style={streak >= 2 ? { ...btn, background: hot ? C.gold : T.glass, color: hot ? '#1b1b1b' : C.text } : btn}>
        <span>🔥</span><span style={num}>{fa(streak)}</span>
      </button>
      <button className="tl2-press" aria-label="کشف نقشه" title="کشف نقشه" onClick={onExplore} style={btn}>
        <span>🧭</span><span style={num}>{fa(hex.found)}/{fa(hex.total)}</span>
      </button>
      <button className="tl2-press" aria-label="ماموریت‌های فعال" title="ماموریت‌های فعال" onClick={onMissions} style={btn}>
        <span>🎯</span><span style={num}>{fa(questCount)}</span>
      </button>
    </div>
  )
}
