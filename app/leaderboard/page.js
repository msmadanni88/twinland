'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { getLevelInfo, getSession, fetchLeaderboard, subscribeToProfile } from '../gameSystem'

export default function LeaderboardPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [rows, setRows] = useState([])

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    const sess = getSession()
    let alive = true
    const load = () => fetchLeaderboard(sess).then(list => { if (alive) setRows(list) })
    load()
    // realtime: با هر تغییر XP خودم، جدول رو دوباره بساز تا رتبه‌ها به‌روز شن
    const uid = sess?.user?.id
    const unsub = subscribeToProfile(uid, () => load())
    return () => { alive = false; unsub() }
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
                const lv = getLevelInfo(p.xp).current
                return (
                  <div key={p.id} style={S.podiumCol}>
                    <div style={{ ...S.podiumAvatar, borderColor: lv.color }}>
                      {p.avatar}
                      <span style={S.podiumMedal}>{medals[rank]}</span>
                    </div>
                    <div style={S.podiumName}>{p.name}{p.sample && <span style={S.sampleTag}>نمونه</span>}{p.me && <span style={S.youTag}>تو</span>}</div>
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
          {rest.map((p) => {
            const lv = getLevelInfo(p.xp).current
            return (
              <div key={p.id} style={{ ...S.row, ...(p.me ? S.rowMe : {}) }}>
                <div style={S.rank}>{p.rank.toLocaleString('fa')}</div>
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
