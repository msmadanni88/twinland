'use client'
// رتبه‌بندی تازه، یک جزء برای تب پنل و برای صفحه /leaderboard.
//  • سه دامنه: این هفته (از شنبه ساعت ۰۰ به وقت تهران)، همیشه، و منطقه.
//  • کارت «جایگاه من» با فاصله تا نفر بالاتر. اگر وارد نشده‌ای، دعوت به ورود.
//  • داده فقط از تابع‌های دیتابیس می‌آید (leaderboard_get، leaderboard_me، leaderboard_regions)؛ حساب کسب‌وکار در جدول نیست.
//  • نمونه‌ها فقط در «همیشه» و فقط تا وقتی کمتر از ۱۰ بازیکن واقعی هست می‌آیند و برچسب «نمونه» دارند.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { LEVELS, SAMPLE_USERS, getLevelInfo, getSession } from '@/lib/game/gameSystem'
import { alpha, mix } from '@/components/v2/theme'
import { track } from '@/lib/analytics'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const SCOPES = [['week', 'این هفته'], ['all', 'همیشه'], ['region', 'منطقه']]
const MEDAL = { 1: '#F5B83D', 2: '#B8C2CC', 3: '#D58B5B' }
const SAMPLE_MIN_REAL = 10

function rpc(name, body, token) {
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

const lvOf = (row) => LEVELS.find(l => l.level === row.level) || getLevelInfo(row.xp).current

// چند روز و ساعت تا شنبه بعد به وقت تهران (ایران ساعت تابستانی ندارد: UTC+3:30)
function weekLeft() {
  const t = new Date(Date.now() + 3.5 * 3600e3)
  const day = t.getUTCDay()                   // 0 یکشنبه ... 6 شنبه
  const sinceSat = (day + 1) % 7
  const msIntoWeek = (sinceSat * 86400 + t.getUTCHours() * 3600 + t.getUTCMinutes() * 60 + t.getUTCSeconds()) * 1000
  const left = 7 * 86400e3 - msIntoWeek
  const d = Math.floor(left / 86400e3), h = Math.floor((left % 86400e3) / 3600e3)
  return d > 0 ? fa(d) + ' روز و ' + fa(h) + ' ساعت' : fa(h) + ' ساعت'
}

function Avatar({ a, name, size, ring, C }) {
  const isUrl = a && /^(https?:)?\/\//.test(a)
  return (
    <span style={{ width: size, height: size, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      fontSize: size * 0.5, fontWeight: 900, background: alpha(ring, 0.14), color: C.text, border: Math.max(2, size / 18) + 'px solid ' + ring, boxSizing: 'border-box' }}>
      {isUrl ? <img src={a} alt="" width={size} height={size} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        : (a && a.length <= 4 ? a : String(name || '؟').trim().slice(0, 1))}
    </span>
  )
}

const CSS = `
@keyframes lbxRise{from{transform:scaleY(.05);opacity:0}to{transform:scaleY(1);opacity:1}}
@keyframes lbxUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes lbxGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
@keyframes lbxShine{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
@keyframes lbxPulse{0%,100%{opacity:.5}50%{opacity:.9}}
.lbx-row{animation:lbxUp .4s both;transition:transform .16s ease}
.lbx-row:active{transform:scale(.99)}
@media (hover:hover){.lbx-row:hover{transform:translateY(-2px)}}
@media (prefers-reduced-motion:reduce){.lbx-row,.lbx-stand,.lbx-glow,.lbx-shine,.lbx-sk{animation:none !important}}
`

export function LeaderboardV3({ C, T, full = false }) {
  // نشست از localStorage خوانده می‌شود، پس بعد از بالا آمدن در مرورگر؛ تا رندر سرور و مرورگر یکی بماند
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { const s = getSession(); setToken((s && s.access_token) || null); setReady(true) }, [])
  const loggedIn = !!token
  const [scope, setScope] = useState('week')
  const [region, setRegion] = useState(null)
  const [regions, setRegions] = useState([])
  const [rows, setRows] = useState(null)
  const [me, setMe] = useState(null)
  const [fail, setFail] = useState(false)

  useEffect(() => { track('leaderboard_view', { scope, where: full ? 'page' : 'panel' }) }, [scope]) // eslint-disable-line

  useEffect(() => {
    if (!ready) return
    let alive = true
    rpc('leaderboard_regions', {}, token).then(r => {
      if (!alive || !Array.isArray(r)) return
      setRegions(r)
      setRegion(prev => prev || (r[0] && r[0].region) || null)
    })
    return () => { alive = false }
  }, [token, ready])

  const load = useCallback(() => {
    if (!ready) return () => {}
    if (scope === 'region' && !region) { setRows([]); setMe(null); return () => {} }
    let alive = true
    setFail(false)
    const args = { p_scope: scope, p_region: scope === 'region' ? region : null }
    Promise.all([
      rpc('leaderboard_get', { ...args, p_limit: 50 }, token),
      loggedIn ? rpc('leaderboard_me', args, token) : Promise.resolve(null),
    ]).then(([list, mine]) => {
      if (!alive) return
      if (!Array.isArray(list)) { setFail(true); setRows(r => r || []); return }
      setRows(list)
      setMe(Array.isArray(mine) && mine[0] ? mine[0] : null)
    })
    return () => { alive = false }
  }, [scope, region, token, loggedIn, ready])

  useEffect(() => { setRows(null); setMe(null); return load() }, [load])
  // هر دقیقه بی‌صدا تازه می‌شود، فقط وقتی تب دیده می‌شود
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load() }, 60000)
    return () => clearInterval(t)
  }, [load])

  // فهرست نمایشی: نمونه‌ها فقط در «همیشه» و فقط وقتی بازیکن واقعی کم است
  const list = useMemo(() => {
    if (!rows) return null
    if (scope !== 'all' || rows.length >= SAMPLE_MIN_REAL) return rows
    const merged = [...rows, ...SAMPLE_USERS.map(s => ({ user_id: s.id, name: s.name, avatar: s.avatar, xp: s.xp, level: getLevelInfo(s.xp).current.level, streak: 0, checkins: 0, cafes: 0, sample: true }))]
      .sort((a, b) => b.xp - a.xp)
    let prev = null, rk = 0
    return merged.map((r, i) => { if (prev === null || r.xp !== prev) { rk = i + 1; prev = r.xp } return { ...r, rank: rk } })
  }, [rows, scope])

  const top3 = list ? list.filter(r => r.rank <= 3).slice(0, 3) : []
  const podium = [top3.find(r => r.rank === 2) || top3[1], top3[0], top3.find(r => r.rank === 3) || top3[2]].filter(Boolean)
  const rest = list ? list.filter(r => !top3.includes(r)) : []
  const mineInList = list ? list.find(r => r.me) : null
  const pad = full ? '0 16px' : '0 12px'

  const card = { background: C.card, border: '1px solid ' + T.hair, borderRadius: 20, boxShadow: T.shadow1 }

  return (
    <div style={{ padding: full ? '4px 0 40px' : '10px 0 32px' }}>
      <style>{CSS}</style>

      {/* دامنه‌ها */}
      <div style={{ padding: pad }}>
        <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 16, background: T.chip }}>
          {SCOPES.map(([k, label]) => {
            const on = scope === k
            return <button key={k} role="tab" aria-selected={on} className="tl2-press" onClick={() => setScope(k)}
              style={{ flex: 1, height: 38, border: 'none', borderRadius: 13, fontSize: 13, fontWeight: on ? 900 : 700, fontFamily: 'inherit',
                background: on ? C.card : 'transparent', color: on ? C.text : C.sub, boxShadow: on ? T.shadow1 : 'none' }}>{label}</button>
          })}
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, textAlign: 'center', marginTop: 8, lineHeight: 1.8 }}>
          {scope === 'week' && <>امتیازهای این هفته · <b style={{ color: C.text }}>{weekLeft()}</b> تا شروع هفته بعد</>}
          {scope === 'all' && 'مجموع همه امتیازها از روز اول'}
          {scope === 'region' && 'امتیازی که از چک‌این در یک منطقه می‌آید'}
        </div>
        {scope === 'region' && (
          <div className="tl2-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 0 2px' }}>
            {regions.length === 0 && <span style={{ fontSize: 12, color: C.sub, margin: '0 auto' }}>هنوز منطقه‌ای بازیکن ندارد</span>}
            {regions.map(r => {
              const on = region === r.region
              return <button key={r.region} className="tl2-press" onClick={() => setRegion(r.region)}
                style={{ flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 99, border: '1px solid ' + (on ? 'transparent' : T.hair), fontFamily: 'inherit', fontSize: 12, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap',
                  background: on ? C.accent : T.chip, color: on ? T.onAccent : C.text }}>{r.region} · {fa(r.players)}</button>
            })}
          </div>
        )}
      </div>

      {/* جایگاه من */}
      <div style={{ padding: pad, marginTop: 14 }}>
        <MyCard C={C} T={T} loggedIn={loggedIn} me={me} mineRow={mineInList} scope={scope} card={card} />
      </div>

      {/* لود و خطا */}
      {list === null && (
        <div style={{ padding: pad, marginTop: 14 }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="lbx-sk" style={{ height: 58, borderRadius: 16, background: T.chip, marginBottom: 8, animation: 'lbxPulse 1.4s ease-in-out infinite', animationDelay: i * 0.12 + 's' }} />)}
        </div>
      )}
      {fail && <div style={{ textAlign: 'center', padding: 18, color: C.sub, fontSize: 12.5 }}>جدول لود نشد. <button onClick={load} style={{ border: 'none', background: 'none', color: C.accent, fontWeight: 800, fontFamily: 'inherit' }}>دوباره</button></div>}
      {list && list.length === 0 && !fail && (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>🏁</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 4 }}>{scope === 'week' ? 'این هفته هنوز کسی امتیاز نگرفته' : 'هنوز کسی اینجا نیست'}</div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>اولین چک‌این را بزن تا اسمت بالای جدول بنشیند</div>
        </div>
      )}

      {/* سکو */}
      {podium.length > 0 && (
        <div style={{ padding: pad, marginTop: 16 }}>
          <div style={{ ...card, padding: '22px 10px 0', overflow: 'hidden', position: 'relative',
            background: 'radial-gradient(120% 90% at 50% 0%,' + alpha(MEDAL[1], 0.16) + ',' + C.card + ' 62%)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: full ? 14 : 8 }}>
              {podium.map(p => <PodiumCol key={p.user_id} p={p} C={C} T={T} full={full} />)}
            </div>
          </div>
        </div>
      )}

      {/* بقیه */}
      {rest.length > 0 && (
        <div style={{ padding: pad, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((p, i) => <Row key={p.user_id} p={p} i={i} C={C} T={T} scope={scope} />)}
        </div>
      )}

      {list && list.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: C.sub, marginTop: 16, lineHeight: 1.9 }}>
          {list.some(r => r.sample) ? 'ردیف‌های «نمونه» ساختگی‌اند و با رسیدن بازیکن‌های واقعی برداشته می‌شوند' : 'جدول هر دقیقه تازه می‌شود'}
        </div>
      )}
    </div>
  )
}

