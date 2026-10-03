// پوسته‌های نقشه — نسخه v2.0
// هر پوسته همان داده واقعی OpenStreetMap را با شکل و رنگ خودش می‌کشد؛ جای خیابان‌ها و کافه‌ها عوض نمی‌شود.
// داده از /api/mapkit می‌آید (vector tiles با طرح OpenMapTiles) و MapLibre GL در مرورگر رسمش می‌کند.
// پوسته «ساده» همان کاشی‌های عکسی OpenStreetMap است و MapLibre لازم ندارد.
// برای افزودن پوسته تازه: یک ورودی به SKINS، یک پالت به PALETTES و یک دسته رنگ به ART اضافه شود.

export const SKINS = [
  { id: 'parchment', kind: 'vector', label: 'پوستی قدیمی', hint: 'نقشه گنج روی کاغذ کهنه', dark: false, cafeArt: null, swatch: ['#e6d6ad', '#a5642c', '#a9c2b4', '#bdc189'] },
  { id: 'ember', kind: 'vector', label: 'شب فانوس', hint: 'شهر مهتابی با خیابان‌های روشن', dark: true, cafeArt: null, swatch: ['#161d33', '#ffc46b', '#0c1326', '#143430'] },
  { id: 'toon', kind: 'vector', label: 'کارتونی', hint: 'رنگ‌های شاد و کافه‌های نقاشی‌شده', dark: false, cafeArt: 'color', swatch: ['#9ad865', '#fff6da', '#55c3f3', '#58b23c'] },
  { id: 'sketch', kind: 'vector', label: 'طرح مدادی', hint: 'نقشه دست‌کشیده با مداد', dark: false, cafeArt: 'ink', swatch: ['#f5f1e6', '#4a4a4a', '#c9d3dd', '#dcdccd'] },
  { id: 'plain', kind: 'raster', label: 'ساده', hint: 'نقشه معمولی OpenStreetMap', dark: false, cafeArt: null, swatch: ['#f2efe9', '#ffffff', '#aad3df', '#cdebb0'] },
]
export const DEFAULT_SKIN = 'parchment'
export const SKIN_STORAGE_KEY = 'tl_map_skin'
export const SKIN_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
export const PLAIN_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

export function isKnownSkin(id) { return SKINS.some(s => s.id === id) }
export function skinInfo(id) { return SKINS.find(s => s.id === id) || SKINS[0] }
export function isVectorSkin(id) { return skinInfo(id).kind === 'vector' }

