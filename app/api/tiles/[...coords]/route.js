export const runtime = 'edge'

// Map tiles are served through our own domain so that
//   1) the provider key never reaches the browser, and
//   2) the Vercel CDN caches every tile (s-maxage), keeping provider traffic low.
//
// Primary:  CARTO Voyager. Since 23 Sep 2026 CARTO needs a key; without one it
//           answers 200 with a watermarked "API KEY REQUIRED" tile. The key lives
//           only in the CARTO_BASEMAPS_KEY environment variable on Vercel.
// Fallback: OpenStreetMap standard tiles — light use only, identified and cached
//           for at least 7 days, as the OSM tile usage policy requires.
// Both need visible attribution; the map shows it (components/home/TwinLand.js).

const UA = 'TwinLand/1.0 (+https://twinland.ir)'
// Browsers keep a tile 1 hour; the Vercel CDN keeps it 7 days (reset on every deploy,
// so adding the CARTO key and redeploying switches everyone over within the hour).
const TILE_CACHE = 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400'
const TIMEOUT_MS = 8000

// Only real tile coordinates are proxied — never arbitrary paths on the provider.
function parseTile(coords) {
  if (!Array.isArray(coords) || coords.length !== 3) return null
  const [zs, xs, ys] = coords
  const m = /^(\d{1,7})\.png$/.exec(ys || '')
  if (!/^\d{1,2}$/.test(zs || '') || !/^\d{1,7}$/.test(xs || '') || !m) return null
  const z = Number(zs), x = Number(xs), y = Number(m[1])
  if (z > 19) return null
  const n = 2 ** z
  if (x >= n || y >= n) return null
  return `${z}/${x}/${y}.png`
}

function providers() {
  const list = []
  const key = process.env.CARTO_BASEMAPS_KEY
  if (key) list.push(p => `https://basemaps.cartocdn.com/rastertiles/voyager/${p}?key=${encodeURIComponent(key)}`)
  list.push(p => `https://tile.openstreetmap.org/${p}`)
  return list
}

async function fetchTile(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://twinland.ir/' },
      signal: ctrl.signal,
    })
    const type = res.headers.get('content-type') || ''
    if (!res.ok || !type.startsWith('image/')) return null
    return { body: await res.arrayBuffer(), type }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// 1×1 transparent PNG — returned when every provider fails; never cached.
const EMPTY_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjkB6QAAAABJRU5ErkJggg=='),
  c => c.charCodeAt(0)
)

export async function GET(req, { params }) {
  const path = parseTile(params.coords)
  if (!path) return new Response('Bad tile', { status: 400 })

  for (const build of providers()) {
    const tile = await fetchTile(build(path))
    if (tile) {
      return new Response(tile.body, {
        status: 200,
        headers: {
          'Content-Type': tile.type,
          'Cache-Control': TILE_CACHE,
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }
  return new Response(EMPTY_PNG, {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  })
}
