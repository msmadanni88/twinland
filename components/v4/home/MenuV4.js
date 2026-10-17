'use client'
// منوی اصلی — نسخه v4.0
// همان گزینه‌ها و همان رفتار منوی مشترک، روی یک کارت شیشه‌ای با آیکون خطی.
// ردیف زیر ماوس یک قرص پیوسته به لبه داخلی کارت (چپ، سمت نقشه) می‌شود. بالای منو «حلقه تو» با چهره دوستان و هم‌کلنی‌هاست،
// و یک کلید حالت روشن و تیره؛ انتخاب پالت رنگ در این نسخه نیست (کدش در نسخه‌های قبل سر جایش مانده).
import { useState } from 'react'
import { L, ROUTE } from '@/lib/theme/labels'
import { InstallSheet, ReferralSheet } from '@/components/v3/growth/GrowthSheets'
import { Icon } from '@/components/v4/icons'
import { CircleCard } from '@/components/v4/ui/AvatarStack'

function Switch({ on, C, T, onClick, label }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={!!on} aria-label={label} className="tl4-press"
      style={{ position: 'relative', width: 44, height: 26, borderRadius: 99, border: '1px solid ' + T.hair, cursor: 'pointer', flexShrink: 0, padding: 0,
        background: on ? C.accent : T.chip, transition: 'background .25s ease' }}>
      <span style={{ position: 'absolute', top: 2, right: on ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: on ? T.onAccent : C.card, boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'right .25s cubic-bezier(.2,.9,.3,1)' }} />
    </button>
  )
}

