// پین و خوشه نسخه v2.0 «فانوس»: هر کافه مثل یک فانوس کوچک روی نقشه آرام می‌درخشد.
// خروجی به useCafeMap داده می‌شود (pinStyle) و منطق نقشه دست نمی‌خورد.
import { onColor } from '@/lib/theme/ui'
import { alpha, mix } from '@/components/v2/theme'

// مجموعه کافه‌های نقاشی‌شده: ده شکل ساختمان کوچک — مالک کافه می‌تواند از پنل خودش
// یکی را برای کافه‌اش انتخاب کند (cafe.icon_id)؛ بدون انتخاب، بر اساس شناسه کافه
// یکی خودکار تعیین می‌شود. رنگ سایبان همان رنگ ثابت کافه است. حالت ink همان
// شکل‌ها را تک‌رنگ و مدادی می‌کشد.
export const CAFE_SHAPES = [
  // مغازه با سایبان راه‌راه
  (k) => '<rect x="6" y="20" width="32" height="22" rx="2" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<path d="M4 20 L8 10 H36 L40 20 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M15 10 L13 20 M22 10 V20 M29 10 L31 20" stroke="' + k.stripe + '" stroke-width="2.4"/>' +
    '<rect x="10" y="25" width="10" height="9" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/><rect x="25" y="25" width="9" height="17" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // خانه شیروانی با دودکش
  (k) => '<rect x="29" y="6" width="5" height="10" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.8"/>' +
    '<path d="M4 22 L22 6 L40 22 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="8" y="22" width="28" height="20" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<circle cx="22" cy="16" r="3" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/>' +
    '<rect x="12" y="27" width="8" height="8" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/><rect x="25" y="27" width="8" height="15" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // کیوسک گنبدی
  (k) => '<path d="M7 24 A15 15 0 0 1 37 24 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M22 9 V4 M22 4 L28 6 L22 8" stroke="' + k.line + '" stroke-width="1.8" fill="' + k.stripe + '" stroke-linejoin="round"/>' +
    '<rect x="9" y="24" width="26" height="18" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<rect x="13" y="28" width="18" height="7" rx="1" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/><path d="M9 36 H35" stroke="' + k.line + '" stroke-width="1.8"/>',
  // دوطبقه با تابلو
  (k) => '<rect x="8" y="6" width="28" height="36" rx="2" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<rect x="8" y="20" width="28" height="6" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="1.8"/>' +
    '<rect x="12" y="10" width="7" height="7" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/><rect x="25" y="10" width="7" height="7" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/>' +
    '<rect x="12" y="30" width="9" height="8" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/><rect x="25" y="29" width="8" height="13" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // دکه فنجانی
  (k) => '<path d="M15 5 Q12 9 15 12 M22 3 Q19 8 22 12 M29 5 Q26 9 29 12" stroke="' + k.line + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<path d="M8 16 H34 L31 40 Q30 42 28 42 H14 Q12 42 11 40 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M34 21 H38 Q41 21 41 25 Q41 30 36 30 H33" fill="none" stroke="' + k.line + '" stroke-width="2.2"/>' +
    '<rect x="15" y="24" width="14" height="10" rx="2" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // کافه گوشه با برجک
  (k) => '<path d="M26 14 L33 4 L40 14 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="27" y="14" width="12" height="28" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<rect x="5" y="22" width="22" height="20" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<path d="M3 22 H29 L27 16 H5 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="9" y="27" width="8" height="8" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/><rect x="19" y="28" width="6" height="14" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.5"/><rect x="30" y="19" width="6" height="7" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/>',
  // مغازه با سایبان هلالی
  (k) => '<rect x="7" y="21" width="30" height="21" rx="2" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<path d="M5 21 L6 11 H38 L39 21 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M5 21 Q9 25 13 21 Q17 25 21 21 Q25 25 29 21 Q33 25 37 21" fill="none" stroke="' + k.stripe + '" stroke-width="2"/>' +
    '<rect x="11" y="26" width="9" height="8" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/><rect x="24" y="26" width="9" height="16" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // کلبه چوبی با تیرچه‌های افقی
  (k) => '<path d="M4 23 L22 7 L40 23 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="7" y="23" width="30" height="19" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<path d="M7 28 H37 M7 33 H37 M7 38 H37" stroke="' + k.stripe + '" stroke-width="1.2" opacity="0.55"/>' +
    '<circle cx="22" cy="15" r="2.6" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.4"/>' +
    '<rect x="11" y="27" width="8" height="7" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.5"/><rect x="24" y="28" width="8" height="14" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.5"/>',
  // ویترین باکس با پنجره بزرگ
  (k) => '<rect x="6" y="12" width="32" height="30" rx="2" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<rect x="6" y="12" width="32" height="6" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="1.8"/>' +
    '<rect x="10" y="22" width="24" height="12" rx="1.5" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.8"/>' +
    '<path d="M10 28 H34" stroke="' + k.line + '" stroke-width="1.2" opacity="0.5"/>' +
    '<rect x="27" y="34" width="7" height="8" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>',
  // بوتیک با ورودی طاقی
  (k) => '<rect x="7" y="18" width="30" height="24" fill="' + k.wall + '" stroke="' + k.line + '" stroke-width="2"/>' +
    '<path d="M5 18 H39 L37 10 H7 Z" fill="' + k.main + '" stroke="' + k.line + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M11 42 V30 Q11 24 17 24 Q23 24 23 30 V42" fill="' + k.door + '" stroke="' + k.line + '" stroke-width="1.6"/>' +
    '<rect x="27" y="24" width="8" height="9" rx="1.5" fill="' + k.glass + '" stroke="' + k.line + '" stroke-width="1.6"/>',
]

