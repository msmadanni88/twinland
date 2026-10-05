// کلیدهای چیدمان نسخه v3.0 — برای برگشت به حالت قبل فقط همین‌ها را عوض کن، کد دیگری لازم نیست.
//   compactMobileHud: true  → چیدمان تازه موبایل: دکمه‌های مربعی بالا راست، جستجو و منطقه‌ها پشت دکمه فیلتر، نوار رویداد پایین
//   compactMobileHud: false → همان چیدمان قبلی موبایل تا 4 اکتبر 2026
//   ledBar: false → نوار تبلیغ LED پنهان است. کدش سر جایش مانده؛ با true برمی‌گردد.
export const V3_FLAGS = {
  compactMobileHud: true,
  ledBar: false,
  // true → نوار رویدادها پایین صفحه، جای نوار LED، در موبایل و دسکتاپ. false → همان بالا چپ قبلی
  bottomEventBar: true,
  // true → نوار امتیاز بالای صفحه رنگی و کشیده‌تر. false → همان نوار ساده v2.0
  prominentXp: true,
}
