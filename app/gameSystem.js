// ============================================================================
// gameSystem.js — منبع واحد حقیقت برای XP، لِوِل، رتبه، یوزرهای نمونه و realtime
// همه‌ی صفحات (نقشه، رتبه، پروفایل، کلن، داشبورد) باید فقط از این ماژول بخونن.
// هیچ صفحه‌ای نباید LEVELS یا SAMPLE یا آستانه‌ی XP خودش رو تعریف کنه.
// ============================================================================

export const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
export const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

// ── جدول لِوِل‌ها (تنها نسخه‌ی معتبر) ─────────────────────────────────────────
// این آستانه‌ها باید دقیقاً با فرمول level داخل RPC award_xp در دیتابیس یکی باشن.
export const LEVELS = [
  { level: 1, name: 'تازه‌وارد',  minXP: 0,    icon: '🌱', color: '#8BC34A' },
  { level: 2, name: 'کافه‌رو',    minXP: 100,  icon: '☕', color: '#FF9800' },
  { level: 3, name: 'کاشف',      minXP: 300,  icon: '🔍', color: '#2196F3' },
  { level: 4, name: 'ماجراجو',   minXP: 600,  icon: '⚡', color: '#9C27B0' },
  { level: 5, name: 'اسطوره',    minXP: 1000, icon: '🏆', color: '#FF5722' },
  { level: 6, name: 'افسانه‌ای', minXP: 2000, icon: '👑', color: '#FFD700' },
]

// اطلاعات کامل لِوِل از روی XP: لِوِل فعلی، لِوِل بعدی، درصد پیشرفت، XP باقی‌مانده
export function getLevelInfo(xp) {
  const x = Number(xp) || 0
  let current = LEVELS[0]
  let next = LEVELS[1] || null
  for (let i = 0; i < LEVELS.length; i++) {
    if (x >= LEVELS[i].minXP) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  const progress = next
    ? Math.min(100, ((x - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100
  const remaining = next ? Math.max(0, next.minXP - x) : 0
  return { current, next, progress, remaining }
}

// نگاشت XP → شماره‌ی لِوِل (باید با CASE داخل award_xp در SQL یکی باشه)
export function levelNumberOf(xp) {
  return getLevelInfo(xp).current.level
}

// ── XP config (مقادیر پاداش — فقط برای نمایش؛ منبع واقعی، RPC دیتابیسه) ───────
export const XP_CONFIG = {
  checkin: 20, checkin_top: 30, checkin_first: 50, streak_bonus: 10, event_bonus: 40,
}

// ── یوزرهای نمونه (واقعی نیستن) ──────────────────────────────────────────────
// یک لیست واحد که همه‌ی صفحات از همین می‌خونن تا اعداد همه‌جا یکی باشه.
// وقتی کاربر واقعی زیاد شد، فقط همین آرایه رو خالی کن.
export const SAMPLE_USERS = [
  { id: 's1', name: 'سارا',  avatar: '🦊', xp: 1840, sample: true },
  { id: 's2', name: 'نیما',  avatar: '🐧', xp: 1620, sample: true },
  { id: 's3', name: 'مهسا',  avatar: '🐱', xp: 880,  sample: true },
  { id: 's4', name: 'رضا',   avatar: '🦁', xp: 760,  sample: true },
  { id: 's5', name: 'آیدا',  avatar: '🦉', xp: 210,  sample: true },
  { id: 's6', name: 'پارسا', avatar: '🐺', xp: 90,   sample: true },
]

// ── خواندن نشست از localStorage ───────────────────────────────────────────────
export function getSession() {
  try {
    const raw = localStorage.getItem('tl_session')
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s && s.access_token) return s
  } catch (e) {}
  return null
}

function authHeaders(sess) {
  return {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + ((sess && sess.access_token) || SB_KEY),
  }
}

// ── خواندن پروفایل واقعی کاربر (منبع واحد XP) ─────────────────────────────────
export async function fetchMyProfile(sess) {
  const s = sess || getSession()
  const uid = s && s.user && s.user.id
  if (!uid) return null
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/profiles?id=eq.' + uid + '&select=*',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    return (Array.isArray(rows) && rows[0]) || null
  } catch (e) { return null }
}

// ── جدول رتبه‌بندی: یوزرهای واقعی از profiles + یوزرهای نمونه، همه با XP یکسان ──
// همه‌جا از همین تابع استفاده کن تا رتبه و XP همه‌ی صفحات دقیقاً یکی باشه.
export async function fetchLeaderboard(sess) {
  const s = sess || getSession()
  const uid = (s && s.user && s.user.id) || null
  let real = []
  try {
    const list = await fetch(
      SB_URL + '/rest/v1/profiles?select=id,display_name,xp,avatar_emoji&order=xp.desc&limit=100',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    if (Array.isArray(list)) {
      real = list.map(p => ({
        id: p.id,
        name: p.display_name || 'کاربر',
        avatar: p.avatar_emoji || '☕',
        xp: p.xp || 0,
        sample: false,
        me: p.id === uid,
      }))
    }
  } catch (e) { real = [] }

  const merged = [...real, ...SAMPLE_USERS].sort((a, b) => b.xp - a.xp)
  // شماره‌ی رتبه رو همین‌جا تثبیت می‌کنیم تا همه‌ی صفحات یکی باشن
  return merged.map((u, i) => ({ ...u, rank: i + 1 }))
}

// ── افزایش XP فقط از طریق RPC اتمیک award_xp (تنها راه مجاز) ──────────────────
// خروجی: { xp, level } جدید — یا null اگه خطا خورد.
export async function awardXP(sess, amount, reason, refId = null) {
  const s = sess || getSession()
  const token = (s && s.access_token) || SB_KEY
  const uid = s && s.user && s.user.id
  if (!uid) return null
  try {
    const res = await fetch(SB_URL + '/rest/v1/rpc/award_xp', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_user: uid, p_amount: amount, p_reason: reason, p_ref: refId }),
    }).then(r => r.json())
    // RPC یک ردیف با ستون‌های new_xp و new_level برمی‌گردونه
    const row = Array.isArray(res) ? res[0] : res
    if (row && (row.new_xp != null)) return { xp: row.new_xp, level: row.new_level }
  } catch (e) {}
  return null
}

