'use client'
// داده پنجره کافه در v2.0 — همان منطق نسخه v1.0: رویدادهای فعال، پیشرفت کاربر، شرکت در رویداد و علاقه‌مندی.
// به‌علاوه عکس کاور از گالری واقعی کافه و اشتراک‌گذاری واقعی.
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession, subscribeToChanges, subscribeToTables } from '@/lib/game/gameSystem'
import { listPhotos, photoUrl } from '@/lib/cafeContent'

export function useCafeSheetData({ cafe, favs, setFavs, showToast }) {
  const [cafeEvents, setCafeEvents] = useState([])
  const [evLoading, setEvLoading] = useState(true)
  const [evProgress, setEvProgress] = useState({})
  const [joiningId, setJoiningId] = useState(null)
  const [cover, setCover] = useState(null)
  const sess = getSession()
  const uid = sess && sess.user && sess.user.id
  const token = sess && sess.access_token

  useEffect(() => {
    let alive = true
    const h = { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY) }
    const loadEvents = () => {
      fetch(SB_URL + '/rest/v1/quests?cafe_id=eq.' + cafe.id + '&active=eq.true&or=(ends_at.is.null,ends_at.gt.' + new Date().toISOString() + ')&select=id,title,icon,reward_label,reward_xp,discount_pct,target_count,collectible_defs(icon,title,rarity)&order=created_at.desc&limit=6', { headers: h })
        .then(r => r.json()).then(rows => { if (alive) setCafeEvents(Array.isArray(rows) ? rows : []) }).catch(() => {})
        .finally(() => { if (alive) setEvLoading(false) })
      if (uid) {
        fetch(SB_URL + '/rest/v1/quest_progress?user_id=eq.' + uid + '&select=quest_id,progress,completed', { headers: h })
          .then(r => r.json()).then(rows => { if (!alive) return; const m = {}; (Array.isArray(rows) ? rows : []).forEach(p => { m[p.quest_id] = p }); setEvProgress(m) }).catch(() => {})
      }
    }
    setEvLoading(true)
    loadEvents()
    const unsubLight = subscribeToChanges(['quests'], () => loadEvents())
    let unsubPersonal = () => {}
    if (uid) unsubPersonal = subscribeToTables([{ table: 'quest_progress', event: '*', filter: 'user_id=eq.' + uid }], () => loadEvents())
    return () => { alive = false; unsubLight(); unsubPersonal() }
  }, [cafe.id, uid])

  // کاور: اولین عکس واقعی گالری کافه، اگر باشد
  useEffect(() => {
    let alive = true
    setCover(null)
    listPhotos(cafe.id).then(rows => { if (alive && rows && rows[0]) setCover(photoUrl(rows[0].storage_path)) }).catch(() => {})
    return () => { alive = false }
  }, [cafe.id])

  async function joinEvent(ev) {
    if (!token) { showToast('اول وارد شو', 'warn'); return }
    setJoiningId(ev.id)
    const res = await fetch(SB_URL + '/rest/v1/rpc/join_quest', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_quest_id: ev.id }),
    }).then(r => r.json()).catch(() => null)
    setJoiningId(null)
    // شرکت = فقط ثبت‌نام. جایزه فقط با چک‌این واقعی در خود کافه باز می‌شود.
    if (res && res.ok) {
      if (res.already_completed) showToast('این رویداد رو قبلاً کامل کردی ✅', 'warn')
      else {
        const left = Math.max(0, (res.target || 1) - (res.progress || 0))
        showToast('🎯 ثبت شد! برای گرفتن جایزه برو به کافه و چک‌این کن' + (left > 1 ? (' — ' + left.toLocaleString('fa') + ' بار') : ''), 'xp')
        setEvProgress(prev => ({ ...prev, [ev.id]: { quest_id: ev.id, progress: res.progress || 0, completed: false } }))
      }
    } else {
      const em = { quest_not_active: 'این رویداد دیگه فعال نیست', not_new_customer: 'این رویداد فقط مخصوص مشتری‌های جدیده', quest_full: 'ظرفیت جایزه‌های این رویداد تموم شده', not_authenticated: 'اول وارد شو' }
      showToast(em[res && res.error] || 'خطا در شرکت', 'warn')
    }
  }

  async function toggleFav() {
    // آپدیت خوش‌بینانه + ثبت واقعی سمت سرور؛ اگر سرور قبول نکرد برمی‌گردد
    const wasFav = favs.has(cafe.id)
    const n = new Set(favs); wasFav ? n.delete(cafe.id) : n.add(cafe.id); setFavs(n)
    const back = () => { const b = new Set(favs); wasFav ? b.add(cafe.id) : b.delete(cafe.id); setFavs(b) }
    try {
      const r = await fetch(SB_URL + '/rest/v1/rpc/toggle_favorite', {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY), 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_cafe_id: cafe.id }),
      }).then(x => x.json())
      if (r && r.ok) showToast(r.fav ? ('❤️ ذخیره شد — ' + (r.count || 1).toLocaleString('fa') + ' نفر این کافه رو دوست دارن') : 'از علاقه‌مندی‌ها حذف شد')
      else { back(); showToast(r && r.error === 'not_authenticated' ? 'اول وارد شو' : 'ثبت نشد، دوباره بزن', 'warn') }
    } catch (e) { back(); showToast('خطا در ارتباط', 'warn') }
  }

  async function share() {
    const where = cafe.description || cafe.district
    const text = cafe.name + (where ? ' — ' + where : '') + ' | TwinLand'
    const url = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://twinland.ir/'
    try {
      if (navigator.share) { await navigator.share({ title: cafe.name, text, url }); return }
      await navigator.clipboard.writeText(text + '\n' + url)
      showToast('🔗 لینک کپی شد')
    } catch (e) {
      if (e && e.name === 'AbortError') return
      showToast('کپی نشد', 'warn')
    }
  }

  return { cafeEvents, cover, evLoading, evProgress, joinEvent, joiningId, share, toggleFav, token, uid }
}
