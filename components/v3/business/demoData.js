// داده نمایشی پنل کسب‌وکار — فقط در حافظه همین تب. هیچ‌چیز در دیتابیس نوشته یا از آن خوانده نمی‌شود.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

export function makeBizDemo() {
  const today = new Date()
  const daily = []
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(today.getTime() - i * 86400000)
    const base = 26 + Math.round(10 * Math.sin(i / 3)) + (dt.getDay() === 5 || dt.getDay() === 4 ? 14 : 0) + Math.round((29 - i) * 0.6)
    const c = Math.max(4, base + rnd(-5, 6))
    daily.push({ day: dt.toISOString().slice(0, 10), checkins: c, unique_visitors: Math.round(c * 0.78) })
  }
  const shape = [0, 0, 0, 0, 0, 0, 1, 3, 8, 14, 18, 16, 12, 10, 9, 12, 17, 22, 26, 24, 18, 11, 5, 1]
  const hourly = shape.map((v, hour) => ({ hour, checkins: v * 4 + (v ? rnd(0, 6) : 0) }))
  const wk = [70, 52, 48, 55, 61, 96, 110]
  const weekday = wk.map((v, i) => ({ weekday: i, checkins: v + rnd(-4, 6) }))
  const last7 = daily.slice(-7).reduce((a, x) => a + x.checkins, 0), prev7 = daily.slice(-14, -7).reduce((a, x) => a + x.checkins, 0)
  const month = daily.reduce((a, x) => a + x.checkins, 0)
  const d = {
    daily, hourly, weekday, favCount: 184,
    retention: { total_customers: 412, one_time: 236, repeat_customers: 176, new_this_week: 38, returned_this_week: 61 },
    periods: { this_week: last7, last_week: prev7, this_month: month, last_month: Math.round(month * 0.86), visitors_this_week: Math.round(last7 * 0.74), visitors_last_week: Math.round(prev7 * 0.74) },
    clv: { avg_visits_per_customer: 2.7, top_customer_visits: 31, avg_lifespan_days: 46, tier_1visit: 236, tier_2to4: 118, tier_5to9: 41, tier_loyal: 17 },
    cohort: { new_30d: 143, new_30d_returned: 52, active_7d: 97, dormant: 64, churned: 108 },
    rank: { district: 'منطقه 6', m_checkins: month, rank_in_district: 2, total_in_district: 11 },
    clans: [
      { clan_name: 'شب‌گردهای ولیعصر', emblem: '🦉', members_visited: 14, total_checkins: 63 },
      { clan_name: 'قهوه‌بازها', emblem: '☕', members_visited: 9, total_checkins: 41 },
      { clan_name: 'کاشفان شهر', emblem: '🧭', members_visited: 7, total_checkins: 22 },
      { clan_name: 'تیم لاته', emblem: '🥛', members_visited: 5, total_checkins: 15 },
    ],
    covisit: [
      { other_cafe_name: 'کافه نمونه دو', other_district: 'منطقه 6', shared_customers: 58 },
      { other_cafe_name: 'کتاب‌فروشی نمونه', other_district: 'منطقه 6', shared_customers: 33 },
      { other_cafe_name: 'شیرینی‌فروشی نمونه', other_district: 'منطقه 3', shared_customers: 21 },
    ],
    quests: [
      { id: 'dq1', icon: '⚡', title: 'ساعت طلایی عصر', reward_label: 'یک کوکی رایگان', active: true },
      { id: 'dq2', icon: '🔁', title: 'سه بار در هفته', reward_label: 'تخفیف 20 درصدی', active: true },
      { id: 'dq3', icon: '🌙', title: 'شب‌نشینی پنجشنبه', reward_label: 'دسر رایگان', active: false },
    ],
    qstats: [
      { quest_id: 'dq1', completions: 87, redemptions_used: 61, codes_issued: 87 },
      { quest_id: 'dq2', completions: 34, redemptions_used: 19, codes_issued: 34 },
      { quest_id: 'dq3', completions: 52, redemptions_used: 40, codes_issued: 52 },
    ],
  }
  const names = ['منطقه 6', 'منطقه 3', 'منطقه 1', 'منطقه 2', 'منطقه 7', 'منطقه 11', 'منطقه 12']
  const cnt = [1180, 940, 1420, 610, 520, 380, 210]
  const districts = names.map((n, i) => ({ district: n, places: [11, 15, 43, 4, 6, 4, 1][i], checkins_30d: cnt[i], checkins_prev_30d: Math.round(cnt[i] * (0.8 + i * 0.05)), visitors_30d: Math.round(cnt[i] * 0.42) }))
  const places = []
  for (let i = 0; i < 46; i++) places.push({ id: 'dp' + i, name: 'مکان نمونه ' + (i + 1), lat: 35.7219 + (Math.random() - 0.5) * 0.07, lng: 51.3979 + (Math.random() - 0.5) * 0.09, district: names[i % names.length], category: 'cafe', level: rnd(0, 4), mine: false })
  places.push({ id: 'dp-me', name: 'کافه نمونه', lat: 35.7219, lng: 51.3979, district: 'منطقه 6', category: 'cafe', level: 4, mine: true })
  const area = { ok: true, district: 'منطقه 6', min_group: 5, districts, places, city: { checkins_30d: cnt.reduce((a, b) => a + b, 0), visitors_30d: 1840, active_places: 71 }, hours: shape.map((v, hour) => ({ hour, checkins: v * 30 + (hour > 20 || hour < 2 ? 160 : 0) })) }
  const collab = {
    ok: true,
    items: [
      { id: 'c1', kind: 'joint_quest', title: 'قهوه اینجا، کتاب آنجا', message: 'هر کس در یک هفته به هر دو جا بیاید یک نشان مشترک بگیرد.', status: 'pending', incoming: true, other_business: 'b2', other_name: 'کتاب‌فروشی نمونه', other_district: 'منطقه 6' },
      { id: 'c2', kind: 'cross_promo', title: 'معرفی دوطرفه روی نقشه', message: null, status: 'accepted', incoming: false, other_business: 'b3', other_name: 'کافه نمونه دو', other_district: 'منطقه 6' },
    ],
    directory: [
      { business_id: 'b3', name: 'کافه نمونه دو', district: 'منطقه 6', category: 'cafe', shared_customers: 58 },
      { business_id: 'b2', name: 'کتاب‌فروشی نمونه', district: 'منطقه 6', category: 'shop', shared_customers: 33 },
      { business_id: 'b4', name: 'شیرینی‌فروشی نمونه', district: 'منطقه 3', category: 'food', shared_customers: 21 },
      { business_id: 'b5', name: 'گل‌فروشی نمونه', district: 'منطقه 3', category: 'shop', shared_customers: 9 },
      { business_id: 'b6', name: 'رستوران نمونه', district: 'منطقه 1', category: 'food', shared_customers: 4 },
    ],
  }
  return { biz: { id: 'demo', cafe_id: 'demo', status: 'verified', plan: 'pro', cafes: { name: 'کافه نمونه', district: 'منطقه 6' } }, d, area, collab }
}

