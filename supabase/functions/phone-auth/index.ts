// ─────────────────────────────────────────────────────────────────────────────
//  phone-auth — optional sign-in with a mobile number and an SMS code
//
//  POST { action: 'status' }                         → { enabled }
//  POST { action: 'send',   phone }                  → { ok: true, ttl }
//  POST { action: 'verify', phone, code, name? }     → { ok: true, session: { access_token, refresh_token, expires_in, user } }
//
//  Secrets (Supabase → Edge Functions → Secrets):
//    PHONE_AUTH_PEPPER  random secret of 32+ characters, set by Dani   (hashes phone numbers and codes; never leaves the server)
//    SMS_API_KEY        API key of the Iranian SMS panel (Kavenegar)  (the sign-in stays switched off until this exists)
//    SMS_TEMPLATE       name of the approved verify template, default "twinland-otp"; it must contain %token
//
//  Design: the phone number is stored only as a salted hash. Codes are 6 digits, valid 5 minutes, five tries, single use.
//  Limits: one code per number per 60 s, 5 per number per hour, 15 per IP per hour, 400 per day for the whole site.
//  A phone account is a normal Supabase user with a random alias e-mail and a server-derived password, so every other
//  part of the app (profiles, RLS, XP, check-ins) works unchanged. Nobody can sign in to it with a password.
//  The logic is in `core` and takes its dependencies as arguments so it can be tested without Deno or a database.
// ─────────────────────────────────────────────────────────────────────────────

export type Deps = {
  pepper: string
  smsConfigured: boolean
  now: () => number
  randomCode: () => string
  lastSent: (h: string) => Promise<number | null>
  countByPhone: (h: string, sinceMs: number) => Promise<number>
  countByIp: (ipHash: string, sinceMs: number) => Promise<number>
  countAll: (sinceMs: number) => Promise<number>
  insertOtp: (row: { phone: string; code_hash: string; expires_at: string; ip_hash: string }) => Promise<number>
  latestOpen: (h: string) => Promise<{ id: number; code_hash: string; attempts: number } | null>
  bumpAttempts: (id: number) => Promise<void>
  markUsed: (id: number, h: string) => Promise<void>
  cleanup: () => Promise<void>
  sendSms: (phone09: string, code: string) => Promise<boolean>
  accountByHash: (h: string) => Promise<{ user_id: string; email: string } | null>
  createAccount: (h: string, name: string, password: string) => Promise<{ user_id: string; email: string } | null>
  syncPassword: (userId: string, password: string) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<any | null>
}

export type Result = { status: number; body: Record<string, unknown> }
const fail = (status: number, error: string, extra: Record<string, unknown> = {}): Result => ({ status, body: { ok: false, error, ...extra } })

const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩'
// accepts 0912…, 912…, +98912…, 98912…, Persian and Arabic digits; returns 98912xxxxxxx or null
export function normalizePhone(raw: unknown): string | null {
  let s = String(raw ?? '')
  s = s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)))
  s = s.replace(/[\s\-().+]/g, '')
  if (/^0098/.test(s)) s = s.slice(4)
  else if (/^98/.test(s)) s = s.slice(2)
  else if (/^0/.test(s)) s = s.slice(1)
  return /^9\d{9}$/.test(s) ? '98' + s : null
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function hmacHex(key: string, text: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

const TTL_MS = 5 * 60_000
const HOUR = 3_600_000, DAY = 86_400_000

export async function core(deps: Deps, ip: string, input: any): Promise<Result> {
  const action = String(input?.action ?? '')
  if (action === 'status') return { status: 200, body: { ok: true, enabled: deps.smsConfigured && deps.pepper.length >= 16 } }
  if (!(deps.smsConfigured && deps.pepper.length >= 16)) return fail(503, 'sms_unavailable')

  const phone = normalizePhone(input?.phone)
  if (!phone) return fail(400, 'bad_phone')
  const h = await hmacHex(deps.pepper, 'phone|' + phone)
  const ipHash = await hmacHex(deps.pepper, 'ip|' + ip)

  if (action === 'send') {
    const now = deps.now()
    const last = await deps.lastSent(h)
    if (last && now - last < 60_000) return fail(429, 'wait', { retry_in: Math.ceil((60_000 - (now - last)) / 1000) })
    if ((await deps.countByPhone(h, now - HOUR)) >= 5) return fail(429, 'too_many')
    if ((await deps.countByIp(ipHash, now - HOUR)) >= 15) return fail(429, 'too_many')
    if ((await deps.countAll(now - DAY)) >= 400) return fail(429, 'busy')
    const code = deps.randomCode()
    const codeHash = await hmacHex(deps.pepper, 'otp|' + h + '|' + code)
    const id = await deps.insertOtp({ phone: h, code_hash: codeHash, expires_at: new Date(now + TTL_MS).toISOString(), ip_hash: ipHash })
    const sent = await deps.sendSms('0' + phone.slice(2), code)
    if (!sent) { await deps.markUsed(id, h); return fail(502, 'sms_failed') }
    deps.cleanup().catch(() => {})
    return { status: 200, body: { ok: true, ttl: TTL_MS / 1000 } }
  }

  if (action === 'verify') {
    const code = String(input?.code ?? '').replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/\D/g, '')
    if (code.length !== 6) return fail(400, 'bad_code')
    const row = await deps.latestOpen(h)
    if (!row) return fail(400, 'invalid')
    if (row.attempts >= 5) return fail(429, 'locked')
    const want = await hmacHex(deps.pepper, 'otp|' + h + '|' + code)
    if (!safeEqual(want, row.code_hash)) {
      await deps.bumpAttempts(row.id)
      return fail(400, 'invalid', { left: Math.max(0, 4 - row.attempts) })
    }
    await deps.markUsed(row.id, h)
    const password = await hmacHex(deps.pepper, 'pw|' + phone)
    let acct = await deps.accountByHash(h)
    if (acct) { if (!(await deps.syncPassword(acct.user_id, password))) return fail(500, 'account') }
    else {
      const raw = String(input?.name ?? '').replace(/[\u0000-\u001f‎‏‪-‮]/g, '').trim().slice(0, 24)
      const name = raw.length >= 2 && !/https?:|www\.|@/i.test(raw) ? raw : 'کاربر ' + String(1000 + Math.floor(Math.random() * 9000))
      acct = await deps.createAccount(h, name, password)
      if (!acct) return fail(500, 'account')
    }
    const session = await deps.signIn(acct.email, password)
    if (!session) return fail(500, 'session')
    return { status: 200, body: { ok: true, session } }
  }
  return fail(400, 'bad_action')
}

