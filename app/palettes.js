// ─────────────────────────────────────────────────────────────
//  TwinLand — سیستم پالت رنگی مشترک (نسخه‌ی حرفه‌ای)
//  هر پالت دو حالت دارد: light (روز) و dark (شب)
//  رنگ‌های معنایی (green/blue/purple/gold/danger) بین همه مشترک‌اند
//
//  اصل مهم: هر حالت فقط چند مقدار «هسته» تعریف می‌کند (bg, card, accent, ...)
//  و بقیه‌ی مقادیر مشتق (text/sub/border/chip/glass) به‌صورت خودکار با کنتراست
//  درست ساخته می‌شوند. این تضمین می‌کند متن هیچ‌وقت روی زمینه‌ی هم‌رنگ گم نشود.
// ─────────────────────────────────────────────────────────────

const SEMANTIC = {
  green:'#34C759', blue:'#007AFF', purple:'#AF52DE',
  gold:'#FFD60A', danger:'#FF3B30',
}

// ── ابزار رنگ ────────────────────────────────────────────────
function hexToRgb(hex){
  let h = String(hex||'').replace('#','').trim()
  if(h.length===3) h = h.split('').map(c=>c+c).join('')
  const n = parseInt(h||'000000',16)
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }
}
function rgba(hex, a){ const {r,g,b}=hexToRgb(hex); return 'rgba('+r+','+g+','+b+','+a+')' }
function luminance(hex){ const {r,g,b}=hexToRgb(hex); return 0.299*r+0.587*g+0.114*b }
function isDark(hex){ return luminance(hex) < 140 }
function inkOn(hex, darkInk, lightInk){
  return isDark(hex) ? (lightInk||'#F8FAFC') : (darkInk||'#0F172A')
}
function clamp(v){ return Math.max(0,Math.min(255,Math.round(v))) }
function rgbHex(r,g,b){ return '#'+[r,g,b].map(x=>clamp(x).toString(16).padStart(2,'0')).join('') }
function lighten(hex,amt){ const {r,g,b}=hexToRgb(hex); return rgbHex(r+255*amt,g+255*amt,b+255*amt) }
function darken(hex,amt){ const {r,g,b}=hexToRgb(hex); return rgbHex(r-255*amt,g-255*amt,b-255*amt) }

// ── هسته‌ی هر حالت را به آبجکت کامل رنگ تبدیل می‌کند ──────────
function expand(core){
  const bgIsDark   = isDark(core.bg)
  const cardIsDark = isDark(core.card)

  const text = core.text || (cardIsDark ? (core.textLight||'#F8FAFC') : (core.textDark||'#0F172A'))
  const sub  = core.sub  || (cardIsDark ? rgba(text,0.62) : rgba('#000000',0.45))
  const chip = core.chip || (bgIsDark ? lighten(core.card,0.06) : darken(core.bg,0.05))

  return {
    bg: core.bg,
    card: core.card,
    text,
    sub,
    accent: core.accent,
    accentText: core.accentText || inkOn(core.accent),
    accentL: rgba(core.accent, 0.16),
    border: bgIsDark ? rgba('#FFFFFF',0.10) : rgba('#000000',0.09),
    chip,
    chipText: inkOn(chip),
    glass:     bgIsDark ? rgba(core.card,0.72) : rgba('#FFFFFF',0.72),
    glassDark: bgIsDark ? rgba(core.bg,0.90)  : rgba('#FFFFFF',0.92),
    grad: core.grad || core.accent,
    isDarkBg: bgIsDark,
  }
}