// ── تاریخچه‌ی XP کاربر (برای بخش «تاریخچه» داشبورد/پروفایل) ────────────────────
export async function fetchXpHistory(sess, limit = 50) {
  const s = sess || getSession()
  const uid = s && s.user && s.user.id
  if (!uid) return []
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/xp_history?user_id=eq.' + uid +
      '&select=amount,reason,resulting_xp,created_at&order=created_at.desc&limit=' + limit,
      { headers: authHeaders(s) }
    ).then(r => r.json())
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}

// ── جوایز/نشان‌ها/کالکتیبل‌های کاربر (با زمان دقیق کسب) ───────────────────────
export async function fetchAwards(sess) {
  const s = sess || getSession()
  const uid = s && s.user && s.user.id
  if (!uid) return []
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/awards?user_id=eq.' + uid +
      '&select=kind,code,title,icon,earned_at&order=earned_at.desc',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}

// ── Realtime: با هر تغییر XP در profiles، همه‌ی صفحات باز فوراً آپدیت می‌شن ─────
// نیاز به supabase-js نداره؛ روی WebSocket خام realtime سوپابیس کار می‌کنه.
// cb با ردیف جدید profile صدا زده می‌شه. تابع پاک‌کننده برمی‌گردونه.
export function subscribeToProfile(uid, cb) {
  if (typeof window === 'undefined' || !uid) return () => {}
  let ws = null
  let closed = false
  let ref = 0
  let heartbeat = null

  try {
    const wsUrl = SB_URL.replace('https://', 'wss://') +
      '/realtime/v1/websocket?apikey=' + SB_KEY + '&vsn=1.0.0'
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      if (closed) return
      // join روی تغییرات جدول profiles فقط برای همین کاربر
      ws.send(JSON.stringify({
        topic: 'realtime:public:profiles',
        event: 'phx_join',
        payload: {
          config: {
            postgres_changes: [
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + uid },
            ],
          },
        },
        ref: String(++ref),
      }))
      // heartbeat هر ۳۰ ثانیه تا اتصال باز بمونه
      heartbeat = setInterval(() => {
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }))
        }
      }, 30000)
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)
        if (data.event === 'postgres_changes') {
          const rec = data.payload && data.payload.data && data.payload.data.record
          if (rec) cb(rec)
        }
      } catch (e) {}
    }

    ws.onerror = () => {}
  } catch (e) {}

  return () => {
    closed = true
    if (heartbeat) clearInterval(heartbeat)
    try { ws && ws.close() } catch (e) {}
  }
}

