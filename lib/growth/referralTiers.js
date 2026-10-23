// پله‌های نشان دعوت؛ همان جدول تابع tl_referral_badges در supabase/sql/2026-10-23_referral_signup_reward.sql
// هر پله با دعوت‌های موفق بیشتر و ارزشمندتر است. اگر اینجا عوض شد، تابع دیتابیس هم عوض شود.
export const REFERRAL_TIERS = [
  { need: 1,  code: 'ref_1',  title: 'دعوت‌کننده', rarity: 'common' },
  { need: 3,  code: 'ref_3',  title: 'میزبان',     rarity: 'rare' },
  { need: 5,  code: 'ref_5',  title: 'سفیر',       rarity: 'rare' },
  { need: 10, code: 'ref_10', title: 'چهره محله',  rarity: 'epic' },
  { need: 25, code: 'ref_25', title: 'افسانه شهر', rarity: 'legendary' },
]

export const tierByCode = (code) => REFERRAL_TIERS.find(t => t.code === code) || null
export const isReferralBadge = (code) => /^ref_\d+$/.test(String(code || ''))

// پله بعدی برای شمار دعوت‌های موفق فعلی
export function nextTier(count) {
  return REFERRAL_TIERS.find(t => (Number(count) || 0) < t.need) || null
}
