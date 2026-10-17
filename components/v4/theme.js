// ─────────────────────────────────────────────────────────────
//  TwinLand — ظاهر نسخه v4.0 «مینیمال»
//  همان کلیدهای v2Tokens را برمی‌گرداند تا اجزای مشترک نسخه‌های قبل بی‌تغییر کار کنند،
//  فقط مقدارها سیاه و سفید و شیشه‌ای‌اند. رنگ فقط برای چند استثنا می‌ماند که در V4_COLOR آمده.
// ─────────────────────────────────────────────────────────────
import { alpha } from '@/components/v2/theme'

// استثناهای رنگی v4.0 — بقیه همه سیاه و سفید
export const V4_COLOR = {
  streak: '#FF7A1A',
  streakGrad: 'linear-gradient(135deg,#FFB13D 0%,#FF7A1A 55%,#F2471C 100%)',
  pin: '#34C759',          // نشانگر کافه‌ها همیشه همین سبز است؛ همان سبز «آنلاین» و تیک
  todayGrad: 'linear-gradient(135deg,#FFB13D,#F2471C)',
}

export function v4Tokens(C) {
  const dark = C.mode === 'dark'
  const ink = C.text
  return {
    dark,
    radius: { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 },
    // شیشه مات روی همه سطح‌ها
    glass: dark ? 'rgba(24,24,27,0.56)' : 'rgba(255,255,255,0.58)',
    glassStrong: dark ? 'rgba(16,16,18,0.70)' : 'rgba(255,255,255,0.72)',
    // منوها و پنجره‌های روی محتوای شلوغ کمی مات‌ترند تا نوشته زیرشان خواندن را سخت نکند
    glassMenu: dark ? 'rgba(14,14,16,0.86)' : 'rgba(255,255,255,0.88)',
    blur: 'blur(22px) saturate(1.6)',
    hair: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
    hairStrong: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
    highlight: dark ? 'inset 0 1px 0 rgba(255,255,255,.07)' : 'inset 0 1px 0 rgba(255,255,255,.85)',
    shadow1: dark
      ? '0 1px 2px rgba(0,0,0,.5), 0 8px 20px rgba(0,0,0,.35)'
      : '0 1px 2px rgba(0,0,0,.04), 0 8px 22px rgba(0,0,0,.07)',
    shadow2: dark
      ? '0 2px 8px rgba(0,0,0,.5), 0 22px 56px rgba(0,0,0,.5)'
      : '0 2px 8px rgba(0,0,0,.04), 0 22px 56px rgba(0,0,0,.10)',
    // بدون هاله رنگی؛ فقط سایه نرم
    glow: () => (dark ? '0 8px 22px -10px rgba(0,0,0,.8)' : '0 8px 22px -10px rgba(0,0,0,.35)'),
    ink,
    sub: C.sub,
    accent: C.accent,
    onAccent: C.accentText || (dark ? '#0A0A0A' : '#FFFFFF'),
    accentSoft: alpha(ink, dark ? 0.12 : 0.07),
    hover: alpha(ink, dark ? 0.09 : 0.06),
    grad: C.grad || C.accent,
    chip: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
    // نقشه عکسی پشتیبان هم بی‌رنگ می‌شود
    tileFilter: dark
      ? 'grayscale(1) invert(1) brightness(.78) contrast(.92)'
      : 'grayscale(1) brightness(1.06) contrast(.9)',
    mapBg: dark ? '#0B0B0C' : '#EEEEEF',
    green: V4_COLOR.pin,
  }
}

// اندازه‌ها همان v2 است به‌اضافه ستون ابزار چپ دسکتاپ
export function v4Layout({ isMobile, isDesktop }) {
  const gap = isMobile ? 8 : 12
  const barH = isMobile ? 52 : 58
  const chipsH = 38
  const dockH = isMobile ? 62 : 64
  const dockBottom = isMobile ? 8 : 12
  return {
    gap,
    barTop: gap,
    barH,
    chipsTop: gap + barH + 8,
    chipsH,
    hudTop: gap + barH + 8 + chipsH + 10,
    dockH,
    dockBottom,
    dockW: isMobile ? null : 420,
    aboveDock: dockBottom + dockH + 10,
    panelW: isDesktop ? 372 : 320,
    railW: 60,
    railWOpen: 224,
  }
}
