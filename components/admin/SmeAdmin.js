'use client'
// ─────────────────────────────────────────────────────────────
//  کارت «کسب‌وکارهای تازه و همکاری‌ها» در پنل ادمین — نسخه v5.0، فقط مالک اپ
//  ۱. راه‌اندازی هر نوع مکان: نانوایی، قنادی، فست‌فود و بعدی‌ها. مکان‌های واردشده تا راه‌اندازی پنهان‌اند
//     و نسخه‌های قبل از v5.0 هرگز نوع‌های تازه را نمی‌بینند.
//  ۲. نمای کلی همکاری‌ها با توقف، ادامه و پایان.
//  ۳. ساختن مسیر شهری TwinLand روی هر مکانی، فقط با امتیاز، برای شروع سرد و آزمون دستی.
//  ۴. بازسازی جدول جفت مکان‌ها برای پیشنهاد همکار.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { catInfo } from '@/lib/places/categories'
import { onColor } from '@/lib/theme/ui'
import { STATUS, adminOverview, affinityRebuild, categoryStatus, errText, launchCategory, platformAction, platformCreate, KIND } from '@/lib/alliances/alliances'

const OWNER_EMAIL = 'msmadani88@gmail.com'
const fa = (n) => Number(n || 0).toLocaleString('fa')