// رنگ‌ها و انتخاب‌های هر پوسته. roadGlow: نور زیر راه‌های اصلی. doubleRoad: راه سفید با دو خط کناری.
const PALETTES = {
  parchment: {
    paper: '#e6d6ad', paperTex: 0.5, land: '#dfcda0', wood: '#bdc189', grass: '#d0cd97', park: '#c6c88e', sand: '#e3cf98', rock: '#cdb98a', ice: '#efe8d2',
    treeOpacity: 0.9, water: '#a9c2b4', waterLine: '#6f8f86', waterway: '#7fa197', waterTex: 0.7,
    building: '#d6c18d', buildingLine: '#9c8052', buildingTex: 0,
    roadCase: '#5e3d1f', motorway: '#a5642c', major: '#b98447', minor: '#c9ad78', path: '#8a6a42', rail: '#5b3a1e', caseOpacity: 0.85,
    boundary: '#93452d', aero: '#d2bf90', label: '#4a2f17', labelSoft: '#6d4f2c', halo: '#eee1bd', waterLabel: '#46675f',
    glow: null, roadGlow: null, labelFont: 'Noto Sans Regular',
  },
  ember: {
    paper: '#141b2f', paperTex: 0.9, land: '#18213a', wood: '#123230', grass: '#16302f', park: '#143430', sand: '#1f2740', rock: '#1b2238', ice: '#28324f',
    treeOpacity: 0.95, water: '#0c1326', waterLine: '#33466e', waterway: '#1c2a4c', waterTex: 0.9,
    building: '#1d2845', buildingLine: 'rgba(120,150,210,0.35)', buildingTex: 0.9,
    roadCase: '#0b101f', motorway: '#ffc46b', major: '#d79a55', minor: '#33405f', path: '#46557c', rail: '#090d19', caseOpacity: 0.9,
    boundary: '#7f8fd0', aero: '#1c2540', label: '#f1e3c2', labelSoft: '#aab6d6', halo: '#0b101f', waterLabel: '#7f96c8',
    glow: { color: '#ff9d2e', core: '#ffe9bd' }, roadGlow: '#ffae4a', labelFont: 'Noto Sans Regular',
  },
  toon: {
    paper: '#9ad865', paperTex: 0.35, land: '#a9e074', wood: '#58b23c', grass: '#8fd35c', park: '#6cc04a', sand: '#f6e39a', rock: '#c9c9b4', ice: '#f2fbff',
    treeOpacity: 1, water: '#55c3f3', waterLine: '#2b8fc4', waterway: '#55c3f3', waterTex: 0.9,
    building: '#ffe08a', buildingLine: '#d59a35', buildingTex: 0,
    roadCase: '#5c9a39', motorway: '#ffcf4d', major: '#fff6da', minor: '#f4f2d6', path: '#f7efc4', rail: '#6b6f7a', caseOpacity: 0.9,
    boundary: '#e2574c', aero: '#d9e6c4', label: '#1f3b57', labelSoft: '#2d5a2a', halo: '#ffffff', waterLabel: '#125f8f',
    glow: null, roadGlow: null, labelFont: 'Noto Sans Bold',
  },
  sketch: {
    paper: '#f5f1e6', paperTex: 0.6, land: '#f1ede1', wood: '#e2e2d2', grass: '#eae9da', park: '#dedfcf', sand: '#efe9d6', rock: '#e2dfd6', ice: '#fbfaf5',
    treeOpacity: 0.9, water: '#d3dbe3', waterLine: '#6d7a88', waterway: '#8894a1', waterTex: 0.95,
    building: '#fbf9f2', buildingLine: '#5a5a5a', buildingTex: 0.75,
    roadCase: '#3d3d3d', motorway: '#fffdf6', major: '#fffdf6', minor: '#fdfbf4', path: '#6b6b6b', rail: '#3d3d3d', caseOpacity: 0.8,
    boundary: '#7a7a7a', aero: '#e9e6dc', label: '#2f2f2f', labelSoft: '#555555', halo: '#f5f1e6', waterLabel: '#55616e',
    glow: null, roadGlow: null, doubleRoad: true, labelFont: 'Noto Sans Italic',
  },
}

const FONT_BOLD = ['Noto Sans Bold']
const FONT_ITALIC = ['Noto Sans Italic']
const NAME = ['coalesce', ['get', 'name'], ['get', 'name:latin'], '']
const CLS = ['coalesce', ['get', 'class'], '']
const SUB = ['coalesce', ['get', 'subclass'], '']
const zoomed = (stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops]
const classIn = (...list) => ['match', CLS, list, true, false]
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel']

// مکان‌های شاخص شهر که نشان مخصوص خودشان را می‌گیرند
const POI_KIND = ['case',
  ['==', SUB, 'mall'], 'mall',
  ['in', SUB, ['literal', ['museum', 'monument', 'memorial', 'castle', 'archaeological_site', 'ruins', 'palace']]], 'heritage',
  ['==', SUB, 'place_of_worship'], 'mosque',
  ['==', CLS, 'hospital'], 'hospital',
  ['==', CLS, 'stadium'], 'stadium',
  ['==', CLS, 'town_hall'], 'civic',
  ['in', SUB, ['literal', ['university', 'college']]], 'school',
  ['==', CLS, 'attraction'], 'landmark',
  ['==', CLS, 'park'], 'park',
  '']

