'use client'
// ─────────────────────────────────────────────────────────────
//  همکاری کسب‌وکارها، مسیرها، کد حضور و کوپن — لایه داده نسخه v5.0
//  همه چیز از تابع‌های امن دیتابیس می‌آید و هیچ تصمیم امنیتی اینجا گرفته نمی‌شود.
//  طرح و قاعده‌ها: supabase/sql/2026-10-27_v5_sme_part2_alliances.sql و سند claude/TwinLand_SME_Expansion_Design.md
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react'
import { rpc } from '@/lib/profile/people'
import { getSession, subscribeToTables } from '@/lib/game/gameSystem'

export const KIND = {
  trail: { label: 'مسیر مشترک', icon: 'route', hint: 'کاربر در بازه تعیین‌شده به همه مکان‌ها سر می‌زند و در پایان، هر طرف جایزه خودش را می‌دهد.' },
  bounceback: { label: 'بازگشت متقابل', icon: 'handshake', hint: 'بعد از چک‌این در یک طرف، مشتری تازه طرف دیگر کوپن می‌گیرد. برای فاصله زیاد.' },
  event: { label: 'رویداد مشترک', icon: 'calendar', hint: 'رویداد زمان‌دار در یک یا دو مکان؛ چک‌این داخل بازه حساب می‌شود.' },
  clan_sponsor: { label: 'حامی کلن', icon: 'users', hint: 'وقتی کلنی در مکان تو دورهمی برگزار کند، حاضران جایزه تو را می‌گیرند.' },
}
export const TIER = {
  walk: { label: 'پیاده', hint: 'تا حدود 600 متر، مسیر هم‌روز با بازه 4 ساعت' },
  area: { label: 'محله', hint: 'تا حدود 3 کیلومتر، مسیر یک‌هفته‌ای با 2 یا 3 توقف' },
  city: { label: 'شهر', hint: 'هر فاصله‌ای، بازگشت متقابل یا گذرنامه 30 روزه' },
}
export const STATUS = {
  draft: 'پیش‌نویس', proposed: 'پیشنهاد شده', countered: 'شرایط تازه', accepted: 'پذیرفته', scheduled: 'زمان‌بندی‌شده',
  active: 'فعال', paused: 'متوقف', ended: 'تمام‌شده', declined: 'رد شده', withdrawn: 'پس گرفته', expired: 'منقضی',
}
export const EVENT_TEXT = {
  proposed: 'پیشنهاد داد', countered: 'شرایط را عوض کرد', accepted: 'پذیرفت', activated: 'همکاری شروع شد', started: 'زمان شروع رسید',
  paused: 'متوقف شد', resumed: 'ادامه پیدا کرد', ended: 'تمام شد', declined: 'رد کرد', withdrawn: 'پس گرفت', expired: 'منقضی شد', budget_raised: 'بودجه را بالا برد',
}
export const PAUSE_REASON = {
  budget: 'بودجه جایزه یکی از طرف‌ها تمام شد',
  place_closed: 'یکی از مکان‌ها بسته یا پنهان شد',
  business_unverified: 'احراز یکی از طرف‌ها برداشته شد',
  manual: 'یکی از طرف‌ها آن را نگه داشت',
}
export function pauseText(r) {
  return PAUSE_REASON[String(r || '').split(':')[0]] || 'متوقف شد'
}

