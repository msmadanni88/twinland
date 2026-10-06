'use client'
// حالت نمایشی نسخه v3.0 — پل میان موتور شبیه‌سازی و صفحه نقشه.
// هیچ‌چیز در دیتابیس نوشته نمی‌شود. وقتی خاموش است، همان داده واقعی بدون هیچ تغییری برمی‌گردد
// و هیچ‌کدام از کدهای این پوشه اجرا نمی‌شود.
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { DEMO_USER_COUNT, decorOf, sim } from '@/components/v3/demo/simWorld'

export { DEMO_USER_COUNT }
const EMPTY = { checkins: 0, badges: 0, quests: 0, questDone: 0, newVisitors: 0 }
const cut = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }

// me: وضعیت واقعی کاربر (فقط خوانده می‌شود) — امتیاز و چک‌این‌های ساختگی روی آن سوار می‌شوند
export function useDemoSim({ cafes, enabled, live, me }) {
  const ready = enabled && cafes.length > 0
  const snap = useSyncExternalStore(sim.subscribe, sim.getSnapshot, () => null)
  const on = ready && !!snap
  const cafesRef = useRef(cafes)

  useEffect(() => {
    if (!ready) {
      // خاموش شدن با دکمه: دنیا و هر چه در حافظه تب مانده پاک می‌شود
      if (!enabled) { try { if (sessionStorage.getItem('tl_demo') !== '1') sim.clear() } catch (e) {} }
      return
    }
    sim.start(cafesRef.current)
    return () => { setTimeout(() => sim.pause(), 0) }
  }, [ready, enabled])

  const worldId = snap ? snap.startedAt : 0
  // ویترین ساختگی مکان‌ها. هویت این آرایه در طول نمایش ثابت می‌ماند تا پین‌ها بی‌دلیل از نو ساخته نشوند
  const demoCafes = useMemo(() => {
    if (!on) return cafes
    const W = sim.world(); const byId = {}
    if (W) W.cafes.forEach(c => { byId[c.id] = c })
    return cafes.map(c => {
      const d = decorOf(c), q = byId[c.id] && byId[c.id].quest
      return { ...c, motto: c.motto || d.motto, featured_item_name: c.featured_item_name || d.item, active_quest: q ? { id: q.id, title: q.title, icon: q.icon } : null, is_full: c.is_full || d.full }
    })
  }, [cafes, on, worldId])
  cafesRef.current = on ? demoCafes : cafes

  useEffect(() => { if (on) sim.setMe({ xp: me.xp, name: me.name || 'تو' }) }, [on, me.xp, me.name])

  // جان دادن به نقشه: پین هر چک‌این ساختگی باز می‌شود، عددش تکان می‌خورد و کمپین تازه همان‌جا روی پین می‌نشیند
  useEffect(() => {
    if (!on) return
    const open = new Set()
    const cap = () => (window.innerWidth < 700 ? 3 : 5)
    const hostOf = (id) => { const lv = document.getElementById('lv-' + id); return lv && lv.closest('.tl2-cafe,.tl2-pin') }
    const pop = (id, ms) => {
      const h = hostOf(id)
      if (!h || open.size >= cap() || h.classList.contains('is-open')) return
      open.add(h); h.classList.add('is-open', 'tl3-demo-pop')
      setTimeout(() => { try { h.classList.remove('is-open', 'tl3-demo-pop') } catch (e) {} open.delete(h) }, ms)
    }
    const bump = (id) => { const lv = document.getElementById('lv-' + id); if (!lv) return; lv.classList.remove('tl3-bump'); void lv.offsetWidth; lv.classList.add('tl3-bump') }
    const off = sim.onLive((evs) => {
      try {
        evs.forEach(ev => {
          if (ev.type === 'checkin' || ev.type === 'quiet') bump(ev.cafeId)
          if (ev.type === 'checkin') pop(ev.cafeId, 4200)
          if (ev.type === 'quest_new' && ev.quest) {
            const c = cafesRef.current.find(x => x.id === ev.cafeId)
            if (c) c.active_quest = { id: ev.quest.id, title: ev.quest.title, icon: ev.quest.icon }
            const h = hostOf(ev.cafeId), node = h && h.querySelector('.tl2-node-quest')
            if (node) {
              node.setAttribute('data-quest-id', ev.quest.id)
              const disc = node.querySelector('.tl2-disc'), tag = node.querySelector('.tl2-tag')
              if (disc) disc.textContent = ev.quest.icon
              if (tag) tag.textContent = cut(ev.quest.title, 16)
            }
            pop(ev.cafeId, 5200)
          }
        })
      } catch (e) {}
    })
    return () => {
      off()
      try { document.querySelectorAll('.tl3-demo-pop').forEach(h => h.classList.remove('is-open', 'tl3-demo-pop')) } catch (e) {}
    }
  }, [on])

  const newChecked = snap ? snap.me.newChecked : null
  const checkedIn = useMemo(() => {
    if (!on) return me.checkedIn
    const s = new Set(me.checkedIn); newChecked.forEach(id => s.add(id)); return s
  }, [on, me.checkedIn, newChecked])

  if (!on) return { on: false, cafes, live, feed: [], leaders: null, counts: EMPTY, snap: null, me: null, users: DEMO_USER_COUNT, checkinMe: null }
  return {
    on: true, cafes: demoCafes, live: snap.live, snap, feed: snap.feed, counts: snap.counters, users: snap.users,
    me: { name: me.name || 'تو', xp: (Number(me.xp) || 0) + snap.me.dxp, coins: (Number(me.coins) || 0) + snap.me.coins, streak: Math.max(Number(me.streak) || 0, snap.me.newChecked.length ? 1 : 0), checkedIn },
    // چک‌این دستی در حالت نمایشی — بدون موقعیت‌یاب و بدون هیچ درخواستی به سرور
    checkinMe(cafe) {
      if (!cafe) return { ok: false }
      if (checkedIn.has(cafe.id)) return { ok: false, reason: 'dup' }
      const gain = sim.checkinMe(cafe.id)
      return gain ? { ok: true, gain } : { ok: false }
    },
  }
}