// ── Deno glue ────────────────────────────────────────────────────────────────
const ORIGINS = ['https://twinland.ir', 'https://www.twinland.ir', 'https://twinex.ir', 'https://www.twinex.ir', 'https://digitwins.ir', 'https://www.digitwins.ir', 'http://localhost:3000']

// @ts-ignore Deno global
if (typeof Deno !== 'undefined' && (Deno as any).serve) {
  const D: any = Deno
  const { createClient } = await import('npm:@supabase/supabase-js@2')
  const url = D.env.get('SUPABASE_URL')!, service = D.env.get('SUPABASE_SERVICE_ROLE_KEY')!, anon = D.env.get('SUPABASE_ANON_KEY')!
  const smsKey = D.env.get('SMS_API_KEY') || '', smsTemplate = D.env.get('SMS_TEMPLATE') || 'twinland-otp'
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const iso = (ms: number) => new Date(ms).toISOString()

  const deps: Deps = {
    pepper: D.env.get('PHONE_AUTH_PEPPER') || '',
    smsConfigured: smsKey.length > 8,
    now: () => Date.now(),
    randomCode: () => String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)),
    lastSent: async (h) => { const { data } = await admin.from('phone_otps').select('created_at').eq('phone', h).order('id', { ascending: false }).limit(1); return data && data[0] ? Date.parse(data[0].created_at) : null },
    countByPhone: async (h, since) => { const { count } = await admin.from('phone_otps').select('id', { count: 'exact', head: true }).eq('phone', h).gte('created_at', iso(since)); return count || 0 },
    countByIp: async (ip, since) => { const { count } = await admin.from('phone_otps').select('id', { count: 'exact', head: true }).eq('ip_hash', ip).gte('created_at', iso(since)); return count || 0 },
    countAll: async (since) => { const { count } = await admin.from('phone_otps').select('id', { count: 'exact', head: true }).gte('created_at', iso(since)); return count || 0 },
    insertOtp: async (row) => { const { data, error } = await admin.from('phone_otps').insert(row).select('id').single(); if (error) throw error; return data.id },
    latestOpen: async (h) => { const { data } = await admin.from('phone_otps').select('id,code_hash,attempts').eq('phone', h).eq('used', false).gt('expires_at', iso(Date.now())).order('id', { ascending: false }).limit(1); return data && data[0] ? data[0] : null },
    bumpAttempts: async (id) => { const { data } = await admin.from('phone_otps').select('attempts').eq('id', id).single(); await admin.from('phone_otps').update({ attempts: (data?.attempts || 0) + 1 }).eq('id', id) },
    markUsed: async (id, h) => { await admin.from('phone_otps').update({ used: true }).eq('phone', h).eq('used', false) },
    cleanup: async () => { await admin.from('phone_otps').delete().lt('created_at', iso(Date.now() - DAY)) },
    sendSms: async (phone09, code) => {
      try {
        const u = 'https://api.kavenegar.com/v1/' + encodeURIComponent(smsKey) + '/verify/lookup.json?receptor=' + phone09 + '&token=' + code + '&template=' + encodeURIComponent(smsTemplate)
        const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
        const j = await r.json().catch(() => ({}))
        return r.ok && j?.return?.status === 200
      } catch { return false }
    },
    accountByHash: async (h) => { const { data } = await admin.from('phone_accounts').select('user_id,email').eq('phone_hash', h).maybeSingle(); return data || null },
    createAccount: async (h, name, password) => {
      const email = 'ph-' + crypto.randomUUID() + '@phone.twinland.ir'
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name, via: 'phone' } })
      if (error || !data?.user) return null
      const ins = await admin.from('phone_accounts').insert({ phone_hash: h, user_id: data.user.id, email })
      if (ins.error) return null
      return { user_id: data.user.id, email }
    },
    syncPassword: async (userId, password) => { const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true }); return !error },
    signIn: async (email, password) => {
      const { data, error } = await pub.auth.signInWithPassword({ email, password })
      if (error || !data?.session) return null
      const s = data.session
      return { access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in, user: { id: s.user.id } }
    },
  }

  D.serve(async (req: Request) => {
    const origin = req.headers.get('origin') || ''
    const okOrigin = ORIGINS.includes(origin)
    const cors = { 'Access-Control-Allow-Origin': okOrigin ? origin : ORIGINS[0], 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    const json = (r: Result) => new Response(JSON.stringify(r.body), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
    if (req.method !== 'POST') return json(fail(405, 'method'))
    if (!okOrigin) return json(fail(403, 'origin'))
    let input: any = null
    try { input = await req.json() } catch { return json(fail(400, 'bad_json')) }
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    try { return json(await core(deps, ip, input)) } catch (e) { console.error('phone-auth', e); return json(fail(500, 'server')) }
  })
}
