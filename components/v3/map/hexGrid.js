// شبکه شش‌ضلعی نسخه v3.0 — «کشف نقشه».
// هر شهر شبکه خودش را دارد که از مرکز همان شهر شروع می‌شود. خانه‌ها شش‌ضلعی نوک‌بالا
// با شعاع 175 متر هستند، یعنی حدود 300 متر از این ضلع تا ضلع روبه‌رو.
// همه چیز حساب ساده است و هیچ کتابخانه‌ای لازم ندارد.
//
// مهم: تابع public.tl_cell_key در پایگاه داده دقیقاً همین حساب را انجام می‌دهد (نسخه شبکه 1).
// سرور کلید هر چک‌این را خودش از مختصات مکان می‌سازد؛ اگر اینجا چیزی عوض شود،
// باید همان تابع هم عوض شود و GRID_VERSION بالا برود. در غیر این صورت سلول‌های کاربر جابه‌جا می‌شوند.
import { CITIES } from '@/lib/constants'

export const GRID_VERSION = 1
export const HEX_RADIUS_M = 175
const SQ3 = Math.sqrt(3)
const M_LAT = 110540          // متر در هر درجه عرض جغرافیایی
const M_LNG = 111320          // متر در هر درجه طول، روی استوا

// همسایه‌ها به ترتیب ضلع‌ها: ضلع i بین گوشه i و i+1 است و رو به همسایه HEX_NEIGHBORS[i]
export const HEX_NEIGHBORS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]

export function makeHexGrid(origin, radius) {
  const R = radius || HEX_RADIUS_M
  const kx = M_LNG * Math.cos(origin.lat * Math.PI / 180)
  const toXY = (lat, lng) => [(lng - origin.lng) * kx, (lat - origin.lat) * M_LAT]
  const toLatLng = (x, y) => [origin.lat + y / M_LAT, origin.lng + x / kx]

  // خانه‌ای که این نقطه در آن است: [q, r]
  function cellOf(lat, lng) {
    const p = toXY(lat, lng)
    const fq = (SQ3 / 3 * p[0] - p[1] / 3) / R, fr = (2 / 3 * p[1]) / R, fs = -fq - fr
    let q = Math.round(fq), r = Math.round(fr)
    const s = Math.round(fs)
    const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs)
    if (dq > dr && dq > ds) q = -r - s
    else if (dr > ds) r = -q - s
    return [q + 0, r + 0]          // + 0 یعنی ‎-0 هم 0 نوشته شود، مثل سرور
  }
  const center = (q, r) => toLatLng(R * SQ3 * (q + r / 2), R * 1.5 * r)
  // شش گوشه خانه به ترتیب، برای رسم. گوشه i در زاویه 60i-30 درجه
  function corners(q, r) {
    const cx = R * SQ3 * (q + r / 2), cy = R * 1.5 * r
    const out = []
    for (let i = 0; i < 6; i++) {
      const a = (60 * i - 30) * Math.PI / 180
      out.push(toLatLng(cx + R * Math.cos(a), cy + R * Math.sin(a)))
    }
    return out
  }
  return { cellOf, center, corners }
}

export const hexKey = (q, r) => q + ':' + r
export const hexFromKey = (k) => k.split(':').map(Number)

// ── کلید کامل با نام شهر، همان قالب سرور: «tehran:9:-9» ─────────────────────
const CITY_LIST = Object.keys(CITIES).map(k => ({ k, lat: CITIES[k].lat, lng: CITIES[k].lng }))
const GRIDS = {}
const gridOf = (city) => GRIDS[city] || (GRIDS[city] = makeHexGrid(CITIES[city] || CITIES.tehran))

// نزدیک‌ترین مرکز شهر، با همان معیار تابع سرور
export function nearestCity(lat, lng) {
  let best = CITY_LIST[0].k, bd = Infinity
  const c = Math.cos(lat * Math.PI / 180)
  for (const o of CITY_LIST) {
    const d = Math.pow(o.lat - lat, 2) + Math.pow((o.lng - lng) * c, 2)
    if (d < bd) { bd = d; best = o.k }
  }
  return best
}

export function cellKeyOf(lat, lng) {
  const city = nearestCity(lat, lng)
  const [q, r] = gridOf(city).cellOf(lat, lng)
  return city + ':' + q + ':' + r
}

export function parseCellKey(k) {
  const p = String(k).split(':')
  return { city: p[0], q: Number(p[1]), r: Number(p[2]) }
}

export function cellCorners(k) { const c = parseCellKey(k); return gridOf(c.city).corners(c.q, c.r) }
export function cellCenter(k) { const c = parseCellKey(k); return gridOf(c.city).center(c.q, c.r) }
export function neighborKey(k, i) { const c = parseCellKey(k); const n = HEX_NEIGHBORS[i]; return c.city + ':' + (c.q + n[0]) + ':' + (c.r + n[1]) }
export function neighborKeys(k) { return [0, 1, 2, 3, 4, 5].map(i => neighborKey(k, i)) }

// فاصله تقریبی دو خانه به متر، از مرکزهایشان
export function cellDistanceM(a, b) {
  const pa = cellCenter(a), pb = cellCenter(b)
  const dy = (pa[0] - pb[0]) * M_LAT, dx = (pa[1] - pb[1]) * M_LNG * Math.cos(pa[0] * Math.PI / 180)
  return Math.sqrt(dx * dx + dy * dy)
}
