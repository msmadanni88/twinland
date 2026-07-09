'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { SB_URL, SB_KEY, getSession, subscribeToTables } from '../gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export default function QuestsPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [quests, setQuests] = useState([])
  const [progress, setProgress] = useState({})   // quest_id -> row
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => { setPal(loadPrefs()) }, [])

  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })
  const get = (url, h) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => r.json()).catch(() => [])

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = H(s)
    const now = new Date().toISOString()
    const [qs, prog, red] = await Promise.all([
      get('quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.' + now + ')&select=*,cafes(name,district)&order=created_at.desc&limit=100', h),
      get('quest_progress?user_id=eq.' + s.user.id + '&select=*', h),
      get('redemptions?user_id=eq.' + s.user.id + '&select=*&order=issued_at.desc', h),
    ])
    setQuests(Array.isArray(qs) ? qs.filter(q => q.cafe_id) : [])
    const pm = {}; (Array.isArray(prog) ? prog : []).forEach(p => { pm[p.quest_id] = p })
    setProgress(pm)
    setRedemptions(Array.isArray(red) ? red : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const s = getSession()
    if (!s || !s.user) return
    const unsub = subscribeToTables([
      { table: 'quests', event: '*' },
      { table: 'quest_progress', event: '*', filter: 'user_id=eq.' + s.user.id },
      { table: 'redemptions', event: '*', filter: 'user_id=eq.' + s.user.id },
    ], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  const activeQuests = quests.filter(q => !(progress[q.id] && progress[q.id].completed))
  const completedRewards = redemptions

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>کمپین‌ها</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={S.tabs}>
          <button style={tab === 'active' ? S.tabActive : S.tab} onClick={() => setTab('active')}>فعال ({fa(activeQuests.length)})</button>
          <button style={tab === 'rewards' ? S.tabActive : S.tab} onClick={() => setTab('rewards')}>جایزه‌های من ({fa(completedRewards.length)})</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '50px 0' }}>در حال بارگذاری…</div> : <>

          {tab === 'active' && (
            activeQuests.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>الان کمپین فعالی نیست. سر بزن یه وقت دیگه ☕</div>
              : activeQuests.map(q => <QuestCard key={q.id} C={C} q={q} prog={progress[q.id]} />)
          )}

          {tab === 'rewards' && (
            completedRewards.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>هنوز جایزه‌ای نگرفتی. یه Quest رو کامل کن!</div>
              : completedRewards.map(r => <RewardCard key={r.id} C={C} r={r} />)
          )}
        </>}
      </div>
    </div>
  )
}

function QuestCard({ C, q, prog }) {
  const cur = prog ? prog.progress : 0
  const pctv = Math.min(100, Math.round((cur / (q.target_count || 1)) * 100))
  const cafeName = q.cafes ? q.cafes.name : 'کافه'
  const district = q.cafes ? q.cafes.district : ''
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: C.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{q.icon || '🎯'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text }}>{q.title}</div>
          <div style={{ fontSize: 11, color: C.sub }}>{cafeName}{district ? ' · ' + district : ''}</div>
        </div>
      </div>
      {q.description && <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.7 }}>{q.description}</div>}

      {q.target_count > 1 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 8, background: C.chip, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pctv + '%', background: C.accent, borderRadius: 99, transition: 'width .5s' }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.sub, marginTop: 4 }}>{fa(cur)} از {fa(q.target_count)}</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>🎁 {q.reward_label}{q.reward_xp > 0 ? ' + ' + fa(q.reward_xp) + ' XP' : ''}</div>
        {q.reward_collectible_code && <span style={{ fontSize: 10, background: C.chip, borderRadius: 99, padding: '3px 9px', color: C.sub }}>+ آیتم کلکسیونی</span>}
      </div>
    </div>
  )
}

function RewardCard({ C, r }) {
  const statusMap = { issued: ['در انتظار ارائه', '#f59e0b'], redeemed: ['استفاده شد', '#10b981'], expired: ['منقضی شده', '#94a3b8'] }
  const [label, color] = statusMap[r.status] || statusMap.issued
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 22 }}>🎟️</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.reward_label}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>کد: <span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{r.code}</span></div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', borderRadius: 99, padding: '4px 10px' }}>{label}</span>
    </div>
  )
}

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)', borderBottom: '1px solid ' + C.border },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 14 },
  tab: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: C.chip, color: C.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
})