function PodiumCol({ p, C, T, full }) {
  const lv = lvOf(p), col = MEDAL[p.rank] || MEDAL[3]
  const first = p.rank === 1
  const h = first ? 104 : p.rank === 2 ? 78 : 62
  const av = first ? (full ? 76 : 66) : (full ? 62 : 54)
  return (
    <div style={{ flex: 1, maxWidth: 130, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'lbxUp .5s both', animationDelay: (first ? 0.05 : 0.18) + 's' }}>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        {first && <span aria-hidden style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 22, filter: 'drop-shadow(0 2px 6px ' + alpha(col, 0.6) + ')' }}>👑</span>}
        <span className="lbx-glow" aria-hidden style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'radial-gradient(circle,' + alpha(col, 0.5) + ',transparent 70%)', animation: 'lbxGlow 2.8s ease-in-out infinite' }} />
        <span style={{ position: 'relative', display: 'block' }}><Avatar a={p.avatar} name={p.name} size={av} ring={col} C={C} /></span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 900, color: C.text, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
        {p.name}{p.me && <Tag bg={C.accent} fg={T.onAccent}>تو</Tag>}{p.sample && <Tag bg={T.chip} fg={C.sub}>نمونه</Tag>}
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{lv.icon} {lv.name}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color: C.text, marginTop: 3 }}>{fa(p.xp)} <span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>XP</span></div>
      <div className="lbx-stand" style={{ width: '100%', height: h, marginTop: 8, borderRadius: '14px 14px 0 0', position: 'relative', overflow: 'hidden', transformOrigin: 'bottom',
        background: 'linear-gradient(180deg,' + col + ',' + mix(col, C.card, 0.72) + ')', animation: 'lbxRise .7s cubic-bezier(.2,.9,.3,1) both', animationDelay: (first ? 0.1 : 0.25) + 's' }}>
        <span className="lbx-shine" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent)', animation: 'lbxShine 4.5s ease-in-out infinite', animationDelay: (p.rank * 0.8) + 's' }} />
        <span style={{ position: 'relative', display: 'block', textAlign: 'center', paddingTop: 8, fontSize: first ? 30 : 24, fontWeight: 900, color: 'rgba(0,0,0,.55)', lineHeight: 1 }}>{fa(p.rank)}</span>
      </div>
    </div>
  )
}

