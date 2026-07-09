'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { getSession, subscribeToTables, SB_URL, SB_KEY } from '../gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const WEEKDAYS = ['شنبه', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه']

export default function BusinessPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [businesses, setBusinesses] = useState([])
  const [stats, setStats] = useState({})
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPal(loadPrefs()) }, [])
  const authHeaders = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = authHeaders(s)
    const biz = await fetch(SB_URL + '/rest/v1/businesses?owner_id=eq.' + s.user.id + '&select=id,cafe_id,status,plan,created_at,cafes(name,district)&order=created_at.desc', { headers: h }).then(r => r.json()).catch(() => [])
    const bizArr = Array.isArray(biz) ? biz : []
    setBusinesses(bizArr)
    const statRows = await fetch(SB_URL + '/rest/v1/business_stats?owner_id=eq.' + s.user.id + '&select=*', { headers: h }).then(r => r.json()).catch(() => [])
    if (Array.isArray(statRows)) { const m = {}; statRows.forEach(r => m[r.business_id] = r); setStats(m) }
    const verifiedCafes = bizArr.filter(b => b.status === 'verified').map(b => b.cafe_id)
    const anaMap = {}
    for (const cid of verifiedCafes) {
      const [daily, hourly, weekday, retention] = await Promise.all([
        fetch(SB_URL + '/rest/v1/business_daily?cafe_id=eq.' + cid + '&select=day,checkins&order=day.asc', { headers: h }).then(r => r.json()).catch(() => []),
        fetch(SB_URL + '/rest/v1/business_hourly?cafe_id=eq.' + cid + '&select=hour,checkins&order=hour.asc', { headers: h }).then(r => r.json()).catch(() => []),
        fetch(SB_URL + '/rest/v1/business_weekday?cafe_id=eq.' + cid + '&select=weekday,checkins&order=weekday.asc', { headers: h }).then(r => r.json()).catch(() => []),
        fetch(SB_URL + '/rest/v1/business_retention?cafe_id=eq.' + cid + '&select=*', { headers: h }).then(r => r.json()).catch(() => []),
      ])
      anaMap[cid] = {
        daily: Array.isArray(daily) ? daily : [],
        hourly: Array.isArray(hourly) ? hourly : [],
        weekday: Array.isArray(weekday) ? weekday : [],
        retention: Array.isArray(retention) && retention[0] ? retention[0] : null,
      }
    }
    setAnalytics(anaMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const unsub = subscribeToTables([{ table: 'checkins', event: 'INSERT' }, { table: 'businesses', event: '*' }], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const verified = businesses.filter(b => b.status === 'verified')
  const pending = businesses.filter(b => b.status === 'pending')

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text, fontFamily: 'Estedad, sans-serif', direction: 'rtl' }}>
      <div style={{ background: C.card, borderBottom: '1px solid ' + C.border, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🏪</span>
          <div><div style={{ fontSize: 17, fontWeight: 800 }}>پنل کافه‌دار</div><div style={{ fontSize: 11, color: C.sub }}>TwinLand Business</div></div>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.accent, fontWeight: 700, textDecoration: 'none', background: C.chip, padding: '8px 14px', borderRadius: 99 }}>← برگشت به اپ</a>
      </div>
      <div style={{ padding: '18px', maxWidth: 680, margin: '0 auto' }}>
        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '60px 0' }}>در حال بارگذاری…</div>
          : businesses.length === 0 ? <EmptyState C={C} />
          : <>
            {verified.map(b => <BusinessCard key={b.id} C={C} biz={b} stat={stats[b.id]} ana={analytics[b.cafe_id]} />)}
            {pending.map(b => (
              <div key={b.id} style={{ background: C.card, border: '1px solid #f59e0b44', borderRadius: 18, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{b.cafes?.name} — در انتظار تأیید</div><div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>بعد از تأیید ادمین فعال می‌شه.</div></div>
              </div>
            ))}
          </>}
      </div>
    </div>
  )
}

function EmptyState({ C }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>هنوز کافه‌ای نداری</div>
      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 20 }}>توی اپ اصلی کافه‌ت رو پیدا کن و «صاحب این کافه هستید؟» رو بزن.</div>
      <a href="/" style={{ display: 'inline-block', background: C.accent, color: '#fff', padding: '12px 24px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>رفتن به نقشه</a>
    </div>
  )
}

