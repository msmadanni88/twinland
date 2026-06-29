export const runtime = 'edge'

const PROVIDERS = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager',
  'https://tile.openstreetmap.org',
  'https://a.tile.openstreetmap.org',
]

export async function GET(req, { params }) {
  const path = params.coords.join('/')
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(`${provider}/${path}`, {
        headers: {
          'User-Agent': 'TwinLand/1.0 (twinland.ir)',
          'Referer': 'https://twinland.ir',
        },
        next: { revalidate: 86400 },
      })
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch { continue }
  }
  const empty = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjkB6QAAAABJRU5ErkJggg=='), c=>c.charCodeAt(0))
  return new Response(empty, { status:200, headers:{'Content-Type':'image/png'} })
}
