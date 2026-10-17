// پوسته‌های نقشه نسخه v4.0
// پوسته پیش‌فرض «مینیمال» است: بی‌رنگ، هم‌رنگ حالت روشن یا خیلی تیره سایت، همه برداری و تیز.
// پوسته‌های هنری v2 هم برای کسی که بخواهد سر جایشان هستند، و نقشه عکسی فقط پشتیبان است.
// همه نوشته‌های نقشه در لایه‌های symbol جدا هستند و با یک کلید پنهان یا دیده می‌شوند؛ پیش‌فرض بدون نوشته.
import { SKINS as V2_SKINS, buildSkinStyle as buildV2Style, cafeFeatures } from '@/components/v2/map/skins'

export const MINI = 'mini'
export const SKINS_V4 = [
  { id: MINI, kind: 'vector', label: 'مینیمال', hint: 'بی‌رنگ، هم‌رنگ حالت روشن و تیره', swatch: ['#F2F2F3', '#FFFFFF', '#0D0D0F', '#2A2A2F'] },
  ...V2_SKINS.filter(s => s.kind === 'vector'),
  { id: 'plain', kind: 'raster', label: 'عکسی', hint: 'نقشه عکسی OpenStreetMap، بی‌رنگ', swatch: ['#e6e6e6', '#ffffff', '#cfcfcf', '#bdbdbd'] },
]
export const DEFAULT_SKIN_V4 = MINI
export const SKIN_KEY_V4 = 'tl_map_skin_v4'
export const LABELS_KEY_V4 = 'tl_map_labels_v4'

export function isKnownSkinV4(id) { return SKINS_V4.some(s => s.id === id) }
export function skinInfoV4(id) { return SKINS_V4.find(s => s.id === id) || SKINS_V4[0] }
export function isVectorSkinV4(id) { return skinInfoV4(id).kind === 'vector' }

// رنگ‌های پوسته مینیمال
const MINI_P = {
  light: {
    bg: '#F2F2F3', land: '#EEEEEF', park: '#E5E7E5', water: '#D8DBE0', waterLine: '#C9CDD3',
    building: '#E6E6E8', buildingLine: '#DADADD',
    roadCase: '#DEDEE1', minor: '#FFFFFF', major: '#FFFFFF', motorway: '#FFFFFF', motorwayCase: '#CFCFD4', path: '#D3D3D7', rail: '#C4C4C9',
    boundary: '#A9A9B0', label: '#55555C', labelSoft: '#7A7A82', halo: '#F2F2F3', waterLabel: '#7D828A',
  },
  dark: {
    bg: '#0D0D0F', land: '#101012', park: '#121413', water: '#060607', waterLine: '#1A1B1F',
    building: '#17171A', buildingLine: '#1F1F23',
    roadCase: '#0D0D0F', minor: '#1D1D21', major: '#2A2A2F', motorway: '#38383E', motorwayCase: '#0D0D0F', path: '#232327', rail: '#2C2C31',
    boundary: '#4A4A52', label: '#A6A6AE', labelSoft: '#7C7C85', halo: '#0D0D0F', waterLabel: '#6E7480',
  },
}

const FONT = ['Noto Sans Regular']
const FONT_BOLD = ['Noto Sans Bold']
const NAME = ['coalesce', ['get', 'name'], ['get', 'name:latin'], '']
const CLS = ['coalesce', ['get', 'class'], '']
const zoomed = (stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops]
const classIn = (...list) => ['match', CLS, list, true, false]
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel']

