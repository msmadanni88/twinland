// ─────────────────────────────────────────────────────────────
//  نوع مکان‌ها، از نسخه v5.0
//  تنها جای تعریف نوع‌ها در کد سایت: نام، آیکون، سرشاخه، نوع داده ساختاریافته و اسم عام.
//  روشن و خاموش بودن هر نوع و عددهای بازی در دیتابیس است: place_categories و category_profiles.
//  xp فقط برای نمایش در برگه مکان است و باید با category_profiles یکی بماند؛ امتیاز واقعی را سرور می‌دهد.
//  نسخه‌های قبلی ظاهر فقط کافه و رستوران را می‌گیرند؛ useCafes همین را فیلتر می‌کند.
// ─────────────────────────────────────────────────────────────
import { SB_KEY, SB_URL } from '@/lib/config'

// نوع‌هایی که نسخه‌های قبل از v5.0 می‌شناسند
export const LEGACY_CATEGORIES = ['cafe', 'restaurant']

export const ROOTS = [
  { key: 'drink', label: 'کافه', icon: 'coffee' },
  { key: 'bread', label: 'نان و شیرینی', icon: 'bread' },
  { key: 'food', label: 'غذا', icon: 'utensils' },
  { key: 'culture', label: 'کتاب', icon: 'book' },
  { key: 'sport', label: 'ورزش', icon: 'dumbbell' },
  { key: 'beauty', label: 'زیبایی', icon: 'scissors' },
  { key: 'market', label: 'بازارچه', icon: 'store' },
]

export const CATEGORIES = {
  cafe: { label: 'کافه', root: 'drink', icon: 'coffee', noun: 'کافه', schema: 'CafeOrCoffeeShop', xp: [50, 30] },
  restaurant: { label: 'رستوران', root: 'food', icon: 'utensils', noun: 'رستوران', schema: 'Restaurant', xp: [50, 30] },
  fast_food: { label: 'فست‌فود', root: 'food', icon: 'burger', noun: 'فست‌فود', schema: 'FastFoodRestaurant', xp: [30, 20] },
  bakery: { label: 'نانوایی', root: 'bread', icon: 'bread', noun: 'نانوایی', schema: 'Bakery', xp: [20, 20] },
  pastry: { label: 'قنادی', root: 'bread', icon: 'cake', noun: 'قنادی', schema: 'Bakery', xp: [30, 20] },
  bookstore: { label: 'کتاب‌فروشی', root: 'culture', icon: 'book', noun: 'کتاب‌فروشی', schema: 'BookStore', xp: [40, 20] },
  gym: { label: 'باشگاه', root: 'sport', icon: 'dumbbell', noun: 'باشگاه', schema: 'ExerciseGym', xp: [30, 20] },
  beauty_salon: { label: 'آرایشگاه', root: 'beauty', icon: 'scissors', noun: 'آرایشگاه', schema: 'BeautySalon', xp: [30, 20] },
  market_event: { label: 'بازارچه', root: 'market', icon: 'store', noun: 'بازارچه', schema: 'LocalBusiness', xp: [40, 20] },
}

export function catInfo(key) {
  return CATEGORIES[key || 'cafe'] || CATEGORIES.cafe
}
export function rootOf(key) {
  return catInfo(key).root
}
export function rootInfo(root) {
  return ROOTS.find(r => r.key === root) || ROOTS[0]
}
export function catIcon(key) {
  return catInfo(key).icon
}

// شمار هر سرشاخه در فهرست مکان‌ها، به ترتیب ROOTS، فقط آن‌هایی که دست‌کم یک مکان دارند
export function rootCounts(cafes) {
  const n = {}
  for (const c of cafes || []) { const r = rootOf(c.category); n[r] = (n[r] || 0) + 1 }
  return ROOTS.filter(r => n[r.key] > 0).map(r => ({ ...r, count: n[r.key] }))
}

// فهرست نوع‌ها از دیتابیس، برای پنل ادمین و فرم‌ها
export async function fetchCategories() {
  try {
    const r = await fetch(SB_URL + '/rest/v1/place_categories?select=key,parent,label_fa,icon,sort,enabled,in_game&order=sort.asc',
      { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    if (!r.ok) return []
    const rows = await r.json()
    return Array.isArray(rows) ? rows : []
  } catch (e) { return [] }
}
