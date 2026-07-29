'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import {
  SB_URL, SB_KEY, getLevelInfo, getSession,
  fetchMyProfile, fetchXpHistory, fetchAwards, subscribeToTables, REASON_LABELS,
} from '../gameSystem'
import { L, ICON, fa as faNum } from '../labels'
import { UIStyles, useDragScroll, hscroll, onColor, isDarkC } from '../ui'

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
  const [favCount, setFavCount] = useState(0)
  const [loadWarn, setLoadWarn] = useState('')

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    const sess = getSession()
    if (!sess || !sess.user) { window.location.href = '/'; return }
    const uid = sess.user.id
    const h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (sess.access_token || SB_KEY) }

    let alive = true
    // پروفایل واقعی (منبع واحد XP)
    fetchMyProfile(sess).then(p => { if (alive && p) setProfile(p) })
    // ── چک‌این‌های واقعی (برای آمار و مدال‌ها) ─────────────────────────────
    // 🐞 باگی که آمار رو صفر نشون می‌داد: کوئری قبلی ستون‌های cafes رو با نام
    // ثابت می‌خواست. اگه فقط یکی از اون نام‌ها توی دیتابیس نبود (مثلاً city)،
    // PostgREST به‌جای آرایه یک آبجکتِ خطا برمی‌گردوند، Array.isArray رد می‌شد
    // و لیست خالی می‌موند → «۰ چک‌این» با اینکه دیتا سر جاش بود.
    // حالا: اول کوئری کامل، و اگه شکست خورد خودکار سراغ نسخه‌ی ساده می‌ریم.
    // نتیجه: آمار هیچ‌وقت الکی صفر نمی‌شه.
    const CK_FULL = 'checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone,district)&order=created_at.desc&limit=500'
    const CK_MIN  = 'checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at&order=created_at.desc&limit=500'
    const loadCheckins = () =>
      fetch(SB_URL + '/rest/v1/' + CK_FULL, { headers: h })
        .then(r => r.json())
        .then(rows => {
          if (Array.isArray(rows)) { if (alive) { setCheckins(rows); setLoadWarn('') } ; return }
          // کوئری کامل خطا داد → با نسخه‌ی مینیمال دوباره تلاش کن
          return fetch(SB_URL + '/rest/v1/' + CK_MIN, { headers: h })
            .then(r2 => r2.json())
            .then(rows2 => {
              if (!alive) return
              if (Array.isArray(rows2)) {
                setCheckins(rows2)
                setLoadWarn('جزئیات کافه‌ها لود نشد (اسم/منطقه) — ولی آمار درسته.')
              } else {
                setLoadWarn('چک‌این‌ها لود نشدن. اگه ادامه داشت، دسترسی جدول checkins رو چک کن.')
              }
            })
        })
        .catch(() => { if (alive) setLoadWarn('خطا در ارتباط با سرور') })
    loadCheckins()

    // ── قلب‌ها (کافه‌هایی که دوست داری) ───────────────────────────────────
    fetch(SB_URL + '/rest/v1/favorites?user_id=eq.' + uid + '&select=cafe_id', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setFavCount(rows.length) }).catch(() => {})
    // تاریخچه‌ی دقیق XP + جوایز
    fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
    fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })
    // تاریخچه‌ی کلن
    const reloadClanHist=()=>fetch(SB_URL + '/rest/v1/clan_history?user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=100', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setClanHistory(rows) }).catch(() => {})
    reloadClanHist()

    // realtime: پروفایل، بج‌ها، تاریخچه و چک‌این‌ها لحظه‌ای آپدیت شن
    const reloadCheckins = loadCheckins
    const reloadFavs = () => fetch(SB_URL + '/rest/v1/favorites?user_id=eq.' + uid + '&select=cafe_id', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setFavCount(rows.length) }).catch(() => {})
    const unsub = subscribeToTables([
      { table:'profiles',   event:'UPDATE', filter:'id=eq.'+uid },
      { table:'awards',     event:'*',      filter:'user_id=eq.'+uid },
      { table:'xp_history', event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'checkins',   event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'clan_history', event:'*',    filter:'user_id=eq.'+uid },
      { table:'favorites',  event:'*',      filter:'user_id=eq.'+uid },
    ],(p)=>{
      if(!alive) return
      if(p.table==='profiles' && p.record) setProfile(prev => ({ ...(prev || {}), ...p.record }))
      if(p.table==='xp_history') fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
      if(p.table==='awards') fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })
      if(p.table==='checkins') reloadCheckins()
      if(p.table==='clan_history') reloadClanHist()
      if(p.table==='favorites') reloadFavs()
    })
    return () => { alive = false; unsub() }
  }, [])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)
  const histRef = useDragScroll()   // نوار فیلترهای تاریخچه — کشیدن با ماوس در ویندوز

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
    ['all', ICON.history, 'همه'],
    ['checkin', ICON.cafe, L.checkin],
    ['quest', ICON.quests, L.questsShort],
    ['xp', ICON.xpSystem, L.xp],
    ['clan', ICON.clans, L.clanShort],
    ['badge', ICON.badges, L.badges],
    ['collectible', ICON.gallery, L.gallery],
  ]
  const filteredTimeline = histFilter === 'all' ? timeline : timeline.filter(x => x.cat === histFilter)

  return (
    <div style={S.page}>
      <UIStyles/>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ {L.map}</a>
        <div style={S.brand}>{ICON.profile} {L.profile}</div>
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
        {loadWarn && (
          <div style={{ background: '#FF950022', border: '1px solid #FF950055', borderRadius: 12, padding: '9px 12px', fontSize: 11, color: C.text, marginBottom: 10, lineHeight: 1.7 }}>
            ⚠️ {loadWarn}
          </div>
        )}
        <div style={S.statsGrid}>
          <Stat S={S} icon={ICON.checkin} value={checkinCount} label={L.checkin} accent={C.accent} />
          <Stat S={S} icon={ICON.cafe} value={cafeCount} label={L.cafe} accent={C.accent} />
          <Stat S={S} icon={ICON.streak} value={streak} label={L.streak} accent="#FF9F0A" />
          <Stat S={S} icon={ICON.hearts} value={favCount} label={L.hearts} accent="#FF2D55" />
          <Stat S={S} icon="📅" value={joinedDays} label="روز عضویت" accent={C.sub} />
        </div>

        {/* پیش‌نمایش نگارخانه */}
        <a href="/gallery" className="tl-tile" style={S.galleryStrip}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(collectibles.length > 0 ? collectibles.slice(0, 4) : [{ icon: '💎' }, { icon: '🏆' }, { icon: '🔒' }]).map((c, i) => (
              <div key={i} style={S.galleryIcon}>{c.icon || '🔒'}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{ICON.gallery} {L.gallery}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{collectibles.length > 0 ? collectibles.length.toLocaleString('fa') + ' آیتم داری' : 'هنوز چیزی نگرفتی'}</div>
          </div>
          <span style={{ color: C.accent, fontSize: 18 }}>‹</span>
        </a>

        {/* تب‌ها */}
        <div style={S.tabs}>
          <button className="tl-press" style={tab === 'badges' ? S.tabActive : S.tab} onClick={() => setTab('badges')}>{ICON.badges} {L.badges}</button>
          <button className="tl-press" style={tab === 'history' ? S.tabActive : S.tab} onClick={() => setTab('history')}>{ICON.history} {L.history}</button>
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
            {/* اسکرول‌بار خاکستریِ پیش‌فرضِ ویندوز حذف شد — حالا با کشیدنِ
                ماوس یا چرخ ماوس جابه‌جا می‌شه، مثل سایت‌های مدرن. */}
            <div ref={histRef} className="tl-hscroll" style={{ ...hscroll, gap: 6, marginBottom: 12, paddingBottom: 2 }}>
              {HIST_FILTERS.map(([k, icon, label]) => (
                <button key={k} className="tl-press" onClick={() => setHistFilter(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 99,
                    border: '1px solid ' + (histFilter === k ? 'transparent' : C.border),
                    background: histFilter === k ? C.accent : C.chip,
                    color: histFilter === k ? onColor(C.accent) : C.sub,
                    fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{icon} {label}</button>
              ))}
            </div>

            <div style={S.historyList}>
              {filteredTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '24px 0' }}>
                  {histFilter === 'all' ? 'هنوز فعالیتی نداری. برو روی نقشه یه کافه رو بزن! ☕' : 'در این دسته فعالیتی نیست.'}
                </div>
              ) : filteredTimeline.map((it, i) => (
                <div key={i} className="tl-row" style={S.historyItem}>
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

function Stat({ icon, value, label, S, accent }) {
  return (
    <div className="tl-tile" style={{ ...S.statCard, borderColor: accent ? accent + '44' : S.statCard.borderColor }}>
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
  container: { maxWidth: 560, margin: '0 auto', padding: '16px' },
  card: {
    background: 'linear-gradient(150deg,' + C.accent + '18, ' + C.card + ' 58%)', backdropFilter: 'blur(28px)',
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

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 16 },
  statCard: {
    background: C.card, backdropFilter: 'blur(20px)',
    border: '1.5px solid ' + C.border,
    borderRadius: 16, padding: '12px 3px', textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  statIcon: { fontSize: 19 },
  statValue: { fontSize: 17, fontWeight: 900, marginTop: 2, color: C.text },
  statLabel: { fontSize: 9.5, color: C.sub, marginTop: 1 },

  galleryStrip: {
    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
    background: 'linear-gradient(120deg,' + C.accent + '20, ' + C.card + ' 60%)',
    backdropFilter: 'blur(20px)', border: '1.5px solid ' + C.accent + '40',
    borderRadius: 18, padding: '13px 14px', marginBottom: 14,
    boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
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

  // در ویندوز/مانیتور بزرگ ستون‌ها خودکار زیاد می‌شن به‌جای اینکه کشیده بشن
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))', gap: 10 },
  badge: {
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 4px', textAlign: 'center', position: 'relative',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 10, color: C.text, marginTop: 4, lineHeight: 1.3 },
  badgeLock: { fontSize: 9, color: C.sub, marginTop: 2 },
  badgeWhen: { fontSize: 8, color: C.accent, marginTop: 2 },

  historyList: {
    maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 8 },
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
