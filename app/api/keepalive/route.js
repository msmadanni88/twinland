// Daily keep-alive for the free-plan Supabase project.
// Supabase pauses free projects after 7 days without activity, which takes the
// whole site down (it happened on 2026-07-22 and again before 2026-09-24).
// Vercel Cron calls this route once a day (see vercel.json); one small real
// query is enough to count as activity.
import { SB_URL, SB_KEY } from '../../../lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" automatically.
  // Anything else is rejected so the route can't be used to spam the database.
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const started = Date.now()
  try {
    const res = await fetch(`${SB_URL}/rest/v1/cafes?select=id&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: 'no-store',
    })
    const body = { ok: res.ok, status: res.status, ms: Date.now() - started, at: new Date().toISOString() }
    if (!res.ok) console.error('keepalive: Supabase answered', res.status)
    return Response.json(body, { status: res.ok ? 200 : 502 })
  } catch (err) {
    console.error('keepalive: request failed', err)
    return Response.json({ ok: false, error: String(err) }, { status: 502 })
  }
}
