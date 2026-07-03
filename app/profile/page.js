'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

// ---- همون سیستم XP که توی نقشه داریم (هماهنگ) ----
const LEVELS = [
  { min: 0,    name: 'تازه‌وارد',  icon: '🌱', color: '#9ca3af' },
  { min: 100,  name: 'کاشف',      icon: '🧭', color: '#3b82f6' },
  { min: 300,  name: 'ماجراجو',   icon: '⚡', color: '#8b5cf6' },
  { min: 700,  name: 'کافه‌گرد',  icon: '☕', color: '#ec4899' },
  { min: 1500, name: 'استاد',     icon: '🔥', color: '#f97316' },
  { min: 3000, name: 'افسانه‌ای', icon: '👑', color: '#eab308' },
]

function levelInfo(xp) {
  let current = LEVELS[0]
  let next = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  const span = next ? next.min - current.min : 1
  const into = xp - current.min
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100
  return { current, next, pct }
}

// مدال‌ها: قفل/باز بر اساس آمار واقعی. (تاریخ کسب در فاز ۵ اضافه می‌شه)
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

function faWhen(iso) {
  const d = new Date(iso).getTime()
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days <= 0) return 'امروز'
  if (days === 1) return 'دیروز'
  return days.toLocaleString('fa') + ' روز پیش'
}

export default function ProfilePage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [tab, setTab] = useState('badges')
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])   // ردیف‌های واقعی چک‌این (با کافه)

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    let sess = null
    try { const raw = localStorage.getItem('tl_session'); if (raw) sess = JSON.parse(raw) } catch (e) {}
    if (!sess || !sess.user) { window.location.href = '/'; return }
    const uid = sess.user.id
    const h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (sess.access_token || SB_KEY) }
    // پروفایل واقعی (حتی با توکن منقضی هم قابل خواندنه)
    fetch(SB_URL + '/rest/v1/profiles?id=eq.' + uid + '&select=*', { headers: h })
      .then(r => r.json()).then(rows => { if (Array.isArray(rows) && rows[0]) setProfile(rows[0]) }).catch(() => {})
    // چک‌این‌های واقعی + اطلاعات کافه (برای آمار، تاریخچه، مدال‌ها)
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone)&order=created_at.desc&limit=50', { headers: h })
      .then(r => r.json()).then(rows => { if (Array.isArray(rows)) setCheckins(rows) }).catch(() => {})
  }, [])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  const xp = profile?.xp || 0
  const { current, next, pct } = levelInfo(xp)
  const name = profile?.display_name || 'کاربر'
  const streak = profile?.streak || 0
  const joinedDays = profile?.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / 86400000)) : 1

  const checkinCount = checkins.length
  const cafeCount = new Set(checkins.map(c => c.cafe_id)).size
  const zoneCount = new Set(checkins.map(c => c.cafes?.zone).filter(Boolean)).size
  const stats = { checkins: checkinCount, cafes: cafeCount, streak, zones: zoneCount }

  return (
    <div style={S.page}>
      {/* نوار بالا */}
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
            </div>
          </div>

          {/* نوار XP */}
          <div style={S.xpRow}>
            <span style={S.xpLabel}>{xp.toLocaleString('fa')} XP</span>
            <span style={S.xpNext}>
              {next ? `تا ${next.name}: ${(next.min - xp).toLocaleString('fa')} XP` : 'حداکثر لول!'}
            </span>
          </div>
          <div style={S.xpTrack}>
            <div style={{ ...S.xpFill, width: pct + '%', background: current.color }} />
          </div>
        </div>

        {/* آمار واقعی */}
        <div style={S.statsGrid}>
          <Stat S={S} icon="📍" value={checkinCount} label="چک‌این" />
          <Stat S={S} icon="☕" value={cafeCount} label="کافه" />
          <Stat S={S} icon="🔥" value={streak} label="استریک" />
          <Stat S={S} icon="📅" value={joinedDays} label="روز فعال" />
        </div>

        {/* تب‌ها */}
        <div style={S.tabs}>
          <button style={tab === 'badges' ? S.tabActive : S.tab} onClick={() => setTab('badges')}>مدال‌ها</button>
          <button style={tab === 'history' ? S.tabActive : S.tab} onClick={() => setTab('history')}>تاریخچه</button>
        </div>

        {tab === 'badges' && (
          <div style={S.badgeGrid}>
            {BADGE_DEFS.map((b, i) => {
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
          <div style={S.historyList}>
            {checkins.length === 0 && (
              <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '24px 0' }}>
                هنوز چک‌این نکردی. برو روی نقشه یه کافه رو بزن! ☕
              </div>
            )}
            {checkins.map((h, i) => (
              <div key={i} style={S.historyItem}>
                <div style={S.historyIcon}>☕</div>
                <div style={{ flex: 1 }}>
                  <div style={S.historyCafe}>{h.cafes?.name || 'کافه'}</div>
                  <div style={S.historyArea}>{(h.cafes?.description || '') + ' · ' + faWhen(h.created_at)}</div>
                </div>
                <div style={S.historyXp}>+{(h.xp_awarded || 0).toLocaleString('fa')} XP</div>
              </div>
            ))}
          </div>
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