// یک قدم جلو: یک چک‌این ساختگی تازه، گاهی یک مشتری تازه یا استفاده از کد جایزه
export function tickBizDemo(s) {
  const d = { ...s.d }
  const daily = d.daily.slice(); const last = { ...daily[daily.length - 1] }
  last.checkins += 1; const isNew = Math.random() < 0.45; if (Math.random() < 0.75) last.unique_visitors += 1
  daily[daily.length - 1] = last; d.daily = daily
  const h = new Date().getHours()
  d.hourly = d.hourly.map(x => x.hour === h ? { ...x, checkins: x.checkins + 1 } : x)
  d.periods = { ...d.periods, this_week: d.periods.this_week + 1, this_month: d.periods.this_month + 1, visitors_this_week: d.periods.visitors_this_week + (isNew ? 1 : 0) }
  d.retention = { ...d.retention, total_customers: d.retention.total_customers + (isNew ? 1 : 0), new_this_week: d.retention.new_this_week + (isNew ? 1 : 0), repeat_customers: d.retention.repeat_customers + (!isNew && Math.random() < 0.2 ? 1 : 0), returned_this_week: d.retention.returned_this_week + (isNew ? 0 : 1) }
  let ev = isNew ? { icon: '🆕', text: 'یک مشتری تازه چک‌این کرد' } : { icon: '📍', text: 'یک مشتری همیشگی چک‌این کرد' }
  if (Math.random() < 0.22) {
    d.qstats = d.qstats.map((q, i) => i === 0 ? { ...q, completions: q.completions + 1, codes_issued: q.codes_issued + 1, redemptions_used: q.redemptions_used + (Math.random() < 0.6 ? 1 : 0) } : q)
    ev = { icon: '🎁', text: 'یک نفر کمپین «ساعت طلایی عصر» را کامل کرد' }
  } else if (Math.random() < 0.1) { d.favCount += 1; ev = { icon: '❤️', text: 'یک نفر این مکان را نشان کرد' } }
  return { ...s, d, last: ev, n: (s.n || 0) + 1 }
}
