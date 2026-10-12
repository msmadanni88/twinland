'use client'
// داشبورد کاربر — نسخه v3.0
// داده‌های مشترک اینجا یک بار گرفته می‌شود و به همه ویجت‌ها در ctx داده می‌شود.
// هر ویجت فقط ctx را می‌خواند، پس ویجت تازه به هیچ جای دیگری دست نمی‌زند.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { fetchLeaderboard, getSession, subscribeToChanges } from '@/lib/game/gameSystem'
import { useEventFeed } from '@/components/events/useEventFeed'
import { DASHBOARD_LAYOUT, DASHBOARD_WIDGETS } from '@/components/v3/dashboard/registry'

const dayKey = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()

export function DashboardV3({ role = 'user', C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe, setPanelTab }) {
  const { events, ready } = useEventFeed({ slot: 'dashboard', limit: 8 })
  const [checkinDays, setCheckinDays] = useState([])
  const [board, setBoard] = useState([])

  // روزهایی که چک‌این داشته‌ای، برای نوار هفته. با هر چک‌این تازه دوباره گرفته می‌شود.
  useEffect(() => {
    const s = getSession()
    if (!s || !s.user || !s.access_token) return
    let alive = true
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + s.user.id + '&select=created_at&order=created_at.desc&limit=60', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token } })
      .then(r => (r.ok ? r.json() : [])).then(rows => {
        if (!alive || !Array.isArray(rows)) return
        setCheckinDays(rows.map(r => dayKey(new Date(r.created_at))))
      }).catch(() => {})
    return () => { alive = false }
  }, [checkedIn.size])

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
    events, ready, board, checkinDays, checkedToday, openEvent, goTab: (t) => setPanelTab && setPanelTab(t),
  }), [C, T, cafes, filtered, live, totalLive, checkedIn, xp, levelInfo, streak, userName, showToast, setSearch, setShowXP, setSelCafe, events, ready, board, checkinDays, checkedToday, openEvent, setPanelTab])

  const order = DASHBOARD_LAYOUT[role] || DASHBOARD_LAYOUT.user
  return (
    <div style={{ paddingBottom: 28 }}>
      {order.map(id => {
        const w = DASHBOARD_WIDGETS[id]
        if (!w) return null
        const W = w.Component
        return <W key={id} ctx={ctx} />
      })}
    </div>
  )
}
