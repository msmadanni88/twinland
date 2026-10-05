'use client'
// بخش‌های پنل کسب‌وکار نسخه v3.0. همه عددها جمعی‌اند: هیچ اسم یا هویت مشتری اینجا نمی‌آید.
import { useMemo, useState } from 'react'
import { BarsChart, Btn, Card, Delta, Empty, HeatStrip, Kpi, Legend, SegBar, TrendChart, WEEKDAYS, fa, pctOf } from '@/components/v3/business/bizUi'

const grid = (min) => ({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(' + min + 'px, 1fr))', gap: 12 })
const hours24 = (rows) => { const a = new Array(24).fill(0); (rows || []).forEach(r => { if (r.hour >= 0 && r.hour < 24) a[r.hour] = Number(r.checkins) || 0 }); return a }
// weekday در ویوی دیتابیس از قبل 0 = شنبه است
const weekFromSat = (rows) => { const a = new Array(7).fill(0); (rows || []).forEach(r => { const i = Number(r.weekday); if (i >= 0 && i < 7) a[i] = Number(r.checkins) || 0 }); return a }
const dayLabel = (iso) => { try { return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }) } catch (e) { return String(iso) } }
const peak = (arr) => { let m = -1, at = -1; arr.forEach((v, i) => { if (v > m) { m = v; at = i } }); return m > 0 ? at : -1 }

function insights(d, area) {
  const out = []
  const hrs = hours24(d.hourly), wk = weekFromSat(d.weekday)
  const ph = peak(hrs), pw = peak(wk)
  const r = d.retention || {}, p = d.periods || {}, co = d.cohort || {}
  if (ph >= 0) out.push({ icon: '⏰', tone: 'info', text: 'شلوغ‌ترین ساعتت ' + fa(ph) + ' تا ' + fa((ph + 1) % 24) + ' است.', go: 'timing', cta: 'زمان‌بندی' })
  if (pw >= 0) {
    const low = wk.indexOf(Math.min(...wk))
    if (low !== pw) out.push({ icon: '📅', tone: 'idea', text: WEEKDAYS[low] + ' خلوت‌ترین روزت است. یک کمپین مخصوص همان روز می‌تواند پرش کند.', go: 'campaigns', cta: 'ساخت کمپین' })
  }
  if (r.total_customers > 0) {
    const rep = pctOf(r.repeat_customers, r.total_customers)
    out.push(rep < 30
      ? { icon: '🔁', tone: 'warn', text: 'فقط ' + fa(rep) + ' درصد مشتری‌ها برگشته‌اند. کمپین وفاداری چندباره این را بالا می‌برد.', go: 'campaigns', cta: 'ساخت کمپین' }
      : { icon: '💚', tone: 'good', text: fa(rep) + ' درصد مشتری‌ها دوباره آمده‌اند. این نرخ خوبی است.', go: 'customers', cta: 'مشتری‌ها' })
  }
  if (co.dormant > 0) out.push({ icon: '😴', tone: 'warn', text: fa(co.dormant) + ' مشتری مدتی است نیامده‌اند. قبل از رفتن کامل، با یک پیشنهاد برشان گردان.', go: 'campaigns', cta: 'ساخت کمپین' })
  if (p.this_week != null && p.last_week > 0 && p.this_week < p.last_week * 0.8) out.push({ icon: '📉', tone: 'warn', text: 'چک‌این این هفته از هفته قبل کمتر است.', go: 'overview', cta: null })
  const top = (d.covisit || [])[0]
  if (top) out.push({ icon: '🤝', tone: 'idea', text: fa(top.shared_customers) + ' مشتری مشترک با «' + top.other_cafe_name + '» داری. همکاری دوطرفه به هر دو کمک می‌کند.', go: 'collab', cta: 'همکاری' })
  if ((d.clans || []).length) out.push({ icon: '🛡', tone: 'idea', text: 'کلن «' + d.clans[0].clan_name + '» بیشترین رفت‌وآمد را پیش تو دارد.', go: 'clans', cta: 'کلن‌ها' })
  if (area && area.district) {
    const me = (area.districts || []).find(x => x.district === area.district)
    if (me && me.checkins_prev_30d > 0 && me.checkins_30d > me.checkins_prev_30d) out.push({ icon: '📍', tone: 'good', text: 'محله‌ات در 30 روز اخیر شلوغ‌تر از ماه قبل شده است.', go: 'area', cta: 'نقشه و محله' })
  }
  if (!out.length) out.push({ icon: '🌱', tone: 'info', text: 'هنوز داده کافی برای پیشنهاد نیست. با اولین چک‌این‌ها این بخش پر می‌شود.', go: null, cta: null })
  return out.slice(0, 6)
}

