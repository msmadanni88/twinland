'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { getSession, subscribeToTables, SB_URL, SB_KEY } from '../gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const WEEKDAYS = ['شنبه', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه']
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)

export default function BusinessPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [businesses, setBusinesses] = useState([])
  const [data, setData] = useState({})   // همه‌ی داده‌ها per cafe_id
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => { setPal(loadPrefs()) }, [])
  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })
  const get = (url, h) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => r.json()).catch(() => [])
  const one = (arr) => (Array.isArray(arr) && arr[0]) ? arr[0] : null

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = H(s)
    const biz = await get('businesses?owner_id=eq.' + s.user.id + '&select=id,cafe_id,status,plan,created_at,cafes(name,district)&order=created_at.desc', h)
    const bizArr = Array.isArray(biz) ? biz : []
    setBusinesses(bizArr)
    const statRows = await get('business_stats?owner_id=eq.' + s.user.id + '&select=*', h)
    const statMap = {}; if (Array.isArray(statRows)) statRows.forEach(r => statMap[r.cafe_id] = r)

    const map = {}
    for (const b of bizArr.filter(x => x.status === 'verified')) {
      const cid = b.cafe_id
      const [daily, hourly, weekday, retention, periods, clv, cohort, rank, clans, covisit] = await Promise.all([
        get('business_daily?cafe_id=eq.' + cid + '&select=day,checkins&order=day.asc', h),
        get('business_hourly?cafe_id=eq.' + cid + '&select=hour,checkins&order=hour.asc', h),
        get('business_weekday?cafe_id=eq.' + cid + '&select=weekday,checkins&order=weekday.asc', h),
        get('business_retention?cafe_id=eq.' + cid + '&select=*', h),
        get('business_periods?cafe_id=eq.' + cid + '&select=*', h),
        get('business_clv?cafe_id=eq.' + cid + '&select=*', h),
        get('business_cohort?cafe_id=eq.' + cid + '&select=*', h),
        get('business_rank?cafe_id=eq.' + cid + '&select=*', h),
        get('business_clans?cafe_id=eq.' + cid + '&select=*&order=members_visited.desc&limit=5', h),
        get('business_covisit?cafe_id=eq.' + cid + '&select=*&order=shared_customers.desc&limit=6', h),
      ])
      map[cid] = {
        stat: statMap[cid] || {},
        daily: daily || [], hourly: hourly || [], weekday: weekday || [],
        retention: one(retention), periods: one(periods), clv: one(clv),
        cohort: one(cohort), rank: one(rank),
        clans: Array.isArray(clans) ? clans : [], covisit: Array.isArray(covisit) ? covisit : [],
      }
    }
    setData(map)
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
        <a href="/" style={{ fontSize: 13, color: C.accent, fontWeight: 700, textDecoration: 'none', background: C.chip, padding: '8px 14px', borderRadius: 99 }}>← برگشت</a>
      </div>

      <div style={{ padding: '18px', maxWidth: 680, margin: '0 auto' }}>
        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '60px 0' }}>در حال بارگذاری…</div>
          : businesses.length === 0 ? <EmptyState C={C} />
          : <>
            {verified.map(b => <BusinessCard key={b.id} C={C} biz={b} d={data[b.cafe_id]} tab={tab} setTab={setTab} />)}
            {pending.map(b => (
              <div key={b.id} style={{ background: C.card, border: '1px solid #f59e0b44', borderRadius: 18, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{b.cafes && b.cafes.name} — در انتظار تأیید</div></div>
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

function BusinessCard({ C, biz, d, tab, setTab }) {
  if (!d) return null
  const TABS = [['overview', 'نمای کلی'], ['customers', 'مشتری‌ها'], ['timing', 'زمان‌بندی'], ['market', 'بازار']]
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

      {/* تب‌ها */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none', background: tab === k ? C.accent : C.chip, color: tab === k ? '#fff' : C.sub, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && <TabOverview C={C} d={d} />}
      {tab === 'customers' && <TabCustomers C={C} d={d} />}
      {tab === 'timing' && <TabTiming C={C} d={d} />}
      {tab === 'market' && <TabMarket C={C} d={d} />}
    </div>
  )
}

// ── تب نمای کلی: متریک‌های کلیدی + مقایسه دوره‌ای + بینش عملی ─────────────────
function TabOverview({ C, d }) {
  const s = d.stat || {}, p = d.periods || {}
  const wkChange = p.last_week > 0 ? Math.round(((p.this_week - p.last_week) / p.last_week) * 100) : (p.this_week > 0 ? 100 : 0)
  const moChange = p.last_month > 0 ? Math.round(((p.this_month - p.last_month) / p.last_month) * 100) : (p.this_month > 0 ? 100 : 0)
  const metrics = [
    { label: 'چک‌این امروز', value: s.today_checkins, icon: '📍', accent: C.accent },
    { label: 'بازدیدکننده امروز', value: s.today_unique, icon: '👤', accent: '#10b981' },
    { label: 'کل چک‌این‌ها', value: s.total_checkins, icon: '📊', accent: '#8b5cf6' },
    { label: 'مشتری یکتا (هفته)', value: s.week_unique, icon: '🔄', accent: '#f59e0b' },
  ]
  const insights = buildInsights(C, d)
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
      {metrics.map(m => (
        <div key={m.label} style={{ background: C.chip, borderRadius: 14, padding: '14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><span style={{ fontSize: 15 }}>{m.icon}</span><span style={{ fontSize: 11, color: C.sub }}>{m.label}</span></div>
          <div style={{ fontSize: 26, fontWeight: 900, color: m.accent }}>{fa(m.value)}</div>
        </div>
      ))}
    </div>

    {/* مقایسه‌ی دوره‌ای */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
      <CompareCard C={C} label="این هفته" value={p.this_week} change={wkChange} prev={p.last_week} prevLabel="هفته قبل" />
      <CompareCard C={C} label="این ماه" value={p.this_month} change={moChange} prev={p.last_month} prevLabel="ماه قبل" />
    </div>

    {/* بینش‌های عملی */}
    {insights.length > 0 && (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>💡 بینش‌های عملی</div>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, background: ins.color + '0d', border: '1px solid ' + ins.color + '33', borderRadius: 12, padding: '11px 13px', marginBottom: 8 }}>
            <span style={{ fontSize: 17 }}>{ins.icon}</span>
            <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.7 }}>{ins.text}</div>
          </div>
        ))}
      </div>
    )}
  </>
}

function CompareCard({ C, label, value, change, prev, prevLabel }) {
  const up = change >= 0
  return (
    <div style={{ background: C.chip, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{fa(value)}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: up ? '#10b981' : '#ef4444' }}>{up ? '▲' : '▼'} {fa(Math.abs(change))}٪</div>
      </div>
      <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>{prevLabel}: {fa(prev)}</div>
    </div>
  )
}

// ── تب مشتری‌ها: CLV، لایه‌های وفاداری، کوهورت بازگشت ────────────────────────
function TabCustomers({ C, d }) {
  const clv = d.clv || {}, co = d.cohort || {}, ret = d.retention || {}
  const tiers = [
    { label: 'یک‌بار', value: clv.tier_1visit, color: '#94a3b8' },
    { label: '۲ تا ۴ بار', value: clv.tier_2to4, color: '#3b82f6' },
    { label: '۵ تا ۹ بار', value: clv.tier_5to9, color: '#8b5cf6' },
    { label: '۱۰+ (وفادار)', value: clv.tier_loyal, color: '#10b981' },
  ]
  const totalTier = tiers.reduce((a, t) => a + (t.value || 0), 0)
  const new30 = co.new_30d || 0, ret30 = co.new_30d_returned || 0
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
      <BigStat C={C} label="میانگین دفعات بازگشت" value={clv.avg_visits_per_customer} suffix="بار" accent="#8b5cf6" hint="هر مشتری چند بار میاد" />
      <BigStat C={C} label="وفادارترین مشتری" value={clv.top_customer_visits} suffix="بار" accent="#10b981" hint="بیشترین دفعات یک نفر" />
    </div>

    {/* لایه‌های وفاداری */}
    <div style={{ background: C.chip, borderRadius: 14, padding: 14, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>لایه‌های وفاداری مشتری</div>
      {tiers.map(t => (
        <div key={t.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
            <span style={{ color: C.sub }}>{t.label}</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{fa(t.value)} نفر ({fa(pct(t.value, totalTier))}٪)</span>
          </div>
          <div style={{ height: 7, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct(t.value, totalTier) + '%', background: t.color, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>

    {/* کوهورت بازگشت مشتری جدید */}
    <div style={{ background: C.chip, borderRadius: 14, padding: 14, marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>نرخ بازگشت مشتری جدید (۳۰ روز)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <DonutChart C={C} pct={pct(ret30, new30)} color="#10b981" />
        <div style={{ flex: 1, fontSize: 12, color: C.sub, lineHeight: 1.8 }}>
          از <b style={{ color: C.text }}>{fa(new30)}</b> مشتری جدید این ماه، <b style={{ color: '#10b981' }}>{fa(ret30)}</b> نفر دوباره برگشتن.
          <div style={{ marginTop: 6 }}>فعال (۷ روز): <b style={{ color: C.accent }}>{fa(co.active_7d)}</b> · در خطر ریزش: <b style={{ color: '#ef4444' }}>{fa(co.churned)}</b></div>
        </div>
      </div>
    </div>
  </>
}

// ── تب زمان‌بندی: نمودار روزانه، ساعت، روز هفته ──────────────────────────────
function TabTiming({ C, d }) {
  const hasData = (d.daily && d.daily.length) || (d.hourly && d.hourly.length)
  if (!hasData) return <NoData C={C} />
  return <>
    {d.daily && d.daily.length > 0 && <ChartBox C={C} title="روند چک‌این (۳۰ روز)"><LineChart C={C} data={d.daily.map(x => ({ y: x.checkins }))} color={C.accent} /></ChartBox>}
    {d.hourly && d.hourly.length > 0 && <ChartBox C={C} title="ساعت‌های پیک"><BarChart C={C} data={hourBuckets(d.hourly)} color="#8b5cf6" labelEvery={3} /></ChartBox>}
    {d.weekday && d.weekday.length > 0 && <ChartBox C={C} title="شلوغی روزهای هفته"><BarChart C={C} data={weekdayBuckets(d.weekday)} color="#f59e0b" labelEvery={1} /></ChartBox>}
  </>
}

// ── تب بازار: رتبه در منطقه، کلن‌ها، هم‌بازدیدی ──────────────────────────────
function TabMarket({ C, d }) {
  const r = d.rank || {}
  return <>
    {/* رتبه در منطقه */}
    <div style={{ background: 'linear-gradient(135deg,' + C.accent + '18,' + C.accent + '05)', border: '1px solid ' + C.accent + '33', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>رتبه‌ی کافه‌ت در {r.district || 'منطقه'}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color: C.accent }}>{fa(r.rank_in_district)}<span style={{ fontSize: 15, color: C.sub, fontWeight: 500 }}> از {fa(r.total_in_district)}</span></div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>بر اساس چک‌این ۳۰ روز اخیر</div>
    </div>

    {/* کلن‌های مشتری */}
    {d.clans && d.clans.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🛡️ کلن‌های پرتکرار مشتری‌هات</div>
        {d.clans.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.chip, borderRadius: 12, padding: '10px 12px', marginBottom: 7 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: c.color || '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{c.emblem || '⚔️'}</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{c.clan_name}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{fa(c.members_visited)} عضو · {fa(c.total_checkins)} چک‌این</div>
          </div>
        ))}
      </div>
    )}

    {/* هم‌بازدیدی */}
    {d.covisit && d.covisit.length > 0 && (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>🔗 مشتری‌هات کجای دیگه می‌رن</div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, lineHeight: 1.6 }}>کافه‌هایی که مشتری‌های مشترک با تو دارن (بینش رقابتی و سلیقه)</div>
        {d.covisit.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.chip, borderRadius: 12, padding: '10px 12px', marginBottom: 7 }}>
            <span style={{ fontSize: 16 }}>☕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.other_cafe_name}</div>
              <div style={{ fontSize: 10, color: C.sub }}>{c.other_district}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>{fa(c.shared_customers)} مشترک</div>
          </div>
        ))}
      </div>
    )}
    {(!d.clans || !d.clans.length) && (!d.covisit || !d.covisit.length) && <NoData C={C} />}
  </>
}

// بینش‌های عملی («اگه این، پس آن») — قلب حرفه‌ای‌بودن
function buildInsights(C, d) {
  const out = []
  const p = d.periods || {}, co = d.cohort || {}, hourly = d.hourly || [], weekday = d.weekday || []
  // رشد/افت هفتگی
  if (p.last_week > 0) {
    const ch = Math.round(((p.this_week - p.last_week) / p.last_week) * 100)
    if (ch <= -15) out.push({ icon: '📉', color: '#ef4444', text: 'چک‌این این هفته ' + fa(Math.abs(ch)) + '٪ کمتر از هفته‌ی قبله. یه کمپین یا quest کوتاه‌مدت می‌تونه برش گردونه.' })
    else if (ch >= 20) out.push({ icon: '🚀', color: '#10b981', text: 'رشد ' + fa(ch) + '٪ نسبت به هفته‌ی قبل! هرکاری این هفته کردی جواب داده — ادامه بده.' })
  }
  // ریزش
  if (co.churned > 0 && (co.churned > (co.active_7d || 0))) {
    out.push({ icon: '⚠️', color: '#f59e0b', text: fa(co.churned) + ' مشتری بیش از ۹۰ روزه نیومدن. یه quest «دلتنگتیم» با پاداش ویژه برای برگردوندنشون بذار.' })
  }
  // ساعت خلوت
  if (hourly.length > 3) {
    const sorted = [...hourly].sort((a, b) => a.checkins - b.checkins)
    const quiet = sorted[0]
    if (quiet && quiet.hour >= 8 && quiet.hour <= 20) out.push({ icon: '⏰', color: '#8b5cf6', text: 'ساعت ' + fa(quiet.hour) + ' خلوت‌ترین زمانته. یه quest «ساعت طلایی» بذار تا این ساعت پر شه.' })
  }
  // روز خلوت
  if (weekday.length > 3) {
    const map = {}; weekday.forEach(w => map[w.weekday] = w.checkins)
    let minDay = 0, minVal = Infinity
    for (let i = 0; i < 7; i++) { const v = map[i] || 0; if (v < minVal) { minVal = v; minDay = i } }
    out.push({ icon: '📅', color: '#3b82f6', text: WEEKDAYS[minDay] + '‌ها خلوت‌ترین روزته. کمپین مخصوص ' + WEEKDAYS[minDay] + ' می‌تونه فروش رو متعادل کنه.' })
  }
  return out.slice(0, 3)
}

function BigStat({ C, label, value, suffix, accent, hint }) {
  return (
    <div style={{ background: C.chip, borderRadius: 14, padding: '14px 12px' }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{fa(value)} <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{suffix}</span></div>
      {hint && <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

function NoData({ C }) {
  return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '30px 0' }}>هنوز داده‌ی کافی نیست. با چک‌این بیشتر، این بخش پر می‌شه.</div>
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
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</div><div style={{ background: C.chip, borderRadius: 14, padding: '14px 10px 8px' }}>{children}</div></div>
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
      <path d={area} fill="url(#lg)" /><path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
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
        const h = (d.y / max) * (H - pad - labelH); const x = pad + i * bw; const y = H - labelH - h
        return <g key={i}>
          <rect x={x + bw * 0.15} y={y} width={bw * 0.7} height={Math.max(h, 0.5)} rx="1.5" fill={color} opacity={d.y > 0 ? 0.9 : 0.25} />
          {i % labelEvery === 0 && <text x={x + bw / 2} y={H - 4} fontSize="7" fill={C.sub} textAnchor="middle" fontFamily="Estedad">{d.label}</text>}
        </g>
      })}
    </svg>
  )
}

function DonutChart({ C, pct: pctVal, color }) {
  const r = 26, sw = 7, cx = 32, cy = 32
  const circ = 2 * Math.PI * r; const off = circ * (1 - (pctVal || 0) / 100)
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform={'rotate(-90 ' + cx + ' ' + cy + ')'} />
      <text x={cx} y={cy + 4} fontSize="14" fontWeight="800" fill={C.text} textAnchor="middle" fontFamily="Estedad">{fa(pctVal)}٪</text>
    </svg>
  )
}
