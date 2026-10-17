'use client'
// داشبورد کاربر — نسخه v4.0
// همان ساختار داشبورد v3.0 (داده یک بار گرفته می‌شود و در ctx به همه ویجت‌ها می‌رسد)،
// با کارت سلام تازه (حلقه لول رنگی و کمان روزها) و کارت «حلقه تو». بقیه ویجت‌ها همان ویجت‌های v3.0 هستند
// و چون پالت سیاه و سفید است، خودشان سیاه و سفید دیده می‌شوند. «پیشنهاد امروز» عمداً رنگی می‌ماند.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchLeaderboard, getSession, subscribeToChanges } from '@/lib/game/gameSystem'
import { useEventFeed } from '@/components/events/useEventFeed'
import { CityWidget, EventsWidget, ExploreWidget, PulseWidget, QuestsWidget, RankWidget, ShortcutsWidget, TodayWidget } from '@/components/v3/dashboard/widgets'
import { CircleWidget, HeroV4 } from '@/components/v4/dashboard/widgetsV4'
import { useCheckinDays } from '@/components/v4/home/useCheckinDays'
import { dayKey } from '@/components/v4/ui/DayArc'

export const DASHBOARD_WIDGETS_V4 = {
  hero: HeroV4,
  circle: CircleWidget,
  today: TodayWidget,
  events: EventsWidget,
  quests: QuestsWidget,
  city: CityWidget,
  pulse: PulseWidget,
  rank: RankWidget,
  explore: ExploreWidget,
  shortcuts: ShortcutsWidget,
}
export const DASHBOARD_LAYOUT_V4 = {
  user: ['hero', 'today', 'circle', 'events', 'quests', 'city', 'pulse', 'rank', 'explore', 'shortcuts'],
}

export function DashboardV4({ role = 'user', C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe, setPanelTab, onInvite }) {
  const { events, ready } = useEventFeed({ slot: 'dashboard', limit: 8 })
  const checkinDays = useCheckinDays(checkedIn.size)
  const [board, setBoard] = useState([])

  useEffect(() => {
    let alive = true
    const load = () => fetchLeaderboard(getSession()).then(list => { if (alive) setBoard(list) })
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
