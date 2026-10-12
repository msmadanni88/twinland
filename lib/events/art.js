// ─────────────────────────────────────────────────────────────
//  کتابخانه تصویر ویجت‌های رویداد
//
//  هر رویداد یک «کلید تصویر» دارد که صاحب کسب‌وکار هنگام ساخت کمپین انتخاب می‌کند
//  و در ستون quests.art_key ذخیره می‌شود. همین کلید در همه‌جا نشان داده می‌شود:
//  نوار رویداد، داشبورد، ماموریت‌ها، تاریخچه و پنل کسب‌وکار.
//
//  الان تصویرها طرح‌های موقت‌اند و با کد کشیده می‌شوند. وقتی طرح‌های خود دنی آماده شد:
//   1. فایل را با نام همان کلید در public/event-art/ بگذار. مثلا public/event-art/cup.png
//      اندازه پیشنهادی 256 در 256، پس‌زمینه شفاف، PNG یا SVG
//   2. کلید را به آرایه REAL_ART پایین همین فایل اضافه کن
//   3. تمام. هیچ جای دیگری از کد عوض نمی‌شود
//  برای تصویر تازه: یک خط به ART_LIST اضافه کن و فایلش را بگذار.
// ─────────────────────────────────────────────────────────────

// group: دسته‌بندی در انتخابگر. tone رنگ پیش‌فرض گروه است
export const ART_GROUPS = {
  drink:  { label: 'نوشیدنی', tone: '#c47a3d' },
  food:   { label: 'خوراکی',  tone: '#e0577a' },
  offer:  { label: 'پیشنهاد',  tone: '#18a572' },
  fun:    { label: 'سرگرمی',  tone: '#7c5cff' },
  symbol: { label: 'نماد',    tone: '#e8a317' },
}

export const ART_LIST = [
  { key: 'cup',       label: 'فنجان',      group: 'drink' },
  { key: 'latte',     label: 'لاته',       group: 'drink' },
  { key: 'teapot',    label: 'قوری چای',   group: 'drink' },
  { key: 'bean',      label: 'دانه قهوه',  group: 'drink' },
  { key: 'croissant', label: 'کروسان',     group: 'food' },
  { key: 'cake',      label: 'کیک',        group: 'food' },
  { key: 'cookie',    label: 'کوکی',       group: 'food' },
  { key: 'icecream',  label: 'بستنی',      group: 'food' },
  { key: 'burger',    label: 'برگر',       group: 'food' },
  { key: 'tag',       label: 'تخفیف',      group: 'offer' },
  { key: 'gift',      label: 'هدیه',       group: 'offer' },
  { key: 'ticket',    label: 'بلیت',       group: 'offer' },
  { key: 'key',       label: 'کلید',       group: 'offer' },
  { key: 'party',     label: 'جشن',        group: 'fun' },
  { key: 'music',     label: 'موسیقی',     group: 'fun' },
  { key: 'book',      label: 'کتاب',       group: 'fun' },
  { key: 'palette',   label: 'هنر',        group: 'fun' },
  { key: 'gamepad',   label: 'بازی',       group: 'fun' },
  { key: 'moon',      label: 'شب',         group: 'fun' },
  { key: 'star',      label: 'ستاره',      group: 'symbol' },
  { key: 'heart',     label: 'قلب',        group: 'symbol' },
  { key: 'trophy',    label: 'جام',        group: 'symbol' },
  { key: 'crown',     label: 'تاج',        group: 'symbol' },
  { key: 'gem',       label: 'جواهر',      group: 'symbol' },
  { key: 'flame',     label: 'آتش',        group: 'symbol' },
  { key: 'leaf',      label: 'برگ',        group: 'symbol' },
  { key: 'clock',     label: 'ساعت',       group: 'symbol' },
  { key: 'pin',       label: 'مکان',       group: 'symbol' },
]

export const ART_KEYS = ART_LIST.map(a => a.key)
const ART_MAP = {}
ART_LIST.forEach(a => { ART_MAP[a.key] = a })

// کلیدهایی که فایل واقعی‌شان در public/event-art/ هست. خالی یعنی همه طرح موقت‌اند.
export const REAL_ART = []
export const realArtSrc = (key) => (REAL_ART.indexOf(key) >= 0 ? '/event-art/' + key + '.png' : null)

// اگر رویداد تصویر نداشت: اول از روی ایموجی قدیمی، بعد از روی دسته‌بندی
export const CATEGORY_ART = { drink: 'cup', food: 'cake', discount: 'tag', event: 'party', collectible: 'gem', general: 'star' }
export const EMOJI_ART = {
  '☕': 'cup', '🍵': 'teapot', '🫖': 'teapot', '🍰': 'cake', '🧁': 'cake', '🎂': 'cake', '🍪': 'cookie', '🥐': 'croissant',
  '🍦': 'icecream', '🍔': 'burger', '🏷️': 'tag', '🏷': 'tag', '🎁': 'gift', '🎟️': 'ticket', '🎟': 'ticket', '🗝️': 'key',
  '🎉': 'party', '🎊': 'party', '🎵': 'music', '🎶': 'music', '📚': 'book', '📖': 'book', '🎨': 'palette', '🎮': 'gamepad',
  '🌙': 'moon', '⭐': 'star', '🌟': 'star', '🎯': 'star', '❤️': 'heart', '🏆': 'trophy', '👑': 'crown', '💎': 'gem',
  '🔥': 'flame', '🍃': 'leaf', '🌿': 'leaf', '⏰': 'clock', '📍': 'pin',
}

// ev: ردیفی از quests یا خروجی event_feed
export function resolveArtKey(ev) {
  if (!ev) return 'star'
  if (ev.art_key && ART_MAP[ev.art_key]) return ev.art_key
  if (ev.icon && EMOJI_ART[ev.icon]) return EMOJI_ART[ev.icon]
  return CATEGORY_ART[ev.category] || 'star'
}

export function artGroup(key) {
  return (ART_MAP[key] && ART_MAP[key].group) || 'symbol'
}
export function artTone(key) {
  return ART_GROUPS[artGroup(key)].tone
}
export function artLabel(key) {
  return (ART_MAP[key] && ART_MAP[key].label) || ''
}