function layers(id) {
  const P = PALETTES[id]
  const FONT = [P.labelFont]
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

  // بافت زمینه روی زمین، زیر آب و راه‌ها — کاغذ، ستاره یا دانه مداد
  L.push({ id: 'paper-tex', type: 'background', paint: { 'background-pattern': img('paper'), 'background-opacity': P.paperTex } })

  // آب با خط‌های ساحلی تو در تو
  add({ id: 'water', 'source-layer': 'water', type: 'fill', paint: { 'fill-color': P.water } })
  add({ id: 'water-tex', 'source-layer': 'water', type: 'fill', paint: { 'fill-pattern': img('waves'), 'fill-opacity': P.waterTex } })
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
  if (P.buildingTex) {
    add({ id: 'building-tex', 'source-layer': 'building', type: 'fill', minzoom: 14,
      paint: { 'fill-pattern': img('windows'), 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, P.buildingTex] } })
  }

  // راه‌ها: اول نور، بعد دور، بعد رو
  const road = [
    ['minor', classIn('minor', 'service', 'tertiary'), 12, P.minor, [12, 0.5, 14, 2, 17, 9, 19, 22]],
    ['major', classIn('primary', 'secondary'), 9, P.major, [9, 0.6, 12, 1.8, 14, 4, 17, 13, 19, 30]],
    ['motorway', classIn('motorway', 'trunk'), 6, P.motorway, [6, 0.7, 10, 1.8, 13, 4, 15, 7, 17, 16, 19, 34]],
  ]
  add({ id: 'road-path', 'source-layer': 'transportation', type: 'line', minzoom: 14, filter: ['all', classIn('path', 'track'), notTunnel],
    layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': P.path, 'line-width': zoomed([14, 0.7, 18, 2.2]), 'line-dasharray': [2, 2] } })
  if (P.roadGlow) {
    for (const [name, f, minzoom, , w] of road.slice(1)) {
      add({ id: 'road-glow-' + name, 'source-layer': 'transportation', type: 'line', minzoom, filter: ['all', f, notTunnel],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': P.roadGlow, 'line-opacity': name === 'motorway' ? 0.3 : 0.18, 'line-blur': zoomed([8, 3, 14, 9, 18, 22]),
          'line-width': zoomed(w.map((v, i) => (i % 2 ? v * 3 + 4 : v))) } })
    }
  }
  const thin = P.roadGlow ? 0.45 : 1   // در پوسته شب راه‌ها رشته‌های باریک نورند
  for (const [name, f, minzoom, , w] of road) {
    add({ id: 'road-case-' + name, 'source-layer': 'transportation', type: 'line', minzoom, filter: ['all', f, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.roadCase, 'line-opacity': name === 'minor' ? P.caseOpacity * 0.65 : P.caseOpacity,
        'line-width': zoomed(w.map((v, i) => (i % 2 ? v * thin + (P.doubleRoad ? 1.2 : 0) : v))), 'line-blur': 0.3 } })
  }
  for (const [name, f, minzoom, color, w] of road) {
    const inner = w.map((v, i) => (i % 2 ? Math.max(0.3, v * thin - (name === 'minor' ? 1 : 1.6) * thin) : v))
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
      'circle-radius': zoomed([9, 9, 12, 30, 15, 76, 18, 170]),
      'circle-opacity': ['case', lit, 0.7, 0.42] } })
    L.push({ id: 'cafe-glow-core', type: 'circle', source: 'cafes', minzoom: 10, paint: {
      'circle-color': P.glow.core, 'circle-blur': 1,
      'circle-radius': zoomed([10, 3, 15, 18, 18, 48]),
      'circle-opacity': ['case', lit, 0.6, 0.3] } })
  }

  // نوشته‌ها و نشان‌ها
  const text = (size, font) => ({ 'text-field': NAME, 'text-font': font || FONT, 'text-size': size, 'text-max-width': 8 })
  const ink = (color) => ({ 'text-color': color, 'text-halo-color': P.halo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 })
  add({ id: 'label-water', 'source-layer': 'water_name', type: 'symbol',
    layout: { ...text(12, FONT_ITALIC), 'text-letter-spacing': 0.1, 'icon-image': img('poi-lake'), 'icon-size': 0.85, 'text-anchor': 'top', 'text-offset': [0, 1], 'text-optional': true, 'icon-optional': true },
    paint: ink(P.waterLabel) })
  add({ id: 'label-road', 'source-layer': 'transportation_name', type: 'symbol', minzoom: 13.5,
    filter: classIn('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 13, 10, 18, 14]), 'symbol-placement': 'line', 'symbol-spacing': 320, 'text-rotation-alignment': 'map' }, paint: ink(P.labelSoft) })
  add({ id: 'poi', 'source-layer': 'poi', type: 'symbol', minzoom: 12, filter: ['!=', POI_KIND, ''],
    layout: { 'icon-image': ['concat', 'tl:' + id + ':poi-', POI_KIND], 'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 16, 1.1],
      'symbol-sort-key': ['coalesce', ['get', 'rank'], 99], 'icon-padding': 6,
      ...text(10.5), 'text-anchor': 'top', 'text-offset': [0, 1.3], 'text-optional': true, 'text-max-width': 7 },
    paint: ink(P.labelSoft) })
  add({ id: 'label-peak', 'source-layer': 'mountain_peak', type: 'symbol', minzoom: 9,
    layout: { ...text(11, FONT_ITALIC), 'icon-image': img('peak'), 'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 14, 1.15],
      'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-optional': true, 'icon-allow-overlap': false }, paint: ink(P.labelSoft) })
  add({ id: 'label-hood', 'source-layer': 'place', type: 'symbol', minzoom: 11.5, filter: classIn('suburb', 'quarter', 'neighbourhood'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 11, 10, 15, 14]), 'text-letter-spacing': 0.06 }, paint: ink(P.labelSoft) })
  add({ id: 'label-town', 'source-layer': 'place', type: 'symbol', minzoom: 7, filter: classIn('town', 'village'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 7, 10, 13, 15]) }, paint: ink(P.label) })
  add({ id: 'label-city', 'source-layer': 'place', type: 'symbol', filter: classIn('city'),
    layout: { ...text(['interpolate', ['linear'], ['zoom'], 4, 12, 10, 19, 14, 26], FONT_BOLD), 'text-letter-spacing': 0.08 }, paint: { ...ink(P.label), 'text-halo-width': 2 } })
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
  const skin = isKnownSkin(id) && isVectorSkin(id) ? id : DEFAULT_SKIN
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
// نام تصویر: tl:<پوسته>:<نوع>   —   نشان مکان‌ها: tl:<پوسته>:poi-<نوع>
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
const out = (c, ctx) => { const d = ctx.getImageData(0, 0, c.width, c.height); return { width: c.width, height: c.height, data: d.data } }

