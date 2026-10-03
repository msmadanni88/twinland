// پوسته‌های نقشه — نسخه v2.0
// هر پوسته همان داده واقعی OpenStreetMap را با شکل و رنگ خودش می‌کشد؛ جای خیابان‌ها و کافه‌ها عوض نمی‌شود.
// داده از /api/mapkit می‌آید (vector tiles با طرح OpenMapTiles) و MapLibre GL در مرورگر رسمش می‌کند.
// برای افزودن پوسته تازه: یک ورودی به SKINS و یک پالت به PALETTES اضافه شود.

export const SKINS = [
  { id: 'parchment', label: 'پوستی قدیمی', hint: 'نقشه گنج روی کاغذ کهنه', dark: false, swatch: ['#e6d6ad', '#8a5a2b', '#a9c2b4', '#bdc189'] },
  { id: 'ember', label: 'شب فانوس', hint: 'شهر تاریک با نور گرم کافه‌ها', dark: true, swatch: ['#26343a', '#ffae4a', '#18242b', '#34473f'] },
]
export const DEFAULT_SKIN = 'parchment'
export const SKIN_STORAGE_KEY = 'tl_map_skin'
export const SKIN_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

export function isKnownSkin(id) { return SKINS.some(s => s.id === id) }
export function skinInfo(id) { return SKINS.find(s => s.id === id) || SKINS[0] }

const PALETTES = {
  parchment: {
    paper: '#e6d6ad', paperTex: 0.5,
    land: '#dfcda0', wood: '#bdc189', grass: '#d0cd97', park: '#c6c88e', sand: '#e3cf98', rock: '#cdb98a', ice: '#efe8d2',
    treeOpacity: 0.9,
    water: '#a9c2b4', waterLine: '#6f8f86', waterway: '#7fa197',
    building: '#d6c18d', buildingLine: '#9c8052',
    roadCase: '#5e3d1f', motorway: '#a5642c', major: '#b98447', minor: '#c9ad78', path: '#8a6a42', rail: '#5b3a1e',
    boundary: '#93452d', aero: '#d2bf90',
    label: '#4a2f17', labelSoft: '#6d4f2c', halo: '#eee1bd', waterLabel: '#46675f',
    glow: null,
  },
  ember: {
    paper: '#26343a', paperTex: 0.35,
    land: '#293940', wood: '#2c4038', grass: '#2d3f3b', park: '#2f463c', sand: '#34403f', rock: '#303b3f', ice: '#3a474c',
    treeOpacity: 0.85,
    water: '#18242b', waterLine: '#0f181d', waterway: '#1b2a32',
    building: '#33434a', buildingLine: 'rgba(15,23,27,0.45)',
    roadCase: '#141d22', motorway: '#6b5a44', major: '#4e5553', minor: '#3c4a4f', path: '#51606a', rail: '#0f171b',
    boundary: '#c08a52', aero: '#2e3c42',
    label: '#e3d2ad', labelSoft: '#b9ab8c', halo: '#141d22', waterLabel: '#7d97a3',
    glow: { color: '#ffa63d', core: '#ffe2ad' },
  },
}

const FONT = ['Noto Sans Regular']
const FONT_BOLD = ['Noto Sans Bold']
const FONT_ITALIC = ['Noto Sans Italic']
const NAME = ['coalesce', ['get', 'name'], ['get', 'name:latin'], '']
const zoomed = (stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops]
const classIn = (...list) => ['match', ['coalesce', ['get', 'class'], ''], list, true, false]
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel']

