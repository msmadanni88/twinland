'use client'
// نوار فرمان شناور بالای نقشه — نسخه v2.0
// منو، لوگو، شهر، جستجو در دسکتاپ، امتیاز و اعلان‌ها؛ همه روی یک شیشه.
// کلید باز و بسته کردن پنل اینجا نیست؛ رفته به داک پایین، جای دکمه نقشه.
import { CITIES } from '@/lib/constants'
import { L } from '@/lib/theme/labels'
import { alpha } from '@/components/v2/theme'

// xpProminent: نوار امتیاز رنگی و کشیده‌تر نسخه v3.0؛ بدون آن همان نوار ساده v2.0 است
export function CommandBar({ xpProminent = false, C, T, Lay, city, isMobile, levelInfo, notifications, onLogoTap, search, setSearch, setShowCity, setShowMenu, setShowNotif, setShowXP, showNotif, xp }) {
  const unread = notifications.some(n => !n.read)
  const iconBtn = (active) => ({
    width: 40, height: 40, borderRadius: 13, border: '1px solid ' + (active ? 'transparent' : T.hair), flexShrink: 0,
    background: active ? C.accent : T.chip, color: active ? T.onAccent : C.text,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, position: 'relative',
    boxShadow: active ? T.glow(C.accent) : 'none',
  })
  return (
    <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.barTop + 'px)', right: Lay.gap, left: Lay.gap, height: Lay.barH, zIndex: 300,
      display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: isMobile ? '0 8px' : '0 10px',
      background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
      border: '1px solid ' + T.hair, borderRadius: T.radius.xl, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl2Drop .45s cubic-bezier(.2,.9,.3,1)' }}>

      <button data-tut="menu-btn" className="tl2-press" aria-label="منو" onClick={() => setShowMenu(v => !v)} style={iconBtn(false)}>☰</button>

      <img src="/twinland_logo.webp" alt={L.app} onClick={onLogoTap}
        style={{ height: isMobile ? 34 : 40, width: 'auto', flexShrink: 0, objectFit: 'contain', display: 'block', cursor: 'pointer', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.35))' }} />

      {!isMobile && (
        <button className="tl2-press" onClick={() => setShowCity(true)}
          style={{ flexShrink: 0, height: 36, padding: '0 12px', borderRadius: T.radius.pill, border: '1px solid ' + T.hair, background: T.chip, color: C.text, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>📍</span>{CITIES[city].name}<span style={{ color: C.sub, fontSize: 10 }}>▾</span>
        </button>
      )}

      {!isMobile ? (
        <div style={{ flex: 1, minWidth: 0, maxWidth: 440, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', right: 14, fontSize: 13, opacity: 0.55, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'جستجوی ' + L.cafe + '…'}
            style={{ width: '100%', height: 40, borderRadius: T.radius.pill, border: '1px solid ' + (search ? C.accent : T.hair), background: search ? T.accentSoft : T.chip,
              color: C.text, fontSize: 13, padding: '0 38px 0 34px', outline: 'none', transition: 'background .2s,border-color .2s' }} />
          {search && (
            <button className="tl2-press" aria-label="پاک کردن جستجو" onClick={() => setSearch('')}
              style={{ position: 'absolute', left: 8, width: 24, height: 24, borderRadius: '50%', border: 'none', background: T.hairStrong, color: C.text, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
          )}
        </div>
      ) : <div style={{ flex: 1 }} />}

      {!isMobile && <div style={{ flex: 1 }} />}

      {/* امتیاز و لول */}
      <button className="tl2-press" onClick={() => setShowXP(true)} aria-label={L.xpSystem}
        style={{ flexShrink: 0, height: 40, minWidth: isMobile ? 0 : (xpProminent ? 320 : 190), borderRadius: T.radius.pill,
          border: '1px solid ' + (xpProminent ? alpha(C.accent, 0.55) : T.hair),
          background: xpProminent ? 'linear-gradient(90deg,' + alpha(C.accent, 0.26) + ',' + alpha(C.accent, 0.08) + ')' : T.chip,
          boxShadow: xpProminent ? '0 0 0 3px ' + alpha(C.accent, 0.1) + ', inset 0 1px 0 ' + alpha('#ffffff', 0.08) : 'none',
          padding: isMobile ? '0 10px 0 8px' : '0 12px 0 8px', display: 'flex', alignItems: 'center', gap: 8, color: C.text }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: xpProminent ? C.accent : T.accentSoft, boxShadow: xpProminent ? T.glow(C.accent, 0.5) : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{levelInfo.current.icon}</span>
        {!isMobile && (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
              <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{levelInfo.current.name}</span>
              <span style={{ color: xpProminent ? C.accent : C.sub, fontWeight: xpProminent ? 900 : 700, fontSize: xpProminent ? 12 : 11, whiteSpace: 'nowrap' }}>{Number(xp || 0).toLocaleString('fa')} {L.xp}{xpProminent ? ' · ' + Math.round(levelInfo.progress || 0).toLocaleString('fa') + '٪' : ''}</span>
            </span>
            <span style={{ height: xpProminent ? 7 : 5, borderRadius: 99, background: xpProminent ? alpha(C.text, 0.14) : T.hair, overflow: 'hidden', display: 'block' }}>
              <span style={{ display: 'block', height: '100%', width: levelInfo.progress + '%', background: T.grad, borderRadius: 99, transition: 'width .6s', boxShadow: xpProminent ? '0 0 8px ' + alpha(C.accent, 0.8) : 'none' }} />
            </span>
          </span>
        )}
        {isMobile && <span style={{ fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', color: xpProminent ? C.accent : C.text }}>{Number(xp || 0).toLocaleString('fa')}</span>}
      </button>

      <button data-tut="notif-btn" className="tl2-press" aria-label={L.notifications} onClick={() => setShowNotif(v => !v)} style={iconBtn(showNotif)}>
        🔔
        {unread && <span style={{ position: 'absolute', top: 7, left: 8, width: 9, height: 9, borderRadius: '50%', background: C.danger, border: '2px solid ' + C.card }} />}
      </button>

    </div>
  )
}