export function MenuV4({ C, T, TH, isMobile, demoOn, toggleDemo, showBusiness, backfillDistricts, backfilling, effAdmin, isOwner, onLogout, resetMe, setPanelOpen, setPanelTab, setShowMapSettings, setShowMenu, setShowXP, setTab, setTutorialReplay, showMenu, showToast, themeMode, toggleMode, toggleViewMode, viewAsUser }) {
  const [sheet, setSheet] = useState(null)
  const items = [
    { key: 'invite', icon: 'gift', label: 'دعوت دوست · ۱۵۰ امتیاز برای هر دو', userOnly: true },
    { key: 'install', icon: 'phone', label: 'نصب روی گوشی و اعلان' },
    { key: 'map', icon: 'map', label: 'نقشه' },
    { key: 'missions', icon: 'target', label: 'ماموریت‌ها' },
    { key: 'profile', icon: 'user', label: L.profile, href: ROUTE.profile },
    { key: 'rank', icon: 'trophy', label: L.leaderboard, href: ROUTE.leaderboard },
    { key: 'clans', icon: 'users', label: L.clans, href: ROUTE.clans },
    { key: 'quests', icon: 'list', label: L.quests, href: ROUTE.quests },
    { key: 'gallery', icon: 'image', label: L.gallery, href: ROUTE.gallery },
    { key: 'business', icon: 'store', label: L.business, href: ROUTE.business },
    { key: 'admin', icon: 'shield', label: 'پنل ادمین', href: '/admin', adminOnly: true },
    { key: 'xp', icon: 'star', label: L.xpSystem },
    { key: 'tutorial', icon: 'help', label: L.tutorial },
    { key: 'settings', icon: 'sliders', label: L.settings },
    ...(toggleDemo ? [{ key: 'demo', icon: 'film', label: demoOn ? 'خاموش کردن حالت نمایشی' : 'حالت نمایشی — شهر شلوغ ساختگی', adminOnly: true }] : []),
    { key: 'reset', icon: 'refresh', label: 'ریست حساب (تست)', adminOnly: true },
    { key: 'backfill', icon: 'map', label: 'پرکردن منطقه کافه‌ها', adminOnly: true },
    { key: 'logout', icon: 'logout', label: L.logout },
  ].filter(item => (!item.adminOnly || effAdmin) && (item.key !== 'business' || showBusiness !== false) && (!item.userOnly || !showBusiness || isOwner))

  function act(it) {
    const key = it.key
    if (key === 'backfill') { backfillDistricts(); return }
    setShowMenu(false)
    if (key === 'demo') { toggleDemo && toggleDemo(); return }
    if (key === 'reset') { resetMe(); return }
    if (key === 'logout') { onLogout && onLogout(); return }
    if (key === 'xp') { setShowXP(true); return }
    if (key === 'tutorial') { setTutorialReplay(true); return }
    if (key === 'settings') { setShowMapSettings(true); return }
    if (key === 'missions') { setPanelOpen(true); setPanelTab('missions'); return }
    if (key === 'map') { setTab('map'); setPanelOpen(false); return }
    if (key === 'invite' || key === 'install') { setSheet(key); return }
    showToast(it.label + ' به زودی!')
  }
  const rowStyle = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 13, border: 'none', padding: '0 16px 0 14px', height: 46, boxSizing: 'border-box',
    color: C.text, fontSize: 13.5, fontFamily: 'inherit', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', textAlign: 'right',
  }
  return (<>
    {sheet === 'invite' && <ReferralSheet C={C} showToast={showToast} onClose={() => setSheet(null)} />}
    {sheet === 'install' && <InstallSheet C={C} showToast={showToast} onClose={() => setSheet(null)} />}
    {showMenu && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: T.dark ? 'rgba(0,0,0,.32)' : 'rgba(20,20,22,.12)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'tl4Fade .18s' }} onClick={() => setShowMenu(false)}>
        <div onClick={e => e.stopPropagation()} role="menu" aria-label="منو"
          style={{ position: 'absolute', top: TH + 8, right: isMobile ? 10 : 12, left: isMobile ? 10 : 'auto', width: isMobile ? 'auto' : 340, maxHeight: 'calc(100dvh - ' + (TH + 24) + 'px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '12px 10px 14px 0', boxSizing: 'border-box', color: C.text,
            background: T.glassMenu, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, borderRadius: 22, border: '1px solid ' + T.hair, boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl4Pop .2s ease' }}>

          <div style={{ margin: '2px 4px 10px 12px', padding: 12, borderRadius: 16, background: T.chip, border: '1px solid ' + T.hair }}>
            <CircleCard C={C} T={T} compact onInvite={() => setSheet('invite')} onOpen={() => { setShowMenu(false); setPanelOpen(true); setPanelTab('clan') }} />
          </div>

          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 4px 8px 12px', padding: '10px 12px', borderRadius: 16, border: '1px solid ' + T.hair }}>
              <Icon name={viewAsUser ? 'user' : 'crown'} size={19} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{viewAsUser ? 'حالت کاربر عادی' : 'حالت مالک'}</div>
                <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{viewAsUser ? 'سایت را مثل یک کاربر معمولی می‌بینی' : 'همه‌چیز بدون محدودیت'}</div>
              </div>
              <Switch on={viewAsUser} C={C} T={T} onClick={toggleViewMode} label="حالت کاربر عادی" />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 4px 10px 12px', padding: '10px 12px', borderRadius: 16, border: '1px solid ' + T.hair }}>
            <Icon name={themeMode === 'dark' ? 'moon' : 'sun'} size={19} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>{themeMode === 'dark' ? 'حالت تیره' : 'حالت روشن'}</div>
            <Switch on={themeMode === 'dark'} C={C} T={T} onClick={toggleMode} label="حالت تیره" />
          </div>

          {items.map(it => {
            const inner = <>
              <Icon name={it.icon} size={19} />
              <span style={{ flex: 1 }}>{it.key === 'backfill' && backfilling ? 'در حال پردازش…' : it.label}</span>
              {it.href && <Icon name="chevronLeft" size={15} color={C.sub} />}
            </>
            return it.href
              ? <a key={it.key} role="menuitem" className="tl4-row l" href={it.href} style={rowStyle}>{inner}</a>
              : <button key={it.key} role="menuitem" className="tl4-row l" onClick={() => act(it)} style={rowStyle}>{inner}</button>
          })}
        </div>
      </div>
    )}
  </>)
}
