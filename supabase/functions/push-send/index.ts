// ─────────────────────────────────────────────────────────────
//  TwinLand — push-send
//  action "init": makes sure a VAPID key pair exists and returns the public half.
//  action "send": called only by the database hook on notifications (pg_net). It checks
//  the shared hook value from app_secrets, then sends that notification to every live
//  device of its owner. Dead endpoints are switched off.
//  The private key is created here and stays in app_secrets; it never reaches a client.
//  Status 2026-10-15: written, not deployed yet. Deploying needs Dani's go-ahead; until then
//  push_config returns no key, so the app hides the push switch and nothing is sent.
// ─────────────────────────────────────────────────────────────
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const ALLOWED = [
  'https://twinland.ir', 'https://www.twinland.ir', 'https://twinex.ir', 'https://www.twinex.ir',
  'https://digitwins.ir', 'https://www.digitwins.ir', 'https://twinland.vercel.app',
]
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function cors(req: Request) {
  const o = req.headers.get('origin') || ''
  const ok = ALLOWED.includes(o) || /^https:\/\/twinland-[a-z0-9-]+\.vercel\.app$/.test(o) || /^http:\/\/localhost:\d+$/.test(o)
  return {
    'Access-Control-Allow-Origin': ok ? o : ALLOWED[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    'Vary': 'Origin',
  }
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(req) } })

async function secret(name: string): Promise<string | null> {
  const { data } = await sb.from('app_secrets').select('value').eq('name', name).maybeSingle()
  return (data && data.value) || null
}

async function keys(): Promise<{ pub: string; priv: string }> {
  let pub = await secret('vapid_public')
  let priv = await secret('vapid_private')
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys()
    // two first calls at the same moment: the first insert wins, both read it back
    await sb.from('app_secrets').upsert(
      [{ name: 'vapid_public', value: k.publicKey }, { name: 'vapid_private', value: k.privateKey }],
      { onConflict: 'name', ignoreDuplicates: true },
    )
    pub = await secret('vapid_public')
    priv = await secret('vapid_private')
  }
  if (!pub || !priv) throw new Error('no_keys')
  return { pub, priv }
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { ok: false, error: 'method' }, 405)
  let body: any = {}
  try { body = await req.json() } catch (_) { return json(req, { ok: false, error: 'body' }, 400) }

  try {
    if (body.action === 'init') {
      const k = await keys()
      return json(req, { ok: true, public_key: k.pub })
    }

    if (body.action === 'send') {
      const hook = await secret('push_hook')
      if (!hook || typeof body.hook !== 'string' || !same(hook, body.hook)) return json(req, { ok: false, error: 'denied' }, 403)
      const id = Number(body.id)
      if (!Number.isFinite(id)) return json(req, { ok: false, error: 'id' }, 400)
      const { data: n } = await sb.from('notifications').select('id,user_id,type,title,body,icon,link').eq('id', id).maybeSingle()
      if (!n) return json(req, { ok: false, error: 'missing' }, 404)
      const { data: subs } = await sb.from('push_subscriptions')
        .select('id,endpoint,p256dh,auth,fail_count').eq('user_id', n.user_id).is('disabled_at', null).limit(5)
      if (!subs || !subs.length) return json(req, { ok: true, sent: 0 })

      const k = await keys()
      webpush.setVapidDetails('https://twinland.ir', k.pub, k.priv)
      const payload = JSON.stringify({
        title: n.title || 'TwinLand',
        body: n.body || '',
        link: n.link || '/',
        tag: (n.type || 'tl') + '-' + n.id,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
      })
      let sent = 0
      for (const s of subs) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' })
          sent++
          await sb.from('push_subscriptions').update({ last_ok_at: new Date().toISOString(), fail_count: 0 }).eq('id', s.id)
        } catch (e: any) {
          const code = e && e.statusCode
          const dead = code === 404 || code === 410 || (s.fail_count || 0) >= 4
          await sb.from('push_subscriptions')
            .update(dead ? { disabled_at: new Date().toISOString(), fail_count: (s.fail_count || 0) + 1 } : { fail_count: (s.fail_count || 0) + 1 })
            .eq('id', s.id)
        }
      }
      return json(req, { ok: true, sent })
    }

    return json(req, { ok: false, error: 'action' }, 400)
  } catch (e) {
    console.error('push-send', e && (e as Error).message)
    return json(req, { ok: false, error: 'server' }, 500)
  }
})
