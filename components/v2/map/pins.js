// پین و خوشه نسخه v2.0 «فانوس»: هر کافه مثل یک فانوس کوچک روی نقشه آرام می‌درخشد.
// خروجی به useCafeMap داده می‌شود (pinStyle) و منطق نقشه دست نمی‌خورد.
import { onColor } from '@/lib/theme/ui'
import { alpha, mix } from '@/components/v2/theme'

// مجموعه کافه‌های نقاشی‌شده: شش شکل ساختمان کوچک که هر کافه همیشه یکی از آن‌ها را می‌گیرد.
// رنگ سایبان همان رنگ ثابت کافه است. حالت ink همان شکل‌ها را تک‌رنگ و مدادی می‌کشد.
const CAFE_SHAPES = [
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
]

function shapeOf(cafe) {
  const s = String(cafe.id == null ? cafe.name || '' : cafe.id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % CAFE_SHAPES.length
}

// art: null = پین فانوسی، 'color' = کافه نقاشی‌شده رنگی، 'ink' = کافه مدادی
export function makePinStyle(C, T, art) {
  const ring = C.card
  const renderArt = (cafe, { color, isChecked, live }) => {
    const ink = art === 'ink'
    const main = isChecked ? C.green : color
    const k = ink
      ? { main: isChecked ? '#cfe8cf' : '#ffffff', wall: '#fbf9f2', line: '#3d3d3d', stripe: '#3d3d3d', glass: '#e9eef2', door: '#d9d6cc' }
      : { main, wall: '#fff6e0', line: mix(main, '#000000', 0.55), stripe: '#ffffff', glass: '#bfe9ff', door: mix(main, '#000000', 0.25) }
    const n = live || 0
    const html =
      '<div class="tl2-cafe' + (cafe.is_top ? ' is-top' : '') + '">' +
        '<div class="tl2-cafe-shadow"></div>' +
        '<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" style="position:relative;display:block;overflow:visible">' + CAFE_SHAPES[shapeOf(cafe)](k) + '</svg>' +
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
