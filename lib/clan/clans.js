'use client'
// ─────────────────────────────────────────────────────────────
//  کلن — لایه داده نسخه تازه
//  همه چیز از تابع‌های امن دیتابیس می‌آید: clan_home، clan_view، clan_browse، clan_districts، cafe_clan_info
//  و نوشتن‌ها: clan_create2، clan_update، clan_join2، درخواست، ترک، نقش، انتقال، انحلال، کد، دورهمی و تابلو.
//  طرح و قاعده‌ها: supabase/sql/2026-10-24_clans_v4.sql و سند claude/TwinLand_Clan_Design.md
//
//  useClanHome داده کلن خودم را یک بار برای همه جاهای سایت نگه می‌دارد و با هر تغییر لحظه‌ای
//  در تابلو، خبرها و دورهمی‌ها، و با هر نوشتن، خودکار تازه می‌شود.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession, subscribeToTables } from '@/lib/game/gameSystem'
import { rpc } from '@/lib/profile/people'
import { getToken } from '@/lib/auth/session'

export const CLAN_EMBLEMS = ['flame', 'coffee', 'compass', 'crown', 'star', 'bolt', 'target', 'map', 'music', 'book', 'sofa', 'sunrise', 'shield', 'trophy', 'globe', 'users']
export const CLAN_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#71717A']
export const TIER_NAMES = ['برنزی', 'نقره‌ای', 'طلایی']
export const ROLE_LABEL = { leader: 'رهبر', officer: 'معاون', member: 'عضو' }
export const JOIN_MODES = [['open', 'آزاد', 'globe'], ['request', 'با درخواست', 'users'], ['invite', 'فقط با کد', 'lock']]
export const JOIN_MODE_TEXT = { open: 'ورود آزاد', request: 'ورود با درخواست', invite: 'فقط با کد دعوت' }

// نوشته خطاها؛ هر خطای سرور یک جمله روشن
export const CLAN_ERRORS = {
  auth: 'اول وارد حساب شو.',
  input: 'ورودی درست نیست.',
  business: 'حساب کسب‌وکار کلن نمی‌سازد و عضو کلن نمی‌شود.',
  in_clan: 'الان عضو یک کلن هستی. اول از آن بیرون بیا.',
  create_cooldown: 'هر هفت روز فقط یک کلن می‌شود ساخت.',
  name_len: 'اسم کلن باید ۲ تا ۲۴ حرف باشد.',
  name_chars: 'اسم کلن نمی‌تواند پیوند، آیدی، شماره یا نشانه‌های کد داشته باشد.',
  name_taken: 'این اسم را کلن دیگری دارد.',
  motto_len: 'شعار کلن حداکثر ۱۲۰ حرف است.',
  motto_links: 'شعار نمی‌تواند پیوند یا شماره تلفن داشته باشد.',
  home: 'این کافه پیدا نشد.',
  no_clan: 'عضو کلنی نیستی.',
  forbidden: 'این کار فقط از رهبر یا معاون کلن برمی‌آید.',
  cooldown: 'تازه از کلنی بیرون آمده‌ای؛ بعد از ۲۴ ساعت می‌توانی به کلن دیگری بپیوندی.',
  code: 'این کد دعوت پیدا نشد.',
  missing: 'پیدا نشد؛ شاید عوض شده باشد.',
  full: 'ظرفیت این کلن پر است.',
  level: 'لولت برای این کلن کم است.',
  invite_only: 'این کلن فقط با کد دعوت عضو می‌گیرد.',
  taken: 'این نفر حالا عضو کلن دیگری است.',
  kick_cooldown: 'معاون هر ۲۰ دقیقه فقط یک نفر را می‌تواند بیرون کند.',
  officer_limit: 'هر کلن حداکثر ۴ معاون دارد.',
  cafe: 'این کافه پیدا نشد.',
  time: 'زمان دورهمی باید دست‌کم ۱۰ دقیقه بعد و حداکثر ۷ روز دیگر باشد.',
  note_len: 'یادداشت دورهمی حداکثر ۸۰ حرف است.',
  no_links: 'پیوند، آیدی و شماره تلفن گذاشتنی نیست.',
  mine_open: 'یک دورهمی باز داری؛ اول آن برگزار یا لغو شود.',
  meetup_limit: 'سقف دورهمی‌های باز کلن پر است. از سطح ۴ کلن دو دورهمی هم‌زمان می‌شود.',
  closed: 'این دورهمی دیگر باز نیست.',
  short: 'پیام خیلی کوتاه است.',
  long: 'پیام حداکثر ۲۰۰ حرف است.',
  rate: 'کمی صبر کن و دوباره بفرست.',
  own: 'پیام خودت را نمی‌شود گزارش داد.',
  network: 'اتصال برقرار نشد؛ دوباره امتحان کن.',
}
export const clanError = (r) => CLAN_ERRORS[(r && r.error) || 'network'] || CLAN_ERRORS.network

