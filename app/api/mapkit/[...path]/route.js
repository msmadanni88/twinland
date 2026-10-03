export const runtime = 'edge'

// Everything the map skins need is served from our own domain, because visitors in Iran
// often cannot reach the public CDNs or the tile host directly:
//   /api/mapkit/lib/<file>                 → pinned open-source libraries (MapLibre GL, its Leaflet bridge, RTL text)
//   /api/mapkit/tiles/<z>/<x>/<y>.pbf      → OpenFreeMap vector tiles (OpenMapTiles schema, OpenStreetMap data)
//   /api/mapkit/fonts/<fontstack>/<range>.pbf → label glyphs
// Only these exact shapes are proxied — never arbitrary paths. The Vercel CDN caches every answer.
// Attribution shown on the map: OpenFreeMap © OpenMapTiles, data from OpenStreetMap.

const UA = 'TwinLand/1.0 (+https://twinland.ir)'
const TIMEOUT_MS = 9000
const JS = 'application/javascript; charset=utf-8'

const LIBS = {
  'maplibre-gl.js': ['https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js', JS],
  'maplibre-gl.css': ['https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css', 'text/css; charset=utf-8'],
  'leaflet-maplibre-gl.js': ['https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js', JS],
  'rtl-text.js': ['https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js', JS],
}

const LIB_CACHE = 'public, max-age=604800, s-maxage=31536000, immutable'
const TILE_CACHE = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800'
const FONT_CACHE = 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000'

const TILEJSON_URL = 'https://tiles.openfreemap.org/planet'
const FONT_BASE = 'https://tiles.openfreemap.org/fonts/'
const TILEJSON_TTL_MS = 30 * 60 * 1000
let tileTemplate = null
let tileTemplateAt = 0

async function get(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://twinland.ir/' }, signal: ctrl.signal })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// OpenFreeMap publishes dated tile sets; the TileJSON names the current one.
async function currentTileTemplate() {
  const now = Date.now()
  if (tileTemplate && now - tileTemplateAt < TILEJSON_TTL_MS) return tileTemplate
  const res = await get(TILEJSON_URL)
  if (res && res.ok) {
    try {
      const j = await res.json()
      const t = Array.isArray(j.tiles) ? j.tiles[0] : null
      if (typeof t === 'string' && t.startsWith('https://tiles.openfreemap.org/') && t.includes('{z}/{x}/{y}')) {
        tileTemplate = t
        tileTemplateAt = now
      }
    } catch {}
  }
  return tileTemplate
}

function parseTile(parts) {
  if (parts.length !== 3) return null
  const [zs, xs, ys] = parts
  const m = /^(\d{1,7})\.pbf$/.exec(ys || '')
  if (!/^\d{1,2}$/.test(zs || '') || !/^\d{1,7}$/.test(xs || '') || !m) return null
  const z = Number(zs), x = Number(xs), y = Number(m[1])
  if (z > 14) return null
  const n = 2 ** z
  if (x >= n || y >= n) return null
  return { z, x, y }
}

const head = (type, cache) => ({ 'Content-Type': type, 'Cache-Control': cache, 'Access-Control-Allow-Origin': '*' })

export async function GET(req, { params }) {
  const parts = Array.isArray(params.path) ? params.path.map(p => decodeURIComponent(p)) : []
  const kind = parts[0]

  if (kind === 'lib' && parts.length === 2 && LIBS[parts[1]]) {
    const [url, type] = LIBS[parts[1]]
    const res = await get(url)
    if (!res || !res.ok) return new Response('Library unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
    return new Response(await res.arrayBuffer(), { status: 200, headers: head(type, LIB_CACHE) })
  }

  if (kind === 'tiles') {
    const t = parseTile(parts.slice(1))
    if (!t) return new Response('Bad tile', { status: 400 })
    const tpl = await currentTileTemplate()
    if (!tpl) return new Response('Tiles unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
    const res = await get(tpl.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y))
    if (!res) return new Response('Tiles unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
    // No data for this square (open sea, far north): an empty answer the map treats as a blank tile.
    if (res.status === 404 || res.status === 204) return new Response(null, { status: 204, headers: head('application/x-protobuf', TILE_CACHE) })
    if (!res.ok) return new Response('Tiles unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
    return new Response(await res.arrayBuffer(), { status: 200, headers: head('application/x-protobuf', TILE_CACHE) })
  }

  if (kind === 'fonts' && parts.length === 3 && /^[A-Za-z0-9 ,]{1,120}$/.test(parts[1]) && /^\d{1,6}-\d{1,6}\.pbf$/.test(parts[2])) {
    const res = await get(FONT_BASE + encodeURIComponent(parts[1]) + '/' + parts[2])
    if (!res || !res.ok) return new Response('Font unavailable', { status: res && res.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'no-store' } })
    return new Response(await res.arrayBuffer(), { status: 200, headers: head('application/x-protobuf', FONT_CACHE) })
  }

  return new Response('Not found', { status: 404 })
}
