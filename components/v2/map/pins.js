// پین و خوشه نسخه v2.0 «فانوس»: هر کافه مثل یک فانوس کوچک روی نقشه آرام می‌درخشد.
// خروجی به useCafeMap داده می‌شود (pinStyle) و منطق نقشه دست نمی‌خورد.
import { onColor } from '@/lib/theme/ui'
import { alpha, mix } from '@/components/v2/theme'

export function makePinStyle(C, T) {
  const ring = C.card
  const renderPin = (cafe, { color, isChecked, live }) => {
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
