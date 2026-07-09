'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { getSession, subscribeToTables, SB_URL, SB_KEY } from '../gameSystem'

export default function BusinessPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [session, setSession] = useState(null)
  const [businesses, setBusinesses] = useState([])   // کسب‌وکارهای من
  const [stats, setStats] = useState({})             // آمار هر business_id
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPal(loadPrefs()) }, [])

  const authHeaders = (s) => ({
    apikey: SB_KEY,
    Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY),
  })

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    setSession(s)
    const h = authHeaders(s)
    // کسب‌وکارهای من (هر وضعیتی)
    const biz = await fetch(SB_URL + '/rest/v1/businesses?owner_id=eq.' + s.user.id + '&select=id,cafe_id,status,plan,claim_note,created_at,cafes(name,district)&order=created_at.desc', { headers: h })
      .then(r => r.json()).catch(() => [])
    setBusinesses(Array.isArray(biz) ? biz : [])
    // آمار تجمیعی برای کسب‌وکارهای تأییدشده
    const statRows = await fetch(SB_URL + '/rest/v1/business_stats?owner_id=eq.' + s.user.id + '&select=*', { headers: h })
      .then(r => r.json()).catch(() => [])
    if (Array.isArray(statRows)) {
      const map = {}
      statRows.forEach(r => { map[r.business_id] = r })
      setStats(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // realtime: چک‌این جدید یا تغییر وضعیت کسب‌وکار → آمار زنده به‌روز شه
  useEffect(() => {
    const unsub = subscribeToTables([
      { table: 'checkins', event: 'INSERT' },
      { table: 'businesses', event: '*' },
    ], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const verified = businesses.filter(b => b.status === 'verified')
  const pending = businesses.filter(b => b.status === 'pending')
  const rejected = businesses.filter(b => b.status === 'rejected')

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text, fontFamily: 'Estedad, sans-serif', direction: 'rtl' }}>
      {/* هدر پورتال کافه‌دار */}
      <div style={{ background: C.card, borderBottom: '1px solid ' + C.border, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🏪</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>پنل کافه‌دار</div>
            <div style={{ fontSize: 11, color: C.sub }}>TwinLand Business</div>
          </div>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.accent, fontWeight: 700, textDecoration: 'none', background: C.chip, padding: '8px 14px', borderRadius: 99 }}>← برگشت به اپ</a>
      </div>

      <div style={{ padding: '18px', maxWidth: 640, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: C.sub, padding: '60px 0' }}>در حال بارگذاری…</div>
        ) : businesses.length === 0 ? (
          <EmptyState C={C} />
        ) : (
          <>
            {/* کسب‌وکارهای تأییدشده با آمار زنده */}
            {verified.map(b => (
              <VerifiedCard key={b.id} C={C} biz={b} stat={stats[b.id]} />
            ))}

            {/* در انتظار تأیید */}
            {pending.map(b => (
              <StatusCard key={b.id} C={C} biz={b} color="#f59e0b" icon="⏳"
                title={(b.cafes?.name || 'کافه') + ' — در انتظار تأیید'}
                sub="درخواستت ثبت شده. بعد از بررسی ادمین فعال می‌شه." />
            ))}

            {/* ردشده */}
            {rejected.map(b => (
              <StatusCard key={b.id} C={C} biz={b} color="#ef4444" icon="✕"
                title={(b.cafes?.name || 'کافه') + ' — رد شد'}
                sub="این درخواست تأیید نشد. برای اطلاعات بیشتر با پشتیبانی تماس بگیر." />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ C }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>هنوز کافه‌ای نداری</div>
      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 20 }}>
        برای مدیریت کافه‌ت، اول باید توی اپ اصلی کافه‌ت رو پیدا کنی و روی دکمه‌ی «صاحب این کافه هستید؟» بزنی.
        بعد از تأیید ادمین، اینجا آمار و ابزارهای کسب‌وکارت رو می‌بینی.
      </div>
      <a href="/" style={{ display: 'inline-block', background: C.accent, color: '#fff', padding: '12px 24px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
        رفتن به نقشه و پیدا کردن کافه
      </a>
    </div>
  )
}

function VerifiedCard({ C, biz, stat }) {
  const s = stat || { total_checkins: 0, today_checkins: 0, unique_visitors: 0, today_unique: 0, week_unique: 0 }
  const metrics = [
    { label: 'چک‌این امروز', value: s.today_checkins, icon: '📍', accent: C.accent },
    { label: 'بازدیدکننده امروز', value: s.today_unique, icon: '👤', accent: '#10b981' },
    { label: 'کل چک‌این‌ها', value: s.total_checkins, icon: '📊', accent: '#8b5cf6' },
    { label: 'مشتری یکتا (هفته)', value: s.week_unique, icon: '🔄', accent: '#f59e0b' },
  ]
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>☕</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{biz.cafes?.name || 'کافه'}</div>
          <div style={{ fontSize: 11, color: C.sub }}>{biz.cafes?.district || ''} · <span style={{ color: '#10b981', fontWeight: 700 }}>✓ تأییدشده</span></div>
        </div>
        <span style={{ fontSize: 10, background: biz.plan === 'pro' ? '#f59e0b' : C.chip, color: biz.plan === 'pro' ? '#fff' : C.sub, borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>
          {biz.plan === 'pro' ? 'PRO' : 'رایگان'}
        </span>
      </div>

      {/* آمار زنده */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: C.chip, borderRadius: 14, padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 15 }}>{m.icon}</span>
              <span style={{ fontSize: 11, color: C.sub }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: m.accent }}>{Number(m.value || 0).toLocaleString('fa')}</div>
          </div>
        ))}
      </div>

      {/* اشاره به فازهای بعدی */}
      <div style={{ marginTop: 14, padding: '12px 14px', background: C.accent + '0d', border: '1px dashed ' + C.accent + '44', borderRadius: 12, fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
        🔒 نمودارهای حرفه‌ای، quest و کمپین، و آنالیز پیشرفته‌ی مشتری‌ها به‌زودی در پلن Pro اضافه می‌شن.
      </div>
    </div>
  )
}

function StatusCard({ C, biz, color, icon, title, sub }) {
  return (
    <div style={{ background: C.card, border: '1px solid ' + color + '44', borderRadius: 18, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3, lineHeight: 1.6 }}>{sub}</div>
      </div>
    </div>
  )
}
