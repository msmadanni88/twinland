'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { getSession, subscribeToTables, SB_URL, SB_KEY } from '../gameSystem'

export default function AdminPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [isAdmin, setIsAdmin] = useState(null)   // null = در حال چک
  const [claims, setClaims] = useState([])
  const [busy, setBusy] = useState(null)         // business_id در حال پردازش

  useEffect(() => { setPal(loadPrefs()) }, [])

  const authHeaders = (s) => ({
    apikey: SB_KEY,
    Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY),
    'Content-Type': 'application/json',
  })

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = authHeaders(s)
    // چک ادمین بودن
    const me = await fetch(SB_URL + '/rest/v1/profiles?id=eq.' + s.user.id + '&select=is_admin', { headers: h })
      .then(r => r.json()).catch(() => [])
    const admin = Array.isArray(me) && me[0] && me[0].is_admin
    setIsAdmin(!!admin)
    if (!admin) return
    // claim‌های منتظر
    const rows = await fetch(SB_URL + '/rest/v1/pending_claims?select=*', { headers: h })
      .then(r => r.json()).catch(() => [])
    setClaims(Array.isArray(rows) ? rows : [])
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsub = subscribeToTables([{ table: 'businesses', event: '*' }], () => load())
    return () => unsub()
  }, [load])

  async function review(businessId, approve) {
    setBusy(businessId)
    const s = getSession()
    try {
      await fetch(SB_URL + '/rest/v1/rpc/review_claim', {
        method: 'POST', headers: authHeaders(s),
        body: JSON.stringify({ p_business_id: businessId, p_approve: approve }),
      })
      await load()
    } catch (e) {}
    setBusy(null)
  }

  const C = buildC(pal.palette, pal.mode)

  if (isAdmin === false) {
    return (
      <div style={{ minHeight: '100dvh', background: C.bg, color: C.text, fontFamily: 'Estedad, sans-serif', direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>دسترسی فقط برای ادمین</div>
          <a href="/" style={{ color: C.accent, fontSize: 13, display: 'inline-block', marginTop: 12 }}>← برگشت</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text, fontFamily: 'Estedad, sans-serif', direction: 'rtl' }}>
      <div style={{ background: C.card, borderBottom: '1px solid ' + C.border, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>پنل ادمین</div>
            <div style={{ fontSize: 11, color: C.sub }}>تأیید درخواست‌های کافه‌داران</div>
          </div>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.accent, fontWeight: 700, textDecoration: 'none', background: C.chip, padding: '8px 14px', borderRadius: 99 }}>← برگشت</a>
      </div>

      <div style={{ padding: '18px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>
          {claims.length > 0 ? claims.length.toLocaleString('fa') + ' درخواست در انتظار تأیید' : 'درخواستی در انتظار نیست'}
        </div>

        {claims.map(c => (
          <div key={c.business_id} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>☕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{c.cafe_name}</div>
                <div style={{ fontSize: 11, color: C.sub }}>{c.district || ''}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>
              متقاضی: <span style={{ color: C.text, fontWeight: 600 }}>{c.owner_name || '—'}</span>
            </div>
            {c.claim_note && (
              <div style={{ fontSize: 12, color: C.text, background: C.chip, borderRadius: 10, padding: '8px 12px', marginBottom: 12, lineHeight: 1.7 }}>
                «{c.claim_note}»
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => review(c.business_id, true)} disabled={busy === c.business_id}
                style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: busy === c.business_id ? 0.6 : 1 }}>
                {busy === c.business_id ? '…' : '✓ تأیید'}
              </button>
              <button onClick={() => review(c.business_id, false)} disabled={busy === c.business_id}
                style={{ flex: 1, background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                ✕ رد
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
