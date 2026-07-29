// ═══════════════════════════════════════════════════════════════════════════
// app/labels.js — منبع واحدِ اسم‌ها 🏷️
// ───────────────────────────────────────────────────────────────────────────
// چرا این فایل هست؟
// قبلاً اسم «نگارخانه» توی ۵ جای مختلف hardcode شده بود (منو، پروفایل،
// تاریخچه، خود صفحه، تیوتوریال). وقتی توی منو عوضش کردیم، بقیه عقب موندن.
// از این به بعد: **اسم رو فقط اینجا عوض کن، همه‌جا خودکار به‌روز می‌شه.**
//
// قانون: توی هیچ فایل دیگه‌ای اسم بخش‌ها رو دستی ننویس — همیشه از اینجا بخون.
//   ✅ import { L } from '../labels'  →  <div>{L.gallery}</div>
//   ❌ <div>گنجینه</div>
// ═══════════════════════════════════════════════════════════════════════════

export const L = {
  // ── اسم بخش‌های اصلی اپ ──────────────────────────────────────────────────
  app:        'TwinLand',
  map:        'نقشه',
  gallery:    'گنجینه',            // ← قبلاً «نگارخانه‌ی کلکسیون»
  gallerySub: 'کلکسیون تو',        // زیرعنوان داخل صفحه‌ی گنجینه
  quests:     'ماموریت‌ها',
  questsShort:'ماموریت',
  events:     'رویدادها',
  leaderboard:'رتبه‌بندی',
  leaderboardShort:'رتبه',
  clans:      'کلن‌ها',
  clanShort:  'کلن',
  profile:    'پروفایل',
  business:   'پنل کافه‌دار',
  admin:      'پنل ادمین',
  settings:   'تنظیمات',
  tutorial:   'آموزش',
  xpSystem:   'سیستم XP',
  logout:     'خروج',
  notifications:'اعلان‌ها',
  badges:     'مدال‌ها',
  history:    'تاریخچه',

  // ── واژه‌های تکرارشونده ─────────────────────────────────────────────────
  checkin:    'چک‌این',
  cafe:       'کافه',
  cafes:      'کافه‌ها',
  streak:     'استریک',
  hearts:     'علاقه',
  xp:         'XP',
  coin:       'سکه',
  rank:       'رتبه',
}

// ── آیکون هر بخش (کنار اسم، همه‌جا یکسان) ────────────────────────────────
export const ICON = {
  map: '🗺', gallery: '💎', quests: '🎯', events: '🎉',
  leaderboard: '🏆', clans: '🛡', profile: '👤', business: '🏪',
  admin: '🛡️', settings: '⚙️', tutorial: '🎓', xpSystem: '⭐',
  logout: '🚪', checkin: '📍', cafe: '☕', streak: '🔥', hearts: '❤️',
  badges: '🏅', history: '🕐', coin: '🪙',
}

// ── مسیر هر بخش (اگه مسیری عوض شد، فقط اینجا) ────────────────────────────
export const ROUTE = {
  map: '/', gallery: '/gallery', quests: '/quests',
  leaderboard: '/leaderboard', clans: '/clan', profile: '/profile',
  business: '/business', admin: '/admin',
}

// ── کمیابی آیتم‌های کلکسیونی (اسم، رنگ، گرادیانت) ─────────────────────────
// این هم قبلاً توی ۳ فایل تکرار شده بود.
export const RARITY = {
  common:    { label: 'معمولی',    color: '#94a3b8', grad: 'linear-gradient(145deg,#cbd5e1,#94a3b8)' },
  rare:      { label: 'کمیاب',     color: '#3b82f6', grad: 'linear-gradient(145deg,#60a5fa,#3b82f6)' },
  epic:      { label: 'حماسی',     color: '#8b5cf6', grad: 'linear-gradient(145deg,#a78bfa,#8b5cf6)' },
  legendary: { label: 'افسانه‌ای', color: '#f59e0b', grad: 'linear-gradient(145deg,#fbbf24,#f59e0b)' },
}
export const RARITY_LOCKED = 'linear-gradient(145deg,#e2e8f0,#cbd5e1)'
export const rarityOf = (r) => RARITY[r] || RARITY.common

// ── عدد فارسی (این هم توی هر فایل جدا تعریف شده بود) ─────────────────────
export const fa = (n) => Number(n || 0).toLocaleString('fa')

// ── منبع آیتم کلکسیونی ───────────────────────────────────────────────────
export const SOURCE_LABEL = {
  platform: 'اکتشاف پلتفرم',
  business: 'جایزه‌ی کمپین',
}