function miniLayers(mode) {
  const P = MINI_P[mode === 'light' ? 'light' : 'dark']
  const L = []
  const add = (o) => L.push({ source: 'omt', ...o })
  L.push({ id: 'bg', type: 'background', paint: { 'background-color': P.bg } })
  add({ id: 'landuse', 'source-layer': 'landuse', type: 'fill', filter: classIn('residential', 'suburb', 'neighbourhood', 'commercial', 'industrial', 'retail'), paint: { 'fill-color': P.land } })
  add({ id: 'park', 'source-layer': 'park', type: 'fill', paint: { 'fill-color': P.park } })
  add({ id: 'green', 'source-layer': 'landcover', type: 'fill', filter: classIn('wood', 'grass', 'farmland'), paint: { 'fill-color': P.park, 'fill-opacity': 0.8 } })
  add({ id: 'landuse-green', 'source-layer': 'landuse', type: 'fill', filter: classIn('cemetery', 'pitch', 'playground', 'stadium', 'garden', 'park'), paint: { 'fill-color': P.park } })
  add({ id: 'water', 'source-layer': 'water', type: 'fill', paint: { 'fill-color': P.water } })
  add({ id: 'waterway', 'source-layer': 'waterway', type: 'line', filter: notTunnel, layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': P.waterLine, 'line-width': zoomed([8, 0.5, 13, 1.2, 17, 4]) } })
  add({ id: 'aeroway', 'source-layer': 'aeroway', type: 'fill', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': P.land } })
  add({ id: 'building', 'source-layer': 'building', type: 'fill', minzoom: 13.5,
    paint: { 'fill-color': P.building, 'fill-outline-color': P.buildingLine, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15, 1] } })

  // راه‌ها: دور کمرنگ و روی سفید در حالت روشن؛ خاکستری‌های پله‌ای در حالت تیره
  const road = [
    ['minor', classIn('minor', 'service', 'tertiary'), 12, P.minor, P.roadCase, [12, 0.4, 14, 1.6, 17, 8, 19, 20]],
    ['major', classIn('primary', 'secondary'), 8, P.major, P.roadCase, [8, 0.5, 12, 1.5, 14, 3.4, 17, 12, 19, 26]],
    ['motorway', classIn('motorway', 'trunk'), 6, P.motorway, P.motorwayCase, [6, 0.6, 10, 1.5, 13, 3.4, 15, 6.5, 17, 15, 19, 32]],
  ]
  add({ id: 'path', 'source-layer': 'transportation', type: 'line', minzoom: 14.5, filter: ['all', classIn('path', 'track'), notTunnel],
    layout: { 'line-cap': 'round' }, paint: { 'line-color': P.path, 'line-width': zoomed([14.5, 0.6, 18, 1.8]), 'line-dasharray': [2, 2] } })
  if (mode === 'light') {
    for (const [name, f, minzoom, , cas, w] of road) {
      add({ id: 'case-' + name, 'source-layer': 'transportation', type: 'line', minzoom: Math.max(minzoom, 10), filter: ['all', f, notTunnel],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': cas, 'line-width': zoomed(w.map((v, i) => (i % 2 ? v + 1.4 : v))) } })
    }
  }
  for (const [name, f, minzoom, color, , w] of road) {
    add({ id: 'road-' + name, 'source-layer': 'transportation', type: 'line', minzoom, filter: ['all', f, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': zoomed(w) } })
  }
  add({ id: 'rail', 'source-layer': 'transportation', type: 'line', minzoom: 11, filter: ['all', classIn('rail', 'transit'), notTunnel],
    paint: { 'line-color': P.rail, 'line-width': zoomed([11, 0.5, 16, 1.4]), 'line-dasharray': [3, 3] } })
  add({ id: 'boundary', 'source-layer': 'boundary', type: 'line', filter: ['all', ['<=', ['coalesce', ['get', 'admin_level'], 99], 4], ['!=', ['get', 'maritime'], 1]],
    paint: { 'line-color': P.boundary, 'line-opacity': 0.6, 'line-width': zoomed([3, 0.6, 10, 1.4]), 'line-dasharray': [3, 2] } })

  // نوشته‌ها — همه symbol و جدا از بقیه؛ کلید «نوشته‌های نقشه» همین‌ها را پنهان یا دیده می‌کند
  const text = (size, font) => ({ 'text-field': NAME, 'text-font': font || FONT, 'text-size': size, 'text-max-width': 8 })
  const ink = (color) => ({ 'text-color': color, 'text-halo-color': P.halo, 'text-halo-width': 1.5, 'text-halo-blur': 0.3 })
  add({ id: 'lbl-water', 'source-layer': 'water_name', type: 'symbol', layout: { ...text(11.5) }, paint: ink(P.waterLabel) })
  add({ id: 'lbl-road', 'source-layer': 'transportation_name', type: 'symbol', minzoom: 13.5,
    filter: classIn('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 13, 9.5, 18, 13]), 'symbol-placement': 'line', 'symbol-spacing': 340, 'text-rotation-alignment': 'map' }, paint: ink(P.labelSoft) })
  add({ id: 'lbl-poi', 'source-layer': 'poi', type: 'symbol', minzoom: 15, filter: ['<=', ['coalesce', ['get', 'rank'], 99], 20],
    layout: { ...text(10), 'symbol-sort-key': ['coalesce', ['get', 'rank'], 99], 'text-max-width': 7 }, paint: ink(P.labelSoft) })
  add({ id: 'lbl-hood', 'source-layer': 'place', type: 'symbol', minzoom: 11.5, filter: classIn('suburb', 'quarter', 'neighbourhood'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 11, 9.5, 15, 13]), 'text-letter-spacing': 0.04 }, paint: ink(P.labelSoft) })
  add({ id: 'lbl-town', 'source-layer': 'place', type: 'symbol', minzoom: 7, filter: classIn('town', 'village'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 7, 10, 13, 14]) }, paint: ink(P.label) })
  add({ id: 'lbl-city', 'source-layer': 'place', type: 'symbol', filter: classIn('city'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 4, 12, 10, 17, 14, 22], FONT_BOLD), 'text-letter-spacing': 0.06 }, paint: { ...ink(P.label), 'text-halo-width': 2 } })
  return L
}

// پیش‌نمایش پس‌زمینه هر پوسته، برای زمینه زیر نقشه تا تکه‌ها برسند
export function skinBackground(id, mode) {
  if (id === MINI || !isVectorSkinV4(id)) return MINI_P[mode === 'light' ? 'light' : 'dark'].bg
  const s = V2_SKINS.find(x => x.id === id)
  return (s && s.swatch && s.swatch[0]) || MINI_P.dark.bg
}

// همه لایه‌های نوشته (symbol) طبق کلید نوشته‌ها پنهان یا دیده می‌شوند
function applyLabels(style, labels) {
  for (const l of style.layers) {
    if (l.type === 'symbol') l.layout = { ...(l.layout || {}), visibility: labels ? 'visible' : 'none' }
  }
  return style
}

export function buildStyleV4(id, mode, origin, cafeData, labels) {
  if (id !== MINI && isVectorSkinV4(id)) return applyLabels(buildV2Style(id, origin, cafeData), labels)
  return applyLabels({
    version: 8,
    name: 'twinland-v4-mini-' + (mode === 'light' ? 'light' : 'dark'),
    glyphs: origin + '/api/mapkit/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', tiles: [origin + '/api/mapkit/tiles/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14 },
      cafes: { type: 'geojson', data: cafeData || { type: 'FeatureCollection', features: [] } },
    },
    layers: miniLayers(mode),
  }, labels)
}

export { cafeFeatures }