function shapeOf(cafe) {
  const s = String(cafe.id == null ? cafe.name || '' : cafe.id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % CAFE_SHAPES.length
}

// شماره شکلی که برای این کافه نشان داده می‌شود: اول انتخاب خودِ مالک (icon_id)،
// وگرنه همان شکل خودکار قبلی بر اساس شناسه کافه.
export function iconIndexOf(cafe) {
  const id = cafe && cafe.icon_id
  if (id != null && id >= 0 && id < CAFE_SHAPES.length) return id
  return shapeOf(cafe)
}

// کلید رنگ برای رسم شکل‌های رنگی (حالت toon) — هم اینجا و هم در پیش‌نمایش
// انتخابگر آیکون توی پنل کافه‌دار استفاده می‌شود تا دقیقاً یک‌شکل بمانند.
export function shapeKeyFor(main) {
  return { main, wall: '#fff6e0', line: mix(main, '#000000', 0.55), stripe: '#ffffff', glass: '#bfe9ff', door: mix(main, '#000000', 0.25) }
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function truncate(s, n) {
  s = String(s || '')
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ── منظومه دور پین ─────────────────────────────────────────────────────────
// با hover روی دسکتاپ، یا نگه‌داشتن انگشت روی موبایل (کلاس is-open)، چند گره
// از پشت پین بیرون می‌زنند و با خط به آن وصل می‌مانند: ابر شعار، آیتم ویژه،
// کمپین فعال (قابل کلیک → پنل ماموریت‌ها) و نشان «ظرفیت تکمیل».
// اندازه و زاویه هر گره از شناسه کافه درمی‌آید: برای هر کافه ثابت، ولی بین
// کافه‌ها متفاوت، تا همه شبیه هم نباشند.
function seedOf(cafe) {
  const s = String(cafe.id == null ? cafe.name || '' : cafe.id)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h
}
function rnd(seed, i) {
  let x = (seed + Math.imul(i + 1, 0x9E3779B9)) >>> 0
  x ^= x >>> 16; x = Math.imul(x, 0x85EBCA6B) >>> 0
  x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35) >>> 0
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}
const r1 = (n) => Math.round(n * 10) / 10

// آیکون آیتم ویژه از روی اسم خودش حدس زده می‌شود؛ اگر چیزی پیدا نشد ستاره
const ITEM_ICONS = [
  [/آفوگاتو|افوگاتو|aff?ogato|بستنی|ice ?cream|gelato/i, '🍨'],
  [/کوکی|cookie|بیسکو/i, '🍪'],
  [/دونات|donut|doughnut/i, '🍩'],
  [/کیک|cake|براونی|brownie|تیرامیسو|tiramisu/i, '🍰'],
  [/کروسان|croissant/i, '🥐'],
  [/وافل|waffle|پنکیک|pancake/i, '🧇'],
  [/پیتزا|pizza/i, '🍕'],
  [/برگر|burger/i, '🍔'],
  [/ساندویچ|sandwich|پنینی|panini/i, '🥪'],
  [/پاستا|pasta|اسپاگتی/i, '🍝'],
  [/سالاد|salad/i, '🥗'],
  [/صبحانه|املت|omelet|breakfast/i, '🍳'],
  [/شیک|shake|اسموتی|smoothie|فراپه|frapp/i, '🥤'],
  [/آب ?میوه|juice|لیموناد|lemonade|موهیتو|mojito/i, '🍹'],
  [/چای|tea|دمنوش|ماچا|matcha/i, '🍵'],
  [/شکلات|chocolate/i, '🍫'],
  [/قهوه|اسپرسو|لاته|کاپوچینو|موکا|آمریکانو|coffee|latte|espresso|mocha|americano|cappuccino|v60|کمکس/i, '☕'],
]
function itemIcon(name) {
  const s = String(name || '')
  for (let i = 0; i < ITEM_ICONS.length; i++) if (ITEM_ICONS[i][0].test(s)) return ITEM_ICONS[i][1]
  return '⭐'
}

// رنگ ثابت حباب‌ها در همه پوسته‌ها: زمینه تیره، نوشته و خط دور سفید — تا روی هر نقشه‌ای خوانا بماند
const BUBBLE_BG = '#15171c'
const BUBBLE_INK = '#ffffff'

// ابر شعار: اندازه از روی طول متن حساب می‌شود و سه مدل دارد —
// پفکی با برآمدگی درشت، پفکی با برآمدگی ریز، و حباب گرد دوخطه
function cloudNode(text, seed, fill, ink, textColor) {
  const t = truncate(text, 42)
  const per = 15
  const lines = Math.max(1, Math.min(3, Math.ceil(t.length / per)))
  const cols = Math.min(t.length, per)
  const w = Math.round(Math.max(56, cols * 6.4 + 32)), h = lines * 13 + 26
  const variant = seed % 3
  let shape
  if (variant === 2) {
    shape = '<rect x="4" y="5" width="' + (w - 5) + '" height="' + (h - 6) + '" rx="' + r1((h - 6) / 2.2) + '" style="fill:#000000" opacity=".3"/>' +
      '<rect class="tl2-cloud-shape" x="2" y="2" width="' + (w - 5) + '" height="' + (h - 6) + '" rx="' + r1((h - 6) / 2.2) + '" style="fill:' + fill + ';stroke:' + ink + '" stroke-width="2"/>'
  } else {
    const a = w / 2 - 7, b = h / 2 - 7, e = 2 / 3.2
    const perim = 2 * (w + h)
    const n = Math.max(7, Math.round(perim / (variant === 0 ? 27 : 18)))
    const pts = []
    for (let i = 0; i < n; i++) {
      const th = 2 * Math.PI * (i + (rnd(seed, 20 + i) - 0.5) * 0.45) / n - Math.PI / 2
      const c = Math.cos(th), sn = Math.sin(th)
      pts.push([w / 2 + a * Math.sign(c) * Math.pow(Math.abs(c), e), h / 2 + b * Math.sign(sn) * Math.pow(Math.abs(sn), e)])
    }
    let d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1])
    for (let i = 1; i <= n; i++) {
      const q = pts[i % n], o = pts[i - 1]
      const r = Math.hypot(q[0] - o[0], q[1] - o[1]) * (variant === 0 ? 0.6 : 0.56)
      d += 'A' + r1(r) + ' ' + r1(r) + ' 0 0 1 ' + r1(q[0]) + ' ' + r1(q[1])
    }
    shape = '<path class="tl2-cloud-shape" d="' + d + 'Z" style="fill:' + fill + ';stroke:' + ink + '" stroke-width="2" stroke-linejoin="round"/>'
  }
  const html = '<div class="tl2-cloud" style="width:' + w + 'px;height:' + h + 'px">' +
    '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' + shape + '</svg>' +
    '<div class="tl2-cloud-txt" style="color:' + textColor + ' !important">' + escHtml(t) + '</div></div>'
  return { html, w, h }
}

