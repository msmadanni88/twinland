'use client'
// داک شناور پایین صفحه — نسخه v2.0
// همان پنج بخش اصلی و همان آیکون‌های تصویری برند، روی یک شیشه گرد.
// خانه اول یک کلید دو حالته است: پنل باز باشد «نقشه» نشان می‌دهد و با زدنش پنل کنار می‌رود،
// پنل بسته باشد «پنل» نشان می‌دهد و با زدنش پنل می‌آید. یعنی برچسب همیشه کار بعدی است.
import { NAV } from '@/lib/constants'

const PANEL_OF = { missions: 'missions', clan: 'clan', rank: 'rank', profile: 'profile' }

export function Dock({ C, T, Lay, isMobile, panelOpen, panelTab, rightInset, setPanelOpen, setPanelTab, setTab }) {
  const go = (key) => {
    if (key === 'map') {
      // کلید دو حالته — نقشه و پنل جای هم عوض می‌شوند
      setTab(panelOpen ? 'map' : (PANEL_OF[panelTab] || 'map'))
      setPanelOpen(!panelOpen)
      return
    }
    setTab(key)
    const panel = PANEL_OF[key]
    if (panel) { setPanelOpen(true); setPanelTab(panel) }
  }
  return (
    <div style={{ position: 'absolute', left: Lay.gap, right: rightInset, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + Lay.dockBottom + 'px)', zIndex: 280,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none', transition: 'right .35s ease' }}>
      <nav data-tut="bottom-nav" aria-label="بخش‌های اصلی"
        style={{ pointerEvents: 'auto', width: Lay.dockW || '100%', maxWidth: '100%', height: Lay.dockH, display: 'flex', alignItems: 'stretch', padding: 5, gap: 2,
          background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair,
          borderRadius: T.radius.xl, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl2Rise .5s .1s both cubic-bezier(.2,.9,.3,1)' }}>
        {NAV.map(item => {
          const toggle = item.key === 'map'
          // خانه اول کلید است، نه بخش؛ پس حالت «فعال» ندارد و فقط زمینه ملایم دارد
          const active = toggle ? false : (panelOpen && panelTab === item.key)
          const label = toggle ? (panelOpen ? item.label : 'پنل') : item.label
          const isz = isMobile ? 27 : 29
          const src = toggle && !panelOpen
            ? '/dashboard@256.png'
            : '/' + item.img + (active || (toggle && panelOpen) ? '_active' : '_inactive') + '_L.png'
          return (
            <button key={item.key} className="tl2-press" onClick={() => go(item.key)}
              aria-current={active ? 'page' : undefined}
              aria-pressed={toggle ? !panelOpen : undefined}
              aria-label={toggle ? (panelOpen ? 'نمایش نقشه' : 'باز کردن پنل') : undefined}
              style={{ flex: 1, position: 'relative', border: 'none', borderRadius: 18, padding: 0,
                background: active ? T.accentSoft : (toggle ? T.chip : 'transparent'), color: active || toggle ? C.text : C.sub,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                fontSize: isMobile ? 10 : 10.5, fontWeight: active ? 900 : (toggle ? 800 : 600) }}>
              <img src={src} alt="" width={isz} height={isz}
                style={{ objectFit: 'contain', display: 'block', transform: active ? 'translateY(-1px) scale(1.08)' : 'none', transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)',
                  filter: active ? 'drop-shadow(0 4px 8px ' + T.accentSoft + ')' : (toggle ? 'none' : 'saturate(.7) opacity(.85)') }} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
