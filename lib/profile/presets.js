// ─────────────────────────────────────────────────────────────
//  آواتارهای آماده برای کسانی که نمی‌خواهند عکس بگذارند
//
//  فعلاً چند طرح ساده خاکستری اینجاست تا انتخاب کار کند. مجموعه گرافیکی اصلی بعداً
//  جایگزین می‌شود: فایل‌ها را در public/avatars/presets/ بگذار و فقط این فهرست را عوض کن.
//  قانون‌ها:
//   • شناسه فقط حروف کوچک انگلیسی، عدد، خط تیره و زیرخط، حداکثر 32 حرف. همین در دیتابیس بررسی می‌شود.
//   • شناسه‌ای را که کاربرها انتخاب کرده‌اند پاک نکن. اگر طرحی کنار رفت، hidden: true بگذار
//     تا در انتخابگر نیاید ولی آواتار کسانی که قبلاً انتخابش کرده‌اند بماند.
//   • فایل مربع باشد، بهتر است SVG یا WebP حداکثر 512 در 512.
// ─────────────────────────────────────────────────────────────

export const AVATAR_PRESETS = [
  { id: 'p01', src: '/avatars/presets/p01.svg', label: 'فنجان' },
  { id: 'p02', src: '/avatars/presets/p02.svg', label: 'ماه' },
  { id: 'p03', src: '/avatars/presets/p03.svg', label: 'کوه' },
  { id: 'p04', src: '/avatars/presets/p04.svg', label: 'موج' },
  { id: 'p05', src: '/avatars/presets/p05.svg', label: 'ستاره' },
  { id: 'p06', src: '/avatars/presets/p06.svg', label: 'برگ' },
  { id: 'p07', src: '/avatars/presets/p07.svg', label: 'کتاب' },
  { id: 'p08', src: '/avatars/presets/p08.svg', label: 'نقشه' },
]

const BY_ID = Object.fromEntries(AVATAR_PRESETS.map(p => [p.id, p]))

export function presetSrc(id) {
  const p = id && BY_ID[id]
  return p ? p.src : null
}

export function visiblePresets() {
  return AVATAR_PRESETS.filter(p => !p.hidden)
}
