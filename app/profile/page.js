'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import {
  SB_URL, SB_KEY, getLevelInfo, getSession,
  fetchMyProfile, fetchXpHistory, fetchAwards, subscribeToTables, REASON_LABELS,
} from '../gameSystem'

// مدال‌های محاسبه‌شده از آمار واقعی (fallback وقتی جدول awards هنوز پر نشده)
const BADGE_DEFS = [
  { icon: '🥇', name: 'اولین چک‌این', ok: s => s.checkins >= 1 },
  { icon: '🔥', name: 'استریک ۳ روز', ok: s => s.streak >= 3 },
  { icon: '⭐', name: '۱۰ کافه',      ok: s => s.cafes >= 10 },
  { icon: '🗺️', name: '۵ منطقه',      ok: s => s.zones >= 5 },
  { icon: '👑', name: '۵۰ چک‌این',    ok: s => s.checkins >= 50 },
  { icon: '💎', name: 'کلکسیونر ۲۰',  ok: s => s.cafes >= 20 },
  { icon: '🌙', name: 'شب‌گرد',        ok: s => false },
  { icon: '🏆', name: 'قهرمان هفته',  ok: s => false },
]

const RARITY_FA = { common: 'معمولی', rare: 'کمیاب', epic: 'حماسی', legendary: 'افسانه‌ای' }

function faWhen(iso) {
  const d = new Date(iso).getTime()
  const mins = Math.floor((Date.now() - d) / 60000)
  if (mins < 1) return 'همین الان'
  if (mins < 60) return mins.toLocaleString('fa') + ' دقیقه پیش'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs.toLocaleString('fa') + ' ساعت پیش'
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'دیروز'
  return days.toLocaleString('fa') + ' روز پیش'
}

// تاریخ کامل شمسی: «۲۰ تیر ۱۴۰۵»
function faDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR-u-ca-persian', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran',
    })
  } catch (e) { return '' }
}
// تاریخ میلادی: «11 Jul 2026»
function enDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Tehran',
    })
  } catch (e) { return '' }
}
// تاریخ + ساعت کامل برای هر فعالیت: «۲۰ تیر ۱۴۰۵ · ۱۴:۳۰»
function faDateTime(iso) {
  try {
    const t = new Date(iso).toLocaleTimeString('fa-IR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
    })
    return faDate(iso) + ' · ' + t
  } catch (e) { return faWhen(iso) }
}

