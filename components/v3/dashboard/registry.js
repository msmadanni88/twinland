// ─────────────────────────────────────────────────────────────
//  فهرست ویجت‌های داشبورد و چیدمان هر نقش
//
//  برای اضافه کردن ویجت تازه:
//   1. جزء را در widgets.js بنویس. ورودی‌اش فقط ctx است.
//   2. یک خط به DASHBOARD_WIDGETS اضافه کن.
//   3. شناسه‌اش را در چیدمان نقش مورد نظر بگذار.
//  برای عوض کردن ترتیب یا حذف یک ویجت برای همه، فقط DASHBOARD_LAYOUT را عوض کن.
//
//  راه رشد: بعدا این چیدمان می‌تواند از دیتابیس بیاید، برای هر کاربر یا هر نقش یا هر آزمایش A/B،
//  بدون اینکه کد ویجت‌ها عوض شود. قفل کردن بعضی ویجت‌ها پشت اشتراک هم همین‌جا (فیلد plan) انجام می‌شود.
// ─────────────────────────────────────────────────────────────
import { CityWidget, EventsWidget, ExploreWidget, HeroWidget, PulseWidget, QuestsWidget, RankWidget, ShortcutsWidget, TodayWidget } from '@/components/v3/dashboard/widgets'

export const DASHBOARD_WIDGETS = {
  hero:      { Component: HeroWidget,      plan: 'free' },
  today:     { Component: TodayWidget,     plan: 'free' },
  events:    { Component: EventsWidget,    plan: 'free' },
  quests:    { Component: QuestsWidget,    plan: 'free' },
  city:      { Component: CityWidget,      plan: 'free' },
  pulse:     { Component: PulseWidget,     plan: 'free' },
  rank:      { Component: RankWidget,      plan: 'free' },
  explore:   { Component: ExploreWidget,   plan: 'free' },
  shortcuts: { Component: ShortcutsWidget, plan: 'free' },
}

export const DASHBOARD_LAYOUT = {
  user: ['hero', 'today', 'events', 'quests', 'city', 'pulse', 'rank', 'explore', 'shortcuts'],
}