// ── تعریف پالت‌ها (فقط هسته — بقیه خودکار ساخته می‌شود) ───────
const RAW = {
  cyberpunk: { name:'سایبرپانک', emoji:'⚡',
    light:{ bg:'#FAF0FF', card:'#FFFFFF', accent:'#C026D3', grad:'linear-gradient(90deg,#D946EF,#06B6D4)' },
    dark: { bg:'#0A0118', card:'#120726', accent:'#E879F9', grad:'linear-gradient(90deg,#D946EF,#06B6D4)' } },

  luna: { name:'لونا', emoji:'🌙',
    light:{ bg:'#EAF6FB', card:'#FFFFFF', accent:'#26658C', grad:'linear-gradient(90deg,#54ACBF,#26658C)' },
    dark: { bg:'#011C40', card:'#022E5A', accent:'#54ACBF', grad:'linear-gradient(90deg,#54ACBF,#A7EBF2)' } },

  lemon: { name:'لیمو', emoji:'🍋',
    light:{ bg:'#FFFDF2', card:'#FFFFFF', accent:'#E0A800', grad:'linear-gradient(90deg,#FFD54F,#FFB300)' },
    dark: { bg:'#1A1705', card:'#26220A', accent:'#FFD54F', grad:'linear-gradient(90deg,#FFD54F,#FFECB3)' } },

  forest: { name:'جنگل', emoji:'🌿',
    light:{ bg:'#F4F7EE', card:'#FFFFFF', accent:'#5E7345', grad:'linear-gradient(90deg,#88976C,#5E7345)' },
    dark: { bg:'#12160C', card:'#1D2413', accent:'#98A77C', grad:'linear-gradient(90deg,#98A77C,#CFE1B9)' } },

  mocha: { name:'موکا', emoji:'☕',
    light:{ bg:'#FFF8F0', card:'#FFFFFF', accent:'#8C6E63', grad:'linear-gradient(90deg,#D3A376,#8C6E63)' },
    dark: { bg:'#1A0F0A', card:'#2A1B14', accent:'#C79E7F', grad:'linear-gradient(90deg,#C79E7F,#FFE0B2)' } },

  mint: { name:'مینت', emoji:'🌱',
    light:{ bg:'#EFFBF9', card:'#FFFFFF', accent:'#0F9D95', grad:'linear-gradient(90deg,#46DFB1,#09D1C7)' },
    dark: { bg:'#07201F', card:'#0E2E2C', accent:'#2DD4BF', grad:'linear-gradient(90deg,#46DFB1,#80EE98)' } },

  slate: { name:'اسلیت', emoji:'🪨',
    light:{ bg:'#F4F6F8', card:'#FFFFFF', accent:'#2E4156', grad:'linear-gradient(90deg,#3B4256,#2E4156)' },
    dark: { bg:'#0F1826', card:'#1A2636', accent:'#6B7285', grad:'linear-gradient(90deg,#6B7285,#9CA1B4)' } },

  white: { name:'سفید', emoji:'⚪',
    // روز: پس‌زمینه سفید تمیز، accent طوسی تیره (خوانا)، دکمه‌ها/چیپ طوسی روشن
    light:{ bg:'#FFFFFF', card:'#FFFFFF', accent:'#4B4B4B', chip:'#EDEDED', grad:'linear-gradient(90deg,#6E6E6E,#3A3A3A)' },
    dark: { bg:'#121212', card:'#1E1E1E', accent:'#D4D4D4', accentText:'#1a1a1a', chip:'#2A2A2A', grad:'linear-gradient(90deg,#D4D4D4,#9A9A9A)' } },

  graphite: { name:'طوسی', emoji:'🌑',
    // روز: پس‌زمینه طوسی روشن، کارت سفید (کنتراست با bg)، accent طوسی تیره
    light:{ bg:'#E8E8E8', card:'#FFFFFF', accent:'#3D3D3D', chip:'#DADADA', grad:'linear-gradient(90deg,#5C5C5C,#2E2E2E)' },
    dark: { bg:'#242424', card:'#333333', accent:'#C8C8C8', accentText:'#1a1a1a', chip:'#454545', grad:'linear-gradient(90deg,#E0E0E0,#A8A8A8)' } },

  mono: { name:'تک‌رنگ', emoji:'◑',
    light:{ bg:'#FFFFFF', card:'#FAFAFA', accent:'#1a1a1a', accentText:'#FFFFFF', chip:'#EDEDED', grad:'linear-gradient(90deg,#333,#000)' },
    dark: { bg:'#000000', card:'#0D0D0D', accent:'#FFFFFF', accentText:'#000000', chip:'#1A1A1A', grad:'linear-gradient(90deg,#FFF,#BBB)' } },
}

export const PALETTES = Object.fromEntries(
  Object.entries(RAW).map(([key,p])=>[key,{
    name:p.name, emoji:p.emoji,
    light: expand(p.light),
    dark:  expand(p.dark),
    swatch: [p.light.bg, p.light.card, p.light.accent],
    swatchDark: [p.dark.bg, p.dark.card, p.dark.accent],
  }])
)

export const PALETTE_ORDER = ['graphite','cyberpunk','luna','lemon','forest','mocha','mint','slate','white','mono']
export const DEFAULT_PALETTE = 'graphite'
export const DEFAULT_MODE = 'dark'

export function buildC(paletteKey, mode) {
  const p = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE]
  const m = (mode === 'light' || mode === 'dark') ? mode : DEFAULT_MODE
  const base = p[m]
  return {
    ...SEMANTIC,
    ...base,
    grad: base.grad || base.accent,
    mode: m,
    paletteKey,
  }
}

export function loadPrefs() {
  if (typeof window === 'undefined') return { palette: DEFAULT_PALETTE, mode: DEFAULT_MODE }
  try {
    const savedPalette = localStorage.getItem('tl_palette')
    const savedMode = localStorage.getItem('tl_thememode')
    const palette = (savedPalette && PALETTES[savedPalette]) ? savedPalette : DEFAULT_PALETTE
    const mode = (savedMode === 'light' || savedMode === 'dark') ? savedMode : DEFAULT_MODE
    return { palette, mode }
  } catch { return { palette: DEFAULT_PALETTE, mode: DEFAULT_MODE } }
}

export function savePalette(key) {
  try { localStorage.setItem('tl_palette', key) } catch {}
}
export function saveMode(mode) {
  try { localStorage.setItem('tl_thememode', mode) } catch {}
}
