// ─────────────────────────────────────────────────────────────
//  TwinLand — فهرست نسخه‌های ظاهر سایت (UI)
//  ترتیب مهم است: قدیمی‌ترین اول. برگشت به «نسخه قبل» یعنی یک خانه عقب‌تر.
//
//  کل سایت یک نسخه را نشان می‌دهد که در دیتابیس ذخیره شده (app_settings.ui_version).
//  عوض کردن نسخه فقط با یک دستور و فقط برای مالک اپ:
//    select public.set_ui_version('v1.0');   -- رفتن به یک نسخه مشخص
//    select public.ui_rollback();            -- برگشت به نسخه قبلی
//  پیش‌نمایش بدون تغییر سایت، فقط برای مالک: /?ui=v2.0   و خروج: /?ui=site
//
//  قانون: کد نسخه‌های قدیمی هیچ‌وقت پاک نمی‌شود تا برگشت همیشه ممکن باشد.
//  هر نسخه تازه باید هم اینجا و هم در جدول public.ui_versions اضافه شود.
// ─────────────────────────────────────────────────────────────

export const UI_VERSIONS = [
  { id: 'v1.0', name: 'کلاسیک', date: '2026-09-27' },
  { id: 'v2.0', name: 'فانوس', date: '2026-09-27' },
]

export const DEFAULT_UI = 'v1.0'
export const UI_REVALIDATE_SECONDS = 30   // هر تغییر نسخه حداکثر تا این مدت به همه می‌رسد؛ با revalidate در app/layout.js یکی باشد
export const UI_IDS = UI_VERSIONS.map(v => v.id)

export function isKnownUi(id) {
  return typeof id === 'string' && UI_IDS.includes(id)
}

export function uiInfo(id) {
  return UI_VERSIONS.find(v => v.id === id) || null
}