// ── اشتراک عمومی realtime روی چند جدول ────────────────────────────────────────
// specs: آرایه‌ای از { table, event?, filter? }  (event پیش‌فرض '*')
// cb(payload) با هر تغییر صدا زده می‌شه: { table, eventType, record, old }
// یک اتصال WebSocket برای همه‌ی جدول‌ها → سبک و مقیاس‌پذیر.
export function subscribeToTables(specs, cb) {
  if (typeof window === 'undefined' || !specs || !specs.length) return () => {}
  let ws = null, closed = false, ref = 0, heartbeat = null, retry = null

  function connect() {
    if (closed) return
    try {
      const wsUrl = SB_URL.replace('https://', 'wss://') +
        '/realtime/v1/websocket?apikey=' + SB_KEY + '&vsn=1.0.0'
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        if (closed) return
        ws.send(JSON.stringify({
          topic: 'realtime:public',
          event: 'phx_join',
          payload: {
            config: {
              postgres_changes: specs.map(s => ({
                event: s.event || '*', schema: 'public', table: s.table,
                ...(s.filter ? { filter: s.filter } : {}),
              })),
            },
          },
          ref: String(++ref),
        }))
        heartbeat = setInterval(() => {
          if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }))
          }
        }, 30000)
      }

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (data.event === 'postgres_changes') {
            const d = data.payload && data.payload.data
            if (d) cb({ table: d.table, eventType: d.type, record: d.record, old: d.old_record })
          }
        } catch (e) {}
      }

      ws.onclose = () => {
        if (closed) return
        if (heartbeat) clearInterval(heartbeat)
        // اتصال مجدد بعد از ۳ ثانیه
        retry = setTimeout(connect, 3000)
      }
      ws.onerror = () => { try { ws.close() } catch (e) {} }
    } catch (e) {
      if (!closed) retry = setTimeout(connect, 3000)
    }
  }
  connect()

  return () => {
    closed = true
    if (heartbeat) clearInterval(heartbeat)
    if (retry) clearTimeout(retry)
    try { ws && ws.close() } catch (e) {}
  }
}

// ============================================================================
// ── سیستم کلن ────────────────────────────────────────────────────────────────
// ============================================================================

function rpc(sess, name, body) {
  const s = sess || getSession()
  const token = (s && s.access_token) || SB_KEY
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => r.json()).catch(() => null)
}

// رتبه‌بندی همه‌ی کلن‌ها (XP زنده از مجموع اعضا)
export async function fetchClanStandings(sess) {
  const s = sess || getSession()
  try {
    const list = await fetch(
      SB_URL + '/rest/v1/clan_standings?select=*&order=xp_total.desc',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    if (!Array.isArray(list)) return []
    return list.map((c, i) => ({ ...c, rank: i + 1 }))
  } catch (e) { return [] }
}

// کلن‌هایی که کاربر عضوشونه (با نقش و کلن فعال)
export async function fetchMyClans(sess) {
  const s = sess || getSession()
  const uid = s && s.user && s.user.id
  if (!uid) return []
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/clan_members?user_id=eq.' + uid +
      '&select=clan_id,role,is_active,clans(id,name,emblem,color,bio,leader_id,join_code)',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}

// اعضای یک کلن با XP واقعی (از profiles، تک‌منبع)
export async function fetchClanMembers(sess, clanId) {
  const s = sess || getSession()
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/clan_members?clan_id=eq.' + clanId +
      '&select=role,is_active,user_id,profiles(display_name,xp,avatar_emoji)&order=joined_at.asc',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    if (!Array.isArray(rows)) return []
    const uid = s && s.user && s.user.id
    return rows
      .map(r => ({
        user_id: r.user_id,
        role: r.role,
        name: r.profiles?.display_name || 'کاربر',
        xp: r.profiles?.xp || 0,
        avatar: r.profiles?.avatar_emoji || '☕',
        me: r.user_id === uid,
      }))
      .sort((a, b) => b.xp - a.xp)
  } catch (e) { return [] }
}