function Tag({ bg, fg, children }) {
  return <span style={{ fontSize: 9.5, fontWeight: 800, background: bg, color: fg, borderRadius: 99, padding: '1px 7px', flexShrink: 0 }}>{children}</span>
}

function Row({ p, i, C, T, scope }) {
  const lv = lvOf(p)
  return (
    <div className="lbx-row" style={{ animationDelay: Math.min(i, 12) * 0.03 + 's', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 18,
      background: p.me ? alpha(C.accent, 0.1) : C.card, border: '1.5px solid ' + (p.me ? alpha(C.accent, 0.6) : T.hair), boxShadow: p.me ? T.glow(C.accent, 0.3) : 'none' }}>
      <span style={{ width: 28, textAlign: 'center', fontSize: 14.5, fontWeight: 900, color: p.me ? C.accent : C.sub, flexShrink: 0 }}>{fa(p.rank)}</span>
      <Avatar a={p.avatar} name={p.name} size={42} ring={lv.color} C={C} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          {p.me && <Tag bg={C.accent} fg={T.onAccent}>تو</Tag>}
          {p.sample && <Tag bg={T.chip} fg={C.sub}>نمونه</Tag>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: C.sub, flexWrap: 'wrap' }}>
          <span style={{ color: lv.color, fontWeight: 800 }}>{lv.icon} {lv.name}</span>
          {p.streak > 0 && <span>🔥 {fa(p.streak)}</span>}
          {p.checkins > 0 && <span>📍 {fa(p.checkins)}</span>}
          {p.cafes > 0 && <span>☕ {fa(p.cafes)}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{fa(p.xp)}</div>
        <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 700 }}>{scope === 'week' ? 'XP این هفته' : 'XP'}</div>
      </div>
    </div>
  )
}