// cx, cy: مرکز پین داخل جعبه خودش — گره‌ها نسبت به همین نقطه چیده می‌شوند
function renderSatellites(cafe, C, cx, cy) {
  const q = cafe.active_quest
  if (!cafe.motto && !cafe.featured_item_name && !q && !cafe.is_full) return ''
  const seed = seedOf(cafe)
  const ink = C.text
  const rad = Math.PI / 180
  const nodes = []
  let links = ''
  let k = 0
  const place = (baseDeg, spread, dist) => {
    const ang = (baseDeg + (rnd(seed, k * 3) - 0.5) * 2 * spread) * rad
    const dd = dist + (rnd(seed, k * 3 + 1) - 0.5) * 12
    return { x: Math.cos(ang) * dd, y: Math.sin(ang) * dd, d: dd, s: 0.86 + rnd(seed, k * 3 + 2) * 0.4, delay: (k++ * 0.07).toFixed(2) }
  }
  const disc = (cls, attrs, P, icon, bg, label) => {
    links += '<line class="tl2-link" pathLength="1" x1="0" y1="0" x2="' + r1(P.x) + '" y2="' + r1(P.y) + '" stroke="' + ink + '" style="--d:' + P.delay + 's"/>'
    nodes.push('<div class="tl2-node ' + cls + '"' + attrs + ' style="left:' + r1(P.x) + 'px;top:' + r1(P.y) + 'px;--s:' + P.s.toFixed(2) + ';--d:' + P.delay + 's;--b:-' + (rnd(seed, 40 + k) * 3).toFixed(2) + 's">' +
      '<div class="tl2-node-in">' +
        '<div class="tl2-disc" style="background:' + bg + ';color:' + onColor(bg) + ';border-color:' + ink + '">' + icon + '</div>' +
        '<div class="tl2-tag" style="background:' + BUBBLE_BG + ';color:' + BUBBLE_INK + ';border-color:' + BUBBLE_INK + '">' + escHtml(label) + '</div>' +
      '</div></div>')
  }
  if (cafe.motto) {
    const cl = cloudNode(cafe.motto, seed, BUBBLE_BG, BUBBLE_INK, BUBBLE_INK)
    const ang = (-90 + (rnd(seed, 90) - 0.5) * 30) * rad
    const dist = 46 + cl.h / 2 + 12
    const x = Math.cos(ang) * dist, y = Math.sin(ang) * dist
    const delay = (k++ * 0.07).toFixed(2)
    // ردیف دایره‌های ریز «فکر» از پین تا زیر ابر، به‌جای خط
    const from = 24, to = dist - cl.h / 2 - 3
    const steps = [[0.1, 2.2], [0.42, 3.2], [0.8, 4.4]]
    for (let i = 0; i < steps.length; i++) {
      const dd = from + (to - from) * steps[i][0]
      links += '<circle class="tl2-dot" cx="' + r1(Math.cos(ang) * dd) + '" cy="' + r1(Math.sin(ang) * dd) + '" r="' + steps[i][1] + '" stroke-width="1.6" style="fill:' + BUBBLE_BG + ';stroke:' + BUBBLE_INK + ';--d:' + (i * 0.06).toFixed(2) + 's"/>'
    }
    nodes.push('<div class="tl2-node tl2-node-motto" style="left:' + r1(x) + 'px;top:' + r1(y) + 'px;--s:1;--d:' + delay + 's;--b:-' + (rnd(seed, 91) * 3).toFixed(2) + 's"><div class="tl2-node-in">' + cl.html + '</div></div>')
  }
  if (cafe.featured_item_name) disc('tl2-node-item', '', place(-20, 9, 70), itemIcon(cafe.featured_item_name), C.gold, truncate(cafe.featured_item_name, 16))
  if (q) disc('tl2-node-quest', ' data-quest-id="' + escHtml(q.id) + '"', place(-160, 9, 70), escHtml(q.icon || '🎯'), C.accent, truncate(q.title, 16))
  if (cafe.is_full) disc('tl2-node-full', '', place(42, 8, 64), '⛔', C.danger, 'ظرفیت تکمیل')
  return '<div class="tl2-orbit" style="left:' + cx + 'px;top:' + cy + 'px">' +
    '<svg class="tl2-links" width="1" height="1" aria-hidden="true">' + links + '</svg>' + nodes.join('') + '</div>'
}