// ماموریت‌های یک کلن
export async function fetchClanMissions(sess, clanId) {
  const s = sess || getSession()
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/clan_missions?clan_id=eq.' + clanId + '&select=*&order=created_at.desc',
      { headers: authHeaders(s) }
    ).then(r => r.json())
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}

export const clanCreate     = (sess, name, emblem, color, bio) => rpc(sess, 'clan_create', { p_name: name, p_emblem: emblem, p_color: color, p_bio: bio })
export const clanJoin       = (sess, clanId, code) => rpc(sess, 'clan_join', { p_clan_id: clanId || null, p_code: code || null })
export const clanLeave      = (sess, clanId) => rpc(sess, 'clan_leave', { p_clan_id: clanId })
export const clanSetActive  = (sess, clanId) => rpc(sess, 'clan_set_active', { p_clan_id: clanId })

// سطح کلن از XP کل
export function clanLevel(xpTotal) {
  return Math.floor((Number(xpTotal) || 0) / 1000) + 1
}

// ── لیدربورد منطقه‌ای (بر اساس فعالیت در آن منطقه) ────────────────────────────
// region: شماره‌ی منطقه به‌صورت رشته، مثل '1'
export async function fetchRegionLeaderboard(sess, region, limit = 20) {
  const s = sess || getSession()
  const uid = s && s.user && s.user.id
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/region_leaderboard?region=eq.' + encodeURIComponent(region) +
      '&select=user_id,display_name,avatar_emoji,region_xp,region_checkins&order=region_xp.desc&limit=' + limit,
      { headers: authHeaders(s) }
    ).then(r => r.json())
    if (!Array.isArray(rows)) return []
    return rows.map((r, i) => ({
      rank: i + 1,
      user_id: r.user_id,
      name: r.display_name || 'کاربر',
      avatar: r.avatar_emoji || '☕',
      xp: r.region_xp || 0,
      checkins: r.region_checkins || 0,
      me: r.user_id === uid,
    }))
  } catch (e) { return [] }
}

// ── کلن‌های فعال منطقه (بر اساس فعالیت اعضا در آن منطقه) ─────────────────────
export async function fetchRegionClans(sess, region, limit = 20) {
  const s = sess || getSession()
  try {
    const rows = await fetch(
      SB_URL + '/rest/v1/region_clan_leaderboard?region=eq.' + encodeURIComponent(region) +
      '&select=clan_id,clan_name,emblem,color,region_xp,active_members&order=region_xp.desc&limit=' + limit,
      { headers: authHeaders(s) }
    ).then(r => r.json())
    if (!Array.isArray(rows)) return []
    return rows.map((r, i) => ({
      rank: i + 1,
      clan_id: r.clan_id,
      name: r.clan_name || 'کلن',
      emblem: r.emblem || '⚔️',
      color: r.color || '#8b5cf6',
      xp: r.region_xp || 0,
      members: r.active_members || 0,
    }))
  } catch (e) { return [] }
}

// نگاشت reason → متن فارسی برای نمایش در تاریخچه
export const REASON_LABELS = {
  checkin: 'چک‌این',
  checkin_top: 'چک‌این کافه برتر',
  checkin_first: 'اولین چک‌این روز',
  streak_bonus: 'بونوس استریک',
  event_bonus: 'رویداد ویژه',
  mission: 'ماموریت',
}
