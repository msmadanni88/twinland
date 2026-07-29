'use client'
// ⚠️ این فایل مخصوص مسیر: app/quests/page.js
// اسم صفحه از app/labels.js میاد — اینجا دستی ننویس.

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import { SB_URL, SB_KEY, getSession, subscribeToTables } from '../gameSystem'
import { L, ICON, fa } from '../labels'

// «عمومی» عمداً حذف شد — دیگه ماموریت/رویداد بدون دسته نداریم.
// اگه ماموریت قدیمی‌ای هنوز category='general' داشته باشه، به‌جای اینکه ناپدید
// بشه، زیر «رویداد» نشون داده می‌شه (تابع normCat پایین همین کار رو می‌کنه).
const CATEGORY_LABEL = { drink: 'نوشیدنی', food: 'غذا', discount: 'تخفیف', event: 'رویداد', collectible: 'کالکشن' }
const CATEGORY_ICON = { drink: '☕', food: '🍰', discount: '🏷️', event: '🎉', collectible: '💎' }
const normCat = (c) => (c && CATEGORY_LABEL[c]) ? c : 'event'
const GREEN = '#10b981'

// ── گاه‌شمار: فاصله تا یک زمان، به روز/ساعت/دقیقه/ثانیه ──────────────────────
function diffParts(target) {
  const ms = new Date(target).getTime() - Date.now()
  if (!(ms > 0)) return null
  return {
    ms,
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  }
}