export default function ProfilePage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [tab, setTab] = useState('badges')
  const [histFilter, setHistFilter] = useState('all')
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [xpHistory, setXpHistory] = useState([])
  const [awards, setAwards] = useState([])
  const [clanHistory, setClanHistory] = useState([])

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    const sess = getSession()
    if (!sess || !sess.user) { window.location.href = '/'; return }
    const uid = sess.user.id
    const h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (sess.access_token || SB_KEY) }

    let alive = true
    // پروفایل واقعی (منبع واحد XP)
    fetchMyProfile(sess).then(p => { if (alive && p) setProfile(p) })
    // چک‌این‌های واقعی (برای آمار و مدال‌ها)
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone,district,city)&order=created_at.desc&limit=500', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setCheckins(rows) }).catch(() => {})
    // تاریخچه‌ی دقیق XP + جوایز
    fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
    fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })
    // تاریخچه‌ی کلن
    const reloadClanHist=()=>fetch(SB_URL + '/rest/v1/clan_history?user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=100', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setClanHistory(rows) }).catch(() => {})
    reloadClanHist()

    // realtime: پروفایل، بج‌ها، تاریخچه و چک‌این‌ها لحظه‌ای آپدیت شن
    const reloadCheckins=()=>fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone,district,city)&order=created_at.desc&limit=500', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setCheckins(rows) }).catch(() => {})
    const unsub = subscribeToTables([
      { table:'profiles',   event:'UPDATE', filter:'id=eq.'+uid },
      { table:'awards',     event:'*',      filter:'user_id=eq.'+uid },
      { table:'xp_history', event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'checkins',   event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'clan_history', event:'*',    filter:'user_id=eq.'+uid },
    ],(p)=>{
      if(!alive) return
      if(p.table==='profiles' && p.record) setProfile(prev => ({ ...(prev || {}), ...p.record }))
      if(p.table==='xp_history') fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
      if(p.table==='awards') fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })
      if(p.table==='checkins') reloadCheckins()
      if(p.table==='clan_history') reloadClanHist()
    })
    return () => { alive = false; unsub() }
  }, [])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  const xp = profile?.xp || 0
  const { current, next, progress } = getLevelInfo(xp)
  const name = profile?.display_name || 'کاربر'
  const streak = profile?.streak || 0
  // «عضو از» = چند روز از تاریخ ثبت‌نام کاربر گذشته (مثل توییتر/یوتیوب).
  // این با ریست حساب عوض نمی‌شه چون تاریخ عضویت ثابته.
  const joinedDays = profile?.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / 86400000)) : 1

  const checkinCount = checkins.length
  const cafeCount = new Set(checkins.map(c => c.cafe_id)).size
  const zoneCount = new Set(checkins.map(c => c.cafes?.zone).filter(Boolean)).size
  const stats = { checkins: checkinCount, cafes: cafeCount, streak, zones: zoneCount }

  // مدال‌ها: اگه جدول awards پر شده از همون استفاده کن، وگرنه از آمار محاسبه کن
  const earnedBadges = awards.filter(a => a.kind === 'badge')
  const useRealAwards = earnedBadges.length > 0
  const collectibles = awards.filter(a => a.kind !== 'badge')

  // ── تایم‌لاین یکپارچه: همه‌ی فعالیت‌ها از منابع مختلف در یک لیست زمانی ──────
  // هر رویداد یک category دارد که فیلتر بر اساس آن کار می‌کند.
  const timeline = (() => {
    const items = []
    // نگاشت رتبه‌ی چک‌این‌ها از xp_history (که rank_after دارن) بر اساس زمان تقریبی
    const checkinRanks = xpHistory
      .filter(h => h.reason === 'checkin' || h.reason === 'checkin_first')
      .map(h => ({ t: new Date(h.created_at).getTime(), rank: h.rank_after }))
    const findRank = (iso) => {
      const t = new Date(iso).getTime()
      let best = null, bestDiff = 5000 // تا ۵ ثانیه اختلاف = همون فعالیت
      for (const r of checkinRanks) {
        const diff = Math.abs(r.t - t)
        if (diff < bestDiff) { bestDiff = diff; best = r.rank }
      }
      return best
    }
    // چک‌این‌ها (با جزئیات کامل کافه/منطقه/شهر + رتبه)
    checkins.forEach(c => {
      const cf = c.cafes || {}
      const parts = []
      if (cf.district) parts.push('منطقه ' + cf.district)
      else if (cf.zone) parts.push(cf.zone)
      if (cf.city) parts.push(cf.city)
      items.push({
        cat: 'checkin', icon: '☕', ts: c.created_at,
        title: cf.name || 'چک‌این',
        sub: parts.join(' · '),
        rank: findRank(c.created_at),
        xp: c.xp_awarded || 0,
      })
    })
    // رویدادها و XP از xp_history (به‌جز خود چک‌این که بالا آوردیم)
    xpHistory.forEach(h => {
      const isQuest = h.reason === 'quest'
      const isCheckin = h.reason === 'checkin' || h.reason === 'checkin_first'
      if (isCheckin) return
      items.push({
        cat: isQuest ? 'quest' : 'xp',
        icon: isQuest ? '🎯' : '⭐',
        ts: h.created_at,
        title: isQuest ? 'رویداد تکمیل شد' : (REASON_LABELS[h.reason] || h.reason),
        sub: 'مجموع: ' + (h.resulting_xp || 0).toLocaleString('fa') + ' XP',
        rank: h.rank_after,
        xp: h.amount || 0,
      })
    })
    // تاریخچه‌ی کلن (عضو شدن/ترک/ساخت)
    const CLAN_EVENT = {
      joined: ['🛡️', 'عضو کلن شدی'], left: ['🚪', 'کلن رو ترک کردی'],
      created: ['👑', 'کلن رو ساختی'], record: ['🏆', 'رکورد کلنی'],
    }
    clanHistory.forEach(ch => {
      const [icon, def] = CLAN_EVENT[ch.event_type] || ['🛡️', ch.event_type]
      items.push({
        cat: 'clan', icon, ts: ch.created_at,
        title: (ch.detail || def) + (ch.clan_name ? ' — ' + ch.clan_name : ''),
        sub: '', xp: 0,
      })
    })
    // مدال‌ها و کلکسیون‌ها
    awards.forEach(a => {
      items.push({
        cat: a.kind === 'badge' ? 'badge' : 'collectible',
        icon: a.icon || (a.kind === 'badge' ? '🏅' : '💎'),
        ts: a.earned_at,
        title: (a.kind === 'badge' ? 'مدال: ' : 'آیتم: ') + (a.title || ''),
        sub: a.rarity ? RARITY_FA[a.rarity] || a.rarity : '',
        xp: 0,
      })
    })
    // مرتب‌سازی: جدیدترین اول
    return items.filter(x => x.ts).sort((a, b) => new Date(b.ts) - new Date(a.ts))
  })()

  const HIST_FILTERS = [
    ['all', '🕐', 'همه'],
    ['checkin', '☕', 'چک‌این'],
    ['quest', '🎯', 'رویداد'],
    ['xp', '⭐', 'XP'],
    ['clan', '🛡️', 'کلن'],
    ['badge', '🏅', 'مدال'],
    ['collectible', '💎', 'کلکسیون'],
  ]
  const filteredTimeline = histFilter === 'all' ? timeline : timeline.filter(x => x.cat === histFilter)

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>پروفایل</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/icon_profile_active@2x.png" alt="پروفایل" width={88} height={88} style={{ objectFit: 'contain', display: 'inline-block' }} />
        </div>

        {/* هدر پروفایل */}
        <div style={S.card}>
          <div style={S.headerRow}>
            <div style={{ ...S.avatar, borderColor: current.color }}>{current.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={S.name}>{name}</div>
              <div style={{ ...S.levelPill, background: current.color }}>{current.icon} {current.name}</div>
              {profile?.created_at && (
                <div style={{ fontSize: 10.5, color: C.sub, marginTop: 6 }}>
                  📅 عضو از {faDate(profile.created_at)}
                  <span style={{ opacity: 0.6 }}> ({enDate(profile.created_at)})</span>
                </div>
              )}
            </div>
          </div>

          <div style={S.xpRow}>
            <span style={S.xpLabel}>{xp.toLocaleString('fa')} XP</span>
            <span style={S.xpNext}>
              {next ? `تا ${next.name}: ${(next.minXP - xp).toLocaleString('fa')} XP` : 'حداکثر لول!'}
            </span>
          </div>
          <div style={S.xpTrack}>
            <div style={{ ...S.xpFill, width: progress + '%', background: current.color }} />
          </div>
        </div>

        {/* آمار واقعی */}
        <div style={S.statsGrid}>
          <Stat S={S} icon="📍" value={checkinCount} label="چک‌این" />
          <Stat S={S} icon="☕" value={cafeCount} label="کافه" />
          <Stat S={S} icon="🔥" value={streak} label="استریک" />
          <Stat S={S} icon="📅" value={joinedDays} label="روز عضویت" />
        </div>

        {/* پیش‌نمایش نگارخانه */}
        <a href="/gallery" style={S.galleryStrip}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(collectibles.length > 0 ? collectibles.slice(0, 4) : [{ icon: '💎' }, { icon: '🏆' }, { icon: '🔒' }]).map((c, i) => (
              <div key={i} style={S.galleryIcon}>{c.icon || '🔒'}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>نگارخانه‌ی کلکسیون</div>
            <div style={{ fontSize: 11, color: C.sub }}>{collectibles.length > 0 ? collectibles.length.toLocaleString('fa') + ' آیتم داری' : 'هنوز چیزی نگرفتی'}</div>
          </div>
          <span style={{ color: C.accent, fontSize: 18 }}>‹</span>
        </a>

        {/* تب‌ها */}
        <div style={S.tabs}>
          <button style={tab === 'badges' ? S.tabActive : S.tab} onClick={() => setTab('badges')}>مدال‌ها</button>
          <button style={tab === 'history' ? S.tabActive : S.tab} onClick={() => setTab('history')}>تاریخچه</button>
        </div>

        {tab === 'badges' && (
          <div style={S.badgeGrid}>
            {useRealAwards
              ? earnedBadges.map((b, i) => (
                <div key={i} style={S.badge}>
                  <div style={S.badgeIcon}>{b.icon || '🏅'}</div>
                  <div style={S.badgeName}>{b.title}</div>
                  <div style={S.badgeWhen}>{faWhen(b.earned_at)}</div>
                </div>
              ))
              : BADGE_DEFS.map((b, i) => {
                const earned = b.ok(stats)
                return (
                  <div key={i} style={{ ...S.badge, opacity: earned ? 1 : 0.35 }}>
                    <div style={S.badgeIcon}>{b.icon}</div>
                    <div style={S.badgeName}>{b.name}</div>
                    {!earned && <div style={S.badgeLock}>قفل</div>}
                  </div>
                )
              })}
          </div>
        )}

        {tab === 'history' && (
          <>
            {/* چیپ‌های فیلتر */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
              {HIST_FILTERS.map(([k, icon, label]) => (
                <button key={k} onClick={() => setHistFilter(k)}
                  style={{
                    flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: 'none',
                    background: histFilter === k ? C.accent : C.chip,
                    color: histFilter === k ? C.accentText : C.sub,
                    fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  }}>{icon} {label}</button>
              ))}
            </div>

            <div style={S.historyList}>
              {filteredTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '24px 0' }}>
                  {histFilter === 'all' ? 'هنوز فعالیتی نداری. برو روی نقشه یه کافه رو بزن! ☕' : 'در این دسته فعالیتی نیست.'}
                </div>
              ) : filteredTimeline.map((it, i) => (
                <div key={i} style={S.historyItem}>
                  <div style={S.historyIcon}>{it.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.historyCafe}>{it.title}</div>
                    {it.sub && <div style={S.historyArea}>{it.sub}</div>}
                    <div style={{ ...S.historyArea, opacity: 0.7, marginTop: 2 }}>
                      {faDateTime(it.ts)}
                      {it.rank ? <span style={{ color: C.accent, fontWeight: 700 }}> · رتبه #{it.rank.toLocaleString('fa')}</span> : null}
                    </div>
                  </div>
                  {it.xp > 0 && <div style={S.historyXp}>+{it.xp.toLocaleString('fa')} XP</div>}
                </div>
              ))}
            </div>
          </>
        )}

        <button style={S.editBtn}>ویرایش پروفایل</button>
      </div>
    </div>
  )
}

