'use client'
// ═══════════════════════════════════════════════════════════════════════════
// app/ui.js — رفتار مشترک کل سایت 🎛️
// ───────────────────────────────────────────────────────────────────────────
// همون منطق labels.js، ولی برای «رفتار» به‌جای «اسم»:
// یک‌بار اینجا تعریف می‌شه، همه‌ی صفحه‌ها ازش استفاده می‌کنن.
//
// سه چیز رو حل می‌کنه:
//   ۱. انیمیشن hover/کلیک یکدست  → <UIStyles/> + کلاس‌های tl-*
//   ۲. اسکرول افقی درست در ویندوز → useDragScroll()
//   ۳. تضاد رنگ متن با پس‌زمینه   → onColor() و softBg()
//
// قانون از این به بعد:
//   ❌ هیچ رنگ ثابتی مثل '#fff' یا '#FFF9F0' توی صفحه‌ها ننویس.
//   ✅ همیشه onColor(bg) یا رنگ‌های پالت (C.*) رو استفاده کن.
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect } from 'react'

// ── ۱) تضاد رنگ: خودکار و همیشه خوانا ────────────────────────────────────
// مشکلی که داشتیم: بعضی پالت‌ها accent روشن دارن و متنِ روش هم روشن بود،
// یعنی متن سفید روی جعبه‌ی سفید → نامرئی. به‌جای اینکه هر جا دستی درست کنیم،
// روشناییِ واقعیِ پس‌زمینه رو حساب می‌کنیم و متن تیره یا روشن برمی‌گردونیم.

function parseColor(c) {
  if (!c || typeof c !== 'string') return null
  let s = c.trim()
  if (s[0] === '#') {
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
    if (s.length === 9) s = s.slice(0, 7)          // #RRGGBBAA → #RRGGBB
    if (s.length !== 7) return null
    const n = parseInt(s.slice(1), 16)
    if (Number.isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const p = m[1].split(',').map(x => parseFloat(x))
    if (p.length >= 3) return { r: p[0], g: p[1], b: p[2] }
  }
  return null
}

// روشناییِ ادراکی (WCAG relative luminance)
export function luminance(color) {
  const c = parseColor(color)
  if (!c) return 0.5
  const f = (v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
}

/**
 * رنگ متنِ خوانا روی هر پس‌زمینه‌ای.
 * onColor('#FFD60A') → '#12121A' (تیره)
 * onColor('#1a1a2e') → '#FFFFFF' (روشن)
 * به‌جای color:'#fff' یا color:C.accentText همیشه از این استفاده کن.
 */
export function onColor(bg, dark = '#12121A', light = '#FFFFFF') {
  return luminance(bg) > 0.45 ? dark : light
}

/** نسخه‌ی خیلی کم‌رنگِ یک رنگ برای پس‌زمینه‌ی کارت — سازگار با تم روشن و تیره */
export function softBg(color, isDark) {
  return color + (isDark ? '1f' : '14')
}

/** آیا پالت فعلی تیره‌ست؟ از خودِ رنگ پس‌زمینه تشخیص می‌ده، نه از تنظیمات */
export function isDarkC(C) {
  return luminance((C && C.bg) || '#ffffff') < 0.4
}

// ── ۲) اسکرول افقی که در ویندوز هم کار کنه ───────────────────────────────
// روی موبایل با انگشت اسکرول می‌شد، ولی در ویندوز چرخ ماوس فقط عمودیه و
// نوارهای افقی گیر می‌کردن. این هوک سه راه می‌ده: چرخ ماوس، درگ با کلیک،
// و کیبورد. اسکرول‌بار زشتِ پیش‌فرض هم مخفی می‌شه.
export function useDragScroll() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let down = false, startX = 0, startLeft = 0, moved = false

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft -= e.deltaY
        if (el.scrollWidth > el.clientWidth) e.preventDefault()
      }
    }
    const onDown = (e) => {
      if (e.pointerType === 'touch') return          // موبایل خودش بلده
      down = true; moved = false
      startX = e.clientX; startLeft = el.scrollLeft
      el.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 3) moved = true
      el.scrollLeft = startLeft - dx
    }
    const onUp = () => { down = false; el.style.cursor = '' }
    // اگه کاربر درگ کرد، کلیکِ ناخواسته روی آیتم زیر انگشت رو بگیر
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation() } }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('click', onClick, true)
    }
  }, [])
  return ref
}