export function Overview({ C, K, d, area, go }) {
  const p = d.periods || {}, r = d.retention || {}, rk = d.rank || {}
  const daily = d.daily || []
  const labels = daily.map(x => dayLabel(x.day))
  const spark = daily.slice(-14).map(x => Number(x.checkins) || 0)
  const tips = useMemo(() => insights(d, area), [d, area])
  const tone = { good: K.good, warn: K.warn, idea: K.series[0], info: K.muted }
  const activeQ = (d.quests || []).filter(q => q.active).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid(170)}>
        <Kpi C={C} K={K} icon="📍" label="چک‌این این هفته" value={fa(p.this_week)} delta={<Delta K={K} now={p.this_week} prev={p.last_week} suffix="از هفته قبل" />} />
        <Kpi C={C} K={K} icon="👥" label="مشتری یکتای این هفته" value={fa(p.visitors_this_week)} delta={<Delta K={K} now={p.visitors_this_week} prev={p.visitors_last_week} suffix="از هفته قبل" />} />
        <Kpi C={C} K={K} icon="🗓" label="چک‌این این ماه" value={fa(p.this_month)} delta={<Delta K={K} now={p.this_month} prev={p.last_month} suffix="از ماه قبل" />} />
        <Kpi C={C} K={K} icon="🔁" label="مشتری برگشتی" value={fa(pctOf(r.repeat_customers, r.total_customers))} unit="درصد" hint={fa(r.repeat_customers) + ' نفر از ' + fa(r.total_customers) + ' مشتری'} />
        <Kpi C={C} K={K} icon="❤️" label="علاقه‌مندی‌ها" value={fa(d.favCount)} hint="تعداد کسانی که این مکان را نشان کرده‌اند" />
        <Kpi C={C} K={K} icon="🏆" label="رتبه در محله" value={rk.rank_in_district ? fa(rk.rank_in_district) : '—'} unit={rk.total_in_district ? 'از ' + fa(rk.total_in_district) : ''} hint={rk.district || ''} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <Card C={C} K={K} title="روند 30 روز اخیر" hint="چک‌این و مشتری یکتا در هر روز" style={{ gridColumn: 'span 2', minWidth: 0 }}>
          {daily.length ? <>
            <TrendChart C={C} K={K} labels={labels} series={[
              { name: 'چک‌این', color: K.series[0], values: daily.map(x => Number(x.checkins) || 0) },
              { name: 'مشتری یکتا', color: K.series[1], values: daily.map(x => Number(x.unique_visitors) || 0) },
            ]} />
            <Legend C={C} items={[{ label: 'چک‌این', color: K.series[0] }, { label: 'مشتری یکتا', color: K.series[1] }]} />
          </> : <Empty C={C} icon="📈" title="هنوز روندی نیست" text="با اولین چک‌این‌ها این نمودار پر می‌شود." />}
        </Card>
        <Card C={C} K={K} title="پیشنهادهای امروز" hint="بر پایه عددهای خودت">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 10px', borderRadius: 12, background: C.chip, borderInlineStart: '3px solid ' + tone[t.tone] }}>
                <span style={{ fontSize: 16, lineHeight: 1.3 }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.8, color: C.text }}>{t.text}
                  {t.cta && <div><button onClick={() => go(t.go)} style={{ background: 'none', border: 'none', padding: 0, marginTop: 2, color: C.accent, fontWeight: 800, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>{t.cta} ←</button></div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={grid(170)}>
        <Kpi C={C} K={K} icon="🎯" label="کمپین فعال" value={fa(activeQ)} hint={activeQ ? 'روی نقشه برای همه دیده می‌شود' : 'هیچ کمپینی روی نقشه نداری'} />
        <Kpi C={C} K={K} icon="🆕" label="مشتری تازه این هفته" value={fa(r.new_this_week)} />
        <Kpi C={C} K={K} icon="↩️" label="برگشته این هفته" value={fa(r.returned_this_week)} />
        <Kpi C={C} K={K} icon="📊" label="میانگین بازدید هر مشتری" value={(d.clv && d.clv.avg_visits_per_customer != null) ? Number(d.clv.avg_visits_per_customer).toLocaleString('fa', { maximumFractionDigits: 1 }) : '—'} unit="بار" />
      </div>
      {spark.length > 1 && <div style={{ fontSize: 11, color: C.sub, textAlign: 'center' }}>عددها هر دقیقه تازه می‌شوند.</div>}
    </div>
  )
}

export function Customers({ C, K, d }) {
  const r = d.retention || {}, cl = d.clv || {}, co = d.cohort || {}
  const tiers = [
    { label: 'یک بار', value: Number(cl.tier_1visit) || 0, color: K.series[0] },
    { label: '2 تا 4 بار', value: Number(cl.tier_2to4) || 0, color: K.series[1] },
    { label: '5 تا 9 بار', value: Number(cl.tier_5to9) || 0, color: K.series[2] },
    { label: 'وفادار، 10 بار و بیشتر', value: Number(cl.tier_loyal) || 0, color: K.series[3] },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid(170)}>
        <Kpi C={C} K={K} icon="👥" label="کل مشتری‌ها" value={fa(r.total_customers)} />
        <Kpi C={C} K={K} icon="🔁" label="بیش از یک بار آمده" value={fa(r.repeat_customers)} hint={fa(pctOf(r.repeat_customers, r.total_customers)) + ' درصد از کل'} />
        <Kpi C={C} K={K} icon="⏳" label="میانگین عمر مشتری" value={cl.avg_lifespan_days != null ? fa(Math.round(cl.avg_lifespan_days)) : '—'} unit="روز" hint="فاصله اولین تا آخرین بازدید" />
        <Kpi C={C} K={K} icon="⭐" label="پربازدیدترین مشتری" value={fa(cl.top_customer_visits)} unit="بار" hint="فقط عدد، بدون هویت" />
      </div>
      <Card C={C} K={K} title="وفاداری" hint="مشتری‌ها بر اساس تعداد بازدید">
        {r.total_customers ? <SegBar C={C} parts={tiers} /> : <Empty C={C} icon="👥" title="هنوز مشتری ثبت نشده" />}
      </Card>
      <Card C={C} K={K} title="چرخه مشتری" hint="وضعیت مشتری‌ها در 30 روز اخیر">
        <div style={grid(150)}>
          {[['🆕', 'تازه در 30 روز', co.new_30d], ['↩️', 'تازه‌هایی که برگشتند', co.new_30d_returned], ['🔥', 'فعال در 7 روز', co.active_7d], ['😴', 'کم‌پیدا', co.dormant], ['👋', 'رفته', co.churned]].map(x => (
            <div key={x[1]} style={{ background: C.chip, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{x[0]} {x[1]}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>{fa(x[2])}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, padding: '0 4px' }}>🔒 برای حفظ حریم کاربران، اینجا فقط عدد جمعی نشان داده می‌شود. اسم، شماره یا مسیر هیچ کاربری در اختیار کسب‌وکار نیست.</div>
    </div>
  )
}

export function Timing({ C, K, d, area }) {
  const hrs = hours24(d.hourly), wk = weekFromSat(d.weekday)
  const city = hours24(area && area.hours)
  const ph = peak(hrs), pw = peak(wk)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid(170)}>
        <Kpi C={C} K={K} icon="⏰" label="ساعت اوج" value={ph >= 0 ? fa(ph) + ' تا ' + fa((ph + 1) % 24) : '—'} />
        <Kpi C={C} K={K} icon="📅" label="روز اوج" value={pw >= 0 ? WEEKDAYS[pw] : '—'} />
      </div>
      <Card C={C} K={K} title="چک‌این بر اساس ساعت" hint="به وقت تهران">
        {ph >= 0 ? <BarsChart C={C} K={K} color={K.series[0]} hi={ph} labelEvery={3} data={hrs.map((v, h) => ({ label: fa(h), full: 'ساعت ' + fa(h) + ' تا ' + fa((h + 1) % 24), value: v }))} /> : <Empty C={C} icon="⏰" title="هنوز داده ساعتی نیست" />}
      </Card>
      <Card C={C} K={K} title="چک‌این بر اساس روز هفته">
        {pw >= 0 ? <BarsChart C={C} K={K} color={K.series[0]} hi={pw} height={150} data={wk.map((v, i) => ({ label: WEEKDAYS[i], value: v }))} /> : <Empty C={C} icon="📅" title="هنوز داده روزانه نیست" />}
      </Card>
      <Card C={C} K={K} title="تو در برابر کل شهر" hint="هر خانه یک ساعت است، از 0 تا 23. تیره‌تر یعنی شلوغ‌تر. عدد شهر جمعی است.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <HeatStrip C={C} K={K} title="تو" hours={hrs} />
          <HeatStrip C={C} K={K} title="شهر" hours={city} />
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 10, lineHeight: 1.8 }}>ساعت‌هایی که شهر شلوغ است ولی تو خلوتی، بهترین جا برای کمپین ساعتی است.</div>
      </Card>
    </div>
  )
}

