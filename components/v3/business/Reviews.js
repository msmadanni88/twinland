'use client'
// نظرهای مردم درباره همین مکان، و جواب کسب‌وکار زیر هر نظر.
// داده از business_comments و نوشتن از business_reply_comment؛ هر دو مالکیت تأییدشده را در دیتابیس می‌سنجند.
// جواب برای نویسنده نظر یک اعلان می‌فرستد و زیر نظر در برگه کافه و صفحه عمومی آن دیده می‌شود.
// همان قاعده‌های نظر اینجا هم هست: حداکثر 400 حرف، بدون پیوند و شماره تلفن. متن خالی یعنی برداشتن جواب.
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { Btn, Card, Empty, fa } from '@/components/v3/business/bizUi'
import { track } from '@/lib/analytics'

const MAX = 400
const ERR = {
  denied: 'فقط صاحب تأییدشده این مکان می‌تواند جواب بدهد',
  short: 'جواب خیلی کوتاه است',
  long: 'جواب از ۴۰۰ حرف بیشتر است',
  no_links: 'پیوند و شناسه شبکه‌های اجتماعی در جواب مجاز نیست',
  no_phone: 'شماره تلفن در جواب مجاز نیست',
  rate: 'کمی صبر کن و دوباره بفرست',
  missing: 'این نظر دیگر نیست',
}

function rpc(name, body) {
  const s = getSession()
  if (!s || !s.access_token) return Promise.resolve(null)
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'همین الان'
  if (s < 3600) return fa(Math.round(s / 60)) + ' دقیقه پیش'
  if (s < 86400) return fa(Math.round(s / 3600)) + ' ساعت پیش'
  return fa(Math.round(s / 86400)) + ' روز پیش'
}

export function useBizReviewCount(bizId) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!bizId) { setN(0); return () => {} }
    let alive = true
    rpc('business_comments', { p_business_id: bizId, p_limit: 1, p_offset: 0 }).then(r => { if (alive) setN(Array.isArray(r) && r[0] ? r[0].unanswered : 0) })
    return () => { alive = false }
  }, [bizId])
  return n
}

function ReplyBox({ C, row, onDone }) {
  const [text, setText] = useState(row.reply_body || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function send(clear) {
    setBusy(true); setMsg('')
    const body = clear ? '' : text.trim()
    const r = await rpc('business_reply_comment', { p_comment_id: row.id, p_body: body })
    setBusy(false)
    if (r && r.ok) { track('biz_reply', { cleared: !!clear }); onDone() }
    else setMsg((r && ERR[r.error]) || 'ثبت نشد؛ دوباره امتحان کن')
  }
  return (
    <div style={{ marginTop: 10 }}>
      <textarea value={text} onChange={e => setText(e.target.value.slice(0, MAX))} rows={2} maxLength={MAX} placeholder="جواب کوتاه و محترمانه بنویس"
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid ' + C.border, borderRadius: 12, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.9, padding: '8px 10px', outline: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: C.sub }}>{fa(text.length)} از {fa(MAX)}</span>
        <span style={{ flex: 1 }} />
        {msg && <span style={{ fontSize: 11.5, color: '#d03b3b' }}>{msg}</span>}
        {row.reply_body && <Btn C={C} small kind="danger" disabled={busy} onClick={() => send(true)}>برداشتن جواب</Btn>}
        <Btn C={C} small disabled={busy || text.trim().length < 2} onClick={() => send(false)}>{busy ? '…' : row.reply_body ? 'ذخیره جواب' : 'ارسال جواب'}</Btn>
      </div>
    </div>
  )
}

export function Reviews({ C, K, biz }) {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const load = useCallback(() => {
    if (!biz) return
    rpc('business_comments', { p_business_id: biz.id, p_limit: 50, p_offset: 0 }).then(r => setRows(Array.isArray(r) ? r : []))
  }, [biz])
  useEffect(() => { setRows(null); setOpen(null); load() }, [load])

  const total = rows && rows[0] ? rows[0].total : 0
  const unanswered = rows && rows[0] ? rows[0].unanswered : 0
  return (
    <Card C={C} K={K} title="نظرهای مردم" hint="جواب تو زیر همان نظر برای همه دیده می‌شود و برای نویسنده اعلان می‌رود">
      {rows === null && <Empty C={C} icon="⏳" title="در حال بارگذاری…" />}
      {rows && rows.length === 0 && <Empty C={C} icon="💬" title="هنوز کسی نظر نگذاشته" text="وقتی کسی درباره این مکان نظر بدهد، اینجا می‌آید و می‌توانی جواب بدهی." />}
      {rows && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, background: C.chip, borderRadius: 99, padding: '5px 12px' }}>همه نظرها: {fa(total)}</span>
          <span style={{ fontSize: 12, fontWeight: 800, background: unanswered ? '#f59e0b22' : C.chip, color: unanswered ? '#b45309' : C.text, borderRadius: 99, padding: '5px 12px' }}>بی‌جواب: {fa(unanswered)}</span>
        </div>
      )}
      {rows && rows.map(r => (
        <div key={r.id} style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 12, marginBottom: 10, background: r.hidden ? C.chip : C.card, opacity: r.hidden ? 0.7 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16 }}>{r.avatar && r.avatar.length <= 4 ? r.avatar : '☕'}</span>
            <b style={{ fontSize: 13 }}>{r.name}</b>
            <span style={{ fontSize: 11, color: C.sub }}>سطح {fa(r.level)}</span>
            {r.visited && <span style={{ fontSize: 10.5, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: '#10b98122', color: '#047857' }}>اینجا بوده</span>}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: C.sub }}>{ago(r.created_at)}</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 2, marginTop: 6, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{r.body}</div>
          {r.hidden && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 4 }}>این نظر با گزارش مردم یا مدیر سایت پنهان شده و فقط تو می‌بینی</div>}
          {r.reply_body && open !== r.id && (
            <div style={{ marginTop: 8, padding: '8px 11px', borderRadius: 12, background: C.chip, borderRight: '3px solid ' + C.accent }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: C.accent }}>جواب تو · {ago(r.reply_at)}</div>
              <div style={{ fontSize: 13, lineHeight: 1.9, marginTop: 3, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{r.reply_body}</div>
            </div>
          )}
          {!r.hidden && (open === r.id
            ? <ReplyBox C={C} row={r} onDone={() => { setOpen(null); load() }} />
            : <div style={{ marginTop: 8 }}><Btn C={C} small kind={r.reply_body ? 'ghost' : 'primary'} onClick={() => setOpen(r.id)}>{r.reply_body ? 'ویرایش جواب' : 'جواب دادن'}</Btn></div>)}
        </div>
      ))}
    </Card>
  )
}
