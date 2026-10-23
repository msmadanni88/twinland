'use client'
// فعالیت‌های خودم برای صفحه پروفایل: چک‌این‌ها، امتیازها، رویدادهای کامل‌شده، کلن، نشان‌ها و علاقه‌مندی‌ها.
// فقط ردیف‌های خود کاربر خوانده می‌شود (قفل ردیف‌ها در دیتابیس همین را تضمین می‌کند) و با هر تغییر لحظه‌ای تازه می‌شود.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { REASON_LABELS, getSession, subscribeToTables } from '@/lib/game/gameSystem'
import { loadMe } from '@/lib/profile/people'
import { getToken } from '@/lib/auth/session'
import { districtLabel } from '@/lib/events/format'
import { faDigits } from '@/components/v4/kit/kit'

const LABELS = { ...REASON_LABELS, quest: 'جایزه رویداد', referral_invitee: 'جایزه دعوت', referral_inviter: 'جایزه دعوت دوست', league: 'جایزه لیگ هفتگی', league_win: 'جایزه لیگ هفتگی' }
export const reasonLabel = (r) => LABELS[r] || (String(r || '').startsWith('secret') ? 'جایزه پنهان' : 'امتیاز')

export function useMyActivity() {
  const [data, setData] = useState({ loading: true, checkins: [], xp: [], quests: [], clan: [], awards: [], favs: 0 })
  const load = useCallback(async () => {
    const s = getSession()
    const uid = s && s.user && s.user.id
    if (!uid) { setData(d => ({ ...d, loading: false })); return }
    const tk = (await getToken()) || s.access_token
    const h = { apikey: SB_KEY, Authorization: 'Bearer ' + tk }
    const get = (q) => fetch(SB_URL + '/rest/v1/' + q, { headers: h }).then(r => (r.ok ? r.json() : [])).then(r => (Array.isArray(r) ? r : [])).catch(() => [])
    const [checkins, xp, quests, clan, awards, favs] = await Promise.all([
      get('checkins?user_id=eq.' + uid + '&select=id,cafe_id,xp_awarded,created_at,district,cafes(name,district)&order=created_at.desc&limit=500'),
      get('xp_history?user_id=eq.' + uid + '&select=id,amount,reason,created_at&order=created_at.desc&limit=300'),
      get('quest_progress?user_id=eq.' + uid + '&completed=eq.true&select=quest_id,completed_at,updated_at,quests(title,reward_label,reward_xp,cafes(name))&order=updated_at.desc&limit=100'),
      get('clan_history?user_id=eq.' + uid + '&select=id,clan_name,event_type,detail,created_at&order=created_at.desc&limit=100'),
      get('awards?user_id=eq.' + uid + '&select=id,kind,code,title,icon,rarity,earned_at&order=earned_at.desc'),
      get('favorites?user_id=eq.' + uid + '&select=cafe_id'),
    ])
    setData({ loading: false, checkins, xp, quests, clan, awards, favs: favs.length })
  }, [])

  useEffect(() => {
    load()
    const s = getSession()
    const uid = s && s.user && s.user.id
    if (!uid) return
    const unsub = subscribeToTables([
      { table: 'profiles', event: 'UPDATE', filter: 'id=eq.' + uid },
      { table: 'checkins', event: 'INSERT', filter: 'user_id=eq.' + uid },
      { table: 'xp_history', event: 'INSERT', filter: 'user_id=eq.' + uid },
      { table: 'awards', event: '*', filter: 'user_id=eq.' + uid },
      { table: 'clan_history', event: '*', filter: 'user_id=eq.' + uid },
      { table: 'favorites', event: '*', filter: 'user_id=eq.' + uid },
    ], (p) => { if (p.table === 'profiles') loadMe(true); else load() })
    return () => unsub()
  }, [load])

  // تایم‌لاین یکپارچه؛ امتیاز چک‌این‌ها کنار خود چک‌این نوشته می‌شود و جدا تکرار نمی‌شود
  const timeline = useMemo(() => {
    const items = []
    data.checkins.forEach(c => items.push({ k: 'c' + c.id, cat: 'checkin', icon: 'pin', at: c.created_at,
      title: 'چک‌این در ' + ((c.cafes && c.cafes.name) || 'کافه'), sub: faDigits(districtLabel((c.cafes && c.cafes.district) || c.district || '')), amount: c.xp_awarded || 0 }))
    data.xp.filter(x => !String(x.reason || '').startsWith('checkin')).forEach(x => items.push({ k: 'x' + x.id, cat: 'xp', icon: 'star', at: x.created_at, title: reasonLabel(x.reason), sub: '', amount: x.amount }))
    data.quests.forEach(q => items.push({ k: 'q' + q.quest_id, cat: 'quest', icon: 'target', at: q.completed_at || q.updated_at,
      title: 'رویداد کامل شد: ' + ((q.quests && q.quests.title) || ''), sub: [(q.quests && q.quests.cafes && q.quests.cafes.name), (q.quests && q.quests.reward_label)].filter(Boolean).join(' · '), amount: 0 }))
    const CLAN = { joined: 'عضو کلن شدی', left: 'کلن را ترک کردی', created: 'کلن را ساختی', record: 'رکورد کلن', leader: 'رهبر کلن شدی' }
    data.clan.forEach(c => items.push({ k: 'l' + c.id, cat: 'clan', icon: 'users', at: c.created_at,
      title: (CLAN[c.event_type] || 'کلن') + (c.clan_name ? ': ' + c.clan_name : ''), sub: c.detail && !CLAN[c.event_type] ? c.detail : '', amount: 0 }))
    data.awards.forEach(a => items.push({ k: 'a' + a.id, cat: 'award', icon: a.kind === 'badge' ? 'medal' : 'image', at: a.earned_at,
      title: (a.kind === 'badge' ? 'نشان تازه: ' : 'آیتم تازه: ') + (a.title || a.code || ''), sub: '', amount: 0 }))
    return items.filter(i => i.at).sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [data])

  const stats = useMemo(() => {
    const cafes = new Set(data.checkins.map(c => c.cafe_id)).size
    const districts = new Set(data.checkins.map(c => (c.cafes && c.cafes.district) || c.district).filter(Boolean)).size
    return { checkins: data.checkins.length, cafes, districts, favs: data.favs, items: data.awards.filter(a => a.kind !== 'badge').length, badges: data.awards.filter(a => a.kind === 'badge').length }
  }, [data])

  return { ...data, timeline, stats, reload: load }
}
