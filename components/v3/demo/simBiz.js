// نمای پنل کسب‌وکار از همان دنیای شبیه‌سازی — «مکان من» یکی از مکان‌های همان شهر ساختگی است،
// پس هر چک‌این ساختگی که روی نقشه دیده می‌شود همین‌جا هم در آمار می‌نشیند. چیزی از دیتابیس خوانده یا در آن نوشته نمی‌شود.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const SHAPE = [0, 0, 0, 0, 0, 0, 1, 3, 8, 14, 18, 16, 12, 10, 9, 12, 17, 22, 26, 24, 18, 11, 5, 1]
const level = (n) => n <= 0 ? 0 : n <= 3 ? 1 : n <= 7 ? 2 : n <= 13 ? 3 : 4

function base(W) {
  if (W.bizBase) return W.bizBase
  const r = mulberry32(W.cfg.seed ^ 0xB12)
  const rnd = (a, b) => a + Math.floor(r() * (b - a + 1))
  let idx = 0
  W.cafes.forEach((c, i) => { if (c.w > W.cafes[idx].w) idx = i })
  const start = new Date(W.cfg.startedAt)
  const daily = []
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(start.getTime() - i * 86400000)
    const b = 170 + Math.round(40 * Math.sin(i / 3)) + (dt.getDay() === 5 || dt.getDay() === 4 ? 70 : 0) + Math.round((29 - i) * 2.2)
    let c = Math.max(30, b + rnd(-18, 22))
    if (i === 0) c = Math.round(c * Math.min(0.95, (start.getHours() * 60 + start.getMinutes()) / 1440))   // امروز هنوز تمام نشده
    daily.push({ day: dt.toISOString().slice(0, 10), checkins: c, unique_visitors: Math.round(c * 0.78) })
  }
  const hourly = SHAPE.map((v, hour) => ({ hour, checkins: v * 22 + (v ? rnd(0, 30) : 0) }))
  const weekday = [420, 310, 290, 330, 365, 575, 660].map((v, i) => ({ weekday: i, checkins: v + rnd(-20, 30) }))
  const sum = (a, f, t) => a.slice(f, t).reduce((x, y) => x + y.checkins, 0)
  const month = sum(daily, 0, 30)
  const others = W.cafes.map((c, i) => ({ c, i })).filter(x => x.i !== idx)
  const near = others.slice().sort((a, b) => {
    const m = W.cafes[idx], d = (p) => Math.hypot(p.c.lat - m.lat, p.c.lng - m.lng)
    return d(a) - d(b)
  }).slice(0, 5)
  const shared = [58, 33, 21, 9, 4]
  const n0 = near[0] || { c: W.cafes[idx], i: idx }, n1 = near[1] || n0
  const past = [{ id: 'dq-old1', icon: '🔁', title: 'سه بار در هفته', reward_label: 'تخفیف 20 درصدی', active: true, done: 34 + rnd(0, 20) }, { id: 'dq-old2', icon: '🌙', title: 'شب‌نشینی پنجشنبه', reward_label: 'دسر رایگان', active: false, done: 52 + rnd(0, 20) }]
  W.bizBase = {
    idx, daily, hourly, weekday, month, last7: sum(daily, 23, 30), prev7: sum(daily, 16, 23), fav: 184 + rnd(0, 60),
    clanCk: W.clans.map(() => rnd(8, 70)), clanMem: W.clans.map(() => rnd(3, 16)), past,
    covisit: near.slice(0, 3).map((x, j) => ({ other_cafe_name: x.c.name, other_district: x.c.district, shared_customers: shared[j] })),
    collab: {
      ok: true,
      items: [
        { id: 'c1', kind: 'joint_quest', title: 'قهوه اینجا، کتاب آنجا', message: 'هر کس در یک هفته به هر دو جا بیاید یک نشان مشترک بگیرد.', status: 'pending', incoming: true, other_business: 'b-' + n1.i, other_name: n1.c.name, other_district: n1.c.district },
        { id: 'c2', kind: 'cross_promo', title: 'معرفی دوطرفه روی نقشه', message: null, status: 'accepted', incoming: false, other_business: 'b-' + n0.i, other_name: n0.c.name, other_district: n0.c.district },
      ],
      directory: near.map((x, j) => ({ business_id: 'b-' + x.i, name: x.c.name, district: x.c.district, category: 'cafe', shared_customers: shared[j] })),
    },
  }
  return W.bizBase
}

