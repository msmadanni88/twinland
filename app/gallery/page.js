'use client'
// ⚠️ این فایل مخصوص مسیر: app/gallery/page.js  (عنوان صفحه: «نگارخانه»)
// اگه این کامنت رو زیر quests/page.js می‌بینی یعنی فایل اشتباه آپلود شده!

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { SB_URL, SB_KEY, getSession, subscribeToTables } from '../gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const RARITY_LABEL = { common: 'معمولی', rare: 'کمیاب', epic: 'حماسی', legendary: 'افسانه‌ای' }
const RARITY_COLOR = { common: '#94a3b8', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' }
const RARITY_GRADIENT = {
  common: 'linear-gradient(145deg,#cbd5e1,#94a3b8)',
  rare: 'linear-gradient(145deg,#60a5fa,#3b82f6)',
  epic: 'linear-gradient(145deg,#a78bfa,#8b5cf6)',
  legendary: 'linear-gradient(145deg,#fbbf24,#f59e0b)',
}
const LOCKED_GRADIENT = 'linear-gradient(145deg,#e2e8f0,#cbd5e1)'

export default function GalleryPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [defs, setDefs] = useState([])       // کاتالوگ کامل
  const [owned, setOwned] = useState({})     // code -> earned_at
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | owned | locked | platform | business
  const [selected, setSelected] = useState(null)

  useEffect(() => { setPal(loadPrefs()) }, [])

  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })
  const get = (url, h) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => r.json()).catch(() => [])

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = H(s)
    const [allDefs, myAwards] = await Promise.all([
      get('collectible_defs?select=*&order=rarity.asc,created_at.asc', h),
      get('awards?user_id=eq.' + s.user.id + '&select=code,earned_at', h),
    ])
    setDefs(Array.isArray(allDefs) ? allDefs : [])
    const om = {}; (Array.isArray(myAwards) ? myAwards : []).forEach(a => { om[a.code] = a.earned_at })
    setOwned(om)
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

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>نگارخانه</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={S.heroCard}>
          <div style={{ fontSize: 13, color: C.sub }}>کلکسیون تو</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginTop: 2 }}>{fa(ownedCount)} <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}>از {fa(defs.length)}</span></div>
        </div>

        <div style={S.filterRow}>
          {[['all', 'همه'], ['owned', 'کسب‌شده'], ['locked', 'قفل'], ['platform', 'اکتشافی'], ['business', 'کمپینی']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={filter === k ? S.filterActive : S.filter}>{label}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '50px 0' }}>در حال بارگذاری…</div> : (
          visible.length === 0
            ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>چیزی اینجا نیست.</div>
            : <div style={S.grid}>
                {visible.map(d => {
                  const isOwned = !!owned[d.code]
                  return (
                    <button key={d.code} onClick={() => setSelected({ ...d, earned_at: owned[d.code] })} style={{ ...S.cell, background: isOwned ? (RARITY_GRADIENT[d.rarity] || RARITY_GRADIENT.common) : LOCKED_GRADIENT }}>
                      <div style={{ fontSize: 40, filter: isOwned ? 'none' : 'grayscale(1) opacity(.7)' }}>{isOwned ? d.icon : '🔒'}</div>
                      {isOwned && <div style={S.cellTitle}>{d.title}</div>}
                    </button>
                  )
                })}
              </div>
        )}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={S.overlay}>
          <div onClick={e => e.stopPropagation()} style={S.sheet}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', margin: '0 auto 12px', background: owned[selected.code] ? (RARITY_GRADIENT[selected.rarity] || RARITY_GRADIENT.common) : LOCKED_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>{owned[selected.code] ? selected.icon : '🔒'}</div>
            <div style={{ fontSize: 17, fontWeight: 800, textAlign: 'center', color: C.text }}>{owned[selected.code] ? selected.title : '؟؟؟'}</div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: RARITY_COLOR[selected.rarity], borderRadius: 99, padding: '3px 10px' }}>{RARITY_LABEL[selected.rarity] || selected.rarity}</span>
              <span style={{ fontSize: 11, color: C.sub, marginRight: 8 }}>{selected.source === 'business' ? 'جایزه‌ی کمپین' : 'اکتشاف پلتفرم'}</span>
            </div>
            {owned[selected.code]
              ? <>
                  {selected.description && <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', marginTop: 12, lineHeight: 1.8 }}>{selected.description}</div>}
                  <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 8 }}>کسب‌شده در {new Date(selected.earned_at).toLocaleDateString('fa-IR')}</div>
                </>
              : <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', marginTop: 12, lineHeight: 1.8 }}>هنوز این آیتم رو نگرفتی. با چک‌این و شرکت در کمپین‌های کافه‌ها کشفش کن.</div>}
            <button onClick={() => setSelected(null)} style={S.closeBtn}>بستن</button>
          </div>
        </div>
      )}
    </div>
  )
}

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)', borderBottom: '1px solid ' + C.border },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  heroCard: { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 14, textAlign: 'center' },
  filterRow: { display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' },
  filter: { flexShrink: 0, padding: '8px 13px', borderRadius: 10, border: 'none', background: C.chip, color: C.sub, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' },
  filterActive: { flexShrink: 0, padding: '8px 13px', borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 },
  cell: { position: 'relative', aspectRatio: '1', border: 'none', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit', overflow: 'hidden', padding: '6px 4px' },
  cellTitle: { fontSize: 9.5, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,.4)', lineHeight: 1.3, paddingTop: 2 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  sheet: { width: '100%', maxWidth: 480, margin: '0 auto', background: C.card, borderRadius: '22px 22px 0 0', padding: '22px 20px 28px' },
  closeBtn: { width: '100%', marginTop: 18, padding: '12px', borderRadius: 12, border: 'none', background: C.chip, color: C.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
})
