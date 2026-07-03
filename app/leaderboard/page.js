'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

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

// یوزرهای نمونه (واقعی نیستن) — چون هنوز کاربر کم داریم، تا برد شلوغ‌تر دیده شه.
// با برچسب «نمونه» مشخص شدن. وقتی کاربر واقعی زیاد شد، این‌ها رو حذف می‌کنیم.
const SAMPLE = [
  { id: 's1', name: 'سارا',  avatar: '🦊', xp: 1840, sample: true },
  { id: 's2', name: 'نیما',  avatar: '🐧', xp: 1220, sample: true },
  { id: 's3', name: 'مهسا',  avatar: '🐱', xp: 760,  sample: true },
  { id: 's4', name: 'رضا',   avatar: '🦁', xp: 430,  sample: true },
  { id: 's5', name: 'آیدا',  avatar: '🦉', xp: 210,  sample: true },
  { id: 's6', name: 'پارسا', avatar: '🐺', xp: 90,   sample: true },
]

export default function LeaderboardPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [rows, setRows] = useState([])

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    let sess = null
    try { const raw = localStorage.getItem('tl_session'); if (raw) sess = JSON.parse(raw) } catch (e) {}
    const uid = sess?.user?.id || null
    const h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (sess?.access_token || SB_KEY) }
    fetch(SB_URL + '/rest/v1/profiles?select=id,display_name,xp,avatar_emoji&order=xp.desc&limit=100', { headers: h })
      .then(r => r.json()).then(list => {
        const real = Array.isArray(list)
          ? list.map(p => ({ id: p.id, name: p.display_name || 'کاربر', avatar: p.avatar_emoji || '☕', xp: p.xp || 0, sample: false, me: p.id === uid }))
          : []
        setRows([...real, ...SAMPLE].sort((a, b) => b.xp - a.xp))
      })
      .catch(() => setRows([...SAMPLE].sort((a, b) => b.xp - a.xp)))
  }, [])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)
  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumRank = { [top3[0]?.id]: 1, [top3[1]?.id]: 2, [top3[2]?.id]: 3 }
  const heights = { 1: 92, 2: 70, 3: 56 }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>برترین‌ها</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/icon_rank_active@2x.png" alt="رتبه" width={88} height={88} style={{ objectFit: 'contain', display: 'inline-block' }} />
        </div>

        {rows.length === 0 && (
          <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '30px 0' }}>در حال بارگذاری…</div>
        )}

        {/* سکوی ۳ نفر برتر */}
        {podium.length > 0 && (
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
                    <div style={S.podiumName}>{p.name}{p.sample && <span style={S.sampleTag}>نمونه</span>}</div>
                    <div style={S.podiumXp}>{p.xp.toLocaleString('fa')}</div>
                    <div style={{ ...S.podiumStand, height: heights[rank], background: lv.color }}>
                      <span style={S.podiumRankNum}>{rank.toLocaleString('fa')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                  <div style={S.rowName}>
                    {p.name}
                    {p.me && <span style={S.youTag}>تو</span>}
                    {p.sample && <span style={S.sampleTag}>نمونه</span>}
                  </div>
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

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)',
    borderBottom: '1px solid ' + C.border,
  },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },

  podiumCard: {
    background: C.card, backdropFilter: 'blur(28px)',
    border: '1px solid ' + C.border, borderRadius: 20,
    padding: '20px 12px 0', marginBottom: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
  },
  podiumRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 },
  podiumCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 110 },
  podiumAvatar: {
    width: 56, height: 56, borderRadius: '50%', background: C.card,
    border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, position: 'relative',
  },
  podiumMedal: { position: 'absolute', bottom: -6, fontSize: 18 },
  podiumName: { fontWeight: 800, fontSize: 13, marginTop: 8, color: C.text, display: 'flex', alignItems: 'center', gap: 4 },
  podiumXp: { fontSize: 12, color: C.sub, marginBottom: 6 },
  podiumStand: { width: '100%', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 },
  podiumRankNum: { color: '#fff', fontWeight: 800, fontSize: 20 },

  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 14, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  rowMe: { border: '2px solid ' + C.accent, background: C.accentL },
  rank: { width: 22, textAlign: 'center', fontWeight: 800, color: C.sub, fontSize: 15 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: '50%', background: C.card, border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  rowName: { fontWeight: 700, fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 10, background: C.accent, color: '#fff', borderRadius: 999, padding: '1px 7px' },
  sampleTag: { fontSize: 9, background: C.chip, color: C.sub, border: '1px solid ' + C.border, borderRadius: 999, padding: '1px 6px' },
  rowLevel: { fontSize: 12, color: C.sub },
  rowXp: { color: C.accent, fontWeight: 800, fontSize: 13 },
})