function MyCard({ C, T, loggedIn, me, mineRow, scope, card }) {
  const base = { ...card, padding: 16, position: 'relative', overflow: 'hidden' }
  if (!loggedIn) {
    return (
      <div style={{ ...base, textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>جایگاهت را ببین</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>وارد شو تا رتبه‌ات و فاصله‌ات با نفر بالاتر اینجا بیاید</div>
      </div>
    )
  }
  if (!me) {
    return (
      <div style={{ ...base, textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>{scope === 'week' ? 'این هفته هنوز امتیازی نگرفته‌ای' : scope === 'region' ? 'در این منطقه هنوز چک‌این نداری' : 'هنوز در جدول نیستی'}</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>یک چک‌این بزن تا اسمت بیاید</div>
      </div>
    )
  }
  const first = me.rank === 1
  const gap = Number(me.gap_up || 0)
  return (
    <div style={{ ...base, background: 'linear-gradient(135deg,' + alpha(C.accent, 0.2) + ',' + C.card + ' 70%)', border: '1.5px solid ' + alpha(C.accent, 0.5), boxShadow: T.glow(C.accent, 0.35) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'center', minWidth: 74 }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>رتبه تو</div>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, color: C.accent }}>{fa(me.rank)}</div>
          <div style={{ fontSize: 10.5, color: C.sub }}>از {fa(me.total)} نفر</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: T.hair }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{fa(me.xp)} <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>XP</span></div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>
            {first ? 'اول جدولی. حالا نگهش دار 👑'
              : gap > 0 ? <>فقط <b style={{ color: C.text }}>{fa(gap)} XP</b> تا {me.next_name ? <b style={{ color: C.text }}>{me.next_name}</b> : 'نفر بالاتر'}</>
              : 'هم‌امتیاز با نفر بالاتر'}
          </div>
        </div>
      </div>
    </div>
  )
}
