'use client'
// قاب پنل — نسخه v4.0
// دسکتاپ: کارت شیشه‌ای شناور سمت راست. موبایل: برگه پایین‌رونده.
// زبانه‌ها آیکون خطی دارند و فقط زبانه فعال نامش را نشان می‌دهد؛ زبانه فعال یک قرص توپر است که با دو گوشه وارونه روی خط زیر زبانه‌ها می‌نشیند.
import { useState } from 'react'
import { ClanTabV4 } from '@/components/v4/panels/ClanTabV4'
import { MissionsV4 } from '@/components/v4/panels/MissionsV4'
import { ProfileTabV4 } from '@/components/v4/panels/ProfileTabV4'
import { LeaderboardV4 } from '@/components/v4/rank/LeaderboardV4'
import { L } from '@/lib/theme/labels'
import { useDragScroll } from '@/lib/theme/ui'
import { Icon } from '@/components/v4/icons'
import { DashboardV4 } from '@/components/v4/dashboard/DashboardV4'
import { ReferralSheetV4 } from '@/components/v4/growth/Referral'
import { R } from '@/components/v4/theme'

const TABS = [
  { key: 'dashboard', label: 'داشبورد', icon: 'grid' },
  { key: 'missions', label: L.questsShort, icon: 'target' },
  { key: 'rank', label: L.leaderboardShort, icon: 'trophy' },
  { key: 'clan', label: L.clanShort, icon: 'users' },
  { key: 'profile', label: L.profile, icon: 'user' },
]

export function PanelShellV4({ demoTabs = null, C, T, Lay, cafes, checkedIn, coins, docked, filtered, highlightQuestId, levelInfo, live, panelOpen, panelTab, setPanelOpen, setPanelTab, setSearch, setSelCafe, setShowXP, showToast, streak, totalLive, userName, xp }) {
  const tabsRef = useDragScroll()
  const [invite, setInvite] = useState(false)
  if (!panelOpen) return null
  const frame = docked
    ? { position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + (Lay.barTop + Lay.barH + 10) + 'px)', right: Lay.gap, bottom: Lay.gap, width: Lay.panelW,
        borderRadius: T.radius.xl, animation: 'tl2Slide .35s cubic-bezier(.2,.9,.3,1)' }
    : { position: 'fixed', left: Lay.gap, right: Lay.gap, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.dockBottom + Lay.dockH + 10) + 'px)',
        height: 'min(72dvh, calc(100dvh - env(safe-area-inset-top, 0px) - ' + (Lay.barTop + Lay.barH + 20) + 'px - ' + (Lay.dockBottom + Lay.dockH + 10) + 'px))',
        borderRadius: T.radius.xl, animation: 'tl2Sheet .35s cubic-bezier(.2,.9,.3,1)' }
  return (<>
    {invite && <ReferralSheetV4 showToast={showToast} onClose={() => setInvite(false)} />}
    {!docked && <div onClick={() => setPanelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: T.dark ? 'rgba(0,0,0,.4)' : 'rgba(20,20,22,.16)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'tl2Fade .25s' }} />}
    <aside aria-label="پنل" style={{ ...frame, zIndex: docked ? 250 : 901, display: 'flex', flexDirection: 'column', overflow: 'hidden', color: C.text,
      background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow2 + ',' + T.highlight }}>
      {!docked && <div style={{ width: 38, height: 4, borderRadius: 99, background: T.hairStrong, margin: '9px auto 0', flexShrink: 0 }} />}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 10px 0', flexShrink: 0, borderBottom: '2px solid ' + C.accent }}>
        <div ref={tabsRef} role="tablist" className="tl2-noscroll" style={{ flex: 1, minWidth: 0, display: 'flex', gap: 4, overflowX: 'auto', padding: '0 10px', ['--fr']: R.box + 'px' }}>
          {TABS.map(t => {
            const on = panelTab === t.key
            return (
              <button key={t.key} role="tab" aria-selected={on} aria-label={t.label} title={t.label} className={'tl4-row b' + (on ? ' is-on' : '')} onClick={() => setPanelTab(t.key)}
                style={{ flexShrink: 0, height: 38, minWidth: 40, padding: on ? '0 13px' : '0 10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                  color: on ? T.onAccent : C.sub, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
                <Icon name={t.icon} size={18} stroke={on ? 2 : 1.75} />
                {on && t.label}
              </button>
            )
          })}
        </div>
        <button className="tl4-btn" aria-label="بستن پنل" onClick={() => setPanelOpen(false)}
          style={{ width: 34, height: 34, flexShrink: 0, marginBottom: 4, borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="tl-vscroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: docked ? 0 : 'env(safe-area-inset-bottom, 0px)' }}>
        {demoTabs && (demoTabs[panelTab] || null)}
        {!demoTabs && panelTab === 'dashboard' && <DashboardV4 C={C} T={T} cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} checkedIn={checkedIn} xp={xp} levelInfo={levelInfo} streak={streak} userName={userName} setShowXP={setShowXP} setSelCafe={setSelCafe} setPanelTab={setPanelTab} onInvite={() => setInvite(true)} />}
        {!demoTabs && panelTab === 'missions' && <MissionsV4 cafes={cafes} highlightQuestId={highlightQuestId} setSelCafe={setSelCafe} showToast={showToast} />}
        {!demoTabs && panelTab === 'rank' && <LeaderboardV4 />}
        {!demoTabs && panelTab === 'clan' && <ClanTabV4 />}
        {!demoTabs && panelTab === 'profile' && <ProfileTabV4 xp={xp} levelInfo={levelInfo} streak={streak} checkedIn={checkedIn} userName={userName} showToast={showToast} />}
      </div>
    </aside>
  </>)
}