// tree: round ابری با خط دور، pine کاج، ball گوی کارتونی، scribble خط مدادی
const ART = {
  parchment: { tree: 'round', speck: 'rgba(92,58,24,', fiber: 'rgba(120,84,40,', leaf: '#9aa565', leaf2: '#8a9657', line: '#5b4a24', peak: '#cdb98a', peakShade: '#a68d5c', wave: 'rgba(79,112,104,0.55)', rock: 'rgba(94,61,31,0.4)', fill: '#efe1b8', accent: '#b0492d', lw: 2.4 },
  ember: { tree: 'pine', speck: 'rgba(255,255,255,', fiber: 'rgba(160,190,255,', leaf: '#1d4a44', leaf2: '#2b6a5c', line: '#0a1220', peak: '#2a3558', peakShade: '#1a2340', wave: 'rgba(170,200,255,0.34)', rock: 'rgba(150,170,220,0.3)', fill: '#232f52', accent: '#ffc46b', lw: 2.2, lineLight: '#9fb3e6', window: 'rgba(255,205,120,0.9)' },
  toon: { tree: 'ball', speck: 'rgba(255,255,255,', fiber: 'rgba(60,140,40,', leaf: '#3fa02f', leaf2: '#7dd04f', line: '#2c6e22', peak: '#b8c3a0', peakShade: '#8d9a78', wave: 'rgba(255,255,255,0.85)', rock: 'rgba(90,100,80,0.45)', fill: '#ffffff', accent: '#ff6b5e', lw: 3 },
  sketch: { tree: 'scribble', speck: 'rgba(60,60,60,', fiber: 'rgba(60,60,60,', leaf: 'rgba(0,0,0,0)', leaf2: 'rgba(0,0,0,0)', line: '#4a4a4a', peak: '#f5f1e6', peakShade: '#d9d6cc', wave: 'rgba(80,95,110,0.6)', rock: 'rgba(60,60,60,0.45)', fill: '#fbf9f2', accent: '#4a4a4a', lw: 2, window: 'rgba(70,70,70,0.4)' },
}