// art: null = پین فانوسی، 'color' = کافه نقاشی‌شده رنگی، 'ink' = کافه مدادی
export function makePinStyle(C, T, art) {
  const ring = C.card
  const renderArt = (cafe, { color, isChecked, live }) => {
    const ink = art === 'ink'
    const main = isChecked ? C.green : color
    const k = ink
      ? { main: isChecked ? '#cfe8cf' : '#ffffff', wall: '#fbf9f2', line: '#3d3d3d', stripe: '#3d3d3d', glass: '#e9eef2', door: '#d9d6cc' }
      : shapeKeyFor(main)
    const n = live || 0
    const html =
      '<div class="tl2-cafe' + (cafe.is_top ? ' is-top' : '') + '">' +
        renderSatellites(cafe, C, 22, 24) +
        '<div class="tl2-cafe-shadow"></div>' +
        '<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" style="position:relative;display:block;overflow:visible">' + CAFE_SHAPES[iconIndexOf(cafe)](k) + '</svg>' +
        (isChecked ? '<div class="tl2-pin-star" style="left:auto;right:-4px;top:-5px;background:' + C.green + ';color:' + onColor(C.green) + ';border-color:' + ring + '">✓</div>' : '') +
        (cafe.is_top ? '<div class="tl2-pin-star" style="background:' + C.gold + ';color:' + onColor(C.gold) + ';border-color:' + ring + '">★</div>' : '') +
        '<div id="lv-' + cafe.id + '" class="tl2-pin-live" style="top:auto;bottom:-3px;right:-6px;display:' + (n > 0 ? 'flex' : 'none') +
          ';background:' + C.danger + ';color:' + onColor(C.danger) + ';border-color:' + ring + '">' + (n > 0 ? n : '') + '</div>' +
      '</div>'
    return { html, size: [44, 48], anchor: [22, 44] }
  }
  const renderPin = art ? renderArt : (cafe, { color, isChecked, live }) => {
    const base = isChecked ? C.green : color
    const light = mix(base, '#FFFFFF', 0.28)
    const deep = mix(base, '#000000', 0.18)
    const glyph = isChecked ? '✓' : '☕'
    const glyphStyle = isChecked
      ? 'font-size:17px;font-weight:900;color:' + onColor(base)
      : 'font-size:16px'
    const n = live || 0
    const html =
      '<div class="tl2-pin' + (cafe.is_top ? ' is-top' : '') + '">' +
        renderSatellites(cafe, C, 20, 19) +
        '<div class="tl2-pin-shadow"></div>' +
        '<div class="tl2-pin-tail" style="background:' + deep + ';border-color:' + ring + '"></div>' +
        '<div class="tl2-pin-head" style="background:radial-gradient(circle at 32% 26%,' + light + ',' + base + ' 60%,' + deep + ');' +
          'border-color:' + ring + ';box-shadow:0 0 0 4px ' + alpha(base, T.dark ? 0.28 : 0.2) + ',0 8px 18px -4px ' + alpha(base, 0.7) + '">' +
          '<span style="' + glyphStyle + '">' + glyph + '</span>' +
        '</div>' +
        (cafe.is_top ? '<div class="tl2-pin-star" style="background:' + C.gold + ';color:' + onColor(C.gold) + ';border-color:' + ring + '">★</div>' : '') +
        '<div id="lv-' + cafe.id + '" class="tl2-pin-live" style="display:' + (n > 0 ? 'flex' : 'none') +
          ';background:' + C.danger + ';color:' + onColor(C.danger) + ';border-color:' + ring + '">' + (n > 0 ? n : '') + '</div>' +
      '</div>'
    return { html, size: [40, 50], anchor: [20, 48] }
  }

  const clusterIcon = (count) => {
    const size = count < 10 ? 38 : count < 100 ? 46 : 56
    const html =
      '<div class="tl2-cluster" style="width:' + size + 'px;height:' + size + 'px;' +
        'background:' + alpha(C.card, 0.94) + ';color:' + C.text + ';border-color:' + alpha(C.accent, 0.95) + ';' +
        'box-shadow:0 0 0 5px ' + alpha(C.accent, T.dark ? 0.2 : 0.16) + ',0 10px 22px -6px rgba(0,0,0,.5);' +
        'font-size:' + (count < 100 ? 14 : 12) + 'px">' +
        '<span>' + count.toLocaleString('fa') + '</span>' +
      '</div>'
    return { html, size: [size, size] }
  }

  return {
    renderPin,
    clusterIcon,
    pulseColor: C.accent,
    boundaryOn: C.accent,
    boundaryOff: alpha(C.text, 0.45),
  }
}
