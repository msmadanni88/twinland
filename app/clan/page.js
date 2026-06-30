'use client'

import { useState } from 'react'

// ---- داده موک (بعداً از Supabase) ----
const MY_CLAN = {
  name: 'کافه‌نشینان',
  emblem: '⚔️',
  color: '#8b5cf6',
  level: 4,
  xp: 24800,
  rank: 2,          // رتبه بین همه کلن‌ها
  members: [
    { id: 1, name: 'سارا',  avatar: '🦊', xp: 6200, role: 'رهبر' },
    { id: 2, name: 'دانی',  avatar: '☕', xp: 4980, role: 'افسر', me: true },
    { id: 3, name: 'نیما',  avatar: '🐧', xp: 4310, role: 'عضو' },
    { id: 4, name: 'مهسا',  avatar: '🐱', xp: 3600, role: 'عضو' },
    { id: 5, name: 'رضا',   avatar: '🦁', xp: 2900, role: 'عضو' },
    { id: 6, name: 'آیدا',  avatar: '🦉', xp: 2810, role: 'عضو' },
  ],
}

const DISCOVER = [
  { id: 1, name: 'شب‌گردها',    emblem: '🌙', color: '#3b82f6', members: 24, xp: 38200, rank: 1 },
  { id: 2, name: 'کافه‌نشینان', emblem: '⚔️', color: '#8b5cf6', members: 18, xp: 24800, rank: 2 },
  { id: 3, name: 'اسپرسوبازها', emblem: '☕', color: '#ec4899', members: 15, xp: 19400, rank: 3 },
  { id: 4, name: 'شمال‌چی‌ها',  emblem: '⛰️', color: '#10b981', members: 11, xp: 12600, rank: 4 },
  { id: 5, name: 'پاتوق',       emblem: '🔥', color: '#f97316', members: 9,  xp: 8900,  rank: 5 },
]

export default function ClanPage() {
  const [joined, setJoined] = useState(true) // true = عضو کلن

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>کلن 🛡️</div>
        <button style={S.switchBtn} onClick={() => setJoined(!joined)}>
          {joined ? 'کشف' : 'کلن من'}
        </button>
      </div>

      <div style={S.container}>
        {joined ? <MyClan /> : <Discover />}
      </div>
    </div>
  )
}

function MyClan() {
  const c = MY_CLAN
  return (
    <>
      {/* هدر کلن */}
      <div style={{ ...S.banner, background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` }}>
        <div style={S.emblem}>{c.emblem}</div>
        <div style={S.clanName}>{c.name}</div>
        <div style={S.clanMeta}>سطح {c.level.toLocaleString('fa')} · رتبه {c.rank.toLocaleString('fa')} از همه کلن‌ها</div>
      </div>

      {/* آمار کلن */}
      <div style={S.statsGrid}>
        <Stat icon="⭐" value={c.xp.toLocaleString('fa')} label="XP کلن" />
        <Stat icon="👥" value={c.members.length.toLocaleString('fa')} label="اعضا" />
        <Stat icon="🏆" value={c.rank.toLocaleString('fa')} label="رتبه" />
      </div>

      {/* اعضا */}
      <div style={S.sectionTitle}>اعضای کلن</div>
      <div style={S.list}>
        {c.members.map((m, i) => (
          <div key={m.id} style={{ ...S.row, ...(m.me ? S.rowMe : {}) }}>
            <div style={S.rank}>{(i + 1).toLocaleString('fa')}</div>
            <div style={{ ...S.rowAvatar, borderColor: c.color }}>{m.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={S.rowName}>
                {m.name}{m.me && <span style={S.youTag}>تو</span>}
              </div>
              <div style={S.rowRole}>{m.role}</div>
            </div>
            <div style={S.rowXp}>{m.xp.toLocaleString('fa')} XP</div>
          </div>
        ))}
      </div>

      <button style={S.leaveBtn}>خروج از کلن</button>
    </>
  )
}

function Discover() {
  return (
    <>
      <div style={S.sectionTitle}>کلن‌های برتر</div>
      <div style={S.list}>
        {DISCOVER.map(c => (
          <div key={c.id} style={S.clanCard}>
            <div style={{ ...S.clanEmblem, background: c.color }}>{c.emblem}</div>
            <div style={{ flex: 1 }}>
              <div style={S.clanCardName}>{c.name}</div>
              <div style={S.clanCardMeta}>
                {c.members.toLocaleString('fa')} عضو · {c.xp.toLocaleString('fa')} XP
              </div>
            </div>
            <button style={{ ...S.joinBtn, background: c.color }}>پیوستن</button>
          </div>
        ))}
      </div>

      <button style={S.createBtn}>+ ساخت کلن جدید</button>
    </>
  )
}

function Stat({ icon, value, label }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)',
    fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    direction: 'rtl', color: '#1f2937', paddingBottom: 40,
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  backBtn: { width: 64, fontSize: 15, color: '#f97316', textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17 },
  switchBtn: {
    width: 64, fontSize: 13, color: '#f97316', background: 'none', border: 'none',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },

  banner: {
    borderRadius: 20, padding: 22, textAlign: 'center', color: '#fff',
    marginBottom: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
  emblem: { fontSize: 44 },
  clanName: { fontSize: 22, fontWeight: 800, marginTop: 4 },
  clanMeta: { fontSize: 13, opacity: 0.9, marginTop: 4 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 },
  statCard: {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    padding: '12px 6px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 16, fontWeight: 800, marginTop: 2 },
  statLabel: { fontSize: 11, color: '#6b7280' },

  sectionTitle: { fontWeight: 800, fontSize: 15, marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 14, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  rowMe: { border: '2px solid #f97316', background: 'rgba(255,247,237,0.9)' },
  rank: { width: 22, textAlign: 'center', fontWeight: 800, color: '#9ca3af', fontSize: 15 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  rowName: { fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 10, background: '#f97316', color: '#fff', borderRadius: 999, padding: '1px 7px' },
  rowRole: { fontSize: 12, color: '#6b7280' },
  rowXp: { color: '#f97316', fontWeight: 800, fontSize: 13 },

  clanCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  clanEmblem: {
    width: 46, height: 46, borderRadius: 14, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
  },
  clanCardName: { fontWeight: 800, fontSize: 15 },
  clanCardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  joinBtn: {
    color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },

  leaveBtn: {
    width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none',
    background: '#fee2e2', color: '#dc2626', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  createBtn: {
    width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none',
    background: '#1f2937', color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
