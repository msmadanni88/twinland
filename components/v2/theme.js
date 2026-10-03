// ─────────────────────────────────────────────────────────────
//  TwinLand — ظاهر نسخه v2.0 «فانوس»
//  توکن‌های طراحی این نسخه از روی پالت فعال کاربر (C) ساخته می‌شوند؛
//  هیچ رنگ ثابتی در اجزای v2 نوشته نمی‌شود. فقط سایه‌ها از سیاهِ نیمه‌شفاف استفاده می‌کنند.
// ─────────────────────────────────────────────────────────────
import { onColor } from '@/lib/theme/ui'

function rgbOf(c) {
  if (!c || typeof c !== 'string') return { r: 0, g: 0, b: 0 }
  let s = c.trim()
  if (s[0] === '#') {
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
    const n = parseInt(s.slice(1, 7), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) { const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2] } }
  return { r: 0, g: 0, b: 0 }
}

// رنگ با شفافیت دلخواه — ورودی می‌تواند hex یا rgba باشد
export function alpha(c, a) {
  const { r, g, b } = rgbOf(c)
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

// ترکیب دو رنگ؛ t=0 یعنی a و t=1 یعنی b
export function mix(a, b, t) {
  const x = rgbOf(a), y = rgbOf(b)
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return '#' + h(x.r + (y.r - x.r) * t) + h(x.g + (y.g - x.g) * t) + h(x.b + (y.b - x.b) * t)
}

// همه چیزی که اجزای v2 لازم دارند، یک‌جا
export function v2Tokens(C) {
  const dark = C.mode === 'dark'
  const ink = C.text
  return {
    dark,
    radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
    // سطح‌های شیشه‌ای روی نقشه
    glass: dark ? alpha(C.card, 0.74) : alpha(C.card, 0.8),
    glassStrong: dark ? alpha(mix(C.bg, C.card, 0.5), 0.9) : alpha(C.card, 0.93),
    blur: 'blur(18px) saturate(1.5)',
    // خط‌های نازک دور اجزا
    hair: alpha(ink, dark ? 0.1 : 0.09),
    hairStrong: alpha(ink, dark ? 0.18 : 0.16),
    highlight: dark ? 'inset 0 1px 0 rgba(255,255,255,.06)' : 'inset 0 1px 0 rgba(255,255,255,.7)',
    // سایه‌ها: کم برای دکمه‌ها، زیاد برای پنل‌ها
    shadow1: dark
      ? '0 1px 2px rgba(0,0,0,.45), 0 6px 16px rgba(0,0,0,.30)'
      : '0 1px 2px rgba(0,0,0,.06), 0 6px 18px rgba(0,0,0,.10)',
    shadow2: dark
      ? '0 2px 6px rgba(0,0,0,.45), 0 18px 48px rgba(0,0,0,.45)'
      : '0 2px 6px rgba(0,0,0,.06), 0 18px 48px rgba(0,0,0,.16)',
    glow: (c, a = 0.45) => '0 10px 26px -8px ' + alpha(c, a),
    // رنگ‌ها
    ink,
    sub: C.sub,
    accent: C.accent,
    onAccent: onColor(C.accent),
    accentSoft: alpha(C.accent, dark ? 0.16 : 0.12),
    grad: C.grad || C.accent,
    chip: alpha(C.chip, dark ? 0.9 : 0.95),
    // فیلتر کاشی‌های نقشه در حالت «معمولی»: نقشه آرام و هم‌رنگ پالت، تا کافه‌ها بدرخشند
    tileFilter: dark
      ? 'invert(1) hue-rotate(180deg) saturate(.32) brightness(.86) contrast(.92)'
      : 'saturate(.42) brightness(1.04) contrast(.93)',
    mapBg: dark ? mix(C.bg, '#000000', 0.25) : mix(C.bg, C.card, 0.5),
  }
}

// اندازه‌ها و فاصله‌های ثابت چیدمان v2
export function v2Layout({ isMobile, isDesktop }) {
  const gap = isMobile ? 8 : 12
  const barH = isMobile ? 52 : 58
  const chipsH = 38
  const dockH = isMobile ? 64 : 66
  const dockBottom = isMobile ? 8 : 12
  return {
    gap,
    barTop: gap,
    barH,
    chipsTop: gap + barH + 8,
    chipsH,
    hudTop: gap + barH + 8 + chipsH + 10,   // زیر نوار بالا و ردیف منطقه‌ها
    dockH,
    dockBottom,
    dockW: isMobile ? null : 440,
    aboveDock: dockBottom + dockH + 10,      // فاصله امن از پایین، بالای داک
    panelW: isDesktop ? 360 : 320,
  }
}