const call = async (name, body) => {
  const r = await rpc(name, body || {})
  return r && typeof r === 'object' ? r : { ok: false, error: 'network' }
}

// ── یک منبع برای کلن خودم ──────────────────────────────────
let state = null, at = 0, inflight = null
const subs = new Set()
const emit = () => subs.forEach(f => { try { f(state) } catch (e) {} })

export function loadClanHome(force = false) {
  const s = getSession()
  if (!s || !s.access_token) { state = { ok: false, error: 'auth' }; emit(); return Promise.resolve(state) }
  if (!force && state && state.ok && Date.now() - at < 30e3) return Promise.resolve(state)
  if (inflight) return inflight
  inflight = call('clan_home').then(r => {
    inflight = null
    if (r.ok || !state || !state.ok) { state = r; at = Date.now() }
    emit()
    return state
  })
  return inflight
}

export function bustClan() { at = 0; return loadClanHome(true) }

export function useClanHome(enabled = true) {
  const [d, setD] = useState(state)
  const [loading, setLoading] = useState(!state)
  useEffect(() => {
    if (!enabled) return
    const f = (v) => setD(v)
    subs.add(f)
    loadClanHome(false).then(v => { setD(v); setLoading(false) })
    return () => { subs.delete(f) }
  }, [enabled])

  // تغییرهای لحظه‌ای کلن خودم؛ قفل ردیف‌ها فقط ردیف‌های کلن خودم را می‌فرستد
  const clanId = d && d.ok && d.clan ? d.clan.id : null
  useEffect(() => {
    if (!enabled) return
    let timer = null
    const later = () => { clearTimeout(timer); timer = setTimeout(() => loadClanHome(true), 500) }
    const specs = clanId
      ? [{ table: 'clan_posts', event: '*', filter: 'clan_id=eq.' + clanId }, { table: 'clan_events', event: 'INSERT', filter: 'clan_id=eq.' + clanId },
         { table: 'clan_meetups', event: '*', filter: 'clan_id=eq.' + clanId }, { table: 'clan_meetup_rsvps', event: '*' }]
      : []
    const s = getSession()
    const uid = s && s.user && s.user.id
    if (uid) specs.push({ table: 'notifications', event: 'INSERT', filter: 'user_id=eq.' + uid })
    // چک‌این خودم هدف هفته کلن را جلو می‌برد
    if (uid && clanId) specs.push({ table: 'checkins', event: 'INSERT', filter: 'user_id=eq.' + uid })
    if (!specs.length) return
    const off = subscribeToTables(specs, (p) => {
      if (p.table === 'notifications' && !String((p.record && p.record.type) || '').startsWith('clan_')) return
      later()
    })
    const vis = () => { if (document.visibilityState === 'visible') loadClanHome(false) }
    document.addEventListener('visibilitychange', vis)
    return () => { clearTimeout(timer); off(); document.removeEventListener('visibilitychange', vis) }
  }, [enabled, clanId])

  const reload = useCallback(() => bustClan(), [])
  return { data: d, loading: loading && !d, reload }
}

// ── خواندن‌های دیگر ────────────────────────────────────────
export const clanView = (id) => call('clan_view', { p_id: Number(id) })
export const clanBrowse = (q, sort = 'week', limit = 30) => call('clan_browse', { p_q: q || null, p_sort: sort, p_limit: limit })
export const clanDistricts = () => call('clan_districts')
export const cafeClanInfo = (cafeId) => call('cafe_clan_info', { p_cafe: cafeId })

