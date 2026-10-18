'use client'
// نوار بالای صفحه — نسخه v4.0
// منو، لوگو، شهر، جستجو، امتیاز با نوار چندتکه‌ای و اعلان‌ها؛ همه روی یک شیشه مات با آیکون خطی.
// نشان لول تنها چیز رنگی این نوار است.
import { CITIES } from '@/lib/constants'
import { L } from '@/lib/theme/labels'
import { Icon } from '@/components/v4/icons'
import { LevelBadge, XpBar } from '@/components/v4/kit/Meter'
import { R } from '@/components/v4/theme'
import { V4_FLAGS } from '@/components/v4/flags'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function TopBarV4({ C, T, Lay, city, isMobile, levelInfo, notifications, onLogoTap, search, setSearch, setShowCity, setShowMenu, setShowNotif, setShowXP, showMenu, showNotif, xp }) {
  const unread = notifications.some(n => !n.read)
  const sq = (on) => ({
    width: 40, height: 40, borderRadius: R.box, flexShrink: 0, padding: 0, cursor: 'pointer',
    border: '1px solid ' + (on ? 'transparent' : T.hair), background: on ? C.accent : T.chip, color: on ? T.onAccent : C.text,
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
  })
  const lv = levelInfo.current
  const pct = Math.max(0, Math.min(100, levelInfo.progress || 0))
  return (
    <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.barTop + 'px)', right: Lay.gap, left: Lay.gap, height: Lay.barH, zIndex: 300,
      display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: isMobile ? '0 7px' : '0 9px',
      background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
      border: '1px solid ' + T.hair, borderRadius: T.radius.xl, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl2Drop .45s cubic-bezier(.2,.9,.3,1)' }}>

      <button data-tut="menu-btn" className={'tl4-btn' + (showMenu ? ' is-on' : '')} aria-label="منو" aria-expanded={!!showMenu} onClick={() => setShowMenu(v => !v)} style={sq(showMenu)}>
        <Icon name="menu" size={20} />
      </button>

      <img src="/twinland_logo.webp" alt={L.app} onClick={onLogoTap}
        style={{ height: isMobile ? 32 : 38, width: 'auto', flexShrink: 0, objectFit: 'contain', display: 'block', cursor: 'pointer',
          filter: V4_FLAGS.monoLogo ? (T.dark ? 'grayscale(1) brightness(1.15) contrast(1.05)' : 'grayscale(1) contrast(1.1)') : 'none' }} />

      {!isMobile && (
        <button className="tl4-btn" onClick={() => setShowCity(true)}
          style={{ flexShrink: 0, height: 36, padding: '0 12px 0 10px', borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, color: C.text, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', cursor: 'pointer' }}>
          <Icon name="pin" size={16} />{CITIES[city].name}<Icon name="chevronDown" size={14} color={C.sub} />
        </button>
      )}

      {!isMobile ? (
        <div style={{ flex: 1, minWidth: 0, maxWidth: 420, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', right: 13, pointerEvents: 'none', color: C.sub }}><Icon name="search" size={17} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'جستجوی ' + L.cafe + '…'} aria-label={'جستجوی ' + L.cafe}
            style={{ width: '100%', height: 40, borderRadius: R.box, border: '1px solid ' + (search ? C.accent : T.hair), background: T.chip,
              color: C.text, fontSize: 13, padding: '0 40px 0 36px', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s' }} />
          {search && (
            <button className="tl4-btn" aria-label="پاک کردن جستجو" onClick={() => setSearch('')}
              style={{ position: 'absolute', left: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.hairStrong, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}>
              <Icon name="x" size={13} stroke={2.2} />
            </button>
          )}
        </div>
      ) : <div style={{ flex: 1 }} />}

      {!isMobile && <div style={{ flex: 1 }} />}

      {/* امتیاز و لول: نشان لول رنگی، نوار پنج‌تکه‌ای تا لول بعد */}
      <button className="tl4-btn" onClick={() => setShowXP(true)} aria-label={L.xpSystem + '، ' + fa(xp) + ' امتیاز'}
        style={{ flexShrink: 0, height: 40, minWidth: isMobile ? 0 : 300, borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip,
          padding: isMobile ? '0 10px 0 6px' : '0 14px 0 6px', display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 10, color: C.text, fontFamily: 'inherit', cursor: 'pointer' }}>
        <LevelBadge level={lv} size={30} C={C} T={T} />
        {isMobile ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch', width: 58 }}>
            <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fa(xp)}</span>
            <XpBar levelInfo={levelInfo} size="sm" C={C} T={T} />
          </span>
        ) : (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5 }}>
              <span style={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{lv.name}</span>
              <span style={{ color: C.sub, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fa(xp)} {L.xp} · {fa(Math.round(pct))}٪</span>
            </span>
            <XpBar levelInfo={levelInfo} size="md" C={C} T={T} />
          </span>
        )}
      </button>

      <button data-tut="notif-btn" className={'tl4-btn' + (showNotif ? ' is-on' : '')} aria-label={L.notifications + (unread ? '، تازه داری' : '')} onClick={() => setShowNotif(v => !v)} style={sq(showNotif)}>
        <Icon name="bell" size={20} />
        {unread && <span style={{ position: 'absolute', top: 8, left: 9, width: 8, height: 8, borderRadius: '50%', background: showNotif ? T.onAccent : C.text, boxShadow: '0 0 0 2px ' + (showNotif ? C.accent : C.card) }} />}
      </button>
    </div>
  )
}
