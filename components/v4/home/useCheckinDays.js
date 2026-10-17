'use client'
// روزهایی که کاربر چک‌این داشته، برای کمان روزها. با هر چک‌این تازه (version) دوباره گرفته می‌شود.
// همان خواندنی است که داشبورد v3.0 انجام می‌دهد؛ یک بار گرفته و بین نوار بالا و داشبورد مشترک می‌ماند.
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { dayKey } from '@/components/v4/ui/DayArc'

let memo = { v: null, days: null }

export function useCheckinDays(version = 0, enabled = true) {
  const [days, setDays] = useState(memo.v === version && memo.days ? memo.days : [])
  useEffect(() => {
    if (!enabled) return
    if (memo.v === version && memo.days) { setDays(memo.days); return }
    const s = getSession()
    if (!s || !s.user || !s.access_token) return
    let alive = true
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + s.user.id + '&select=created_at&order=created_at.desc&limit=60', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token } })
      .then(r => (r.ok ? r.json() : [])).then(rows => {
        if (!Array.isArray(rows)) return
        const list = rows.map(r => dayKey(new Date(r.created_at)))
        memo = { v: version, days: list }
        if (alive) setDays(list)
      }).catch(() => {})
    return () => { alive = false }
  }, [version, enabled])
  return days
}