export const ALLIANCE_ERRORS = {
  auth: 'اول وارد حساب شو.',
  not_allowed: 'این کار فقط از صاحب یا مدیر همین شعبه برمی‌آید.',
  not_party: 'این شعبه طرف این همکاری نیست.',
  bad_spec: 'ورودی درست نیست.',
  place_inactive: 'مکان تو الان روی نقشه نیست.',
  bad_kind: 'نوع همکاری را انتخاب کن.',
  bad_title: 'عنوان باید 3 تا 60 حرف باشد.',
  bad_blurb: 'توضیح حداکثر 200 حرف است.',
  bad_reward: 'جایزه باید 2 تا 80 حرف باشد.',
  bad_budget: 'سقف جایزه کل بین 1 تا 10000 و سقف روزانه بین 1 تا 1000 است.',
  budget_only_up: 'بعد از شروع، بودجه فقط بالا می‌رود.',
  bad_coupon_days: 'اعتبار کوپن بین 1 تا 60 روز است.',
  self_partner: 'نمی‌شود با خودت همکاری کنی.',
  bad_partners: 'تعداد همکارها با این نوع جور نیست: مسیر 1 تا 4 همکار، بازگشت متقابل دقیقاً یکی، رویداد حداکثر یکی، حامی کلن بدون همکار.',
  reward_required: 'برای این نوع دست‌کم یک طرف باید جایزه بگذارد.',
  partner_unavailable: 'همکار انتخاب‌شده تأییدشده یا فعال نیست.',
  same_brand: 'شعبه‌های یک برند با هم همکاری ثبت نمی‌کنند.',
  too_many_active: 'هر شعبه حداکثر 5 همکاری فعال دارد.',
  too_many_open: 'حداکثر 10 پیشنهاد باز داری؛ اول جواب بقیه بیاید.',
  rate_limited: 'در 24 ساعت حداکثر 20 پیشنهاد می‌شود داد.',
  event_needs_end: 'رویداد باید زمان پایان داشته باشد.',
  bad_dates: 'تاریخ‌ها درست نیست: دست‌کم یک ساعت و حداکثر 180 روز؛ رویداد حداکثر 14 روز.',
  too_many_for_tier: 'برای این فاصله توقف زیادی گذاشته‌ای: پیاده تا 4 و محله تا 3 توقف.',
  bad_required: 'تعداد توقف لازم درست نیست.',
  no_device: 'برای کد حضور، اول در زبانه کارکنان یک دستگاه صندوق بساز.',
  bad_state: 'این همکاری در حالتی نیست که این کار را بپذیرد.',
  version_mismatch: 'شرایط همین الان عوض شده؛ نسخه تازه را ببین و دوباره بپذیر.',
  cannot_start: 'همکاری شروع نشد: یکی از مکان‌ها یا طرف‌ها آماده نیست.',
  cannot_resume: 'هنوز نمی‌شود ادامه داد. اگر بودجه تمام شده، اول بودجه را بالا ببر.',
  bad_action: 'کار ناشناخته.',
  network: 'اتصال برقرار نشد؛ دوباره امتحان کن.',
  not_found: 'پیدا نشد.',
  too_many: 'حداکثر 3 دستگاه فعال می‌شود داشت.',
  bad_code: 'کد شش رقم است.',
  wrong_code: 'کد درست نبود؛ کد تازه را از صندوق بگیر.',
  too_many_tries: 'چند بار اشتباه شد؛ ده دقیقه دیگر دوباره امتحان کن.',
  no_checkin: 'اول همین‌جا چک‌این کن، بعد کد حضور را بزن.',
  not_authorized: 'این کد مال مکان تو نیست.',
  own_coupon: 'کوپن خودت را نمی‌توانی تأیید کنی.',
  already_used: 'این کد قبلاً استفاده شده.',
  needs_presence: 'این کوپن هنوز با کد حضور باز نشده.',
  expired: 'تاریخ این کد گذشته.',
  daily_cap: 'سقف تأیید امروز پر شده.',
  owner_only: 'این کار فقط از صاحب شعبه برمی‌آید.',
  bad_role: 'نقش درست نیست.',
  code: 'این کد دعوت پیدا نشد یا تاریخش گذشته.',
  not_member: 'این نفر عضو کارکنان نیست.',
  owner: 'صاحب شعبه را نمی‌شود برداشت.',
  bad_steps: 'مسیر 2 تا 5 مکان متفاوت می‌خواهد؛ رویداد 1 تا 5.',
  place_unavailable: 'یکی از مکان‌ها روی نقشه یا داخل بازی نیست.',
  bad_xp: 'عددهای امتیاز خارج از بازه است.',
  bad_window: 'بازه مسیر درست نیست.',
}
export function errText(res, fallback) {
  const e = res && res.error
  return ALLIANCE_ERRORS[e] || fallback || 'انجام نشد، دوباره امتحان کن.'
}

// کلید تکرارناپذیر برای هر کار مهم، تا دوبار زدن یک دکمه دوبار کار نکند
export function opKey() {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID() } catch (e) {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}