// ── نوشتن؛ هر کدام بعد از موفقیت داده کلن را همه‌جا تازه می‌کند ─────────
const write = async (name, body) => {
  const r = await call(name, body)
  if (r.ok) bustClan()
  return r
}
export const clanCreate = (p) => write('clan_create2', { p })
export const clanUpdate = (p) => write('clan_update', { p })
export const clanJoin = (id, code) => write('clan_join2', { p_clan: id ? Number(id) : null, p_code: code || null })
export const clanRequestCancel = (id) => write('clan_request_cancel', { p_clan: Number(id) })
export const clanDecide = (requestId, accept) => write('clan_request_decide', { p_request: Number(requestId), p_accept: !!accept })
export const clanLeave = () => write('clan_leave2')
export const clanDisband = () => write('clan_disband')
export const clanKick = (uid) => write('clan_kick', { p_user: uid })
export const clanSetRole = (uid, role) => write('clan_set_role', { p_user: uid, p_role: role })
export const clanTransfer = (uid) => write('clan_transfer', { p_user: uid })
export const clanCodeRegen = () => write('clan_code_regen')
export const meetupCreate = (cafeId, at, note) => write('clan_meetup_create', { p_cafe: cafeId, p_at: at, p_note: note || null })
export const meetupRsvp = (id, going) => write('clan_meetup_rsvp', { p_meetup: Number(id), p_going: !!going })
export const meetupCancel = (id) => write('clan_meetup_cancel', { p_meetup: Number(id) })
export const postCreate = (body) => write('clan_post_create', { p_body: body })
export const postDelete = (id) => write('clan_post_delete', { p_id: Number(id) })
export const postReport = (id) => write('clan_post_report', { p_id: Number(id) })

// ── پیوند دعوت کلن ─────────────────────────────────────────
export function clanJoinLink(code) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://twinland.ir'
  return base + '/clan?join=' + encodeURIComponent(code)
}
export const clanInviteText = (name) => 'بیا عضو کلن «' + name + '» در TwinLand شو تا با هم کافه برویم و صندوق‌های هفته را باز کنیم:'

// ── جستجوی کافه برای پاتوق و دورهمی ─────────────────────────
export async function searchCafes(q, limit = 12) {
  const t = String(q || '').trim()
  if (t.length < 2) return []
  const tk = (await getToken()) || SB_KEY
  const safe = t.replace(/[%*,()]/g, ' ').trim()
  const url = SB_URL + '/rest/v1/cafes?select=id,name,district,branch&is_active=eq.true&or=(name.ilike.*' + encodeURIComponent(safe) + '*,branch.ilike.*' + encodeURIComponent(safe) + '*)&order=name.asc&limit=' + limit
  try {
    const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tk } })
    const rows = r.ok ? await r.json() : []
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}

// یک کافه با شناسه؛ برای باز شدن فرم دورهمی با همان کافه از برگه کافه
export async function getCafe(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null
  const tk = (await getToken()) || SB_KEY
  try {
    const r = await fetch(SB_URL + '/rest/v1/cafes?select=id,name,district,branch&is_active=eq.true&id=eq.' + id + '&limit=1', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tk } })
    const rows = r.ok ? await r.json() : []
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch (e) { return null }
}

// ── زمان ─────────────────────────────────────────────────
// مدت باقی‌مانده تا یک زمان آینده: «۲ روز و ۵ ساعت»، «۳ ساعت»، «۲۵ دقیقه»
export function faUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  if (!(ms > 0)) return ''
  const f = (n) => Number(n).toLocaleString('fa')
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.max(1, Math.ceil((ms % 36e5) / 6e4))
  if (d > 0) return h > 0 ? f(d) + ' روز و ' + f(h) + ' ساعت' : f(d) + ' روز'
  if (h > 0) return f(h) + ' ساعت'
  return f(m) + ' دقیقه'
}
const DAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
export function tehranParts(d) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value]))
    return p
  } catch (e) { return null }
}
// «امروز ساعت ۱۸:۳۰»، «فردا ساعت ۱۸»، «پنجشنبه ۲ آبان ساعت ۱۸»
export function meetupWhen(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const fa = (s) => String(s).replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[x])
  const time = d.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false })
  const key = (x) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(x)
  const today = key(new Date()), tomorrow = key(new Date(Date.now() + 864e5)), that = key(d)
  if (that === today) return 'امروز ساعت ' + time
  if (that === tomorrow) return 'فردا ساعت ' + time
  const day = d.toLocaleDateString('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', weekday: 'long', day: 'numeric', month: 'long' })
  return fa(day) + ' ساعت ' + time
}
// زمان از روز و ساعت انتخاب‌شده به وقت تهران؛ ایران تغییر ساعت تابستانی ندارد
export function tehranISO(dayOffset, hour, minute) {
  const now = new Date()
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date(now.getTime() + dayOffset * 864e5))
  const hh = String(hour).padStart(2, '0'), mm = String(minute).padStart(2, '0')
  return new Date(ymd + 'T' + hh + ':' + mm + ':00+03:30').toISOString()
}
export function dayLabel(offset) {
  if (offset === 0) return 'امروز'
  if (offset === 1) return 'فردا'
  const d = new Date(Date.now() + offset * 864e5)
  const p = tehranParts(d)
  const idx = p ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) : d.getDay()
  return DAY_NAMES[idx < 0 ? d.getDay() : idx]
}
