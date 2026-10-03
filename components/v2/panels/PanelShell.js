'use client'
// قاب پنل — نسخه v2.0
// دسکتاپ: کارت شیشه‌ای شناور سمت راست. موبایل: برگه پایین‌رونده.
// محتوای تب‌ها همان اجزای مشترک هستند.
import { ClanTab } from '@/components/panels/ClanTab'
import { DashboardTab } from '@/components/panels/DashboardTab'
import { MissionsTab } from '@/components/panels/MissionsTab'
import { ProfileTab } from '@/components/panels/ProfileTab'
import { RankTab } from '@/components/panels/RankTab'
import { L } from '@/lib/theme/labels'
import { useDragScroll } from '@/lib/theme/ui'

const TABS = [
  { key: 'dashboard', label: 'داشبورد', on: '/dashboard@256.png', off: '/dashboard@256_disabled.png' },
  { key: 'missions', label: L.questsShort, img: 'icon_mission' },
  { key: 'rank', label: L.leaderboardShort, img: 'icon_rank' },
  { key: 'clan', label: L.clanShort, img: 'icon_clan' },
  { key: 'profile', label: L.profile, img: 'icon_profile' },
]

export function PanelShell({ C, T, Lay, cafes, checkedIn, coins, docked, filtered, levelInfo, live, panelOpen, panelTab, setPanelOpen, setPanelTab, setSearch, setSelCafe, setShowXP, showToast, streak, totalLive, userName, xp }) {
  const tabsRef = useDragScroll()
  if (!panelOpen) return null
  const frame = docked
    ? { position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + ' + (Lay.barTop + Lay.barH + 10) + 'px)', right: Lay.gap, bottom: Lay.gap, width: Lay.panelW,
        borderRadius: T.radius.xl, animation: 'tl2Slide .35s cubic-bezier(.2,.9,.3,1)' }
    // موبایل: برگه روی داک نمی‌نشیند؛ داک پایین می‌ماند تا کلید نقشه و پنل همیشه در دسترس باشد
    : { position: 'fixed', left: Lay.gap, right: Lay.gap, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.dockBottom + Lay.dockH + 10) + 'px)',
        height: 'min(72dvh, calc(100dvh - env(safe-area-inset-top, 0px) - ' + (Lay.barTop + Lay.barH + 20) + 'px - ' + (Lay.dockBottom + Lay.dockH + 10) + 'px))',
        borderRadius: T.radius.xl, animation: 'tl2Sheet .35s cubic-bezier(.2,.9,.3,1)' }
  return (<>
    {!docked && <div onClick={() => setPanelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'tl2Fade .25s' }} />}
    <aside aria-label="پنل" style={{ ...frame, zIndex: docked ? 250 : 901, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow2 + ',' + T.highlight }}>
      {!docked && <div style={{ width: 42, height: 5, borderRadius: 99, background: T.hairStrong, margin: '10px auto 2px', flexShrink: 0 }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 8px', flexShrink: 0, borderBottom: '1px solid ' + T.hair }}>
        <div ref={tabsRef} className="tl2-noscroll" style={{ flex: 1, minWidth: 0, display: 'flex', gap: 4, overflowX: 'auto', padding: 3, borderRadius: 16, background: T.chip }}>
          {TABS.map(t => {
            const on = panelTab === t.key
            const src = t.on ? (on ? t.on : t.off) : '/' + t.img + (on ? '_active' : '_inactive') + '_L.png'
            return (
              <button key={t.key} className="tl2-press" onClick={() => setPanelTab(t.key)}
                style={{ flexShrink: 0, height: 36, padding: '0 11px', border: 'none', borderRadius: 13, display: 'flex', alignItems: 'center', gap: 5,
                  background: on ? C.card : 'transparent', color: on ? C.text : C.sub, fontSize: 12, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap',
                  boxShadow: on ? T.shadow1 : 'none' }}>
                <img src={src} alt="" width={18} height={18} style={{ objectFit: 'contain', display: 'block', opacity: on ? 1 : 0.8 }} />
                {t.label}
              </button>
            )
          })}
        </div>
        <button className="tl2-press" aria-label="بستن پنل" onClick={() => setPanelOpen(false)}
          style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 12, border: '1px solid ' + T.hair, background: T.chip, color: C.text, fontSize: 14, fontWeight: 900 }}>✕</button>
      </div>
      <div className="tl-vscroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: docked ? 0 : 'env(safe-area-inset-bottom, 0px)' }}>
        {panelTab === 'dashboard' && <DashboardTab C={C} cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} checkedIn={checkedIn} xp={xp} levelInfo={levelInfo} streak={streak} setShowXP={setShowXP} />}
        {panelTab === 'missions' && <MissionsTab C={C} cafes={cafes} setSelCafe={setSelCafe} showToast={showToast} />}
        {panelTab === 'rank' && <RankTab C={C} />}
        {panelTab === 'clan' && <ClanTab C={C} />}
        {panelTab === 'profile' && <ProfileTab C={C} xp={xp} levelInfo={levelInfo} streak={streak} checkedIn={checkedIn} userName={userName} coins={coins} />}
      </div>
    </aside>
  </>)
}
