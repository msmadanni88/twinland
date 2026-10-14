'use client'
// جایزه‌های لیگ هفتگی برای این هفته و هفته بعد، فقط برای مالک پلتفرم.
// اگر برای هفته‌ای جایزه‌ای ثبت نشود، جایزه پیش‌فرض نشان طلا، نقره و برنز با 300، 200 و 100 امتیاز است.
// متن خالی یعنی برگشت به جایزه پیش‌فرض همان رتبه.
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const MEDAL = ['🥇', '🥈', '🥉']
const DEFAULT_XP = [300, 200, 100]

function rpc(name, body) {
  const s = getSession()
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

function faDate(iso) {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }) } catch (e) { return iso }
}

function WeekEditor({ C, week, onSaved }) {
  const [draft, setDraft] = useState(() => [1, 2, 3].map(rank => {
    const p = (week.prizes || []).find(x => x.rank === rank)
    return { rank, title: p ? p.title : '', xp: p ? p.xp_bonus : DEFAULT_XP[rank - 1] }
  }))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true); setMsg('')
    let bad = 0
    for (const d of draft) {
      const r = await rpc('admin_league_set_prize', { p_week: week.week_start, p_rank: d.rank, p_title: d.title, p_cafe: null, p_xp: Number(d.xp) || 0 })
      if (!r || !r.ok) bad++
    }
    setBusy(false)
    setMsg(bad ? 'بعضی ردیف‌ها ذخیره نشد' : 'ذخیره شد')
    onSaved && onSaved()
  }
  const input = { width: '100%', boxSizing: 'border-box', border: '1px solid ' + C.border, borderRadius: 10, background: C.bg, color: C.text, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  return (
    <div style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 12, marginBottom: 10, background: C.chip }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>هفته‌ای که از شنبه {faDate(week.week_start)} شروع می‌شود</div>
      {draft.map((d, i) => (
        <div key={d.rank} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 18, width: 24 }}>{MEDAL[i]}</span>
          <input value={d.title} placeholder="جایزه پیش‌فرض: نشان لیگ" maxLength={80}
            onChange={e => setDraft(v => v.map(x => x.rank === d.rank ? { ...x, title: e.target.value } : x))} style={{ ...input, flex: 1 }} />
          <input value={d.xp} inputMode="numeric" title="امتیاز جایزه"
            onChange={e => setDraft(v => v.map(x => x.rank === d.rank ? { ...x, xp: e.target.value.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)) } : x))} style={{ ...input, width: 74, textAlign: 'center' }} />
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
        <button onClick={save} disabled={busy} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? '…' : 'ذخیره جایزه‌ها'}</button>
        {msg && <span style={{ fontSize: 12, color: C.sub }}>{msg}</span>}
      </div>
    </div>
  )
}

export function LeagueAdmin({ C }) {
  const [data, setData] = useState(null)
  const load = useCallback(() => rpc('admin_league_overview', {}).then(r => setData(r && r.ok ? r : { weeks: [], history: [] })), [])
  useEffect(() => { load() }, [load])
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>لیگ هفتگی</div>
          <div style={{ fontSize: 11, color: C.sub }}>متن جایزه و امتیاز سه نفر اول. خالی یعنی جایزه پیش‌فرض</div>
        </div>
      </div>
      {!data && <div style={{ fontSize: 12.5, color: C.sub, textAlign: 'center', padding: 12 }}>در حال بارگذاری…</div>}
      {data && (data.weeks || []).map(w => <WeekEditor key={w.week_start} C={C} week={w} onSaved={load} />)}
      {data && (data.history || []).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>هفته‌های بسته‌شده</div>
          {data.history.map(h => (
            <div key={h.week_start} style={{ fontSize: 12, color: C.sub, lineHeight: 1.9, borderTop: '1px solid ' + C.border, padding: '6px 0' }}>
              <b style={{ color: C.text }}>هفته {faDate(h.week_start)}</b> · بازیکن: {fa(h.players)}
              {(h.winners || []).map(w => <div key={w.rank}>{MEDAL[w.rank - 1]} {w.name} · {fa(w.pts)} امتیاز · {w.prize}</div>)}
              {(!h.winners || h.winners.length === 0) && <div>برنده‌ای نداشت</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