function BusinessCard({ C, biz, stat, ana }) {
  const s = stat || {}
  const metrics = [
    { label: 'چک‌این امروز', value: s.today_checkins, icon: '📍', accent: C.accent },
    { label: 'بازدیدکننده امروز', value: s.today_unique, icon: '👤', accent: '#10b981' },
    { label: 'کل چک‌این‌ها', value: s.total_checkins, icon: '📊', accent: '#8b5cf6' },
    { label: 'مشتری یکتا (هفته)', value: s.week_unique, icon: '🔄', accent: '#f59e0b' },
  ]
  const ret = ana && ana.retention
  const repeatPct = ret && ret.total_customers > 0 ? Math.round((ret.repeat_customers / ret.total_customers) * 100) : 0
  const hasCharts = ana && ((ana.daily && ana.daily.length > 0) || (ana.hourly && ana.hourly.length > 0))

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>☕</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{biz.cafes ? biz.cafes.name : 'کافه'}</div>
          <div style={{ fontSize: 11, color: C.sub }}>{biz.cafes ? biz.cafes.district : ''} · <span style={{ color: '#10b981', fontWeight: 700 }}>✓ تأییدشده</span></div>
        </div>
        <span style={{ fontSize: 10, background: biz.plan === 'pro' ? '#f59e0b' : C.chip, color: biz.plan === 'pro' ? '#fff' : C.sub, borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>{biz.plan === 'pro' ? 'PRO' : 'رایگان'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: C.chip, borderRadius: 14, padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><span style={{ fontSize: 15 }}>{m.icon}</span><span style={{ fontSize: 11, color: C.sub }}>{m.label}</span></div>
            <div style={{ fontSize: 26, fontWeight: 900, color: m.accent }}>{fa(m.value)}</div>
          </div>
        ))}
      </div>

      {ret && (
        <div style={{ background: C.chip, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>وفاداری مشتری</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DonutChart C={C} pct={repeatPct} color="#10b981" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}><b style={{ color: '#10b981', fontSize: 16 }}>{fa(repeatPct)}٪</b> مشتری بازگشتی</div>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.7 }}>{fa(ret.repeat_customers)} نفر بیش از یک‌بار اومدن · {fa(ret.one_time)} نفر فقط یک‌بار</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>مشتری جدید این هفته: <b style={{ color: C.accent }}>{fa(ret.new_this_week)}</b></div>
            </div>
          </div>
        </div>
      )}

      {ana && ana.daily && ana.daily.length > 0 && (
        <ChartBox C={C} title="روند چک‌این (۳۰ روز)"><LineChart C={C} data={ana.daily.map(d => ({ x: d.day, y: d.checkins }))} color={C.accent} /></ChartBox>
      )}
      {ana && ana.hourly && ana.hourly.length > 0 && (
        <ChartBox C={C} title="ساعت‌های پیک"><BarChart C={C} data={hourBuckets(ana.hourly)} color="#8b5cf6" labelEvery={3} /></ChartBox>
      )}
      {ana && ana.weekday && ana.weekday.length > 0 && (
        <ChartBox C={C} title="شلوغی روزهای هفته"><BarChart C={C} data={weekdayBuckets(ana.weekday)} color="#f59e0b" labelEvery={1} /></ChartBox>
      )}
      {!hasCharts && <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '20px 0' }}>هنوز داده‌ی کافی برای نمودار نیست. با چک‌این بیشتر، نمودارها پر می‌شن.</div>}
    </div>
  )
}

function hourBuckets(hourly) {
  const map = {}; hourly.forEach(h => map[h.hour] = h.checkins)
  return Array.from({ length: 24 }, (_, i) => ({ label: fa(i), y: map[i] || 0 }))
}
function weekdayBuckets(weekday) {
  const map = {}; weekday.forEach(w => map[w.weekday] = w.checkins)
  return WEEKDAYS.map((name, i) => ({ label: name, y: map[i] || 0 }))
}

function ChartBox({ C, title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</div>
      <div style={{ background: C.chip, borderRadius: 14, padding: '14px 10px 8px' }}>{children}</div>
    </div>
  )
}

function LineChart({ C, data, color }) {
  const W = 300, H = 90, pad = 6
  if (!data.length) return null
  const ys = data.map(d => d.y)
  const max = Math.max.apply(null, ys.concat([1]))
  const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0
  const pts = data.map((d, i) => [pad + i * step, H - pad - (d.y / max) * (H - pad * 2)])
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = path + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pad) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - pad) + ' Z'
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={color} />)}
    </svg>
  )
}

function BarChart({ C, data, color, labelEvery = 1 }) {
  const W = 300, H = 100, pad = 6, labelH = 16
  const max = Math.max.apply(null, data.map(d => d.y).concat([1]))
  const bw = (W - pad * 2) / data.length
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.map((d, i) => {
        const h = (d.y / max) * (H - pad - labelH)
        const x = pad + i * bw
        const y = H - labelH - h
        return <g key={i}>
          <rect x={x + bw * 0.15} y={y} width={bw * 0.7} height={Math.max(h, 0.5)} rx="1.5" fill={color} opacity={d.y > 0 ? 0.9 : 0.25} />
          {i % labelEvery === 0 && <text x={x + bw / 2} y={H - 4} fontSize="7" fill={C.sub} textAnchor="middle" fontFamily="Estedad">{d.label}</text>}
        </g>
      })}
    </svg>
  )
}

function DonutChart({ C, pct, color }) {
  const r = 26, sw = 7, cx = 32, cy = 32
  const circ = 2 * Math.PI * r
  const off = circ * (1 - pct / 100)
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform={'rotate(-90 ' + cx + ' ' + cy + ')'} />
      <text x={cx} y={cy + 4} fontSize="14" fontWeight="800" fill={C.text} textAnchor="middle" fontFamily="Estedad">{fa(pct)}٪</text>
    </svg>
  )
}
