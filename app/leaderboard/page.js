'use client'

import { useState } from 'react'

// ---- همون سیستم لول هماهنگ ----
const LEVELS = [
  { min: 0,    name: 'تازه‌وارد',  icon: '🌱', color: '#9ca3af' },
  { min: 100,  name: 'کاشف',      icon: '🧭', color: '#3b82f6' },
  { min: 300,  name: 'ماجراجو',   icon: '⚡', color: '#8b5cf6' },
  { min: 700,  name: 'کافه‌گرد',  icon: '☕', color: '#ec4899' },
  { min: 1500, name: 'استاد',     icon: '🔥', color: '#f97316' },
  { min: 3000, name: 'افسانه‌ای', icon: '👑', color: '#eab308' },
]
function levelOf(xp) {
  let cur = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.min) cur = l
  return cur
}

// ---- داده موک (بعداً از Supabase) ----
const DATA = {
  week: [
    { id: 1, name: 'سارا',   avatar: '🦊', xp: 1840, me: false },
    { id: 2, name: 'نیما',   avatar: '🐧', xp: 1620, me: false },
    { id: 3, name: 'دانی',   avatar: '☕', xp: 920,  me: true  },
    { id: 4, name: 'مهسا',   avatar: '🐱', xp: 880,  me: false },
    { id: 5, name: 'رضا',    avatar: '🦁', xp: 760,  me: false },
    { id: 6, name: 'آیدا',   avatar: '🦉', xp: 540,  me: false },
    { id: 7, name: 'پارسا',  avatar: '🐺', xp: 410,  me: false },
    { id: 8, name: 'الناز',  avatar: '🦋', xp: 320,  me: false },
  ],
  month: [
    { id: 1, name: 'نیما',   avatar: '🐧', xp: 5210, me: false },
    { id: 2, name: 'دانی',   avatar: '☕', xp: 4980, me: true  },
    { id: 3, name: 'سارا',   avatar: '🦊', xp: 4760, me: false },
    { id: 4, name: 'رضا',    avatar: '🦁', xp: 3300, me: false },
    { id: 5, name: 'مهسا',   avatar: '🐱', xp: 2980, me: false },
    { id: 6, name: 'آیدا',   avatar: '🦉', xp: 2540, me: false },
  ],
  all: [
    { id: 1, name: 'سارا',   avatar: '🦊', xp: 18400, me: false },
    { id: 2, name: 'نیما',   avatar: '🐧', xp: 16250, me: false },
    { id: 3, name: 'رضا',    avatar: '🦁', xp: 12100, me: false },
    { id: 4, name: 'دانی',   avatar: '☕', xp: 9200,  me: true  },
    { id: 5, name: 'مهسا',   avatar: '🐱', xp: 7600,  me: false },
    { id: 6, name: 'آیدا',   avatar: '🦉', xp: 5400,  me: false },
  ],
}

const TABS = [
  { key: 'week',  label: 'این هفته' },
  { key: 'month', label: 'این ماه' },
  { key: 'all',   label: 'کل' },
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState('week')
  const list = DATA[tab]
  const top3 = list.slice(0, 3)
  const rest = list.slice(3)

  // ترتیب سکو: دوم، اول، سوم
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumRank = { [top3[0]?.id]: 1, [top3[1]?.id]: 2, [top3[2]?.id]: 3 }
  const heights = { 1: 92, 2: 70, 3: 56 }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>برترین‌ها 🏆</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        {/* فیلتر زمان */}
        <div style={S.tabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              style={tab === t.key ? S.tabActive : S.tab}
              onClick={() => setTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* سکوی ۳ نفر برتر */}
        <div style={S.podiumCard}>
          <div style={S.podiumRow}>
            {podium.map(p => {
              const rank = podiumRank[p.id]
              const lv = levelOf(p.xp)
              return (
                <div key={p.id} style={S.podiumCol}>
                  <div style={{ ...S.podiumAvatar, borderColor: lv.color }}>
                    {p.avatar}
                    <span style={S.podiumMedal}>{medals[rank]}</span>
                  </div>
                  <div style={S.podiumName}>{p.name}</div>
                  <div style={S.podiumXp}>{p.xp.toLocaleString('fa')}</div>
                  <div style={{ ...S.podiumStand, height: heights[rank], background: lv.color }}>
                    <span style={S.podiumRankNum}>{rank.toLocaleString('fa')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* بقیه رتبه‌ها */}
        <div style={S.list}>
          {rest.map((p, i) => {
            const rank = i + 4
            const lv = levelOf(p.xp)
            return (
              <div key={p.id} style={{ ...S.row, ...(p.me ? S.rowMe : {}) }}>
                <div style={S.rank}>{rank.toLocaleString('fa')}</div>
                <div style={{ ...S.rowAvatar, borderColor: lv.color }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.rowName}>{p.name}{p.me && <span style={S.youTag}>تو</span>}</div>
                  <div style={S.rowLevel}>{lv.icon} {lv.name}</div>
                </div>
                <div style={S.rowXp}>{p.xp.toLocaleString('fa')} XP</div>
              </div>
            )
          })}
        </div>
      </div>
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
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },

  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, padding: 10, borderRadius: 12, border: 'none',
    background: 'rgba(255,255,255,0.6)', color: '#6b7280',
    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: {
    flex: 1, padding: 10, borderRadius: 12, border: 'none',
    background: '#f97316', color: '#fff',
    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },

  podiumCard: {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 20,
    padding: '20px 12px 0', marginBottom: 16,
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
  },
  podiumRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 },
  podiumCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 110 },
  podiumAvatar: {
    width: 56, height: 56, borderRadius: '50%', background: '#fff',
    border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, position: 'relative',
  },
  podiumMedal: { position: 'absolute', bottom: -6, fontSize: 18 },
  podiumName: { fontWeight: 800, fontSize: 13, marginTop: 8 },
  podiumXp: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  podiumStand: {
    width: '100%', borderRadius: '10px 10px 0 0',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
  },
  podiumRankNum: { color: '#fff', fontWeight: 800, fontSize: 20 },

  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 14, padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  rowMe: { border: '2px solid #f97316', background: 'rgba(255,247,237,0.9)' },
  rank: { width: 22, textAlign: 'center', fontWeight: 800, color: '#9ca3af', fontSize: 15 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  rowName: { fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 10, background: '#f97316', color: '#fff', borderRadius: 999, padding: '1px 7px' },
  rowLevel: { fontSize: 12, color: '#6b7280' },
  rowXp: { color: '#f97316', fontWeight: 800, fontSize: 13 },
}
