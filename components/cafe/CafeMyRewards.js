'use client'
// صفحه‌ی «جایزه‌های من» در پنجره‌ی کافه — فقط جایزه‌های خودِ کاربر در همین کافه:
// کدهای تخفیف/جایزه‌ای که گرفته و رویدادهایی که کامل کرده. داده از جدول‌های
// redemptions و quest_progress می‌آید و RLS فقط ردیف‌های خودِ کاربر را برمی‌گرداند.
import { useEffect, useState } from 'react'
import { listMyCafeRewards } from '@/lib/cafeContent'

const STATUS = {
  issued:   ['فعال', 'green'],
  redeemed: ['استفاده شد', 'sub'],
  expired:  ['منقضی', 'sub'],
}

export function CafeMyRewards({ C, cafeId, uid, token, showToast }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    if (!uid || !token) { setData({ codes: [], completed: [] }); return }
    setData(null); setFailed(false)
    listMyCafeRewards(cafeId, uid, token)
      .then(d => { if (alive) setData(d) })
      .catch(() => { if (alive) { setData({ codes: [], completed: [] }); setFailed(true) } })
    return () => { alive = false }
  }, [cafeId, uid, token])

  if (!uid) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12.5, padding: '28px 0' }}>برای دیدن جایزه‌هایت اول وارد شو</div>
  if (data === null) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>در حال گرفتن جایزه‌ها…</div>
  if (failed) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>جایزه‌ها بار نشدند — دوباره امتحان کن</div>

  const { codes, completed } = data
  if (codes.length === 0 && completed.length === 0) return (
    <div style={{ textAlign: 'center', padding: '26px 8px' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🎁</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>هنوز از این کافه جایزه‌ای نگرفتی</div>
      <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6 }}>در رویدادهای این کافه شرکت کن و با چک‌این جایزه بگیر</div>
    </div>
  )

  const used = codes.filter(c => c.status === 'redeemed').length
  const active = codes.filter(c => c.status === 'issued' && (!c.expires_at || new Date(c.expires_at) > new Date())).length
  const xpTotal = completed.reduce((s, p) => s + ((p.quests && p.quests.reward_xp) || 0), 0)

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); showToast && showToast('کد کپی شد: ' + code) }
    catch (e) { showToast && showToast('کد: ' + code) }
  }

  return <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
      {[['🎟️', codes.length, 'کد گرفته'], ['✅', used, 'استفاده‌شده'], ['⭐', xpTotal, 'XP از رویدادها']].map(([icon, val, lbl]) => (
        <div key={lbl} style={{ background: C.chip, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 17 }}>{icon}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 3 }}>{Number(val).toLocaleString('fa')}</div>
          <div style={{ fontSize: 9.5, color: C.sub, marginTop: 2 }}>{lbl}</div>
        </div>
      ))}
    </div>

    {codes.length > 0 && <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>🎟️ کدهای جایزه{active > 0 ? ' — ' + active.toLocaleString('fa') + ' فعال' : ''}</div>
      {codes.map(c => {
        const expired = c.status === 'issued' && c.expires_at && new Date(c.expires_at) <= new Date()
        const [label, tone] = expired ? STATUS.expired : (STATUS[c.status] || [c.status, 'sub'])
        const q = c.quests || {}
        return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.chip, borderRadius: 12, padding: '10px 12px', marginBottom: 7 }}>
          <span style={{ fontSize: 20 }}>{q.icon || '🎁'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{c.reward_label || q.title}{q.discount_pct > 0 ? ' · 🏷️' + Number(q.discount_pct).toLocaleString('fa') + '٪' : ''}</div>
            <div style={{ fontSize: 10.5, color: tone === 'green' ? C.green : C.sub, marginTop: 2 }}>{label}</div>
          </div>
          {c.status === 'issued' && !expired && (
            <button onClick={() => copy(c.code)} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 9px', fontSize: 12, fontWeight: 800, color: C.text, fontFamily: 'monospace', direction: 'ltr' }}>{c.code}</button>
          )}
        </div>
      })}
    </div>}

    {completed.length > 0 && <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>🏁 رویدادهای کامل‌شده</div>
      {completed.map(p => {
        const q = p.quests || {}
        return <div key={p.quest_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid ' + C.border }}>
          <span style={{ fontSize: 18 }}>{q.icon || '🎉'}</span>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.text, fontWeight: 600 }}>{q.title}</div>
          {q.reward_xp > 0 && <span style={{ fontSize: 11, color: C.accent, fontWeight: 800 }}>+{Number(q.reward_xp).toLocaleString('fa')} XP</span>}
        </div>
      })}
    </div>}
  </div>
}