function Stat({ icon, value, label, S }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statValue}>{Number(value).toLocaleString('fa')}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

const mkS = (C) => ({
  page: {
    minHeight: '100vh', background: C.bg, fontFamily: 'inherit',
    direction: 'rtl', color: C.text, paddingBottom: 40,
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)',
    borderBottom: '1px solid ' + C.border,
  },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  card: {
    background: C.card, backdropFilter: 'blur(28px)',
    border: '1px solid ' + C.border, borderRadius: 20, padding: 18,
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)', marginBottom: 14,
  },
  headerRow: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, background: C.card, border: '3px solid', flexShrink: 0,
  },
  name: { fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 },
  levelPill: {
    display: 'inline-block', color: '#fff', fontSize: 12, fontWeight: 700,
    padding: '3px 10px', borderRadius: 999,
  },
  xpRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 },
  xpLabel: { fontWeight: 800, color: C.text },
  xpNext: { color: C.sub },
  xpTrack: { height: 10, background: C.chip, borderRadius: 999, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 999, transition: 'width .6s ease' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 },
  statCard: {
    background: C.card, backdropFilter: 'blur(20px)',
    border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 6px', textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: 800, marginTop: 2, color: C.text },
  statLabel: { fontSize: 11, color: C.sub },

  galleryStrip: {
    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
    background: C.card, backdropFilter: 'blur(20px)', border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 14px', marginBottom: 14,
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  galleryIcon: {
    width: 30, height: 30, borderRadius: 9, background: C.chip,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1, padding: '10px', borderRadius: 12, border: 'none',
    background: C.chip, color: C.sub, fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: {
    flex: 1, padding: '10px', borderRadius: 12, border: 'none',
    background: C.accent, color: '#fff', fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },

  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 },
  badge: {
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 4px', textAlign: 'center', position: 'relative',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 10, color: C.text, marginTop: 4, lineHeight: 1.3 },
  badgeLock: { fontSize: 9, color: C.sub, marginTop: 2 },
  badgeWhen: { fontSize: 8, color: C.accent, marginTop: 2 },

  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 14, padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  historyIcon: {
    width: 38, height: 38, borderRadius: '50%', background: C.accentL,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
  },
  historyCafe: { fontWeight: 700, fontSize: 14, color: C.text },
  historyArea: { fontSize: 12, color: C.sub },
  historyXp: { color: C.accent, fontWeight: 800, fontSize: 13 },

  editBtn: {
    width: '100%', marginTop: 18, padding: '14px',
    borderRadius: 14, border: 'none', background: C.accent, color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
})
