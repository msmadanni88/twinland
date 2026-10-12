// قالب‌بندی و یکدست‌سازی داده رویدادها — همه ویجت‌ها از همین‌جا می‌خوانند.
import { resolveArtKey } from '@/lib/events/art'

export const faNum = (n) => Number(n || 0).toLocaleString('fa')

// «۳» تنها گیج‌کننده است: شماره منطقه به شکل «منطقه ۳» نوشته می‌شود
export const districtLabel = (d) => {
  const s = String(d == null ? '' : d).trim()
  if (!s) return ''
  return /^[0-9\u06F0-\u06F9\u0660-\u0669]+$/.test(s) ? 'منطقه ' + s : s
}

// خروجی event_feed، ردیف مستقیم quests (با cafes و collectible_defs تودرتو) و ردیف تاریخچه هر سه پذیرفته می‌شوند
export function normEvent(r) {
  if (!r) return null
  const cafe = r.cafes || null
  const cd = r.collectible_defs || null
  const colTitle = r.collectible_title || (cd && cd.title) || null
  const colIcon = r.collectible_icon || (cd && cd.icon) || null
  const colRarity = r.collectible_rarity || (cd && cd.rarity) || null
  return {
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    cafeId: r.cafe_id,
    cafeName: r.cafe_name || (cafe && cafe.name) || 'کافه',
    district: r.district || (cafe && cafe.district) || '',
    lat: r.lat != null ? r.lat : (r.cafe_lat != null ? r.cafe_lat : null),
    lng: r.lng != null ? r.lng : (r.cafe_lng != null ? r.cafe_lng : null),
    category: r.category || 'general',
    artKey: resolveArtKey(r),
    rewardLabel: r.reward_label || '',
    rewardXp: r.reward_xp || 0,
    discountPct: r.discount_pct || 0,
    target: r.target_count || 1,
    progress: r.my_progress != null ? r.my_progress : (r.progress || 0),
    done: !!(r.my_done || r.done),
    endsAt: r.ends_at || null,
    promo: !!r.promo_live,
    collectible: colTitle || colIcon ? { title: colTitle, icon: colIcon, rarity: colRarity } : null,
    raw: r,
  }
}

// زمان باقی‌مانده تا پایان: null یعنی بی‌پایان یا تمام‌شده
export function timeLeft(endsAt, now) {
  if (!endsAt) return null
  const ms = new Date(endsAt).getTime() - (now || Date.now())
  if (!(ms > 0)) return null
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d >= 1) return { text: faNum(d) + ' روز', urgent: false, ms }
  if (h >= 1) return { text: faNum(h) + ' ساعت', urgent: h < 6, ms }
  return { text: faNum(Math.max(1, m)) + ' دقیقه', urgent: true, ms }
}

// روشن‌تر کردن یک رنگ hex به سمت سفید
export function lighten(hex, t) {
  try {
    let s = String(hex || '#888888').trim()
    if (s[0] !== '#') return s
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
    const n = parseInt(s.slice(1, 7), 16)
    const f = (v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')
    return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255)
  } catch (e) { return hex }
}

export const RARITY_TONE = { common: '#94a3b8', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' }