export function SmeAdmin({ C }) {
  const [owner, setOwner] = useState(false)
  const [cats, setCats] = useState(null)
  const [ov, setOv] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  // ساختن مسیر شهری
  const [kind, setKind] = useState('trail')
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [steps, setSteps] = useState([])
  const [req, setReq] = useState('')
  const [days, setDays] = useState('30')
  const [xp, setXp] = useState('60')

  const load = useCallback(async () => {
    const [c, o] = await Promise.all([categoryStatus(), adminOverview()])
    setCats(c && c.ok ? c.list || [] : [])
    setOv(o && o.ok ? o : null)
  }, [])
  useEffect(() => {
    const s = getSession()
    const is = !!(s && s.user && String(s.user.email || '').toLowerCase() === OWNER_EMAIL)
    setOwner(is)
    if (is) load()
  }, [load])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setFound([]); return }
    const t = setTimeout(() => {
      const safe = term.replace(/[,()*]/g, ' ')
      fetch(SB_URL + '/rest/v1/cafes?select=id,name,branch,district,category&is_active=eq.true&name=ilike.*' + encodeURIComponent(safe) + '*&order=name.asc&limit=10',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } }).then(r => r.json()).then(rows => setFound(Array.isArray(rows) ? rows : [])).catch(() => setFound([]))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  if (!owner) return null
  const card = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 14 }
  const btn = (kind2) => ({ border: kind2 === 'ghost' ? '1px solid ' + C.border : 'none', background: kind2 === 'ghost' ? 'transparent' : kind2 === 'danger' ? '#ef4444' : C.accent, color: kind2 === 'ghost' ? C.text : kind2 === 'danger' ? '#fff' : onColor(C.accent),
    borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', opacity: busy ? 0.6 : 1 })
  const input = { width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 13, padding: '9px 11px', outline: 'none', fontFamily: 'inherit' }

  const run = async (fn, ok) => {
    setBusy(true); setMsg(null)
    const r = await fn()
    setBusy(false)
    if (!r || !r.ok) { setMsg({ ok: false, text: errText(r, r && r.error) }); return null }
    setMsg({ ok: true, text: typeof ok === 'function' ? ok(r) : ok }); load(); return r
  }
  async function create() {
    const spec = { kind, title: title.trim(), blurb: blurb.trim() || null, steps: steps.map(s => s.id), required_steps: req ? Number(req) : null,
      ends_at: new Date(Date.now() + (Number(days) || 30) * 86400000).toISOString(), xp_reward: Number(xp) || 0 }
    const r = await run(() => platformCreate(spec), (x) => 'مسیر ساخته شد، رده ' + x.tier + '، بازه ' + fa(x.window_hours) + ' ساعت')
    if (r) { setTitle(''); setBlurb(''); setSteps([]); setReq('') }
  }

  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>🏪 کسب‌وکارهای تازه و همکاری‌ها · v5.0</div>
      <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginBottom: 12 }}>هر نوع تازه فقط در ظاهر v5.0 دیده می‌شود. اول یک بار دستی آزموده شود، بعد راه‌اندازی.</div>
      {msg && <div style={{ fontSize: 12.5, fontWeight: 800, color: msg.ok ? '#10b981' : '#ef4444', marginBottom: 10 }}>{msg.text}</div>}

      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>نوع مکان‌ها</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {(cats || []).map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: C.chip }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>{c.label} <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>· {c.key}</span></span>
            <span style={{ fontSize: 11.5, color: C.sub }}>{fa(c.active)} فعال · {fa(c.pending)} منتظر</span>
            {c.key !== 'cafe' && c.key !== 'restaurant' && (c.enabled
              ? <button style={btn('ghost')} disabled={busy} onClick={() => { if (window.confirm('«' + c.label + '» خاموش شود و مکان‌های واردشده‌اش دوباره پنهان شوند؟')) run(() => launchCategory(c.key, false), (r) => fa(r.places) + ' مکان پنهان شد') }}>خاموش</button>
              : <button style={btn()} disabled={busy} onClick={() => { if (window.confirm('«' + c.label + '» راه‌اندازی شود؟ ' + fa(c.pending) + ' مکان روی نقشه v5.0 می‌آید.')) run(() => launchCategory(c.key, true), (r) => fa(r.places) + ' مکان روی نقشه آمد') }}>راه‌اندازی</button>)}
          </div>
        ))}
        {cats === null && <div style={{ fontSize: 12, color: C.sub }}>در حال بارگذاری…</div>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>همکاری‌ها</div>
      {ov && <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11.5, marginBottom: 8 }}>
          {Object.entries(ov.by_status || {}).map(([k, n]) => <span key={k} style={{ background: C.chip, borderRadius: 99, padding: '3px 9px' }}>{STATUS[k] || k}: {fa(n)}</span>)}
          <span style={{ background: C.chip, borderRadius: 99, padding: '3px 9px' }}>کوپن: {fa(ov.coupons && ov.coupons.issued)} · استفاده {fa(ov.coupons && ov.coupons.redeemed)}</span>
          <span style={{ background: C.chip, borderRadius: 99, padding: '3px 9px' }}>مسیر در حال رفتن {fa(ov.runs && ov.runs.active)} · تمام {fa(ov.runs && ov.runs.done)}</span>
          <span style={{ background: C.chip, borderRadius: 99, padding: '3px 9px' }}>دستگاه صندوق: {fa(ov.devices)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {(ov.items || []).map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: C.chip, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, fontWeight: 800 }}>{a.title} <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>· {(KIND[a.kind] || {}).label}{a.is_platform ? ' · TwinLand' : ''} · {STATUS[a.status] || a.status} · تمام {fa(a.done_n)}</span></span>
              {(a.status === 'active' || a.status === 'scheduled') && <button style={btn('ghost')} disabled={busy} onClick={() => run(() => platformAction(a.id, 'pause'), 'متوقف شد')}>توقف</button>}
              {a.status === 'paused' && <button style={btn()} disabled={busy} onClick={() => run(() => platformAction(a.id, 'resume'), 'ادامه پیدا کرد')}>ادامه</button>}
              {['active', 'scheduled', 'paused', 'proposed', 'countered'].includes(a.status) && <button style={btn('danger')} disabled={busy} onClick={() => { if (window.confirm('«' + a.title + '» تمام شود؟')) run(() => platformAction(a.id, 'end'), 'تمام شد') }}>پایان</button>}
            </div>
          ))}
          {!(ov.items || []).length && <div style={{ fontSize: 12, color: C.sub }}>هنوز همکاری‌ای ساخته نشده.</div>}
        </div>
      </>}

      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>ساختن مسیر شهری TwinLand</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['trail', 'event'].map(k => <button key={k} style={btn(kind === k ? undefined : 'ghost')} onClick={() => setKind(k)}>{KIND[k].label}</button>)}
        </div>
        <input style={input} value={title} maxLength={60} onChange={e => setTitle(e.target.value)} placeholder="عنوان، مثلاً مسیر نان و قهوه منطقه 6" />
        <input style={input} value={blurb} maxLength={200} onChange={e => setBlurb(e.target.value)} placeholder="یک جمله برای کاربر، اختیاری" />
        <input style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی مکان برای افزودن قدم…" />
        {found.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {found.map(f => (
            <button key={f.id} disabled={steps.length >= 5 || steps.some(s => s.id === f.id)} onClick={() => { setSteps(s => s.concat(f)); setQ('') }}
              style={{ textAlign: 'right', padding: '7px 10px', borderRadius: 10, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer' }}>
              + {f.name}{f.branch ? ' · ' + f.branch : ''} <span style={{ color: C.sub, fontSize: 11 }}>· {catInfo(f.category).label} · {f.district || ''}</span>
            </button>
          ))}
        </div>}
        {steps.length > 0 && <ol style={{ margin: 0, padding: '0 20px 0 0', fontSize: 12.5, lineHeight: 2 }}>
          {steps.map((s, i) => <li key={s.id}>{s.name} <button onClick={() => setSteps(x => x.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>برداشتن</button></li>)}
        </ol>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={input} inputMode="numeric" value={req} onChange={e => setReq(e.target.value.replace(/\D/g, ''))} placeholder={'قدم لازم، پیش‌فرض همه'} />
          <input style={input} inputMode="numeric" value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ''))} placeholder="مدت، روز" />
          <input style={input} inputMode="numeric" value={xp} onChange={e => setXp(e.target.value.replace(/\D/g, ''))} placeholder="امتیاز پایان" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn()} disabled={busy || title.trim().length < 3 || steps.length < (kind === 'trail' ? 2 : 1)} onClick={create}>ساختن و شروع</button>
          <button style={btn('ghost')} disabled={busy} onClick={() => run(() => affinityRebuild(), (r) => 'جفت مکان‌ها بازسازی شد: ' + fa(r.pairs))}>بازسازی جفت مکان‌ها</button>
        </div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>مسیر شهری فقط امتیاز و امتیاز کلن می‌دهد و جایزه کسب‌وکار ندارد. با هر چک‌این در هر نسخه ظاهر پیش می‌رود ولی کارت و خط مسیر فقط در v5.0 دیده می‌شود.</div>
      </div>
    </div>
  )
}
