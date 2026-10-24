'use client'
// داشبورد کاربر — نسخه v4.0
// همان ساختار داشبورد v3.0 (داده یک بار گرفته می‌شود و در ctx به همه ویجت‌ها می‌رسد).
// همه ویجت‌ها نسخه v4 خودشان را دارند و از کیت v4 ساخته شده‌اند: یک کارت، یک گوشه، یک نوار پیشرفت و چهره‌های یکسان.
// ویجت‌های v3.0 دست نخورده‌اند و نسخه v3.0 همان‌ها را نشان می‌دهد.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { subscribeToChanges } from '@/lib/game/gameSystem'
import { fetchLeaderboardCards } from '@/lib/profile/people'
import { useEventFeed } from '@/components/events/useEventFeed'
import { CircleWidget, CityV4, EventsV4, ExploreV4, HeroV4, PulseV4, QuestsV4, RankV4, ShortcutsV4, TodayV4 } from '@/components/v4/dashboard/widgetsV4'
import { useCheckinDays } from '@/components/v4/home/useCheckinDays'
import { dayKey } from '@/components/v4/ui/DayArc'
import { ClanWidgetV4 } from '@/components/v4/clan/ClanWidget'

export const DASHBOARD_WIDGETS_V4 = {
  hero: HeroV4,
  circle: CircleWidget,
  clan: ClanWidgetV4,
  today: TodayV4,
  events: EventsV4,
  quests: QuestsV4,
  city: CityV4,
  pulse: PulseV4,
  rank: RankV4,
  explore: ExploreV4,
  shortcuts: ShortcutsV4,
}
export const DASHBOARD_LAYOUT_V4 = {
  user: ['hero', 'today', 'clan', 'circle', 'events', 'quests', 'city', 'pulse', 'rank', 'explore', 'shortcuts'],
}

export function DashboardV4({ role = 'user', C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe, setPanelTab, onInvite }) {
  const { events, ready } = useEventFeed({ slot: 'dashboard', limit: 8 })
  const checkinDays = useCheckinDays(checkedIn.size)
  const [board, setBoard] = useState([])

  useEffect(() => {
    let alive = true
    const load = () => fetchLeaderboardCards('all', null, 100).then(list => { if (alive && Array.isArray(list)) setBoard(list) })
    load()
    const unsub = subscribeToChanges(['profiles'], load)
    return () => { alive = false; unsub() }
  }, [])

  const openEvent = useCallback((ev) => {
    const cafe = cafes.find(c => c.id === ev.cafeId)
    if (cafe) setSelCafe({ ...cafe, _from: { source: 'dashboard', refType: 'quest', refId: String(ev.id) } })
    else showToast && showToast('این کافه الان روی نقشه نیست', 'warn')
  }, [cafes, setSelCafe, showToast])

  const checkedToday = checkinDays.includes(dayKey(new Date()))
  const ctx = useMemo(() => ({
    C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe,
    events, ready, board, checkinDays, checkedToday, openEvent, goTab: (t) => setPanelTab && setPanelTab(t), onInvite,
  }), [C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe, events, ready, board, checkinDays, checkedToday, openEvent, setPanelTab, onInvite])

  const order = DASHBOARD_LAYOUT_V4[role] || DASHBOARD_LAYOUT_V4.user
  return (
    <div style={{ paddingBottom: 28 }}>
      {order.map(id => {
        const W = DASHBOARD_WIDGETS_V4[id]
        return W ? <W key={id} ctx={ctx} /> : null
      })}
    </div>
  )
}
