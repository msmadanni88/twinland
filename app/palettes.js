// ─────────────────────────────────────────────────────────────
//  TwinLand — سیستم پالت رنگی مشترک
//  هر پالت دو حالت دارد: light (روز) و dark (شب)
//  رنگ‌های معنایی (green/blue/purple/gold/danger) بین همه مشترک‌اند
// ─────────────────────────────────────────────────────────────

const SEMANTIC = {
  green:'#34C759', blue:'#007AFF', purple:'#AF52DE',
  gold:'#FFD60A', danger:'#FF3B30',
}

export const PALETTES = {
  cyberpunk: {
    name:'سایبرپانک', emoji:'⚡',
    light:{ bg:'#FAF0FF', card:'#FFFFFF', border:'rgba(217,70,239,.18)',
      text:'#4A044E', sub:'#86708F', accent:'#C026D3', accentL:'#C026D318',
      chip:'#FAE8FF', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)',
      grad:'linear-gradient(90deg,#D946EF,#06B6D4)' },
    dark:{ bg:'#0A0118', card:'#120726', border:'rgba(217,70,239,.30)',
      text:'#FAF5FF', sub:'#A78BC0', accent:'#E879F9', accentL:'rgba(217,70,239,.18)',
      chip:'#1A0B2E', glass:'rgba(18,7,38,.72)', glassDark:'rgba(10,1,24,.92)',
      grad:'linear-gradient(90deg,#D946EF,#06B6D4)' },
  },
  ocean: {
    name:'اقیانوس', emoji:'🌊',
    light:{ bg:'#F8FAFC', card:'#FFFFFF', border:'rgba(0,0,0,.08)',
      text:'#0F172A', sub:'#64748B', accent:'#0EA5E9', accentL:'#0EA5E918',
      chip:'#E2E8F0', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#0F172A', card:'#1E293B', border:'rgba(255,255,255,.08)',
      text:'#F1F5F9', sub:'#94A3B8', accent:'#38BDF8', accentL:'rgba(56,189,248,.16)',
      chip:'#334155', glass:'rgba(30,41,59,.72)', glassDark:'rgba(15,23,42,.92)' },
  },
  bubblegum: {
    name:'آدامس', emoji:'🍬',
    light:{ bg:'#FDF2F8', card:'#FFFFFF', border:'rgba(236,72,153,.14)',
      text:'#831843', sub:'#9CA3AF', accent:'#EC4899', accentL:'#EC489918',
      chip:'#FCE7F3', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#1A0E16', card:'#2A1622', border:'rgba(236,72,153,.25)',
      text:'#FDF2F8', sub:'#C99AB3', accent:'#F472B6', accentL:'rgba(244,114,182,.16)',
      chip:'#331824', glass:'rgba(42,22,34,.72)', glassDark:'rgba(26,14,22,.92)' },
  },
  slatepro: {
    name:'حرفه‌ای', emoji:'💎',
    light:{ bg:'#F8FAFC', card:'#FFFFFF', border:'rgba(0,0,0,.08)',
      text:'#0F172A', sub:'#64748B', accent:'#0F766E', accentL:'#0F766E18',
      chip:'#E2E8F0', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#0B1220', card:'#172033', border:'rgba(255,255,255,.08)',
      text:'#F1F5F9', sub:'#94A3B8', accent:'#2DD4BF', accentL:'rgba(45,212,191,.16)',
      chip:'#2A3850', glass:'rgba(23,32,51,.72)', glassDark:'rgba(11,18,32,.92)' },
  },
  cyber: {
    name:'سایبر', emoji:'🤖',
    light:{ bg:'#F0FDFF', card:'#FFFFFF', border:'rgba(6,182,212,.14)',
      text:'#164E63', sub:'#94A3B8', accent:'#06B6D4', accentL:'#06B6D418',
      chip:'#CFFAFE', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#070B14', card:'#0E1626', border:'rgba(34,211,238,.22)',
      text:'#ECFEFF', sub:'#7BA0AD', accent:'#22D3EE', accentL:'rgba(34,211,238,.16)',
      chip:'#0E2A33', glass:'rgba(14,22,38,.72)', glassDark:'rgba(7,11,20,.92)' },
  },
  pasteldream: {
    name:'رویای پاستل', emoji:'🌸',
    light:{ bg:'#FDF4FF', card:'#FFFFFF', border:'rgba(167,139,250,.16)',
      text:'#4C1D95', sub:'#9CA3AF', accent:'#A78BFA', accentL:'#A78BFA20',
      chip:'#F3E8FF', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#1E1B2E', card:'#2A2640', border:'rgba(196,181,253,.2)',
      text:'#F5F3FF', sub:'#A5A0C0', accent:'#C4B5FD', accentL:'rgba(196,181,253,.16)',
      chip:'#2D2A40', glass:'rgba(42,38,64,.72)', glassDark:'rgba(30,27,46,.92)' },
  },
  lavender: {
    name:'اسطوخودوس', emoji:'💜',
    light:{ bg:'#FAF5FF', card:'#FFFFFF', border:'rgba(139,92,246,.14)',
      text:'#4C1D95', sub:'#9CA3AF', accent:'#8B5CF6', accentL:'#8B5CF618',
      chip:'#EDE9FE', glass:'rgba(255,255,255,.72)', glassDark:'rgba(255,255,255,.92)' },
    dark:{ bg:'#161325', card:'#221E38', border:'rgba(196,181,253,.18)',
      text:'#F5F3FF', sub:'#9B95BD', accent:'#A5B4FC', accentL:'rgba(165,180,252,.16)',
      chip:'#252040', glass:'rgba(34,30,56,.72)', glassDark:'rgba(22,19,37,.92)' },
  },
}

export const PALETTE_ORDER = ['cyberpunk','ocean','bubblegum','slatepro','cyber','pasteldream','lavender']
export const DEFAULT_PALETTE = 'cyberpunk'
export const DEFAULT_MODE = 'dark'

// می‌سازد آبجکت رنگ نهایی (C) از یک پالت و حالت روز/شب
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

// خواندن انتخاب کاربر از مرورگر (فقط سمت کلاینت)
export function loadPrefs() {
  if (typeof window === 'undefined') return { palette: DEFAULT_PALETTE, mode: DEFAULT_MODE }
  try {
    return {
      palette: localStorage.getItem('tl_palette') || DEFAULT_PALETTE,
      mode: localStorage.getItem('tl_thememode') || DEFAULT_MODE,
    }
  } catch { return { palette: DEFAULT_PALETTE, mode: DEFAULT_MODE } }
}

export function savePalette(key) {
  try { localStorage.setItem('tl_palette', key) } catch {}
}
export function saveMode(mode) {
  try { localStorage.setItem('tl_thememode', mode) } catch {}
}