function layers(id) {
  const P = PALETTES[id]
  const img = (name) => 'tl:' + id + ':' + name
  const L = []
  const add = (o) => L.push({ source: 'omt', ...o })

  L.push({ id: 'paper', type: 'background', paint: { 'background-color': P.paper } })

  // زمین
  add({ id: 'landuse-soft', 'source-layer': 'landuse', type: 'fill', filter: classIn('residential', 'suburb', 'neighbourhood', 'commercial', 'industrial', 'retail'), paint: { 'fill-color': P.land, 'fill-opacity': 0.75 } })
  add({ id: 'cover-grass', 'source-layer': 'landcover', type: 'fill', filter: classIn('grass', 'farmland', 'wetland'), paint: { 'fill-color': P.grass, 'fill-opacity': 0.9 } })
  add({ id: 'cover-sand', 'source-layer': 'landcover', type: 'fill', filter: classIn('sand'), paint: { 'fill-color': P.sand } })
  add({ id: 'cover-rock', 'source-layer': 'landcover', type: 'fill', filter: classIn('rock'), paint: { 'fill-color': P.rock } })
  add({ id: 'cover-rock-tex', 'source-layer': 'landcover', type: 'fill', filter: classIn('rock'), paint: { 'fill-pattern': img('rocks'), 'fill-opacity': 0.8 } })
  add({ id: 'cover-ice', 'source-layer': 'landcover', type: 'fill', filter: classIn('ice'), paint: { 'fill-color': P.ice } })
  add({ id: 'cover-wood', 'source-layer': 'landcover', type: 'fill', filter: classIn('wood'), paint: { 'fill-color': P.wood } })
  add({ id: 'park', 'source-layer': 'park', type: 'fill', paint: { 'fill-color': P.park, 'fill-opacity': 0.9 } })
  add({ id: 'landuse-green', 'source-layer': 'landuse', type: 'fill', filter: classIn('cemetery', 'pitch', 'playground', 'stadium', 'garden', 'park'), paint: { 'fill-color': P.park, 'fill-opacity': 0.9 } })
  // درخت‌های کوچک روی جنگل و پارک
  add({ id: 'cover-wood-trees', 'source-layer': 'landcover', type: 'fill', filter: classIn('wood'), paint: { 'fill-pattern': img('trees'), 'fill-opacity': P.treeOpacity } })
  add({ id: 'park-trees', 'source-layer': 'park', type: 'fill', minzoom: 11, paint: { 'fill-pattern': img('trees'), 'fill-opacity': P.treeOpacity * 0.85 } })

  // بافت کاغذ روی زمین، زیر آب و راه‌ها
  L.push({ id: 'paper-tex', type: 'background', paint: { 'background-pattern': img('paper'), 'background-opacity': P.paperTex } })

  // آب با خط‌های ساحلی تو در تو
  add({ id: 'water', 'source-layer': 'water', type: 'fill', paint: { 'fill-color': P.water } })
  add({ id: 'water-tex', 'source-layer': 'water', type: 'fill', paint: { 'fill-pattern': img('waves'), 'fill-opacity': 0.7 } })
  add({ id: 'water-shore-3', 'source-layer': 'water', type: 'line', minzoom: 11, paint: { 'line-color': P.waterLine, 'line-opacity': 0.22, 'line-width': 1, 'line-offset': 11 } })
  add({ id: 'water-shore-2', 'source-layer': 'water', type: 'line', minzoom: 9, paint: { 'line-color': P.waterLine, 'line-opacity': 0.4, 'line-width': 1, 'line-offset': 6 } })
  add({ id: 'water-shore-1', 'source-layer': 'water', type: 'line', paint: { 'line-color': P.waterLine, 'line-opacity': 0.9, 'line-width': 1.4 } })
  add({ id: 'waterway', 'source-layer': 'waterway', type: 'line', filter: notTunnel, layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': P.waterway, 'line-width': zoomed([8, 0.6, 13, 1.6, 17, 5]) } })

  add({ id: 'aeroway-area', 'source-layer': 'aeroway', type: 'fill', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': P.aero, 'fill-opacity': 0.8 } })
  add({ id: 'aeroway-line', 'source-layer': 'aeroway', type: 'line', filter: ['==', ['geometry-type'], 'LineString'], minzoom: 11,
    paint: { 'line-color': P.aero, 'line-width': zoomed([11, 1.5, 15, 14]) } })

  // ساختمان‌ها
  add({ id: 'building', 'source-layer': 'building', type: 'fill', minzoom: 13,
    paint: { 'fill-color': P.building, 'fill-outline-color': P.buildingLine, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.9] } })

  // راه‌ها: اول دور، بعد رو
  const road = [
    ['minor', classIn('minor', 'service', 'tertiary'), 12, P.minor, [12, 0.5, 14, 2, 17, 9, 19, 22]],
    ['major', classIn('primary', 'secondary'), 9, P.major, [9, 0.6, 12, 1.8, 14, 4, 17, 13, 19, 30]],
    ['motorway', classIn('motorway', 'trunk'), 6, P.motorway, [6, 0.7, 10, 1.8, 13, 4, 15, 7, 17, 16, 19, 34]],
  ]
  add({ id: 'road-path', 'source-layer': 'transportation', type: 'line', minzoom: 14, filter: ['all', classIn('path', 'track'), notTunnel],
    layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': P.path, 'line-width': zoomed([14, 0.7, 18, 2.2]), 'line-dasharray': [2, 2] } })
  for (const [name, f, minzoom, , w] of road) {
    add({ id: 'road-case-' + name, 'source-layer': 'transportation', type: 'line', minzoom, filter: ['all', f, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.roadCase, 'line-opacity': name === 'minor' ? 0.55 : 0.85, 'line-width': zoomed(w), 'line-blur': 0.3 } })
  }
  for (const [name, f, minzoom, color, w] of road) {
    const inner = w.map((v, i) => (i % 2 ? Math.max(0.3, v - (name === 'minor' ? 1 : 1.6)) : v))
    add({ id: 'road-' + name, 'source-layer': 'transportation', type: 'line', minzoom, filter: ['all', f, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': zoomed(inner) } })
  }
  add({ id: 'rail', 'source-layer': 'transportation', type: 'line', minzoom: 10, filter: ['all', classIn('rail', 'transit'), notTunnel],
    paint: { 'line-color': P.rail, 'line-width': zoomed([10, 0.6, 15, 1.6]), 'line-dasharray': [4, 3] } })

  add({ id: 'boundary', 'source-layer': 'boundary', type: 'line', filter: ['all', ['<=', ['coalesce', ['get', 'admin_level'], 99], 4], ['!=', ['get', 'maritime'], 1]],
    layout: { 'line-join': 'round' }, paint: { 'line-color': P.boundary, 'line-opacity': 0.7, 'line-width': zoomed([3, 0.8, 10, 2]), 'line-dasharray': [3, 2, 1, 2] } })

  // نور گرم دور کافه‌ها — فقط پوسته شب
  if (P.glow) {
    const lit = ['>', ['coalesce', ['get', 'live'], 0], 0]
    L.push({ id: 'cafe-glow', type: 'circle', source: 'cafes', paint: {
      'circle-color': P.glow.color, 'circle-blur': 1,
      'circle-radius': zoomed([9, 6, 12, 22, 15, 60, 18, 150]),
      'circle-opacity': ['case', lit, 0.55, 0.3] } })
    L.push({ id: 'cafe-glow-core', type: 'circle', source: 'cafes', minzoom: 11, paint: {
      'circle-color': P.glow.core, 'circle-blur': 1,
      'circle-radius': zoomed([11, 3, 15, 16, 18, 44]),
      'circle-opacity': ['case', lit, 0.5, 0.22] } })
  }

  // نوشته‌ها
  const text = (size, _color, font) => ({ 'text-field': NAME, 'text-font': font || FONT, 'text-size': size, 'text-max-width': 8 })
  const ink = (color) => ({ 'text-color': color, 'text-halo-color': P.halo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 })
  add({ id: 'label-water', 'source-layer': 'water_name', type: 'symbol', layout: { ...text(12, P.waterLabel, FONT_ITALIC), 'text-letter-spacing': 0.1 }, paint: ink(P.waterLabel) })
  add({ id: 'label-road', 'source-layer': 'transportation_name', type: 'symbol', minzoom: 13.5,
    filter: classIn('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 13, 10, 18, 14]), 'symbol-placement': 'line', 'symbol-spacing': 320, 'text-rotation-alignment': 'map' }, paint: ink(P.labelSoft) })
  add({ id: 'label-peak', 'source-layer': 'mountain_peak', type: 'symbol', minzoom: 9,
    layout: { ...text(11, P.labelSoft, FONT_ITALIC), 'icon-image': img('peak'), 'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 14, 1.15],
      'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-optional': true, 'icon-allow-overlap': false }, paint: ink(P.labelSoft) })
  add({ id: 'label-hood', 'source-layer': 'place', type: 'symbol', minzoom: 11.5, filter: classIn('suburb', 'quarter', 'neighbourhood'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 11, 10, 15, 14]), 'text-letter-spacing': 0.06 }, paint: ink(P.labelSoft) })
  add({ id: 'label-town', 'source-layer': 'place', type: 'symbol', minzoom: 7, filter: classIn('town', 'village'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 7, 10, 13, 15]) }, paint: ink(P.label) })
  add({ id: 'label-city', 'source-layer': 'place', type: 'symbol', filter: classIn('city'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 4, 12, 10, 19, 14, 26], P.label, FONT_BOLD), 'text-letter-spacing': 0.08 }, paint: { ...ink(P.label), 'text-halo-width': 2 } })
  return L
}

// کافه‌ها به شکل نقطه برای لایه نور — جای واقعی هر کافه
export function cafeFeatures(cafes, live) {
  const features = []
  for (const c of cafes || []) {
    const lat = Number(c.lat), lng = Number(c.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { live: (live && live[c.id]) || 0 } })
  }
  return { type: 'FeatureCollection', features }
}

export function buildSkinStyle(id, origin, cafeData) {
  const skin = isKnownSkin(id) ? id : DEFAULT_SKIN
  return {
    version: 8,
    name: 'twinland-' + skin,
    glyphs: origin + '/api/mapkit/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', tiles: [origin + '/api/mapkit/tiles/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14 },
      cafes: { type: 'geojson', data: cafeData || { type: 'FeatureCollection', features: [] } },
    },
    layers: layers(skin),
  }
}

// ─── تصویرهای پوسته: همه با canvas ساخته می‌شوند، هیچ فایل تصویری لازم نیست ───
// نام تصویر: tl:<پوسته>:<نوع>
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }

function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  return [c, c.getContext('2d')]
}
const out = (c, ctx) => { const d = ctx.getImageData(0, 0, c.width, c.height); return { width: c.width, height: c.height, data: d.data } }

function drawTree(ctx, x, y, r, fill, line) {
  ctx.lineWidth = 1.6; ctx.strokeStyle = line; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.7); ctx.lineTo(x, y + r * 1.5); ctx.stroke()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x - r * 0.45, y + r * 0.2, r * 0.62, 0, Math.PI * 2)
  ctx.arc(x + r * 0.45, y + r * 0.2, r * 0.62, 0, Math.PI * 2)
  ctx.arc(x, y - r * 0.35, r * 0.72, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath(); ctx.arc(x - r * 0.45, y + r * 0.2, r * 0.62, Math.PI * 0.35, Math.PI * 1.25); ctx.stroke()
  ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.2, r * 0.62, -Math.PI * 0.25, Math.PI * 0.65); ctx.stroke()
  ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.72, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke()
}

