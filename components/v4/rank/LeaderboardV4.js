'use client'
// ─────────────────────────────────────────────────────────────
//  رتبه‌بندی — نسخه v4.0، یک جزء برای زبانه پنل و صفحه /leaderboard
//  همان منطق v3.0 (سه دامنه، لیگ هفتگی، کارت جایگاه من، نمونه‌ها فقط وقتی بازیکن واقعی کم است)
//  با این تفاوت‌ها:
//   • سیاه و سفید؛ سکو، کارت لیگ و ردیف‌ها بی‌رنگ‌اند و مدال ایموجی ندارند
//   • چهره هر نفر همان UserAvatar کل سایت است: عکس، آواتار آماده یا حرف اول نام
//   • ضربه روی نام یا چهره، پروفایل آن نفر را باز می‌کند
//   • داده از leaderboard_cards می‌آید که کارت عمومی هر نفر را طبق حریم خصوصی‌اش برمی‌گرداند
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LEVELS, SAMPLE_USERS, getLevelInfo, getSession } from '@/lib/game/gameSystem'
import { fetchLeaderboardCards, rpc } from '@/lib/profile/people'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Card, Chip, Empty, ListRow, Segmented, Skeleton, Tag } from '@/components/v4/kit/kit'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const SCOPES = [['week', 'این هفته'], ['all', 'همیشه'], ['region', 'منطقه']]
const SAMPLE_MIN_REAL = 10
const lvOf = (row) => LEVELS.find(l => l.level === row.level) || getLevelInfo(row.xp).current

function weekLeft() {
  const t = new Date(Date.now() + 3.5 * 3600e3)
  const sinceSat = (t.getUTCDay() + 1) % 7
  const msIntoWeek = (sinceSat * 86400 + t.getUTCHours() * 3600 + t.getUTCMinutes() * 60 + t.getUTCSeconds()) * 1000
  const left = 7 * 86400e3 - msIntoWeek
  const d = Math.floor(left / 86400e3), h = Math.floor((left % 86400e3) / 3600e3)
  return d > 0 ? fa(d) + ' روز و ' + fa(h) + ' ساعت' : fa(h) + ' ساعت'
}