export default function QuestsPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [quests, setQuests] = useState([])
  const [progress, setProgress] = useState({})
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [catFilter, setCatFilter] = useState('all')
  const [tick, setTick] = useState(0)   // هر ثانیه یک‌بار، تا گاه‌شمارها زنده بمونن

  useEffect(() => { setPal(loadPrefs()) }, [])

  // یک تایمر واحد برای کل صفحه (به‌جای یکی به‌ازای هر کارت)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const H = (s) => ({ apikey: SB_KEY, Authorization: 'Bearer ' + ((s && s.access_token) || SB_KEY) })
  const get = (url, h) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => r.json()).catch(() => [])

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { if (typeof window !== 'undefined') window.location.href = '/'; return }
    const h = H(s)
    const now = new Date().toISOString()
    const [qs, prog, red] = await Promise.all([
      get('quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.' + now + ')&select=*,cafes(name,district)&order=created_at.desc&limit=100', h),
      get('quest_progress?user_id=eq.' + s.user.id + '&select=*', h),
      get('redemptions?user_id=eq.' + s.user.id + '&select=*&order=issued_at.desc', h),
    ])
    setQuests(Array.isArray(qs) ? qs.filter(q => q.cafe_id) : [])
    const pm = {}; (Array.isArray(prog) ? prog : []).forEach(p => { pm[p.quest_id] = p })
    setProgress(pm)
    setRedemptions(Array.isArray(red) ? red : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const s = getSession()
    if (!s || !s.user) return
    const unsub = subscribeToTables([
      { table: 'quests', event: '*' },
      { table: 'quest_progress', event: '*', filter: 'user_id=eq.' + s.user.id },
      { table: 'redemptions', event: '*', filter: 'user_id=eq.' + s.user.id },
    ], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  // ── تغییر مهم: ماموریت‌های تکمیل‌شده دیگه حذف نمی‌شن ─────────────────────
  // قبلاً با فیلتر از لیست بیرون می‌رفتن، برای همین کاربر نمی‌فهمید چی رو تموم
  // کرده. حالا توی لیست می‌مونن ولی غیرفعال و با تیک سبز، و می‌رن ته لیست.
  const shown = quests
    .filter(q => catFilter === 'all' || normCat(q.category) === catFilter)
    .map(q => ({ q, done: !!(progress[q.id] && progress[q.id].completed) }))
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  const openCount = shown.filter(x => !x.done).length
  const doneCount = shown.filter(x => x.done).length

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes qFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes qPulse{0%,100%{opacity:1}50%{opacity:.55}}
        @keyframes qShine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
        .q-card{animation:qFadeUp .35s ease both;transition:transform .2s cubic-bezier(.2,.9,.3,1), box-shadow .25s ease}
        .q-card.live:active{transform:scale(.985)}
        @media (hover:hover){ .q-card.live:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(0,0,0,.16)} }
        .q-chip{transition:transform .16s ease, background .2s ease}
        .q-chip:active{transform:scale(.95)}
        @media (hover:hover){ .q-chip:hover{transform:translateY(-1px)} }
        .q-urgent{animation:qPulse 1.4s ease-in-out infinite}
      `}} />

      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ {L.map}</a>
        <div style={S.brand}>{ICON.quests} {L.quests}</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={S.tabs}>
          <button className="q-chip" style={tab === 'active' ? S.tabActive : S.tab} onClick={() => setTab('active')}>{L.quests} ({fa(openCount)})</button>
          <button className="q-chip" style={tab === 'rewards' ? S.tabActive : S.tab} onClick={() => setTab('rewards')}>جایزه‌های من ({fa(redemptions.length)})</button>
        </div>

        {tab === 'active' && (
          <>
            <div onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft -= e.deltaY }}
              style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}>
              {[['all', '🎯', 'همه'], ...Object.keys(CATEGORY_LABEL).map(k => [k, CATEGORY_ICON[k], CATEGORY_LABEL[k]])].map(([k, icon, label]) => (
                <button key={k} className="q-chip" onClick={() => setCatFilter(k)} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 99, border: '1px solid ' + C.border, background: catFilter === k ? C.accent : C.chip, color: catFilter === k ? C.accentText : C.sub, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{icon} {label}</button>
              ))}
            </div>
            {doneCount > 0 && (
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, textAlign: 'center' }}>
                ✅ {fa(doneCount)} ماموریت تکمیل‌شده — ته لیست
              </div>
            )}
          </>
        )}

        {loading ? <div style={{ textAlign: 'center', color: C.sub, padding: '50px 0' }}>در حال بارگذاری…</div> : <>
          {tab === 'active' && (
            shown.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>الان ماموریت فعالی نیست. سر بزن یه وقت دیگه ☕</div>
              : shown.map(({ q, done }, i) => <QuestCard key={q.id} C={C} q={q} prog={progress[q.id]} done={done} idx={i} tick={tick} />)
          )}
          {tab === 'rewards' && (
            redemptions.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '40px 0' }}>هنوز جایزه‌ای نگرفتی. یه ماموریت رو کامل کن!</div>
              : redemptions.map(r => <RewardCard key={r.id} C={C} r={r} />)
          )}
        </>}
      </div>
    </div>
  )
}

// ── گاه‌شمار زنده روی کارت ────────────────────────────────────────────────
function Countdown({ C, endsAt }) {
  const t = diffParts(endsAt)
  if (!t) return null
  const urgent = t.ms < 3600000 * 6          // کمتر از ۶ ساعت → قرمزِ چشمک‌زن
  const soon = t.ms < 86400000               // کمتر از یک روز → نارنجی
  const color = urgent ? '#ef4444' : soon ? '#f59e0b' : C.sub
  const parts = []
  if (t.d > 0) parts.push(fa(t.d) + ' روز')
  if (t.d > 0 || t.h > 0) parts.push(fa(t.h) + ' ساعت')
  parts.push(fa(t.m) + ' دقیقه')
  if (t.d === 0 && t.h === 0) parts.push(fa(t.s) + ' ثانیه')
  return (
    <div className={urgent ? 'q-urgent' : ''}
      style={{ display: 'flex', alignItems: 'center', gap: 5, background: color + '18', border: '1px solid ' + color + '44', borderRadius: 99, padding: '5px 11px', fontSize: 11, fontWeight: 800, color, marginTop: 10 }}>
      <span>⏳</span>
      <span>{urgent ? 'فقط ' : ''}{parts.join(' و ')} مونده</span>
    </div>
  )
}

function QuestCard({ C, q, prog, done, idx, tick }) {
  const cur = prog ? prog.progress : 0
  const target = q.target_count || 1
  const pctv = done ? 100 : Math.min(100, Math.round((cur / target) * 100))
  const cafeName = q.cafes ? q.cafes.name : L.cafe
  const district = q.cafes ? q.cafes.district : ''
  const expired = q.ends_at ? !diffParts(q.ends_at) : false

  // ── کارت تکمیل‌شده: خاکستری، غیرفعال، تیک سبز ─────────────────────────
  const cardStyle = done
    ? { background: GREEN + '0d', border: '1.5px solid ' + GREEN + '44', opacity: 0.72, filter: 'saturate(.55)', pointerEvents: 'none' }
    : { background: 'linear-gradient(145deg,' + C.accent + '14, ' + C.card + ' 55%)', border: '1.5px solid ' + C.border }

  return (
    <div className={'q-card' + (done ? '' : ' live')} style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: done ? 'none' : '0 6px 20px rgba(0,0,0,.07)', animationDelay: Math.min(idx * 45, 500) + 'ms', ...cardStyle }}>
      {!done && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '45%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent)', animation: 'qShine 4s ease-in-out infinite', pointerEvents: 'none' }} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: done ? GREEN + '22' : C.accent + '1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {done ? '✅' : (q.icon || '🎯')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: C.text, textDecoration: done ? 'line-through' : 'none', textDecorationColor: GREEN + '99' }}>{q.title}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>☕ {cafeName}{district ? ' · ' + district : ''}</div>
        </div>
        {done && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: GREEN, color: '#fff', borderRadius: 99, padding: '5px 11px', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
            ✓ تکمیل شد
          </span>
        )}
      </div>

      {q.description && <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.75, position: 'relative' }}>{q.description}</div>}

      {target > 1 && (
        <div style={{ marginBottom: 10, position: 'relative' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {/* پله‌های پیشرفت — واضح‌تر از نوار ساده */}
            {Array.from({ length: Math.min(target, 10) }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 7, borderRadius: 99, background: i < (done ? target : cur) ? (done ? GREEN : C.accent) : C.chip, transition: 'background .4s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.sub }}>
            <span>{fa(done ? target : cur)} از {fa(target)}</span>
            <span style={{ fontWeight: 800, color: done ? GREEN : C.accent }}>{fa(pctv)}٪</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: done ? GREEN : C.accent }}>🎁 {q.reward_label}{q.reward_xp > 0 ? ' + ' + fa(q.reward_xp) + ' XP' : ''}</div>
        {q.reward_collectible_code && <span style={{ fontSize: 10, background: C.chip, borderRadius: 99, padding: '3px 9px', color: C.sub, flexShrink: 0 }}>+ آیتم کلکسیونی</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', position: 'relative' }}>
        <span style={{ fontSize: 10, background: C.chip, borderRadius: 99, padding: '3px 9px', color: C.sub }}>{CATEGORY_ICON[normCat(q.category)]} {CATEGORY_LABEL[normCat(q.category)]}</span>
        {q.discount_pct > 0 && <span style={{ fontSize: 10, background: GREEN + '22', borderRadius: 99, padding: '3px 9px', color: GREEN, fontWeight: 700 }}>🏷️ {fa(q.discount_pct)}٪ تخفیف</span>}
      </div>

      {/* گاه‌شمار: فقط برای ماموریت‌های زمان‌دار و تکمیل‌نشده */}
      {!done && q.ends_at && !expired && <Countdown C={C} endsAt={q.ends_at} />}
      {!done && expired && (
        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: '#94a3b8', background: '#94a3b818', borderRadius: 99, padding: '5px 11px', display: 'inline-block' }}>⌛ مهلتش تموم شد</div>
      )}
    </div>
  )
}

function RewardCard({ C, r }) {
  const statusMap = { issued: ['در انتظار ارائه', '#f59e0b'], redeemed: ['استفاده شد', GREEN], expired: ['منقضی شده', '#94a3b8'] }
  const [label, color] = statusMap[r.status] || statusMap.issued
  return (
    <div style={{ background: C.card, border: '1.5px solid ' + color + '33', borderRadius: 16, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 24 }}>🎟️</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{r.reward_label}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>کد: <span style={{ fontFamily: 'monospace', letterSpacing: 1.5, fontWeight: 700, color: C.text }}>{r.code}</span></div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, color, background: color + '18', borderRadius: 99, padding: '4px 10px', flexShrink: 0 }}>{label}</span>
    </div>
  )
}

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)', borderBottom: '1px solid ' + C.border },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 14 },
  tab: { flex: 1, padding: '11px', borderRadius: 14, border: 'none', background: C.chip, color: C.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { flex: 1, padding: '11px', borderRadius: 14, border: 'none', background: C.accent, color: C.accentText, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
})