const fa = (n) => Number(n || 0).toLocaleString('fa')
export function distText(m) {
  if (m == null) return ''
  return m < 1000 ? fa(Math.round(m / 10) * 10) + ' متر' : fa(Math.round(m / 100) / 10) + ' کیلومتر'
}
export function walkText(min) {
  if (!min) return ''
  return min < 60 ? fa(min) + ' دقیقه پیاده' : fa(Math.round(min / 6) / 10) + ' ساعت پیاده'
}
export function leftText(iso) {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - Date.now()
  if (!(ms > 0)) return 'مهلت تمام شد'
  const h = ms / 3600000
  if (h < 1) return fa(Math.max(1, Math.round(ms / 60000))) + ' دقیقه مانده'
  if (h < 48) return fa(Math.round(h)) + ' ساعت مانده'
  return fa(Math.round(h / 24)) + ' روز مانده'
}
export function dateText(iso) {
  try { return new Date(iso).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' }) } catch (e) { return '' }
}
export function windowText(h) {
  if (!h) return ''
  return h < 48 ? fa(h) + ' ساعت' : fa(Math.round(h / 24)) + ' روز'
}

// ── سمت کاربر ──────────────────────────────────────────────
export const alliancesNear = (lat, lng, km) => rpc('alliances_near', { p_lat: lat == null ? null : lat, p_lng: lng == null ? null : lng, p_km: km || 5 })
export const alliancesAtPlace = (cafeId) => rpc('alliances_at_place', { p_cafe: cafeId })
export const allianceDetail = (id) => rpc('alliance_detail', { p_id: id })
export const myAlliances = () => rpc('my_alliances', {})
export async function verifyPresence(cafeId, code) {
  return (await rpc('verify_presence', { p_cafe: cafeId, p_code: code })) || { ok: false, error: 'network' }
}

// همکاری‌های فعال نزدیک مرکز نقشه؛ با هر چک‌این و هر سه دقیقه تازه می‌شود
export function useAlliancesNear({ enabled = true, getPos, km = 8 } = {}) {
  const [items, setItems] = useState(null)
  const posRef = useRef(getPos); posRef.current = getPos
  const load = useCallback(async () => {
    if (!enabled) return
    const p = (posRef.current && posRef.current()) || null
    const r = await alliancesNear(p ? p.lat : null, p ? p.lng : null, km)
    setItems(Array.isArray(r) ? r : (items => items || []))
  }, [enabled, km])
  useEffect(() => {
    if (!enabled) return
    load()
    const t = setInterval(() => { if (!document.hidden) load() }, 180000)
    const s = getSession(); const uid = s && s.user && s.user.id
    const un = uid ? subscribeToTables([{ table: 'checkins', event: 'INSERT', filter: 'user_id=eq.' + uid }], () => setTimeout(load, 1200)) : () => {}
    return () => { clearInterval(t); un() }
  }, [enabled, load])
  return { items: items || [], loaded: items !== null, reload: load }
}

export function usePlaceAlliances(cafeId, enabled = true) {
  const [items, setItems] = useState(null)
  const load = useCallback(async () => {
    if (!cafeId || !enabled) return
    const r = await alliancesAtPlace(cafeId)
    setItems(Array.isArray(r) ? r : [])
  }, [cafeId, enabled])
  useEffect(() => { setItems(null); load() }, [load])
  return { items: items || [], loaded: items !== null, reload: load }
}

export function useMyAlliances(enabled = true) {
  const [data, setData] = useState(null)
  const load = useCallback(async () => {
    if (!enabled) return
    const r = await myAlliances()
    setData(r && r.ok ? r : { ok: false, items: [], open_coupons: 0 })
  }, [enabled])
  useEffect(() => {
    load()
    const s = getSession(); const uid = s && s.user && s.user.id
    if (!uid || !enabled) return
    const un = subscribeToTables([{ table: 'checkins', event: 'INSERT', filter: 'user_id=eq.' + uid }], () => setTimeout(load, 1200))
    return () => un()
  }, [load, enabled])
  return { items: (data && data.items) || [], openCoupons: (data && data.open_coupons) || 0, loaded: data !== null, reload: load }
}

// قدم‌های انجام‌شده و لازم یک کارت
export function progressOf(a) {
  const steps = (a.places || []).filter(p => p.is_step)
  const done = steps.filter(p => p.done).length
  const need = a.need || steps.length || 1
  const mine = a.mine || null
  return { steps, done, need, mine, active: !!(mine && mine.status === 'active'), complete: !!(mine && mine.status === 'done') }
}

// ── پنل کسب‌وکار ───────────────────────────────────────────
export const listBusiness = (bid) => rpc('alliance_list_business', { p_business: bid })
export const suggest = (bid) => rpc('alliance_suggest', { p_business: bid })
export const propose = (bid, spec, key) => rpc('alliance_propose', { p_business: bid, p_spec: spec, p_op_key: key || opKey() })
export const updateTerms = (aid, bid, spec) => rpc('alliance_update_terms', { p_alliance: aid, p_business: bid, p_spec: spec })
export const accept = (aid, bid, version, key) => rpc('alliance_accept', { p_alliance: aid, p_business: bid, p_version: version, p_op_key: key || opKey() })
export const action = (aid, bid, act, note) => rpc('alliance_action', { p_alliance: aid, p_business: bid, p_action: act, p_note: note || null })
export const deviceAdd = (bid, label) => rpc('org_device_add', { p_business: bid, p_label: label || 'صندوق' })
export const deviceList = (bid) => rpc('org_device_list', { p_business: bid })
export const deviceRevoke = (bid, id) => rpc('org_device_revoke', { p_business: bid, p_device: id })
export const presenceCode = (id) => rpc('presence_code', { p_device: id })
export const staffRedeem = (code, key) => rpc('staff_redeem', { p_code: code, p_op_key: key || opKey() })
export const staffInvite = (bid, role) => rpc('org_staff_invite', { p_business: bid, p_role: role || 'staff' })
export const staffJoin = (code) => rpc('org_staff_join', { p_code: code })
export const staffList = (bid) => rpc('org_staff_list', { p_business: bid })
export const staffRemove = (bid, uid) => rpc('org_staff_remove', { p_business: bid, p_user: uid })
export const myBusinesses = () => rpc('my_businesses', {})

// ── مالک اپ ────────────────────────────────────────────────
export const platformCreate = (spec) => rpc('alliance_platform_create', { p_spec: spec })
export const platformAction = (id, act) => rpc('alliance_platform_action', { p_id: id, p_action: act })
export const adminOverview = () => rpc('alliance_admin_overview', {})
export const affinityRebuild = () => rpc('alliance_affinity_rebuild', {})
export const categoryStatus = () => rpc('sme_category_status', {})
export const launchCategory = (key, on) => rpc('sme_launch_category', { p_key: key, p_on: on !== false })