export function LeaderboardV4({ full = false }) {
  const { C, T } = useV4()
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

  useEffect(() => { track('leaderboard_view', { scope, where: full ? 'page' : 'panel', ui: 'v4' }) }, [scope]) // eslint-disable-line

  useEffect(() => {
    if (!ready) return
    let alive = true
    rpc('leaderboard_regions', {}, token ? undefined : null).then(r => {
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
      fetchLeaderboardCards(scope, args.p_region, 50),
      loggedIn ? rpc('leaderboard_me', args) : Promise.resolve(null),
    ]).then(([list, mine]) => {
      if (!alive) return
      if (!Array.isArray(list)) { setFail(true); setRows(r => r || []); return }
      setRows(list)
      setMe(Array.isArray(mine) && mine[0] ? mine[0] : null)
    })
    return () => { alive = false }
  }, [scope, region, token, loggedIn, ready])

  useEffect(() => { setRows(null); setMe(null); return load() }, [load])
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load() }, 60000)
    return () => clearInterval(t)
  }, [load])

  const list = useMemo(() => {
    if (!rows) return null
    if (scope !== 'all' || rows.length >= SAMPLE_MIN_REAL) return rows
    const merged = [...rows, ...SAMPLE_USERS.map(s => ({ id: null, key: s.id, name: s.name, xp: s.xp, level: getLevelInfo(s.xp).current.level, streak: 0, checkins: 0, cafes: 0, sample: true }))]
      .sort((a, b) => b.xp - a.xp)
    let prev = null, rk = 0
    return merged.map((r, i) => { if (prev === null || r.xp !== prev) { rk = i + 1; prev = r.xp } return { ...r, rank: rk } })
  }, [rows, scope])

  const top3 = list ? list.filter(r => r.rank <= 3).slice(0, 3) : []
  const podium = [top3.find(r => r.rank === 2) || top3[1], top3[0], top3.find(r => r.rank === 3) || top3[2]].filter(Boolean)
  const rest = list ? list.filter(r => !top3.includes(r)) : []
  const pad = full ? '0 4px' : '0 12px'

  return (
    <div style={{ padding: full ? '4px 0 30px' : '12px 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: pad }}>
        <Segmented options={SCOPES} value={scope} onChange={setScope} label="دامنه رتبه‌بندی" />
        <div style={{ fontSize: 11.5, color: C.sub, textAlign: 'center', marginTop: 8, lineHeight: 1.8 }}>
          {scope === 'week' && <>امتیازهای این هفته · <b style={{ color: C.text }}>{weekLeft()}</b> تا شروع هفته بعد</>}
          {scope === 'all' && 'مجموع همه امتیازها از روز اول'}
          {scope === 'region' && 'امتیازی که از چک‌این در یک منطقه می‌آید'}
        </div>
        {scope === 'region' && (
          <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 0 2px' }}>
            {regions.length === 0 && <span style={{ fontSize: 12, color: C.sub, margin: '0 auto' }}>هنوز در هیچ منطقه‌ای چک‌این ثبت نشده</span>}
            {regions.map(r => <Chip key={r.region} on={region === r.region} count={r.players} onClick={() => setRegion(r.region)}>{r.region}</Chip>)}
          </div>
        )}
      </div>

      {scope === 'week' && <div style={{ padding: pad }}><LeagueCardV4 token={token} ready={ready} /></div>}

      <div style={{ padding: pad }}><MyCardV4 loggedIn={loggedIn} me={me} scope={scope} /></div>
      <div style={{ padding: pad }}><ListRow icon="users" title="رتبه‌بندی کلن‌ها" sub="امتیاز هفته کلن‌ها و پرچم منطقه‌های این ماه" href="/clan?tab=ranks" /></div>

      {list === null && <div style={{ padding: pad }}><Skeleton h={60} n={5} /></div>}
      {fail && <div style={{ textAlign: 'center', padding: 12, color: C.sub, fontSize: 12.5 }}>جدول لود نشد. <button onClick={load} style={{ border: 'none', background: 'none', color: C.text, fontWeight: 900, fontFamily: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>دوباره</button></div>}
      {list && list.length === 0 && !fail && (
        <Empty icon="trophy" title={scope === 'week' ? 'این هفته هنوز کسی امتیاز نگرفته' : 'هنوز کسی اینجا نیست'}
          text="اولین نفری باش که چک‌این می‌کند؛ صدر جدول منتظر توست." />
      )}

      {podium.length > 0 && (
        <div style={{ padding: pad }}>
          <Card style={{ padding: '26px 10px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: full ? 14 : 8 }}>
              {podium.map(p => <PodiumColV4 key={p.id || p.key} p={p} full={full} />)}
            </div>
          </Card>
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((p, i) => <RowV4 key={p.id || p.key} p={p} i={i} scope={scope} />)}
        </div>
      )}

      {list && list.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: C.sub, lineHeight: 1.9 }}>
          {list.some(r => r.sample) ? 'ردیف‌های «نمونه» ساختگی‌اند و با آمدن بازیکن‌های واقعی برداشته می‌شوند' : 'روی اسم هر نفر بزن تا پروفایلش را ببینی · جدول هر دقیقه تازه می‌شود'}
        </div>
      )}
    </div>
  )
}

function PodiumColV4({ p, full }) {
  const { C, T } = useV4()
  const lv = lvOf(p)
  const first = p.rank === 1
  const h = first ? 96 : p.rank === 2 ? 72 : 56
  const av = first ? (full ? 76 : 64) : (full ? 60 : 52)
  return (
    <div style={{ flex: 1, maxWidth: 130, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tl4Pop .45s both', animationDelay: (first ? 0.05 : 0.15) + 's' }}>
      <PersonLink id={p.id} label={p.name} style={{ flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
        <span style={{ position: 'relative', marginBottom: 6, display: 'block' }}>
          {first && <span aria-hidden style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', color: C.text }}><Icon name="crown" size={18} stroke={1.9} /></span>}
          <UserAvatar person={p} size={av} ring={first} />
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 900, color: C.text, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
          {p.name}{p.me && <Tag strong>تو</Tag>}{p.sample && <Tag>نمونه</Tag>}
        </span>
      </PersonLink>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>لول {fa(lv.level)}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color: C.text, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fa(p.xp)} <span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>XP</span></div>
      <div style={{ width: '100%', height: h, marginTop: 8, borderRadius: R.box + 'px ' + R.box + 'px 0 0', transformOrigin: 'bottom',
        background: first ? C.text : (T.dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.07)'), border: '1px solid ' + T.hair, borderBottom: 'none',
        animation: 'tl4Rise .6s cubic-bezier(.2,.9,.3,1) both', animationDelay: (first ? 0.1 : 0.22) + 's' }}>
        <span style={{ display: 'block', textAlign: 'center', paddingTop: 8, fontSize: first ? 28 : 22, fontWeight: 900, lineHeight: 1, color: first ? T.onAccent : C.text }}>{fa(p.rank)}</span>
      </div>
    </div>
  )
}

function RowV4({ p, i, scope }) {
  const { C, T } = useV4()
  const lv = lvOf(p)
  return (
    <div style={{ animation: 'tl4Pop .35s both', animationDelay: Math.min(i, 12) * 0.025 + 's', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: R.box,
      background: p.me ? T.accentSoft : T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + (p.me ? T.hairStrong : T.hair) }}>
      <span style={{ width: 26, textAlign: 'center', fontSize: 14, fontWeight: 900, color: p.me ? C.text : C.sub, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fa(p.rank)}</span>
      <PersonLink id={p.id} label={p.name} style={{ flex: 1, gap: 11 }}>
        <UserAvatar person={p} size={40} />
        <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            {p.me && <Tag strong>تو</Tag>}
            {p.sample && <Tag>نمونه</Tag>}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 2, fontSize: 11, color: C.sub, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800 }}>لول {fa(lv.level)}</span>
            {p.streak > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="flame" size={12} />{fa(p.streak)}</span>}
            {p.checkins > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="pin" size={12} />{fa(p.checkins)}</span>}
            {p.cafes > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="coffee" size={12} />{fa(p.cafes)}</span>}
          </span>
        </span>
      </PersonLink>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fa(p.xp)}</div>
        <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 700 }}>{scope === 'week' ? 'XP این هفته' : 'XP'}</div>
      </div>
    </div>
  )
}

function LeagueCardV4({ token, ready }) {
  const { C, T } = useV4()
  const [st, setSt] = useState(null)
  useEffect(() => {
    if (!ready) return () => {}
    let alive = true
    const get = () => rpc('league_status', {}, token ? undefined : null).then(r => { if (alive && r && r.prizes) setSt(r) })
    get()
    const t = setInterval(() => { if (!document.hidden) get() }, 300000)
    return () => { alive = false; clearInterval(t) }
  }, [ready, token])
  if (!st) return null
  const last = (st.last && st.last.winners) || []
  const myWin = last.find(w => w.me)
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="trophy" size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: C.text }}>لیگ هفتگی</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1, lineHeight: 1.7 }}>هر هفته سه نفر اول جایزه می‌برند. با {fa(st.min_pts || 50)} امتیاز وارد رقابت می‌شوی.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px 12px' }}>
        {(st.prizes || []).map(p => (
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 900,
              background: p.rank === 1 ? C.text : 'transparent', color: p.rank === 1 ? T.onAccent : C.text, border: '1.5px solid ' + C.text }}>{fa(p.rank)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
              {p.cafe_name && <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>در {p.cafe_name}</div>}
            </div>
            {p.xp_bonus > 0 && <span style={{ fontSize: 11.5, fontWeight: 900, color: C.text, background: C.card, border: '1px solid ' + T.hair, borderRadius: R.pill, padding: '3px 9px', flexShrink: 0 }}>{fa(p.xp_bonus)} امتیاز</span>}
          </div>
        ))}
      </div>
      {last.length > 0 && (
        <div style={{ borderTop: '1px solid ' + T.hair, padding: '10px 14px 12px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, marginBottom: 8 }}>{myWin ? 'هفته پیش تو هم جزو برنده‌ها بودی' : 'برنده‌های هفته پیش'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {last.map(w => {
              const card = w.card || { name: w.name }
              return (
                <PersonLink key={w.rank} id={card.id} label={card.name}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.text, background: w.me ? T.accentSoft : T.chip, border: '1px solid ' + T.hair, borderRadius: R.pill, padding: '3px 10px 3px 4px' }}>
                    <UserAvatar person={card} size={22} />
                    <span>{fa(w.rank)}. {card.name}</span>
                  </span>
                </PersonLink>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

function MyCardV4({ loggedIn, me, scope }) {
  const { C, T } = useV4()
  if (!loggedIn) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>جایگاهت را ببین</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>وارد شو تا رتبه‌ات و فاصله‌ات با نفر بالاتر اینجا بیاید.</div>
      </Card>
    )
  }
  if (!me) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>{scope === 'week' ? 'این هفته هنوز امتیازی نگرفته‌ای' : scope === 'region' ? 'در این منطقه هنوز چک‌این نداری' : 'هنوز در جدول نیستی'}</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>با اولین چک‌این، اسمت هم وارد جدول می‌شود.</div>
      </Card>
    )
  }
  const first = me.rank === 1
  const gap = Number(me.gap_up || 0)
  return (
    <Card style={{ border: '1px solid ' + T.hairStrong }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>رتبه تو</div>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fa(me.rank)}</div>
          <div style={{ fontSize: 10.5, color: C.sub }}>از {fa(me.total)} نفر</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: T.hair }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fa(me.xp)} <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>XP</span></div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.9 }}>
            {first ? 'صدر جدول مال توست؛ حالا نگهش دار.'
              : gap > 0 ? <>فقط <b style={{ color: C.text }}>{fa(gap)} XP</b> با {me.next_name ? <b style={{ color: C.text }}>{me.next_name}</b> : 'نفر بالاتر'} فاصله داری.</>
              : 'با نفر بالاتر هم‌امتیازی.'}
          </div>
        </div>
      </div>
    </Card>
  )
}
