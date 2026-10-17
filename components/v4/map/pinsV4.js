// نشانگر کافه نسخه v4.0: یک دایره کوچک همیشه سبز با فنجان خطی سفید و یک ساقه نازک.
// رنگ نشانگر به نام کافه بستگی ندارد؛ همه یک سبز ثابت‌اند، همان سبز «آنلاین» و تیک.
// منظومه دور پین (شعار، آیتم ویژه، کمپین) همان جزء مشترک v2 است، با زمینه‌های بی‌رنگ.
import { renderSatellites } from '@/components/v2/map/pins'
import { V4_COLOR } from '@/components/v4/theme'
import { iconSvg } from '@/components/v4/icons'

export function makePinStyleV4(C, T) {
  const green = V4_COLOR.pin
  const ring = T.dark ? '#0B0B0C' : '#FFFFFF'
  const cup = iconSvg('coffee', 15, '#FFFFFF', 2.1)
  const tick = iconSvg('check', 10, green, 3.2)
  // زمینه دایره‌های منظومه بی‌رنگ؛ فقط خط دور و متن
  const Cm = { ...C, gold: C.card, danger: C.card, accent: C.accent }

  const renderFull = (cafe, { isChecked, live }) => {
    const n = live || 0
    const html =
      '<div class="tl2-pin tl4-pin' + (cafe.is_top ? ' is-top' : '') + '">' +
        renderSatellites(cafe, Cm, 15, 15) +
        '<div class="tl4-pin-dot"></div>' +
        '<div class="tl4-pin-tail" style="background:' + green + '"></div>' +
        '<div class="tl4-pin-head" style="background:' + green + ';border-color:' + ring + ';box-shadow:0 0 0 3px rgba(52,199,89,.18),0 6px 14px -4px rgba(0,0,0,.45)">' + cup + '</div>' +
        (isChecked ? '<div class="tl4-pin-badge" style="right:-4px;top:-4px;background:#FFFFFF;border-color:' + green + '">' + tick + '</div>' : '') +
        (cafe.is_top && !isChecked ? '<div class="tl4-pin-badge" style="right:-4px;top:-4px;background:' + C.accent + ';color:' + T.onAccent + ';border-color:' + ring + '">★</div>' : '') +
        '<div id="lv-' + cafe.id + '" class="tl4-pin-badge" style="left:-6px;top:-4px;display:' + (n > 0 ? 'flex' : 'none') +
          ';background:' + C.accent + ';color:' + T.onAccent + ';border-color:' + ring + '">' + (n > 0 ? n : '') + '</div>' +
      '</div>'
    return { html, size: [30, 38], anchor: [15, 36] }
  }

  // مکان‌های کم‌اهمیت‌تر: نقطه سبز کوچک. جایی که چک‌این شده همیشه نشانگر کامل است.
  const renderPin = (cafe, o) => {
    if (cafe.tier !== 'minor' || o.isChecked) return renderFull(cafe, o)
    const n = o.live || 0
    const html = '<div class="tl4-minor" style="background:' + green + ';border-color:' + ring + ';position:relative">' +
      '<div id="lv-' + cafe.id + '" class="tl4-pin-badge" style="top:-10px;left:-10px;transform:scale(.85);display:' + (n > 0 ? 'flex' : 'none') +
      ';background:' + C.accent + ';color:' + T.onAccent + ';border-color:' + ring + '">' + (n > 0 ? n : '') + '</div></div>'
    return { html, size: [11, 11], anchor: [5.5, 5.5] }
  }

  const clusterIcon = (count) => {
    const size = count < 10 ? 34 : count < 100 ? 40 : 48
    const html =
      '<div class="tl4-cluster" style="width:' + size + 'px;height:' + size + 'px;background:' + T.glassStrong + ';color:' + C.text + ';border-color:' + green + ';' +
        'box-shadow:0 0 0 4px rgba(52,199,89,.16),0 8px 18px -6px rgba(0,0,0,.45);font-size:' + (count < 100 ? 13 : 11.5) + 'px">' +
        '<span>' + count.toLocaleString('fa') + '</span></div>'
    return { html, size: [size, size] }
  }

  return {
    renderPin,
    clusterIcon,
    pulseColor: green,
    boundaryOn: C.accent,
    boundaryOff: T.dark ? 'rgba(244,244,245,.38)' : 'rgba(10,10,10,.34)',
  }
}
