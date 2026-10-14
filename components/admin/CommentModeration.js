'use client'
// صف نظرهای گزارش‌شده و پنهان، فقط برای مالک پلتفرم. هر کار از راه admin_comment_moderate
// انجام می‌شود که خودش مالک بودن را در دیتابیس می‌سنجد. نظری که مالک یک بار بررسی کرد
// دیگر با گزارش خودکار پنهان نمی‌شود، و نظری که برداشت با ویرایش نویسنده برنمی‌گردد.
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const FILTERS = [['reported', 'گزارش‌شده'], ['hidden', 'پنهان'], ['all', 'همه']]

function rpc(name, body) {
  const s = getSession()
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

export function CommentModeration({ C }) {
  const [filter, setFilter] = useState('reported')
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => rpc('admin_comments_queue', { p_filter: filter, p_limit: 80 }).then(r => setRows(Array.isArray(r) ? r : [])), [filter])
  useEffect(() => { setRows(null); load() }, [load])

  async function act(id, action) {
    setBusy(id + action)
    await rpc('admin_comment_moderate', { p_id: id, p_action: action })
    setBusy(null)
    load()
  }

  const btn = (bg, fg, border) => ({ flex: 1, minWidth: 70, background: bg, color: fg, border: border || 'none', borderRadius: 10, padding: '8px 6px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' })
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>مدیریت نظرها</div>
          <div style={{ fontSize: 11, color: C.sub }}>نظرهای گزارش‌شده بالای فهرست می‌آیند</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ flex: 1, border: '1px solid ' + (filter === k ? C.accent : C.border), background: filter === k ? C.accent + '18' : 'transparent', color: C.text, borderRadius: 99, padding: '7px 8px', fontSize: 12, fontWeight: filter === k ? 800 : 600, fontFamily: 'inherit', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>
      {rows === null && <div style={{ fontSize: 12.5, color: C.sub, textAlign: 'center', padding: 12 }}>در حال بارگذاری…</div>}
      {rows && rows.length === 0 && <div style={{ fontSize: 12.5, color: C.sub, textAlign: 'center', padding: 12 }}>نظری برای بررسی نیست</div>}
      {rows && rows.map(r => (
        <div key={r.id} style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 12, marginBottom: 10, background: r.hidden ? '#ef444410' : C.chip }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: C.sub }}>
            <span><b style={{ color: C.text }}>{r.author}</b> درباره <b style={{ color: C.text }}>{r.cafe_name}</b></span>
            <span>{new Date(r.created_at).toLocaleDateString('fa-IR')}</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.9, margin: '6px 0', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{r.body}</div>
          {r.reply_body && <div style={{ fontSize: 12, color: C.sub, borderRight: '3px solid ' + C.accent, paddingRight: 8, marginBottom: 6 }}>پاسخ کافه: {r.reply_body}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, color: C.sub, marginBottom: 8 }}>
            <span>گزارش: {fa(r.report_count)}</span>
            {r.hidden && <span style={{ color: '#ef4444', fontWeight: 800 }}>پنهان</span>}
            {r.mod_locked && <span>بررسی‌شده</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.hidden
              ? <button disabled={!!busy} onClick={() => act(r.id, 'restore')} style={btn('#10b981', '#fff')}>{busy === r.id + 'restore' ? '…' : 'برگرداندن'}</button>
              : <button disabled={!!busy} onClick={() => act(r.id, 'hide')} style={btn('#f59e0b', '#fff')}>{busy === r.id + 'hide' ? '…' : 'پنهان کردن'}</button>}
            <button disabled={!!busy} onClick={() => act(r.id, 'remove')} style={btn('transparent', '#ef4444', '1.5px solid #ef4444')}>{busy === r.id + 'remove' ? '…' : 'برداشتن کامل'}</button>
            {r.reply_body && <button disabled={!!busy} onClick={() => act(r.id, 'clear_reply')} style={btn('transparent', C.text, '1px solid ' + C.border)}>پاک کردن پاسخ</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
