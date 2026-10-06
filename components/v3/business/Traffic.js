'use client'
// برگه «بازدید و کلیک» پنل کسب‌وکار نسخه v3.0.
// مسیر کامل را نشان می‌دهد: برگه مکان دیده شد، روی راه تماس کلیک شد، و آدم واقعاً آمد و چک‌این کرد.
// همه عددها جمعی‌اند. شمار آدم‌ها وقتی کمتر از 5 باشد از سرور نمی‌آید و اینجا «کمتر از 5» نوشته می‌شود.
import { Card, Delta, Empty, Kpi, Legend, TrendChart, fa, pctOf } from '@/components/v3/business/bizUi'

const grid = (min) => ({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(' + min + 'px, 1fr))', gap: 12 })
const dayLabel = (iso) => { try { return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }) } catch (e) { return String(iso) } }
const SOURCES = { map: 'نقشه', search: 'جست‌وجو', quest: 'کمپین و ماموریت', banner: 'نوار رویداد', direct: 'مستقیم', sheet: 'برگه مکان', collab: 'همکاری' }
const ICONS = { phone: '📞', instagram: '📷', website: '🌐', directions: '🗺', google_maps: '🧭', neshan: '🧭', balad: '🧭', menu: '🍽', whatsapp: '💬', telegram: '✈️' }

