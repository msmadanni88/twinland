'use client'
// داک پایین صفحه — نسخه v4.0
// همان پنج بخش و همان رفتار کلید اول (نقشه و پنل جای هم)، با آیکون خطی روی شیشه مات.
// بخش فعال یک قرص توپر سیاه یا سفید است.
import { NAV } from '@/lib/constants'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'

const PANEL_OF = { missions: 'missions', clan: 'clan', rank: 'rank', profile: 'profile' }
const ICONS = { missions: 'target', clan: 'users', rank: 'trophy', profile: 'user' }

export function DockV4({ C, T, Lay, isMobile, leftInset, panelOpen, panelTab, rightInset, setPanelOpen, setPanelTab, setTab }) {
  const go = (key) => {
    if (key === 'map') {
      setTab(panelOpen ? 'map' : (PANEL_OF[panelTab] || 'map'))
      setPanelOpen(!panelOpen)
      return
    }
    setTab(key)
    const panel = PANEL_OF[key]
    if (panel) { setPanelOpen(true); setPanelTab(panel) }
  }
  return (
    <div style={{ position: 'absolute', left: leftInset != null ? leftInset : Lay.gap, right: rightInset, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + Lay.dockBottom + 'px)', zIndex: isMobile && panelOpen ? 950 : 280,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none', transition: 'right .35s ease, left .28s ease' }}>
      <nav data-tut="bottom-nav" aria-label="بخش‌های اصلی"
        style={{ pointerEvents: 'auto', width: Lay.dockW || '100%', maxWidth: '100%', height: Lay.dockH, display: 'flex', alignItems: 'stretch', padding: 5, gap: 3, boxSizing: 'border-box',
          background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair,
          borderRadius: T.radius.xl, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl2Rise .5s .1s both cubic-bezier(.2,.9,.3,1)' }}>
        {NAV.map(item => {
          const toggle = item.key === 'map'
          const active = toggle ? false : (panelOpen && panelTab === item.key)
          const label = toggle ? (panelOpen ? item.label : 'پنل') : item.label
          const icon = toggle ? (panelOpen ? 'map' : 'grid') : ICONS[item.key] || 'grid'
          return (
            <button key={item.key} className={'tl4-btn' + (active ? ' is-on' : '')} onClick={() => go(item.key)}
              aria-current={active ? 'page' : undefined}
              aria-pressed={toggle ? !panelOpen : undefined}
              aria-label={toggle ? (panelOpen ? 'نمایش نقشه' : 'باز کردن پنل') : item.label}
              style={{ flex: 1, position: 'relative', border: toggle ? '1px solid ' + T.hair : '1px solid transparent', borderRadius: R.box, padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                background: toggle ? T.chip : 'transparent', color: active || toggle ? C.text : C.sub,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                fontSize: isMobile ? 10 : 10.5, fontWeight: active ? 900 : (toggle ? 800 : 650) }}>
              <Icon name={icon} size={isMobile ? 21 : 22} stroke={active ? 2 : 1.75} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
