'use client'
// ─────────────────────────────────────────────────────────────
//  پنل کسب‌وکار — نسخه ظاهر v3.0
//  یک پوسته با ناوبری کناری در دسکتاپ و ردیف برگه‌ها در موبایل. داده از همان توابع
//  محافظت‌شده دیتابیس می‌آید: business_dashboard، business_area_overview و business_collab_overview.
//  این صفحه هیچ تصمیم امنیتی نمی‌گیرد؛ هر دسترسی را خود دیتابیس بررسی می‌کند.
//  پنل قبلی در app/business/page.js سر جایش مانده و در نسخه‌های قدیمی‌تر ظاهر نشان داده می‌شود.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '@/lib/theme/palettes'
import { SB_URL, SB_KEY } from '@/lib/config'
import { getSession, subscribeToTables } from '@/lib/game/gameSystem'
import { UIStyles, onColor } from '@/lib/theme/ui'
import { Btn, Card, Empty, bizTokens, fa } from '@/components/v3/business/bizUi'
import { Clans, Collab, Customers, DemoCampaigns, Overview, Timing } from '@/components/v3/business/sections'
import { AreaMap } from '@/components/v3/business/AreaMap'
import { useBizSim } from '@/components/v3/demo/useBizSim'

const OWNER_EMAIL = 'msmadani88@gmail.com'
const NAV = [
  ['overview', '🏠', 'نمای کلی'], ['customers', '👥', 'مشتری‌ها'], ['timing', '⏰', 'زمان‌بندی'], ['area', '🗺', 'نقشه و محله'],
  ['campaigns', '🎯', 'کمپین‌ها'], ['clans', '🛡', 'کلن‌ها'], ['collab', '🤝', 'همکاری'], ['storefront', '🏪', 'ویترین و منو'], ['account', '⚙️', 'حساب'],
]