const ART = {
  parchment: { speck: 'rgba(92,58,24,', fiber: 'rgba(120,84,40,', tree: '#9aa565', treeLine: '#5b4a24', peak: '#cdb98a', peakLine: '#5e3d1f', peakShade: '#a68d5c', wave: 'rgba(79,112,104,0.55)', rock: 'rgba(94,61,31,0.4)' },
  ember: { speck: 'rgba(0,0,0,', fiber: 'rgba(160,190,200,', tree: '#3b5245', treeLine: '#101a17', peak: '#46555c', peakLine: '#0f171b', peakShade: '#2a363c', wave: 'rgba(120,150,165,0.28)', rock: 'rgba(10,16,19,0.5)' },
}

export function skinImage(name) {
  if (typeof document === 'undefined' || typeof name !== 'string') return null
  const parts = name.split(':')
  if (parts.length !== 3 || parts[0] !== 'tl' || !ART[parts[1]]) return null
  const A = ART[parts[1]], kind = parts[2]

  if (kind === 'paper') {
    const [c, ctx] = canvas(256, 256); const r = rng(11)
    for (let i = 0; i < 900; i++) { ctx.fillStyle = A.speck + (0.05 + r() * 0.16) + ')'; ctx.fillRect(r() * 256, r() * 256, 1 + r() * 1.6, 1 + r() * 1.6) }
    for (let i = 0; i < 46; i++) {
      const x = r() * 256, y = r() * 256, len = 10 + r() * 26, a = r() * Math.PI
      ctx.strokeStyle = A.fiber + (0.06 + r() * 0.1) + ')'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 3, y + Math.sin(a) * len * 0.5 - 3, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
    }
    for (let i = 0; i < 9; i++) {
      const x = r() * 256, y = r() * 256, rad = 14 + r() * 30
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, A.speck + '0.07)'); g.addColorStop(1, A.speck + '0)')
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    return out(c, ctx)
  }
  if (kind === 'trees') {
    const [c, ctx] = canvas(128, 128)
    ;[[26, 28, 11], [86, 20, 9], [58, 66, 12], [108, 78, 10], [22, 96, 10], [78, 106, 9]].forEach(([x, y, r]) => drawTree(ctx, x, y, r, A.tree, A.treeLine))
    return out(c, ctx)
  }
  if (kind === 'waves') {
    const [c, ctx] = canvas(128, 128)
    ctx.strokeStyle = A.wave; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
    ;[[18, 26], [78, 50], [34, 86], [96, 108]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 6, x + 10, y); ctx.quadraticCurveTo(x + 15, y + 6, x + 20, y); ctx.stroke()
    })
    return out(c, ctx)
  }
  if (kind === 'rocks') {
    const [c, ctx] = canvas(128, 128)
    ctx.strokeStyle = A.rock; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'
    ;[[20, 40], [74, 28], [46, 88], [104, 96]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x - 9, y + 6); ctx.lineTo(x, y - 8); ctx.lineTo(x + 9, y + 6); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 2, y + 1); ctx.stroke()
    })
    return out(c, ctx)
  }
  if (kind === 'peak') {
    const [c, ctx] = canvas(72, 56)
    ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = A.peakLine
    const tri = (x0, y0, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath() }
    tri(34, 50, 52, 20, 70, 50); ctx.fillStyle = A.peakShade; ctx.fill(); ctx.stroke()
    tri(4, 50, 28, 6, 52, 50); ctx.fillStyle = A.peak; ctx.fill(); ctx.stroke()
    ctx.fillStyle = A.peakShade; tri(28, 6, 52, 50, 32, 50); ctx.fill()
    ctx.strokeStyle = A.peakLine; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(28, 6); ctx.lineTo(31, 30); ctx.lineTo(27, 38); ctx.stroke()
    tri(4, 50, 28, 6, 52, 50); ctx.lineWidth = 2.4; ctx.stroke()
    return out(c, ctx)
  }
  return null
}
