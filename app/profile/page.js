'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'

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

// ---- داده موک (بعداً از Supabase میاد) ----
const USER = {
  name: 'دانی',
  username: '@dani',
  xp: 920,
  joinedDays: 47,
  checkins: 38,
  cafesVisited: 11,
  streak: 3,
}

const BADGES = [
  { id: 1, icon: '🥇', name: 'اولین چک‌این', earned: true },
  { id: 2, icon: '🌙', name: 'شب‌گرد',      earned: true },
  { id: 3, icon: '🔥', name: 'استریک ۳ روز', earned: true },
  { id: 4, icon: '🗺️', name: '۵ منطقه',      earned: true },
  { id: 5, icon: '⭐', name: '۱۰ کافه',      earned: true },
  { id: 6, icon: '👑', name: '۵۰ چک‌این',    earned: false },
  { id: 7, icon: '💎', name: 'کلکسیونر',     earned: false },
  { id: 8, icon: '🏆', name: 'قهرمان هفته',  earned: false },
]

const HISTORY = [
  { id: 1, cafe: 'کافه لمیز',    area: 'ولنجک',    xp: 50, when: 'امروز' },
  { id: 2, cafe: 'کافه نام',     area: 'فرشته',    xp: 30, when: 'دیروز' },
  { id: 3, cafe: 'کافه راز',     area: 'تجریش',    xp: 50, when: '۲ روز پیش' },
  { id: 4, cafe: 'کافه پاتوق',   area: 'انقلاب',   xp: 30, when: '۳ روز پیش' },
  { id: 5, cafe: 'کافه ویونا',   area: 'سعادت‌آباد', xp: 40, when: '۴ روز پیش' },
]

export default function ProfilePage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  useEffect(() => { setPal(loadPrefs()) }, [])
  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)
  const [tab, setTab] = useState('badges') // badges | history
  const { current, next, pct } = levelInfo(USER.xp)

  return (
    <div style={S.page}>
      {/* نوار بالا */}
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>TwinLand 🏙️</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={{textAlign:'center',marginBottom:8}}>
          <img src="/icon_profile_active@2x.png" alt="پروفایل" width={88} height={88} style={{objectFit:'contain',display:'inline-block'}}/>
        </div>
        {/* هدر پروفایل */}
        <div style={S.card}>
          <div style={S.headerRow}>
            <div style={{ ...S.avatar, borderColor: current.color }}>
              {current.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.name}>{USER.name}</div>
              <div style={S.username}>{USER.username}</div>
              <div style={{ ...S.levelPill, background: current.color }}>
                {current.icon} {current.name}
              </div>
            </div>
          </div>

          {/* نوار XP */}
          <div style={S.xpRow}>
            <span style={S.xpLabel}>{USER.xp.toLocaleString('fa')} XP</span>
            <span style={S.xpNext}>
              {next ? `تا ${next.name}: ${(next.min - USER.xp).toLocaleString('fa')} XP` : 'حداکثر لول!'}
            </span>
          </div>
          <div style={S.xpTrack}>
            <div style={{ ...S.xpFill, width: pct + '%', background: current.color }} />
          </div>
        </div>

        {/* آمار */}
        <div style={S.statsGrid}>
          <Stat S={S} icon="📍" value={USER.checkins} label="چک‌این" />
          <Stat S={S} icon="☕" value={USER.cafesVisited} label="کافه" />
          <Stat S={S} icon="🔥" value={USER.streak} label="استریک" />
          <Stat S={S} icon="📅" value={USER.joinedDays} label="روز فعال" />
        </div>

        {/* تب‌ها */}
        <div style={S.tabs}>
          <button
            style={tab === 'badges' ? S.tabActive : S.tab}
            onClick={() => setTab('badges')}
          >مدال‌ها</button>
          <button
            style={tab === 'history' ? S.tabActive : S.tab}
            onClick={() => setTab('history')}
          >تاریخچه</button>
        </div>

        {tab === 'badges' && (
          <div style={S.badgeGrid}>
            {BADGES.map(b => (
              <div key={b.id} style={{ ...S.badge, opacity: b.earned ? 1 : 0.35 }}>
                <div style={S.badgeIcon}>{b.icon}</div>
                <div style={S.badgeName}>{b.name}</div>
                {!b.earned && <div style={S.badgeLock}>قفل</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div style={S.historyList}>
            {HISTORY.map(h => (
              <div key={h.id} style={S.historyItem}>
                <div style={S.historyIcon}>☕</div>
                <div style={{ flex: 1 }}>
                  <div style={S.historyCafe}>{h.cafe}</div>
                  <div style={S.historyArea}>{h.area} · {h.when}</div>
                </div>
                <div style={S.historyXp}>+{h.xp} XP</div>
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
  name: { fontSize: 20, fontWeight: 800, color: C.text },
  username: { fontSize: 13, color: C.sub, marginBottom: 6 },
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