export function BusinessApp({ slots }) {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [wide, setWide] = useState(false)
  const [tab, setTab] = useState('overview')
  const [businesses, setBusinesses] = useState([])
  const [sel, setSel] = useState(null)
  const [dash, setDash] = useState(null)
  const [area, setArea] = useState(null)
  const [collab, setCollab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dashState, setDashState] = useState('idle')   // idle | loading | ready | denied
  const [isOwner, setIsOwner] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demoOn, setDemoOn] = useState(false)
  const [demoCollab, setDemoCollab] = useState(null)   // پیشنهادهای همکاری که در همین نمایش داده یا پذیرفته شده
  const selRef = useRef(null)

  useEffect(() => {
    setPal(loadPrefs())
    const fit = () => setWide(window.innerWidth >= 960)
    fit(); window.addEventListener('resize', fit)
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('demo') === '1') sessionStorage.setItem('tl_demo', '1')
      if (sp.get('demo') === '0') sessionStorage.removeItem('tl_demo')
      setDemoOn(sessionStorage.getItem('tl_demo') === '1')
    } catch (e) {}
    return () => window.removeEventListener('resize', fit)
  }, [])

  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY), 'Content-Type': 'application/json' })
  const rpc = (name, body) => {
    const s = getSession()
    if (!s || !s.access_token) return Promise.resolve({ ok: false, error: 'not_authenticated' })
    return fetch(SB_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: H(s), body: JSON.stringify(body || {}) }).then(r => r.json()).catch(() => ({ ok: false, error: 'network' }))
  }

  const loadList = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    setIsOwner(String(s.user.email || '').toLowerCase() === OWNER_EMAIL)
    const rows = await fetch(SB_URL + '/rest/v1/businesses?owner_id=eq.' + s.user.id + '&select=id,cafe_id,status,plan,created_at,cafes(name,district,icon_id,motto,is_full,featured_menu_item_id)&order=created_at.desc', { headers: H(s) }).then(r => r.json()).catch(() => [])
    const arr = Array.isArray(rows) ? rows : []
    setBusinesses(arr)
    setSel(prev => (prev && arr.some(b => b.id === prev)) ? prev : ((arr.find(b => b.status === 'verified') || arr[0] || {}).id || null))
    setLoading(false)
  }, [])

  const loadData = useCallback(async (b, quiet) => {
    if (!b || b.status !== 'verified') { setDash(null); setArea(null); setCollab(null); setDashState(b ? 'denied' : 'idle'); return }
    if (!quiet) setDashState('loading')
    const [res, ar, co] = await Promise.all([rpc('business_dashboard', { p_business_id: b.id }), rpc('business_area_overview', { p_business_id: b.id }), rpc('business_collab_overview', { p_business_id: b.id })])
    if (selRef.current !== b.id) return
    const ok = !!(res && res.ok)
    const arr = (v) => (ok && Array.isArray(v) ? v : [])
    setDash(ok ? {
      stat: {}, daily: arr(res.daily), hourly: arr(res.hourly), weekday: arr(res.weekday),
      retention: res.retention || null, periods: res.periods || null, clv: res.clv || null, cohort: res.cohort || null, rank: res.rank || null,
      clans: arr(res.clans), covisit: arr(res.covisit), quests: arr(res.quests), qstats: arr(res.qstats), favCount: res.fav_count || 0,
    } : null)
    setArea(ar && ar.ok ? ar : null)
    setCollab(co && co.ok ? co : null)
    setDashState(ok ? 'ready' : 'denied')
  }, [])

  const current = useMemo(() => businesses.find(b => b.id === sel) || null, [businesses, sel])
  selRef.current = sel
  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { if (!demoOn) loadData(current) }, [current && current.id, current && current.status, demoOn])
  useEffect(() => {
    if (demoOn) return
    const unsub = subscribeToTables([{ table: 'businesses', event: '*' }, { table: 'quests', event: '*' }], () => loadList())
    const t = setInterval(() => { if (!document.hidden) { loadList(); const b = businesses.find(x => x.id === selRef.current); if (b) loadData(b, true) } }, 60000)
    return () => { unsub(); clearInterval(t) }
  }, [demoOn, loadList, loadData, businesses])

  // حالت نمایشی: همان دنیای شبیه‌سازی نقشه، از نگاه یکی از مکان‌ها — چیزی از دیتابیس خوانده یا در آن نوشته نمی‌شود
  const bizSim = useBizSim(demoOn)
  useEffect(() => { if (!demoOn) setDemoCollab(null) }, [demoOn])
  const demo = demoOn && bizSim ? { biz: bizSim.biz, d: bizSim.d, area: bizSim.area, collab: demoCollab || bizSim.collab, last: bizSim.last, n: bizSim.n } : null
  const setDemo = (fn) => setDemoCollab(prev => fn({ collab: prev || (bizSim && bizSim.collab) }).collab)
  const toggleDemo = () => setDemoOn(v => { try { if (v) sessionStorage.removeItem('tl_demo'); else sessionStorage.setItem('tl_demo', '1') } catch (e) {} return !v })

  const C = buildC(pal.palette, pal.mode)
  const K = bizTokens(C)
  const view = demoOn && demo ? { biz: demo.biz, d: demo.d, area: demo.area, collab: demo.collab, state: 'ready' } : { biz: current, d: dash, area, collab, state: dashState }
  const pendingIn = ((view.collab && view.collab.items) || []).filter(i => i.incoming && i.status === 'pending').length

  async function propose(p) {
    if (demoOn) { setDemo(s => ({ ...s, collab: { ...s.collab, items: [{ id: 'n' + Date.now(), kind: p.kind, title: p.title, message: p.message || null, status: 'pending', incoming: false, other_name: (s.collab.directory.find(x => x.business_id === p.to) || {}).name || '', other_district: '' }].concat(s.collab.items) } })); return { ok: true } }
    setBusy(true)
    const res = await rpc('business_collab_propose', { p_from_business: current.id, p_to_business: p.to, p_kind: p.kind, p_title: p.title, p_message: p.message || null })
    setBusy(false)
    if (res && res.ok) loadData(current, true)
    return res
  }
  async function respond(id, action) {
    if (demoOn) { setDemo(s => ({ ...s, collab: { ...s.collab, items: s.collab.items.map(i => i.id === id ? { ...i, status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled' } : i) } })); return }
    setBusy(true)
    await rpc('business_collab_respond', { p_collab_id: id, p_action: action })
    setBusy(false)
    loadData(current, true)
  }
  async function claimAll() { setBusy(true); const r = await rpc('owner_claim_all_cafes', {}); setBusy(false); if (r && r.ok) loadList() }
  function logout() { try { localStorage.removeItem('tl_session') } catch (e) {} window.location.href = '/' }

  const navBtn = (k, icon, label) => {
    const on = tab === k
    return (
      <button key={k} className="tl-press" onClick={() => setTab(k)}
        style={wide
          ? { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: 'none', background: on ? C.accent : 'transparent', color: on ? onColor(C.accent) : C.text, fontSize: 13.5, fontWeight: on ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right' }
          : { flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 99, border: '1px solid ' + (on ? 'transparent' : C.border), background: on ? C.accent : C.card, color: on ? onColor(C.accent) : C.text, fontSize: 12.5, fontWeight: on ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: wide ? 16 : 14 }}>{icon}</span><span style={{ flex: wide ? 1 : 'none' }}>{label}</span>
        {k === 'collab' && pendingIn > 0 && <span style={{ background: '#d03b3b', color: '#fff', borderRadius: 99, fontSize: 10.5, fontWeight: 900, padding: '1px 7px' }}>{fa(pendingIn)}</span>}
      </button>
    )
  }

  const switcher = businesses.length > 1 && !demoOn && (
    <select value={sel || ''} onChange={e => setSel(Number(e.target.value))}
      style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 13, fontWeight: 700, padding: '9px 10px', fontFamily: 'inherit', outline: 'none' }}>
      {businesses.map(b => <option key={b.id} value={b.id}>{(b.cafes && b.cafes.name) || 'کسب‌وکار'}{b.status === 'pending' ? ' · در انتظار تأیید' : ''}</option>)}
    </select>
  )
  const identity = view.biz && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: C.accent, color: onColor(C.accent), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏪</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(view.biz.cafes && view.biz.cafes.name) || 'کسب‌وکار'}</div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{(view.biz.cafes && view.biz.cafes.district) || ''} · <span style={{ color: view.biz.status === 'verified' ? K.good : K.warn, fontWeight: 800 }}>{view.biz.status === 'verified' ? '✓ تأییدشده' : '⏳ در انتظار تأیید'}</span></div>
      </div>
    </div>
  )
  const demoBar = demoOn && (
    <button className="tl-press" onClick={toggleDemo} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: '#d03b3b', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', justifyContent: 'center' }}>
      🎬 حالت نمایشی · همه عددها ساختگی است · خاموش کردن ✕
    </button>
  )

  function body() {
    if (loading && !demoOn) return <Card C={C} K={K}><Empty C={C} icon="⏳" title="در حال بارگذاری…" /></Card>
    if (!view.biz && tab !== 'account') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slots && slots.EmptyState ? <slots.EmptyState C={C} onReload={loadList} /> : <Card C={C} K={K}><Empty C={C} icon="🏪" title="هنوز کسب‌وکاری ثبت نکرده‌ای" /></Card>}
        <div style={{ textAlign: 'center' }}><Btn C={C} kind="ghost" onClick={toggleDemo}>🎬 دیدن پنل با داده ساختگی</Btn></div>
      </div>
    )
    if (tab === 'account') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card C={C} K={K} title="حساب کسب‌وکار">
          {identity}
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 2, marginTop: 12 }}>
            {view.biz && <>طرح: <b style={{ color: C.text }}>{view.biz.plan === 'pro' ? 'PRO' : 'رایگان'}</b><br /></>}
            حساب کسب‌وکار در بازی شرکت نمی‌کند: چک‌این و امتیاز فقط برای حساب کاربری است.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <a href="/?play=1" style={{ textDecoration: 'none' }}><Btn C={C} kind="soft">🗺 دیدن نقشه عمومی</Btn></a>
            <Btn C={C} kind="ghost" onClick={toggleDemo}>{demoOn ? 'خاموش کردن حالت نمایشی' : '🎬 حالت نمایشی با داده ساختگی'}</Btn>
            <Btn C={C} kind="danger" onClick={logout}>خروج</Btn>
          </div>
        </Card>
        {businesses.length > 0 && !demoOn && <Card C={C} K={K} title={'کسب‌وکارهای من · ' + fa(businesses.length)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {businesses.slice(0, 40).map(b => (
              <button key={b.id} className="tl-press" onClick={() => { setSel(b.id); setTab('overview') }} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 12, border: '1px solid ' + (b.id === sel ? C.accent : C.border), background: C.chip, color: C.text, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                <span>{(b.cafes && b.cafes.name) || 'کسب‌وکار'}</span><span style={{ color: b.status === 'verified' ? K.good : K.warn, fontSize: 11.5 }}>{b.status === 'verified' ? '✓ تأییدشده' : '⏳ در انتظار'}</span>
              </button>
            ))}
          </div>
        </Card>}
        {isOwner && !demoOn && <Card C={C} K={K} title="ابزار مالک اپ" hint="فقط برای حساب مالک دیده می‌شود">
          <Btn C={C} kind="soft" disabled={busy} onClick={claimAll}>{busy ? 'در حال اضافه کردن…' : '👑 افزودن همه مکان‌ها برای تست'}</Btn>
        </Card>}
      </div>
    )
    if (view.biz.status !== 'verified') return (
      <Card C={C} K={K}><Empty C={C} icon="⏳" title="درخواست مالکیت در انتظار تأیید است" text="بعد از تأیید، آمار، نقشه محله، کمپین‌ها و همکاری همین‌جا باز می‌شود. تا آن موقع می‌توانی ویترین و منو را آماده کنی." />
        {slots && slots.Content && <div style={{ marginTop: 12 }}><slots.Content C={C} biz={view.biz} isPending onReload={loadList} /></div>}
      </Card>
    )
    if (view.state === 'loading' || (view.state === 'idle' && !view.d)) return <Card C={C} K={K}><Empty C={C} icon="📊" title="در حال گرفتن آمار…" /></Card>
    if (!view.d) return <Card C={C} K={K}><Empty C={C} icon="🔒" title="دسترسی به آمار این کسب‌وکار ممکن نشد" text="صفحه را تازه کن. اگر ادامه داشت، دوباره وارد شو." /></Card>
    if (tab === 'overview') return <Overview C={C} K={K} d={view.d} area={view.area} go={setTab} />
    if (tab === 'customers') return <Customers C={C} K={K} d={view.d} />
    if (tab === 'timing') return <Timing C={C} K={K} d={view.d} area={view.area} />
    if (tab === 'area') return view.area ? <AreaMap C={C} K={K} area={view.area} /> : <Card C={C} K={K}><Empty C={C} icon="🗺" title="داده محله در دسترس نیست" /></Card>
    if (tab === 'clans') return <Clans C={C} K={K} d={view.d} go={setTab} />
    if (tab === 'collab') return <Collab C={C} K={K} collab={view.collab} onPropose={propose} onRespond={respond} busy={busy} />
    if (tab === 'campaigns') return demoOn ? <DemoCampaigns C={C} K={K} d={view.d} />
      : <Card C={C} K={K} title="کمپین‌ها و کد جایزه" hint="کمپین فعال روی نقشه برای همه دیده می‌شود">{slots && slots.Campaigns ? <slots.Campaigns C={C} d={view.d} biz={view.biz} isPending={false} onReload={() => { loadList(); loadData(current, true) }} /> : null}</Card>
    if (tab === 'storefront') return demoOn ? <Card C={C} K={K}><Empty C={C} icon="🏪" title="ویترین در حالت نمایشی باز نیست" text="آیکون، شعار، آیتم ویژه، عکس و منو با کسب‌وکار واقعی ویرایش می‌شود." /></Card>
      : <Card C={C} K={K} title="ویترین و منو" hint="آنچه مردم در برگه مکان تو و روی نقشه می‌بینند">{slots && slots.Content ? <slots.Content C={C} biz={view.biz} isPending={false} onReload={loadList} /> : null}</Card>
    return null
  }

  const title = (NAV.find(n => n[0] === tab) || NAV[0])[2]
  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text, fontFamily: "'Estedad','Vazirmatn',system-ui,sans-serif", direction: 'rtl' }}>
      <UIStyles />
      {wide ? (
        <div style={{ display: 'flex', minHeight: '100dvh' }}>
          <aside style={{ width: 248, flexShrink: 0, position: 'sticky', top: 0, height: '100dvh', boxSizing: 'border-box', background: C.card, borderInlineEnd: '1px solid ' + C.border, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 4px 2px' }}>
              <span style={{ fontSize: 22 }}>🏪</span>
              <div><div style={{ fontSize: 15, fontWeight: 900 }}>TwinLand Business</div><div style={{ fontSize: 11, color: C.sub }}>پنل کسب‌وکار</div></div>
            </div>
            {switcher}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{NAV.map(n => navBtn(n[0], n[1], n[2]))}</nav>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demoBar}
              <a href="/?play=1" style={{ fontSize: 12.5, color: C.accent, fontWeight: 800, textDecoration: 'none', textAlign: 'center', padding: '8px', borderRadius: 12, background: C.chip }}>🗺 نقشه عمومی</a>
            </div>
          </aside>
          <main style={{ flex: 1, minWidth: 0, padding: '22px 26px 40px' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, flex: 1 }}>{title}</h1>
                {identity}
              </header>
              {demoOn && demo && demo.last && <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{demo.last.icon} {demo.last.text} · رویداد ساختگی شماره {fa(demo.n)}</div>}
              {body()}
            </div>
          </main>
        </div>
      ) : (
        <div>
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: C.card, borderBottom: '1px solid ' + C.border, padding: '10px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>{identity || <div style={{ fontSize: 15, fontWeight: 900 }}>🏪 TwinLand Business</div>}</div>
              <a href="/?play=1" style={{ fontSize: 12, color: C.accent, fontWeight: 800, textDecoration: 'none', background: C.chip, padding: '7px 11px', borderRadius: 99, flexShrink: 0 }}>🗺 نقشه</a>
            </div>
            {switcher}
            {demoBar}
            <div className="tl-hscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>{NAV.map(n => navBtn(n[0], n[1], n[2]))}</div>
          </div>
          <main style={{ padding: '12px 12px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {demoOn && demo && demo.last && <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{demo.last.icon} {demo.last.text}</div>}
            {body()}
          </main>
        </div>
      )}
    </div>
  )
}