/** استایل پایه‌ی هر نوار افقی — با کلاس tl-hscroll ترکیب می‌شه */
export const hscroll = {
  display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden',
  scrollbarWidth: 'none', msOverflowStyle: 'none',
  overscrollBehaviorX: 'contain', scrollSnapType: 'x proximity',
  cursor: 'grab', WebkitOverflowScrolling: 'touch',
}

// ── ۳) استایل‌های سراسری ─────────────────────────────────────────────────
// این کامپوننت رو یک‌بار توی هر صفحه بذار: <UIStyles/>
// بعدش هر جا خواستی، فقط کلاس بده:
//   tl-press  → دکمه/چیپ: بالا میاد و موقع کلیک فشرده می‌شه
//   tl-row    → ردیف لیست: پس‌زمینه‌ش روشن می‌شه
//   tl-tile   → کارت/کاشی: بالا میاد و سایه می‌گیره
//   tl-hscroll→ نوار افقی بدون اسکرول‌بار زشت
export function UIStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* ── تعامل: یکدست در کل سایت ───────────────────────────────── */
      .tl-press,.tl-row,.tl-tile{
        transition:transform .17s cubic-bezier(.2,.9,.3,1),
                   box-shadow .22s ease, background-color .2s ease,
                   border-color .2s ease, opacity .2s ease;
        -webkit-tap-highlight-color:transparent;
      }
      .tl-press:active{transform:scale(.972)}
      .tl-row:active{transform:scale(.99)}
      .tl-tile:active{transform:scale(.985)}

      /* hover فقط روی دستگاه‌هایی که واقعاً ماوس دارن */
      @media (hover:hover) and (pointer:fine){
        .tl-press:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.16)}
        .tl-row:hover{background-color:rgba(127,127,127,.11)}
        .tl-tile:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(0,0,0,.18)}
        .tl-press:focus-visible,.tl-row:focus-visible,.tl-tile:focus-visible{
          outline:2px solid currentColor;outline-offset:2px;
        }
      }
      /* آیتم غیرفعال (مثلاً ماموریت تکمیل‌شده) نباید واکنش بده */
      .tl-off,.tl-off:hover,.tl-off:active{transform:none!important;box-shadow:none!important;cursor:default}

      /* ── نوار افقی: اسکرول‌بارِ زشتِ ویندوز حذف ─────────────────── */
      .tl-hscroll{scrollbar-width:none;-ms-overflow-style:none}
      .tl-hscroll::-webkit-scrollbar{display:none;height:0;width:0}
      .tl-hscroll>*{scroll-snap-align:start;flex-shrink:0}
      .tl-hscroll:active{cursor:grabbing}

      /* اسکرول عمودی هم نازک و مدرن، به‌جای اسکرول‌بار پیش‌فرض ویندوز */
      .tl-vscroll{scrollbar-width:thin;scrollbar-color:rgba(127,127,127,.35) transparent}
      .tl-vscroll::-webkit-scrollbar{width:6px}
      .tl-vscroll::-webkit-scrollbar-track{background:transparent}
      .tl-vscroll::-webkit-scrollbar-thumb{background:rgba(127,127,127,.32);border-radius:99px}
      .tl-vscroll::-webkit-scrollbar-thumb:hover{background:rgba(127,127,127,.5)}

      /* ── فید زنده: ورود/خروج نرم آیتم‌ها ───────────────────────── */
      @keyframes tlIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes tlOut{from{opacity:1}to{opacity:0;transform:translateY(-8px) scale(.97)}}
      @keyframes tlNewGlow{0%{box-shadow:0 0 0 0 rgba(255,180,60,.55)}100%{box-shadow:0 0 0 12px rgba(255,180,60,0)}}
      .tl-in{animation:tlIn .38s cubic-bezier(.2,.9,.3,1) both}
      .tl-new{animation:tlIn .38s cubic-bezier(.2,.9,.3,1) both, tlNewGlow 1.4s ease-out .3s 2}

      /* برای کسانی که انیمیشن اذیتشون می‌کنه */
      @media (prefers-reduced-motion:reduce){
        .tl-press,.tl-row,.tl-tile,.tl-in,.tl-new{animation:none!important;transition:none!important}
      }
    `}} />
  )
}