function drawTree(ctx, A, x, y, r) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = A.line; ctx.lineWidth = 1.6
  if (A.tree === 'pine') {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.lineTo(x, y + r * 1.5); ctx.stroke()
    for (let i = 0; i < 3; i++) {
      const top = y - r * 1.3 + i * r * 0.62, half = r * (0.5 + i * 0.24), bottom = top + r * 0.95
      ctx.fillStyle = i === 0 ? A.leaf2 : A.leaf
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + half, bottom); ctx.lineTo(x - half, bottom); ctx.closePath(); ctx.fill(); ctx.stroke()
    }
    return
  }
  if (A.tree === 'ball') {
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2.6
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.5); ctx.lineTo(x, y + r * 1.4); ctx.stroke()
    ctx.fillStyle = A.leaf; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = A.leaf2; ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.52, 0, Math.PI * 2); ctx.fill()
    return
  }
  if (A.tree === 'scribble') {
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.7); ctx.lineTo(x + 1, y + r * 1.5); ctx.stroke()
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(x + (i - 1) * r * 0.22, y + (i % 2 ? 0.12 : -0.1) * r, r * (0.95 - i * 0.14), r * (0.78 - i * 0.1), i * 0.5, 0, Math.PI * 1.9); ctx.stroke()
    }
    return
  }
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.7); ctx.lineTo(x, y + r * 1.5); ctx.stroke()
  ctx.fillStyle = A.leaf
  ctx.beginPath()
  ctx.arc(x - r * 0.45, y + r * 0.2, r * 0.62, 0, Math.PI * 2)
  ctx.arc(x + r * 0.45, y + r * 0.2, r * 0.62, 0, Math.PI * 2)
  ctx.arc(x, y - r * 0.35, r * 0.72, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath(); ctx.arc(x - r * 0.45, y + r * 0.2, r * 0.62, Math.PI * 0.35, Math.PI * 1.25); ctx.stroke()
  ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.2, r * 0.62, -Math.PI * 0.25, Math.PI * 0.65); ctx.stroke()
  ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.72, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke()
}

