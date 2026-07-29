'use client'
// ⚠️ این فایل مخصوص مسیر: app/gallery/page.js
// اسم صفحه از app/labels.js میاد — اینجا دستی ننویس.

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { SB_URL, SB_KEY, getSession, subscribeToTables } from '../gameSystem'
import { L, ICON, RARITY_LOCKED, rarityOf, fa, SOURCE_LABEL } from '../labels'

export default function GalleryPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [defs, setDefs] = useState([])        // کاتالوگ کامل
  const [owned, setOwned] = useState({})      // code -> ردیف کامل award
  const [cafeMap, setCafeMap] = useState({})  // cafe_id -> {name, district}
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { setPal(loadPrefs()) }, [])

  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })
  const get = (url, h) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => r.json()).catch(() => [])

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = H(s)
    // select=* می‌گیریم تا هر ستون اضافه‌ای (مثل cafe_id/quest_id) که وجود داره
    // خودکار استفاده بشه، بدون اینکه لازم باشه این فایل عوض بشه.
    const [allDefs, myAwards, allCafes] = await Promise.all([
      get('collectible_defs?select=*&order=rarity.asc,created_at.asc', h),
      get('awards?user_id=eq.' + s.user.id + '&select=*', h),
      get('cafes?select=id,name,district', h),
    ])
    setDefs(Array.isArray(allDefs) ? allDefs : [])
    const om = {}; (Array.isArray(myAwards) ? myAwards : []).forEach(a => { if (a.code) om[a.code] = a })
    setOwned(om)
    const cm = {}; (Array.isArray(allCafes) ? allCafes : []).forEach(c => { cm[c.id] = c })
    setCafeMap(cm)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const s = getSession()
    if (!s || !s.user) return
    const unsub = subscribeToTables([
      { table: 'awards', event: '*', filter: 'user_id=eq.' + s.user.id },
      { table: 'collectible_defs', event: '*' },
    ], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  const visible = defs.filter(d => {
    if (filter === 'owned') return !!owned[d.code]
    if (filter === 'locked') return !owned[d.code]
    if (filter === 'platform') return d.source === 'platform'
    if (filter === 'business') return d.source === 'business'
    return true
  })
  const ownedCount = defs.filter(d => owned[d.code]).length
  const pct = defs.length ? Math.round(ownedCount / defs.length * 100) : 0

  // ── از کدوم کافه گرفتیش؟ ────────────────────────────────────────────────
  // فقط از داده‌ی واقعی خونده می‌شه. اگه ردیف award ستون cafe_id نداشته باشه،
  // سراغ خودِ تعریف آیتم می‌ریم (آیتم‌های کمپینی cafe_id دارن). اگه هیچ‌کدوم
  // نبود، چیزی نشون نمی‌دیم — به‌جای اینکه اسم الکی بسازیم.
  function originOf(def) {
    const aw = owned[def.code]
    const cid = (aw && (aw.cafe_id || aw.ref_cafe_id)) || def.cafe_id || null
    return cid ? cafeMap[cid] : null
  }

  function openCard(d) { setFlipped(false); setSelected(d) }

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glShine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
        @keyframes glFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .gl-cell{animation:glFadeUp .4s ease both}
        .gl-flip{transition:transform .65s cubic-bezier(.4,.2,.2,1);transform-style:preserve-3d}
        .gl-flip.on{transform:rotateY(180deg)}
        .gl-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
        .gl-back{transform:rotateY(180deg)}
      `}} />

      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ {L.map}</a>
        <div style={S.brand}>{ICON.gallery} {L.gallery}</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        {/* هدر قهرمان با نوار پیشرفت */}
        <div style={S.heroCard}>
          <div style={S.heroShine} />
          <div style={{ fontSize: 12, color: C.sub, position: 'relative' }}>{L.gallerySub}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: C.text, marginTop: 2, position: 'relative' }}>
            {fa(ownedCount)}<span style={{ fontSize: 15, color: C.sub, fontWeight: 500 }}> از {fa(defs.length)}</span>
          </div>
          <div style={S.heroTrack}>
            <div style={{ ...S.heroFill, width: pct + '%' }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.sub, marginTop: 6, position: 'relative' }}>
            {pct === 100 ? '🏆 کاملش کردی!' : fa(pct) + '٪ کامل — ' + fa(defs.length - ownedCount) + ' تا مونده'}
          </div>
        </div>

        <div style={S.filterRow}>
          {[['all', 'همه'], ['owned', 'مال من'], ['locked', 'قفل'], ['platform', 'اکتشافی'], ['business', 'کمپینی']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={filter === k ? S.filterActive : S.filter}>{label}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '50px 0' }}>در حال بارگذاری…</div> : (
          visible.length === 0
            ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>چیزی اینجا نیست.</div>
            : <div style={S.grid}>
                {visible.map((d, i) => {
                  const isOwned = !!owned[d.code]
                  const R = rarityOf(d.rarity)
                  return (
                    <button key={d.code} className="gl-cell" onClick={() => openCard(d)}
                      style={{ ...S.cell, background: isOwned ? R.grad : RARITY_LOCKED, animationDelay: Math.min(i * 28, 600) + 'ms', boxShadow: isOwned ? '0 4px 14px ' + R.color + '55' : 'none' }}>
                      <div style={{ fontSize: 38, filter: isOwned ? 'none' : 'grayscale(1) opacity(.65)' }}>{isOwned ? d.icon : '🔒'}</div>
                      {isOwned && <div style={S.cellTitle}>{d.title}</div>}
                      {isOwned && <div style={S.cellCorner} />}
                    </button>
                  )
                })}
              </div>
        )}
      </div>

      {/* ── کارت چرخان ─────────────────────────────────────────────────── */}
      {selected && (() => {
        const isOwned = !!owned[selected.code]
        const aw = owned[selected.code]
        const R = rarityOf(selected.rarity)
        const origin = originOf(selected)
        return (
          <div onClick={() => setSelected(null)} style={S.overlay}>
            <div onClick={e => e.stopPropagation()} style={{ perspective: 1400, width: '100%', maxWidth: 330 }}>
              <div className={'gl-flip' + (flipped ? ' on' : '')}
                onClick={() => isOwned && setFlipped(f => !f)}
                style={{ position: 'relative', width: '100%', aspectRatio: '3/4', cursor: isOwned ? 'pointer' : 'default' }}>

                {/* ── روی کارت ── */}
                <div className="gl-face" style={{ background: isOwned ? R.grad : RARITY_LOCKED, boxShadow: '0 20px 60px rgba(0,0,0,.45)', border: '2px solid rgba(255,255,255,.35)' }}>
                  <div style={{ fontSize: 78, animation: isOwned ? 'glFloat 3s ease-in-out infinite' : 'none', filter: isOwned ? 'drop-shadow(0 6px 14px rgba(0,0,0,.3))' : 'grayscale(1) opacity(.7)' }}>
                    {isOwned ? selected.icon : '🔒'}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', textAlign: 'center', marginTop: 14, textShadow: '0 2px 8px rgba(0,0,0,.35)' }}>
                    {isOwned ? selected.title : '؟؟؟'}
                  </div>
                  <span style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.28)', borderRadius: 99, padding: '4px 13px', border: '1px solid rgba(255,255,255,.3)' }}>
                    {R.label}
                  </span>
                  {isOwned
                    ? <div style={{ position: 'absolute', bottom: 16, fontSize: 10.5, color: 'rgba(255,255,255,.9)', fontWeight: 700 }}>👆 بزن تا برگرده</div>
                    : <div style={{ position: 'absolute', bottom: 16, fontSize: 10.5, color: C.sub, textAlign: 'center', padding: '0 20px' }}>هنوز نگرفتیش</div>}
                </div>

                {/* ── پشت کارت: جزئیات واقعی ── */}
                <div className="gl-face gl-back" style={{ background: C.card, border: '2px solid ' + R.color, boxShadow: '0 20px 60px rgba(0,0,0,.45)', justifyContent: 'flex-start', gap: 0 }}>
                  <div style={{ fontSize: 34, marginBottom: 4 }}>{selected.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text, textAlign: 'center' }}>{selected.title}</div>
                  <span style={{ marginTop: 7, fontSize: 10, fontWeight: 800, color: '#fff', background: R.color, borderRadius: 99, padding: '3px 11px' }}>{R.label}</span>

                  <div style={{ width: '100%', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Row C={C} k="از کجا" v={origin ? '☕ ' + origin.name + (origin.district ? ' · منطقه ' + origin.district : '') : (SOURCE_LABEL[selected.source] || '—')} />
                    {aw && aw.earned_at && <Row C={C} k="کِی" v={'📅 ' + new Date(aw.earned_at).toLocaleDateString('fa-IR') + ' · ' + new Date(aw.earned_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })} />}
                    <Row C={C} k="نوع" v={SOURCE_LABEL[selected.source] || selected.source || '—'} />
                    {aw && aw.code && <Row C={C} k="کد" v={aw.code} mono />}
                  </div>

                  {selected.description && (
                    <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.8, textAlign: 'center', marginTop: 12, padding: '0 4px' }}>{selected.description}</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 14, fontSize: 10, color: C.sub }}>👆 بزن تا برگرده</div>
                </div>
              </div>

              <button onClick={() => setSelected(null)} style={S.closeBtn}>بستن</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function Row({ C, k, v, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.chip, borderRadius: 10, padding: '7px 11px' }}>
      <span style={{ fontSize: 10, color: C.sub, flexShrink: 0, minWidth: 38 }}>{k}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, flex: 1, textAlign: 'left', direction: mono ? 'ltr' : 'rtl', letterSpacing: mono ? 1 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  )
}

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)', borderBottom: '1px solid ' + C.border },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  heroCard: { position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg,' + C.accent + '22, ' + C.card + ' 62%)', border: '1.5px solid ' + C.accent + '44', borderRadius: 22, padding: '18px 16px', marginBottom: 14, textAlign: 'center' },
  heroShine: { position: 'absolute', top: 0, bottom: 0, width: '55%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)', animation: 'glShine 3.4s ease-in-out infinite' },
  heroTrack: { position: 'relative', height: 8, background: C.border, borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  heroFill: { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,' + C.accent + ',#FFD60A)', transition: 'width .9s cubic-bezier(.2,.9,.3,1)' },
  filterRow: { display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' },
  filter: { flexShrink: 0, padding: '8px 14px', borderRadius: 99, border: '1px solid ' + C.border, background: C.chip, color: C.sub, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' },
  filterActive: { flexShrink: 0, padding: '8px 14px', borderRadius: 99, border: 'none', background: C.accent, color: C.accentText, fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 },
  cell: { position: 'relative', aspectRatio: '1', border: 'none', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit', overflow: 'hidden', padding: '6px 4px' },
  cellTitle: { fontSize: 9.5, fontWeight: 800, color: '#fff', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,.45)', lineHeight: 1.3, paddingTop: 2 },
  cellCorner: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '18px solid rgba(255,255,255,.35)', borderLeft: '18px solid transparent' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 },
  closeBtn: { width: '100%', marginTop: 16, padding: '12px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,.92)', color: '#111', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
})
