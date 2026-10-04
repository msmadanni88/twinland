// شبکه شش‌ضلعی نسخه v3.0 — «کشف نقشه».
// هر شهر شبکه خودش را دارد که از مرکز همان شهر شروع می‌شود. خانه‌ها شش‌ضلعی نوک‌بالا
// با شعاع 175 متر هستند، یعنی حدود 300 متر از این ضلع تا ضلع روبه‌رو.
// همه چیز حساب ساده است و هیچ کتابخانه‌ای لازم ندارد.
export const HEX_RADIUS_M = 175
const SQ3 = Math.sqrt(3)
const M_LAT = 110540          // متر در هر درجه عرض جغرافیایی
const M_LNG = 111320          // متر در هر درجه طول، روی استوا

export const HEX_NEIGHBORS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]

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
    return [q, r]
  }
  const center = (q, r) => toLatLng(R * SQ3 * (q + r / 2), R * 1.5 * r)
  // شش گوشه خانه به ترتیب، برای رسم
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