export function buildBiz(W) {
  const B = base(W), c = W.cafes[B.idx]
  const daily = B.daily.slice()
  const last = daily[29]
  daily[29] = { day: last.day, checkins: last.checkins + c.today, unique_visitors: last.unique_visitors + c.newV + Math.round(c.retV * 0.6) }
  const hourly = B.hourly.map(x => ({ hour: x.hour, checkins: x.checkins + c.hours[x.hour] }))
  const wd = (new Date(W.cfg.startedAt).getDay() + 1) % 7                  // روز صفر شنبه است، مثل نمای دیتابیس
  const weekday = B.weekday.map(x => x.weekday === wd ? { weekday: x.weekday, checkins: x.checkins + c.today } : x)
  const month = B.month + c.today
  const sameD = W.cafes.filter(x => x.district === c.district)
  const m30 = (x) => (x === c ? month : x.base30 + x.today)
  const rank = 1 + sameD.filter(x => m30(x) > month).length
  const clans = W.clans.map((k, i) => ({ clan_name: k.name, emblem: k.emblem, members_visited: B.clanMem[i] + c.clanMem[i], total_checkins: B.clanCk[i] + c.clanCk[i] })).sort((a, b) => b.total_checkins - a.total_checkins).slice(0, 5)
  const quests = [], qstats = []
  if (c.quest) { quests.push({ id: c.quest.id, icon: c.quest.icon, title: c.quest.title, reward_label: c.quest.reward_label, active: true }); const dn = 40 + c.quest.done; qstats.push({ quest_id: c.quest.id, completions: dn, redemptions_used: Math.round(dn * 0.68), codes_issued: dn }) }
  B.past.forEach(q => { quests.push({ id: q.id, icon: q.icon, title: q.title, reward_label: q.reward_label, active: q.active }); qstats.push({ quest_id: q.id, completions: q.done, redemptions_used: Math.round(q.done * 0.6), codes_issued: q.done }) })
  const d = {
    daily, hourly, weekday, favCount: B.fav + Math.floor(c.today / 9),
    retention: { total_customers: 1640 + c.newV, one_time: 930 + c.newV, repeat_customers: 710 + Math.floor(c.retV * 0.25), new_this_week: 148 + c.newV, returned_this_week: 236 + c.retV },
    periods: { this_week: B.last7 + c.today, last_week: B.prev7, this_month: month, last_month: Math.round(B.month * 0.86), visitors_this_week: Math.round(B.last7 * 0.74) + c.newV + Math.round(c.retV * 0.6), visitors_last_week: Math.round(B.prev7 * 0.74) },
    clv: { avg_visits_per_customer: 2.7, top_customer_visits: 31, avg_lifespan_days: 46, tier_1visit: 930 + c.newV, tier_2to4: 468 + Math.floor(c.retV * 0.2), tier_5to9: 172, tier_loyal: 70 },
    cohort: { new_30d: 560 + c.newV, new_30d_returned: 204 + Math.floor(c.retV * 0.15), active_7d: 384 + c.newV + Math.floor(c.retV / 2), dormant: 250, churned: 430 },
    rank: { district: c.district, m_checkins: month, rank_in_district: rank, total_in_district: sameD.length },
    clans, covisit: B.covisit, quests, qstats,
  }
  const byD = {}
  W.cafes.forEach(x => { const k = byD[x.district] || (byD[x.district] = { district: x.district, places: 0, checkins_30d: 0, checkins_prev_30d: 0, visitors_30d: 0 }); k.places++; k.checkins_30d += m30(x); k.checkins_prev_30d += Math.round(x.base30 * 0.88); k.visitors_30d += Math.round(m30(x) * 0.42) })
  const districts = Object.values(byD).sort((a, b) => b.checkins_30d - a.checkins_30d)
  const cityHours = new Array(24).fill(0)
  W.cafes.forEach(x => { for (let h = 0; h < 24; h++) cityHours[h] += x.hours[h] })
  const area = {
    ok: true, district: c.district, min_group: 5, districts,
    places: W.cafes.map((x, i) => ({ id: x.id, name: x.name, lat: x.lat, lng: x.lng, district: x.district, category: 'cafe', level: level(x.present), mine: i === B.idx })),
    city: { checkins_30d: districts.reduce((a, b) => a + b.checkins_30d, 0), visitors_30d: Math.round(W.cfg.cafes.length * 38 + W.counters.newVisitors), active_places: W.C },
    hours: SHAPE.map((v, hour) => ({ hour, checkins: v * 30 * W.C / 8 + cityHours[hour] })),
  }
  // کسب‌وکار هیچ‌وقت نام مشتری را نمی‌بیند؛ رویداد فقط به شکل بی‌نام گزارش می‌شود
  const raw = W.feed.find(e => e.cafeId === c.id) || null
  const ev = !raw ? null
    : raw.type === 'quest_done' ? { icon: '🎁', text: 'یک نفر کمپین این مکان را کامل کرد' }
    : raw.type === 'quest_new' ? { icon: '🎉', text: 'کمپین تازه این مکان روی نقشه رفت' }
    : raw.type === 'badge' ? { icon: '🏅', text: 'یک مشتری اینجا نشان تازه گرفت' }
    : raw.isNew ? { icon: '🆕', text: 'یک مشتری تازه چک‌این کرد' } : { icon: '📍', text: 'یک مشتری همیشگی چک‌این کرد' }
  // بازدید و کلیک ساختگی: هر چک‌این شبیه‌سازی یعنی چند نفر پیش از آن برگه را دیده‌اند
  const tv = daily.map(x => ({ day: x.day, views: Math.round(x.checkins * 3.4), clicks: Math.round(x.checkins * 0.62) }))
  const views = tv.reduce((a, x) => a + x.views, 0), clicks = tv.reduce((a, x) => a + x.clicks, 0)
  const share = [['instagram', 'اینستاگرام', 0.41], ['directions', 'مسیریابی', 0.27], ['phone', 'تماس تلفنی', 0.14], ['website', 'وب‌سایت', 0.1], ['google_maps', 'Google Maps', 0.08]]
  const traffic = { ok: true, days: 30, min_group: 5,
    totals: { views, viewers: Math.round(views * 0.71), clicks, clickers: Math.round(clicks * 0.83), visits: Math.round(month * 0.46), prev_views: Math.round(views * 0.84), prev_clicks: Math.round(clicks * 0.79) },
    channels: share.map(x => ({ channel: x[0], label: x[1], events: Math.round(clicks * x[2]), people: Math.round(clicks * x[2] * 0.83) })),
    sources: [{ source: 'map', views: Math.round(views * 0.58) }, { source: 'quest', views: Math.round(views * 0.24) }, { source: 'search', views: Math.round(views * 0.18) }],
    refs: quests.filter(q => q.active).map((q, i) => ({ ref_type: 'quest', ref_id: q.id, title: q.title, views: Math.round(views * (i ? 0.08 : 0.16)), clicks: Math.round(clicks * (i ? 0.07 : 0.15)), visits: Math.round(month * (i ? 0.05 : 0.11)) })),
    daily: tv }
  return { traffic, biz: { id: 'demo', cafe_id: c.id, status: 'verified', plan: 'pro', cafes: { name: c.name, district: c.district } }, d, area, collab: B.collab, last: ev, n: c.today, present: c.present, name: c.name, today: daily[29].checkins, newToday: c.newV, retToday: c.retV }
}