export function Traffic({ C, K, t }) {
  if (!t || !t.ok) return <Card C={C} K={K}><Empty C={C} icon="📈" title="آمار بازدید در دسترس نیست" text="صفحه را تازه کن. اگر ادامه داشت، دوباره وارد شو." /></Card>
  const tt = t.totals || {}
  const k = t.min_group || 5
  const people = (n) => (n == null ? (tt.views ? 'کمتر از ' + fa(k) : '—') : fa(n))
  const daily = t.daily || []
  const channels = [...(t.channels || [])].sort((a, b) => (b.events || 0) - (a.events || 0))
  const sources = t.sources || []
  const refs = t.refs || []
  const maxCh = Math.max(1, ...channels.map(c => c.events || 0))
  const maxSrc = Math.max(1, ...sources.map(s => s.views || 0))
  const empty = !tt.views && !tt.clicks
  const steps = [
    ['👀', 'برگه مکان را دیدند', tt.viewers, null],
    ['👆', 'روی یک راه تماس کلیک کردند', tt.clickers, tt.viewers],
    ['📍', 'تا هفت روز بعد آمدند و چک‌این کردند', tt.visits, tt.viewers],
  ]
  const bar = (v, max, color) => <div style={{ height: 8, borderRadius: 99, background: C.chip, overflow: 'hidden', flex: 1 }}><div style={{ height: '100%', width: Math.max(2, Math.round((v / max) * 100)) + '%', background: color, borderRadius: 99 }} /></div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid(170)}>
        <Kpi C={C} K={K} icon="👀" label={'بازدید برگه در ' + fa(t.days) + ' روز'} value={fa(tt.views)} delta={<Delta K={K} now={tt.views} prev={tt.prev_views} suffix="از دوره قبل" />} />
        <Kpi C={C} K={K} icon="👆" label="کلیک روی راه‌های تماس" value={fa(tt.clicks)} delta={<Delta K={K} now={tt.clicks} prev={tt.prev_clicks} suffix="از دوره قبل" />} />
        <Kpi C={C} K={K} icon="📍" label="مراجعه بعد از دیدن" value={people(tt.visits)} unit={tt.visits != null ? 'نفر' : ''} hint="کسی که برگه را دید و تا هفت روز بعد همین‌جا چک‌این کرد" />
        <Kpi C={C} K={K} icon="🎯" label="نرخ دیدن تا مراجعه" value={tt.visits != null && tt.viewers ? fa(pctOf(tt.visits, tt.viewers)) : '—'} unit={tt.visits != null && tt.viewers ? 'درصد' : ''} hint="از هر صد نفری که برگه را دیدند" />
      </div>

      {empty ? <Card C={C} K={K}><Empty C={C} icon="📈" title="هنوز بازدیدی ثبت نشده" text="از همین حالا هر بار کسی برگه مکان تو را باز کند یا روی تلفن، اینستاگرام، سایت یا مسیر بزند، این‌جا شمرده می‌شود." /></Card> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <Card C={C} K={K} title="روند روزانه" hint="بازدید برگه و کلیک در هر روز" style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <TrendChart C={C} K={K} labels={daily.map(x => dayLabel(x.day))} series={[
              { name: 'بازدید برگه', color: K.series[0], values: daily.map(x => Number(x.views) || 0) },
              { name: 'کلیک', color: K.series[1], values: daily.map(x => Number(x.clicks) || 0) },
            ]} />
            <Legend C={C} items={[{ label: 'بازدید برگه', color: K.series[0] }, { label: 'کلیک', color: K.series[1] }]} />
          </Card>
          <Card C={C} K={K} title="از دیدن تا آمدن" hint="شمار آدم‌ها، نه دفعه‌ها" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map((s, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text }}>{s[1]}</div>
                  {s[3] && s[2] != null ? <div style={{ fontSize: 11, color: C.sub }}>{fa(pctOf(s[2], s[3]))} درصد از بازدیدکننده‌ها</div> : null}
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.text, flexShrink: 0 }}>{people(s[2])}</span>
              </div>)}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <Card C={C} K={K} title="کلیک‌ها به کجا رفتند" hint="هر کلیک یک نفر است که از TwinLand به سمت تو فرستاده شد" style={{ minWidth: 0 }}>
            {channels.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.map(c => <div key={c.channel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.text, marginBottom: 5 }}>
                  <span>{ICONS[c.channel] || '🔗'}</span><span style={{ fontWeight: 800, flex: 1 }}>{c.label}</span>
                  <span style={{ fontWeight: 900 }}>{fa(c.events)} کلیک</span><span style={{ color: C.sub, fontSize: 11 }}>· {people(c.people)} نفر</span>
                </div>
                <div style={{ display: 'flex' }}>{bar(c.events || 0, maxCh, K.series[1])}</div>
              </div>)}
            </div> : <Empty C={C} icon="👆" title="هنوز کلیکی نیست" text="تلفن، اینستاگرام و وب‌سایت را در ویترین کامل کن تا دکمه‌هایشان در برگه مکان بیاید." />}
          </Card>
          <Card C={C} K={K} title="بازدیدکننده از کجا آمد" hint="جایی از TwinLand که برگه تو از آن باز شد" style={{ minWidth: 0 }}>
            {sources.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sources.map(s => <div key={s.source}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.text, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, flex: 1 }}>{SOURCES[s.source] || s.source}</span><span style={{ fontWeight: 900 }}>{fa(s.views)} بازدید</span>
                </div>
                <div style={{ display: 'flex' }}>{bar(s.views || 0, maxSrc, K.series[0])}</div>
              </div>)}
            </div> : <Empty C={C} icon="🧭" title="هنوز داده‌ای نیست" />}
          </Card>
        </div>

        {refs.length > 0 && <Card C={C} K={K} title="اثر هر کمپین" hint="بازدید، کلیک و مراجعه‌ای که از راه همان کمپین آمده است">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {refs.map(r => <div key={r.ref_type + ':' + r.ref_id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 12px', borderRadius: 12, background: C.chip, fontSize: 12.5, color: C.text }}>
              <span style={{ fontWeight: 800, flex: 1, minWidth: 140 }}>🎯 {r.title || 'کمپین'}</span>
              <span>{fa(r.views)} بازدید</span><span>{fa(r.clicks)} کلیک</span><span style={{ fontWeight: 900 }}>{people(r.visits)} مراجعه</span>
            </div>)}
          </div>
        </Card>}
      </>}

      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.9 }}>
        هر نفر برای هر چیز در هر نیم‌ساعت فقط یک بار شمرده می‌شود. بازدید و کلیک خود تو و حساب‌های کسب‌وکار شمرده نمی‌شود. شمار آدم‌ها وقتی کمتر از {fa(k)} باشد نشان داده نمی‌شود.
      </div>
    </div>
  )
}