export function Clans({ C, K, d, go }) {
  const list = d.clans || []
  const max = Math.max(1, ...list.map(c => Number(c.total_checkins) || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card C={C} K={K} title="کلن‌هایی که پیش تو می‌آیند" hint="کلن یک گروه از کاربران است که با هم بازی می‌کنند. اینجا فقط عدد گروهی هر کلن دیده می‌شود.">
        {list.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((c, i) => (
              <div key={c.clan_name + i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.emblem || '🛡'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 800, color: C.text }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.clan_name}</span>
                    <span style={{ color: C.sub, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{fa(c.members_visited)} عضو · {fa(c.total_checkins)} چک‌این</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.chip, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: ((Number(c.total_checkins) || 0) / max * 100) + '%', height: '100%', background: K.series[0], borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty C={C} icon="🛡" title="هنوز کلنی پیش تو نیامده" text="وقتی اعضای یک کلن چک‌این کنند، اینجا دیده می‌شود." />}
      </Card>
      <Card C={C} K={K} title="چرا کلن‌ها مهم‌اند">
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 2 }}>
          اعضای کلن با هم می‌آیند و برای هم رقابت می‌کنند. یک کمپین که با چند بار آمدن جایزه بدهد، معمولاً کل گروه را می‌آورد.
        </div>
        <div style={{ marginTop: 10 }}><Btn C={C} small onClick={() => go('campaigns')}>ساخت کمپین گروهی</Btn></div>
      </Card>
    </div>
  )
}

const KIND = { joint_quest: ['🎯', 'کمپین مشترک'], cross_promo: ['📣', 'معرفی دوطرفه'], event: ['🎉', 'رویداد مشترک'] }
const STATUS = { pending: ['⏳', 'در انتظار'], accepted: ['✅', 'پذیرفته'], declined: ['✖️', 'رد شده'], cancelled: ['↩️', 'لغو شده'] }
const COLLAB_ERR = { already_pending: 'یک پیشنهاد باز بین شما هست', too_many: 'امروز به سقف پیشنهادها رسیده‌ای', bad_title: 'عنوان باید بین 3 تا 80 حرف باشد', message_too_long: 'پیام بلندتر از 400 حرف است', not_allowed: 'اجازه این کار را نداری', target_not_found: 'این کسب‌وکار پیدا نشد', not_pending: 'این پیشنهاد دیگر باز نیست' }

export function Collab({ C, K, collab, onPropose, onRespond, busy }) {
  const [to, setTo] = useState(null)
  const [kind, setKind] = useState('joint_quest')
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const [note, setNote] = useState(null)
  const [q, setQ] = useState('')
  const items = (collab && collab.items) || [], dir = (collab && collab.directory) || []
  const incoming = items.filter(i => i.incoming && i.status === 'pending')
  const partners = items.filter(i => i.status === 'accepted')
  const outgoing = items.filter(i => !i.incoming && i.status === 'pending')
  const shown = dir.filter(x => !q.trim() || (x.name || '').includes(q.trim()) || (x.district || '').includes(q.trim())).slice(0, 24)
  const input = { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'inherit' }
  async function send() {
    setNote(null)
    const res = await onPropose({ to: to.business_id, kind, title: title.trim(), message: msg.trim() })
    if (res && res.ok) { setNote({ ok: true, text: 'پیشنهاد برای «' + to.name + '» فرستاده شد.' }); setTo(null); setTitle(''); setMsg('') }
    else setNote({ ok: false, text: COLLAB_ERR[res && res.error] || 'فرستاده نشد، دوباره امتحان کن' })
  }
  const row = (i, actions) => (
    <div key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: C.chip, borderRadius: 14 }}>
      <span style={{ fontSize: 18 }}>{(KIND[i.kind] || KIND.event)[0]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{i.title}</div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{(KIND[i.kind] || KIND.event)[1]} · {i.incoming ? 'از' : 'به'} «{i.other_name}»{i.other_district ? ' · ' + i.other_district : ''} · {(STATUS[i.status] || STATUS.pending).join(' ')}</div>
        {i.message && <div style={{ fontSize: 12, color: C.text, marginTop: 6, lineHeight: 1.8, overflowWrap: 'anywhere' }}>{i.message}</div>}
        {actions && <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {note && <div style={{ fontSize: 12.5, fontWeight: 800, color: note.ok ? K.good : K.bad, padding: '0 4px' }}>{note.ok ? '✅ ' : '⚠️ '}{note.text}</div>}
      {incoming.length > 0 && <Card C={C} K={K} title={'پیشنهادهای رسیده · ' + fa(incoming.length)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incoming.map(i => row(i, <>
            <Btn C={C} small disabled={busy} onClick={() => onRespond(i.id, 'accept')}>پذیرفتن</Btn>
            <Btn C={C} small kind="ghost" disabled={busy} onClick={() => onRespond(i.id, 'decline')}>رد کردن</Btn>
          </>))}
        </div>
      </Card>}
      <Card C={C} K={K} title="همکارهای فعلی" hint="کسب‌وکارهایی که پیشنهاد همکاری بین شما پذیرفته شده">
        {partners.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{partners.map(i => row(i, null))}</div>
          : <Empty C={C} icon="🤝" title="هنوز همکاری نداری" text="از فهرست پایین یک کسب‌وکار را انتخاب کن و پیشنهاد بده." />}
      </Card>
      {outgoing.length > 0 && <Card C={C} K={K} title="پیشنهادهای فرستاده، در انتظار پاسخ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {outgoing.map(i => row(i, <Btn C={C} small kind="ghost" disabled={busy} onClick={() => onRespond(i.id, 'cancel')}>پس گرفتن</Btn>))}
        </div>
      </Card>}
      <Card C={C} K={K} title="پیدا کردن همکار" hint="مرتب‌شده بر اساس مشتری مشترک با تو. هرچه بیشتر، همکاری طبیعی‌تر است.">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی اسم یا محله…" style={{ ...input, marginBottom: 10 }} />
        {to && (
          <div style={{ border: '1px solid ' + C.accent, borderRadius: 14, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>پیشنهاد به «{to.name}»</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.keys(KIND).map(k => <Btn key={k} C={C} small kind={kind === k ? 'primary' : 'soft'} onClick={() => setKind(k)}>{KIND[k][0]} {KIND[k][1]}</Btn>)}
            </div>
            <input value={title} maxLength={80} onChange={e => setTitle(e.target.value)} placeholder="عنوان، مثلاً: قهوه اینجا، کیک آنجا" style={input} />
            <textarea value={msg} maxLength={400} onChange={e => setMsg(e.target.value)} rows={3} placeholder="توضیح کوتاه برای طرف مقابل، اختیاری" style={{ ...input, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn C={C} disabled={busy || title.trim().length < 3} onClick={send}>فرستادن پیشنهاد</Btn>
              <Btn C={C} kind="ghost" onClick={() => setTo(null)}>انصراف</Btn>
            </div>
          </div>
        )}
        {shown.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
            {shown.map(x => (
              <div key={x.business_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.chip, borderRadius: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{x.district || '—'}{x.shared_customers > 0 ? ' · ' + fa(x.shared_customers) + ' مشتری مشترک' : ''}</div>
                </div>
                <Btn C={C} small kind="ghost" onClick={() => { setTo(x); setNote(null) }}>پیشنهاد</Btn>
              </div>
            ))}
          </div>
        ) : <Empty C={C} icon="🔎" title="کسب‌وکار تأییدشده دیگری پیدا نشد" text="هر کسب‌وکاری که مالکیتش تأیید شود اینجا می‌آید." />}
      </Card>
      <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, padding: '0 4px' }}>🔒 در همکاری فقط اسم و محله کسب‌وکار دیده می‌شود. آمار هیچ‌کدام برای دیگری باز نمی‌شود.</div>
    </div>
  )
}

// کمپین‌های نمایشی، فقط برای حالت نمایشی که کسب‌وکار واقعی پشتش نیست
export function DemoCampaigns({ C, K, d }) {
  const qs = d.quests || []
  const st = {}; (d.qstats || []).forEach(s => { st[s.quest_id] = s })
  return (
    <Card C={C} K={K} title="کمپین‌ها" hint="در حالت نمایشی فقط دیدنی است. ساخت و ویرایش با کسب‌وکار واقعی کار می‌کند.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {qs.map(q => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: C.chip, borderRadius: 14 }}>
            <span style={{ fontSize: 20 }}>{q.icon || '🎯'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{q.title}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{q.reward_label} · {q.active ? 'فعال' : 'متوقف'}</div>
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, textAlign: 'left', flexShrink: 0 }}>
              <b style={{ color: C.text }}>{fa((st[q.id] || {}).completions)}</b> تکمیل · <b style={{ color: C.text }}>{fa((st[q.id] || {}).redemptions_used)}</b> استفاده
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