// نشان مکان‌های شاخص — ۶۴ در ۶۴، در اندازه نیم نشان داده می‌شود
function drawPoi(ctx, A, kind) {
  const line = A.lineLight || A.line
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = A.lw; ctx.strokeStyle = line; ctx.fillStyle = A.fill
  const box = (x, y, w, h) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke() }
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill } ctx.fill(); ctx.stroke(); ctx.fillStyle = A.fill }
  const stroke = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke() }
  if (kind === 'hospital') {
    box(12, 16, 40, 38)
    ctx.fillStyle = A.accent; ctx.fillRect(28, 22, 8, 22); ctx.fillRect(21, 29, 22, 8); ctx.fillStyle = A.fill
    stroke([[8, 54], [56, 54]])
  } else if (kind === 'stadium') {
    ctx.beginPath(); ctx.ellipse(32, 34, 25, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = A.leaf2; ctx.beginPath(); ctx.ellipse(32, 34, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = A.fill
    stroke([[10, 20], [10, 10]]); stroke([[54, 20], [54, 10]])
  } else if (kind === 'mall') {
    poly([[14, 24], [50, 24], [54, 56], [10, 56]])
    ctx.beginPath(); ctx.arc(32, 24, 9, Math.PI, 0); ctx.stroke()
    ctx.fillStyle = A.accent; ctx.beginPath(); ctx.arc(32, 40, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = A.fill
  } else if (kind === 'heritage') {
    poly([[8, 24], [32, 8], [56, 24]], A.accent)
    box(10, 24, 44, 5); box(8, 50, 48, 6)
    ;[16, 29, 42].forEach(x => box(x, 29, 6, 21))
  } else if (kind === 'mosque') {
    box(14, 36, 30, 20)
    ctx.fillStyle = A.accent; ctx.beginPath(); ctx.arc(29, 36, 13, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = A.fill
    stroke([[29, 23], [29, 16]])
    box(47, 18, 7, 38); poly([[46, 18], [50.5, 8], [55, 18]])
  } else if (kind === 'civic') {
    box(10, 30, 44, 26)
    ctx.beginPath(); ctx.arc(32, 30, 11, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke()
    stroke([[32, 19], [32, 6]]); poly([[32, 6], [44, 10], [32, 14]], A.accent)
    ;[18, 29, 40].forEach(x => { ctx.strokeRect(x, 38, 6, 12) })
  } else if (kind === 'school') {
    poly([[32, 12], [58, 24], [32, 36], [6, 24]], A.accent)
    poly([[16, 30], [16, 44], [32, 52], [48, 44], [48, 30], [32, 38]])
    stroke([[58, 24], [58, 40]])
  } else if (kind === 'landmark') {
    poly([[28, 56], [30, 26], [34, 26], [36, 56]])
    ctx.beginPath(); ctx.ellipse(32, 22, 13, 6, 0, 0, Math.PI * 2); ctx.fillStyle = A.accent; ctx.fill(); ctx.stroke(); ctx.fillStyle = A.fill
    stroke([[32, 16], [32, 4]]); stroke([[20, 56], [44, 56]])
  } else if (kind === 'park') {
    drawTree(ctx, A.tree === 'scribble' ? A : { ...A, tree: A.tree }, 26, 28, 15)
    ctx.strokeStyle = line; ctx.lineWidth = A.lw
    stroke([[38, 48], [58, 48]]); stroke([[41, 48], [41, 56]]); stroke([[55, 48], [55, 56]]); stroke([[38, 42], [58, 42]])
  } else if (kind === 'lake') {
    poly([[30, 14], [30, 40], [14, 40]], A.accent); poly([[34, 20], [34, 40], [46, 40]])
    poly([[10, 42], [54, 42], [46, 52], [18, 52]])
    ctx.strokeStyle = A.wave; stroke([[6, 59], [14, 55], [22, 59], [30, 55], [38, 59], [46, 55], [58, 59]])
  } else return false
  return true
}

export function skinImage(name) {
  if (typeof document === 'undefined' || typeof name !== 'string') return null
  const parts = name.split(':')
  if (parts.length !== 3 || parts[0] !== 'tl' || !ART[parts[1]]) return null
  const skin = parts[1], A = ART[skin], kind = parts[2]

  if (kind.indexOf('poi-') === 0) {
    const [c, ctx] = canvas(64, 64)
    return drawPoi(ctx, A, kind.slice(4)) ? out(c, ctx) : null
  }
  if (kind === 'paper') {
    const [c, ctx] = canvas(256, 256); const r = rng(11)
    if (skin === 'ember') {   // آسمان پرستاره
      for (let i = 0; i < 70; i++) { const s = r() < 0.12 ? 2 : 1; ctx.fillStyle = A.speck + (0.12 + r() * 0.4) + ')'; ctx.fillRect(Math.floor(r() * 254), Math.floor(r() * 254), s, s) }
      return out(c, ctx)
    }
    if (skin === 'toon') {   // لکه‌های روشن و چمن
      for (let i = 0; i < 14; i++) { ctx.fillStyle = A.speck + (0.06 + r() * 0.08) + ')'; ctx.beginPath(); ctx.ellipse(r() * 256, r() * 256, 10 + r() * 22, 6 + r() * 12, r() * 3, 0, Math.PI * 2); ctx.fill() }
      ctx.strokeStyle = A.fiber + '0.35)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
      for (let i = 0; i < 22; i++) { const x = r() * 250, y = r() * 250; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 6); ctx.moveTo(x + 4, y); ctx.lineTo(x + 5, y - 7); ctx.stroke() }
      return out(c, ctx)
    }
    for (let i = 0; i < 900; i++) { ctx.fillStyle = A.speck + (0.05 + r() * 0.16) + ')'; ctx.fillRect(r() * 256, r() * 256, 1 + r() * 1.6, 1 + r() * 1.6) }
    for (let i = 0; i < 46; i++) {
      const x = r() * 256, y = r() * 256, len = 10 + r() * 26, a = r() * Math.PI
      ctx.strokeStyle = A.fiber + (0.06 + r() * 0.1) + ')'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 3, y + Math.sin(a) * len * 0.5 - 3, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
    }
    if (skin === 'parchment') for (let i = 0; i < 9; i++) {
      const x = r() * 256, y = r() * 256, rad = 14 + r() * 30
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, A.speck + '0.07)'); g.addColorStop(1, A.speck + '0)')
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    return out(c, ctx)
  }
  if (kind === 'trees') {
    const [c, ctx] = canvas(128, 128)
    if (skin === 'sketch') {   // هاشور مدادی زیر درخت‌ها
      ctx.strokeStyle = 'rgba(70,70,70,0.22)'; ctx.lineWidth = 1
      for (let i = -128; i < 128; i += 9) { ctx.beginPath(); ctx.moveTo(i, 128); ctx.lineTo(i + 128, 0); ctx.stroke() }
    }
    ;[[26, 28, 11], [86, 20, 9], [58, 66, 12], [108, 78, 10], [22, 96, 10], [78, 106, 9]].forEach(([x, y, r]) => drawTree(ctx, A, x, y, r))
    return out(c, ctx)
  }
  if (kind === 'waves') {
    const [c, ctx] = canvas(128, 128)
    ctx.strokeStyle = A.wave; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
    if (skin === 'sketch') {   // هاشور افقی آب
      for (let y = 8; y < 128; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= 128; x += 16) ctx.quadraticCurveTo(x + 8, y + (x % 32 ? 2 : -2), x + 16, y); ctx.stroke() }
      return out(c, ctx)
    }
    ;[[18, 26], [78, 50], [34, 86], [96, 108]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 6, x + 10, y); ctx.quadraticCurveTo(x + 15, y + 6, x + 20, y); ctx.stroke()
    })
    return out(c, ctx)
  }
  if (kind === 'windows') {
    const [c, ctx] = canvas(32, 32)
    if (skin === 'sketch') {
      ctx.strokeStyle = A.window; ctx.lineWidth = 1
      for (let i = -32; i < 32; i += 6) { ctx.beginPath(); ctx.moveTo(i, 32); ctx.lineTo(i + 32, 0); ctx.stroke() }
    } else {
      ctx.fillStyle = A.window || 'rgba(255,255,255,0.5)'
      ;[[5, 6], [19, 4], [12, 18], [25, 22], [4, 26]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 3))
    }
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
    const line = A.lineLight || A.line
    ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = line
    const tri = (x0, y0, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath() }
    tri(34, 50, 52, 20, 70, 50); ctx.fillStyle = A.peakShade; ctx.fill(); ctx.stroke()
    tri(4, 50, 28, 6, 52, 50); ctx.fillStyle = A.peak; ctx.fill(); ctx.stroke()
    ctx.fillStyle = A.peakShade; tri(28, 6, 52, 50, 32, 50); ctx.fill()
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(28, 6); ctx.lineTo(31, 30); ctx.lineTo(27, 38); ctx.stroke()
    tri(4, 50, 28, 6, 52, 50); ctx.lineWidth = 2.4; ctx.stroke()
    return out(c, ctx)
  }
  return null
}
