'use client'
// ویجت‌های داشبورد کاربر — نسخه v3.0
// هر ویجت یک جزء مستقل است که فقط ctx را می‌گیرد. چیدمان و ترتیبشان در registry.js است.
import { useMemo } from 'react'
import { EventArt } from '@/components/events/EventArt'
import { EventCard, EventRow } from '@/components/events/EventWidget'
import { artTone } from '@/lib/events/art'
import { districtLabel, faNum } from '@/lib/events/format'
import { QUICK_FILTERS } from '@/lib/constants'
import { ICON, L, ROUTE } from '@/lib/theme/labels'
import { hscroll, onColor, useDragScroll } from '@/lib/theme/ui'

// ── قاب مشترک همه ویجت‌ها ───────────────────────────────────
export function Section({ ctx, title, hint, action, children, pad = true, style }) {
  const { C, T } = ctx
  return (
    <section style={{ margin: '0 12px 12px', borderRadius: 24, background: C.card, border: '1px solid ' + T.hair, boxShadow: T.shadow1, overflow: 'hidden', ...style }}>
      {(title || action) && (
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px 0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>{title}</div>
            {hint && <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{hint}</div>}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: pad ? '12px 14px 14px' : '12px 0 14px' }}>{children}</div>
    </section>
  )
}

const linkBtn = (C) => ({ fontSize: 11, fontWeight: 800, color: C.accent, textDecoration: 'none', background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0 })

// ── 1. سلام و پیشرفت ────────────────────────────────────────
const DAY_NAMES = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']   // یکشنبه تا شنبه، ترتیب getDay
const dayKey = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()

export function HeroWidget({ ctx }) {
  const { C, T, levelInfo, xp, streak, userName, checkinDays, setShowXP } = ctx
  const lv = levelInfo.current
  const R = 38, CIRC = 2 * Math.PI * R
  const week = useMemo(() => {
    const set = new Set(checkinDays)
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      out.push({ name: DAY_NAMES[d.getDay()], on: set.has(dayKey(d)), today: i === 0 })
    }
    return out
  }, [checkinDays])
  const remain = levelInfo.next ? Math.max(0, levelInfo.next.minXP - xp) : 0
  return (
    <section style={{ margin: '12px 12px 12px', borderRadius: 26, padding: 16, position: 'relative', overflow: 'hidden', color: C.text,
      background: 'linear-gradient(150deg,' + lv.color + '30,' + C.card + ' 70%)', border: '1px solid ' + lv.color + '45', boxShadow: T.shadow1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="tl-press" onClick={() => setShowXP(true)} aria-label="جزئیات امتیاز" style={{ position: 'relative', width: 92, height: 92, flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="46" cy="46" r={R} fill="none" stroke={C.chip} strokeWidth="9" />
            <circle cx="46" cy="46" r={R} fill="none" stroke={lv.color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - Math.min(100, levelInfo.progress) / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.34,1.2,.64,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{lv.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: C.sub, marginTop: 2 }}>لول {faNum(lv.level)}</span>
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>سلام{userName ? '، ' + userName : ''}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: lv.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 }}>{faNum(xp)} <span style={{ fontSize: 13 }}>XP</span></div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{lv.name}{levelInfo.next ? ' · ' + faNum(remain) + ' تا ' + levelInfo.next.name : ' · بالاترین لول'}</div>
        </div>
        {streak >= 1 && (
          <div style={{ textAlign: 'center', flexShrink: 0, background: streak >= 5 ? (C.gold || '#e8a317') + '30' : C.accent + '1c', borderRadius: 16, padding: '8px 10px' }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{ICON.streak}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{faNum(streak)}</div>
            <div style={{ fontSize: 9, color: C.sub }}>روز</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 14 }} aria-label="هفته اخیر">
        {week.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900,
              background: d.on ? lv.color : C.chip, color: d.on ? onColor(lv.color) : C.sub, outline: d.today ? '2px solid ' + lv.color : 'none', outlineOffset: 2 }}>{d.on ? '✓' : ''}</div>
            <span style={{ fontSize: 9.5, color: d.today ? C.text : C.sub, fontWeight: d.today ? 900 : 600 }}>{d.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── 2. پیشنهاد امروز ────────────────────────────────────────
export function TodayWidget({ ctx }) {
  const { C, T, events, checkedToday, openEvent, streak } = ctx
  const pick = events.find(e => !e.done)
  if (checkedToday && !pick) {
    return <Section ctx={ctx} title="امروز"><div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8 }}>چک‌این امروزت ثبت شده{streak >= 2 ? ' و استریک ' + faNum(streak) + ' روزه‌ات سالم است' : ''}. فردا هم بیا.</div></Section>
  }
  if (!pick) {
    return <Section ctx={ctx} title="امروز"><div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8 }}>{checkedToday ? 'امروز چک‌این کردی. فردا هم بیا تا استریک نسوزد.' : 'یک چک‌این امروز استریکت را نگه می‌دارد. یک کافه را روی نقشه بزن.'}</div></Section>
  }
  const tone = artTone(pick.artKey)
  return (
    <section style={{ margin: '0 12px 12px', borderRadius: 24, padding: 14, color: C.text, border: '1px solid ' + tone + '45', boxShadow: T.shadow1,
      background: 'linear-gradient(150deg,' + tone + '2e,' + C.card + ' 72%)' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, marginBottom: 10 }}>{checkedToday ? 'یکی دیگر برای امروز' : 'پیشنهاد امروز'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <EventArt artKey={pick.artKey} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, lineHeight: 1.45 }}>{pick.title}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{pick.cafeName}{pick.district ? ' · ' + districtLabel(pick.district) : ''}</div>
          {pick.rewardLabel && <div style={{ fontSize: 11.5, fontWeight: 800, color: tone, marginTop: 4 }}>{pick.rewardLabel}{pick.rewardXp > 0 ? ' · +' + faNum(pick.rewardXp) + ' XP' : ''}</div>}
        </div>
      </div>
      <button className="tl-press" onClick={() => openEvent(pick)} style={{ marginTop: 12, width: '100%', height: 42, border: 'none', borderRadius: 14, fontFamily: 'inherit', fontSize: 13, fontWeight: 900, cursor: 'pointer', background: C.accent, color: onColor(C.accent), boxShadow: T.glow(C.accent) }}>برو به {pick.cafeName}</button>
    </section>
  )
}

// ── 3. در جریان است ─────────────────────────────────────────
export function EventsWidget({ ctx }) {
  const { C, events, ready, openEvent } = ctx
  const rail = useDragScroll()
  return (
    <Section ctx={ctx} pad={false} title={<span>در جریان است <span style={{ color: C.green }}>●</span></span>} hint="کمپین‌ها و رویدادهای زنده کافه‌ها"
      action={<a href={ROUTE.quests} style={linkBtn(C)}>همه ›</a>}>
      {!ready
        ? <div style={{ padding: '14px', fontSize: 12, color: C.sub }}>در حال بارگذاری…</div>
        : events.length === 0
          ? <div style={{ padding: '6px 14px', fontSize: 12, color: C.sub, lineHeight: 1.8 }}>الان رویداد فعالی نیست. کافه‌دارها به‌زودی چیزی منتشر می‌کنند و همین‌جا لحظه‌ای می‌آید.</div>
          : <div ref={rail} className="tl-hscroll" style={{ ...hscroll, gap: 10, padding: '2px 14px 4px', scrollSnapType: 'x mandatory' }}>
              {events.map((ev, i) => <EventCard key={ev.id} ev={ev} C={C} idx={i} onClick={() => openEvent(ev)} />)}
            </div>}
    </Section>
  )
}

// ── 4. در دست انجام ─────────────────────────────────────────
export function QuestsWidget({ ctx }) {
  const { C, events, openEvent } = ctx
  const mine = events.filter(e => e.progress > 0 && !e.done && e.target > 1)
  if (!mine.length) return null
  return (
    <Section ctx={ctx} title="در دست انجام" hint="چند چک‌ین تا جایزه مانده"
      action={<a href={ROUTE.quests} style={linkBtn(C)}>همه ›</a>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mine.slice(0, 3).map(ev => {
          const pct = Math.min(100, Math.round((ev.progress / ev.target) * 100))
          return (
            <EventRow key={ev.id} ev={ev} C={C} onClick={() => openEvent(ev)}
              sub={faNum(ev.target - ev.progress) + ' چک‌این تا ' + (ev.rewardLabel || 'جایزه')}
              right={<div style={{ width: 54, textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: artTone(ev.artKey) }}>{faNum(ev.progress)}/{faNum(ev.target)}</div>
                <div style={{ height: 5, borderRadius: 99, background: C.chip, marginTop: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', background: artTone(ev.artKey), borderRadius: 99 }} /></div>
              </div>} />
          )
        })}
      </div>
    </Section>
  )
}

// ── 5. کشف شهر ──────────────────────────────────────────────
const districtNo = (s) => { const m = String(s || '').match(/\d+/); return m ? Number(m[0]) : null }

export function CityWidget({ ctx }) {
  const { C, cafes, checkedIn } = ctx
  const { all, seen, cafesSeen } = useMemo(() => {
    const allSet = new Set(), seenSet = new Set()
    cafes.forEach(c => {
      const n = districtNo(c.district); if (n == null) return
      allSet.add(n)
      if (checkedIn.has(c.id)) seenSet.add(n)
    })
    return { all: Array.from(allSet).sort((a, b) => a - b), seen: seenSet, cafesSeen: checkedIn.size }
  }, [cafes, checkedIn])
  if (!all.length) return null
  const pct = Math.round((seen.size / all.length) * 100)
  return (
    <Section ctx={ctx} title="کشف شهر" hint={faNum(cafesSeen) + ' کافه دیده‌ای'}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{faNum(seen.size)}</span>
        <span style={{ fontSize: 12, color: C.sub }}>از {faNum(all.length)} منطقه</span>
        <span style={{ marginRight: 'auto', fontSize: 12, fontWeight: 900, color: C.accent }}>{faNum(pct)}٪</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: C.chip, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 99, background: 'linear-gradient(90deg,' + C.accent + ',' + (C.gold || C.accent) + ')', transition: 'width .8s' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {all.map(n => (
          <span key={n} style={{ minWidth: 30, height: 28, padding: '0 6px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            background: seen.has(n) ? C.accent : C.chip, color: seen.has(n) ? onColor(C.accent) : C.sub }}>{faNum(n)}</span>
        ))}
      </div>
    </Section>
  )
}

// ── 6. نبض شهر ──────────────────────────────────────────────
export function PulseWidget({ ctx }) {
  const { C, cafes, live, totalLive, setSelCafe } = ctx
  const { top, hot } = useMemo(() => {
    const byD = {}, byId = {}
    cafes.forEach(c => { byId[c.id] = c })
    let hotCafe = null
    Object.keys(live).forEach(id => {
      const c = byId[id]; const n = live[id] || 0
      if (!c || n <= 0) return
      const d = districtNo(c.district); if (d != null) byD[d] = (byD[d] || 0) + n
      if (!hotCafe || n > hotCafe.n) hotCafe = { c, n }
    })
    const rows = Object.keys(byD).map(k => ({ d: Number(k), n: byD[k] })).sort((a, b) => b.n - a.n).slice(0, 3)
    return { top: rows, hot: hotCafe }
  }, [cafes, live])
  const max = top.length ? top[0].n : 1
  return (
    <Section ctx={ctx} title="نبض شهر" hint="چند ساعت اخیر"
      action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: C.text }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 3px ' + C.green + '33' }} />{faNum(totalLive)} آنلاین</span>}>
      {top.length === 0
        ? <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}>الان شهر آرام است. اولین چک‌این را تو بزن.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top.map(r => (
              <div key={r.d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 62, fontSize: 11.5, fontWeight: 800, color: C.text }}>منطقه {faNum(r.d)}</span>
                <div style={{ flex: 1, height: 9, borderRadius: 99, background: C.chip, overflow: 'hidden' }}><div style={{ height: '100%', width: Math.max(8, (r.n / max) * 100) + '%', borderRadius: 99, background: C.accent }} /></div>
                <span style={{ width: 24, textAlign: 'left', fontSize: 11.5, fontWeight: 900, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{faNum(r.n)}</span>
              </div>
            ))}
            {hot && <button className="tl-press" onClick={() => setSelCafe(hot.c)} style={{ marginTop: 4, textAlign: 'right', border: 'none', background: C.chip, color: C.text, borderRadius: 14, padding: '9px 12px', fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer' }}>
              شلوغ‌ترین کافه: <b>{hot.c.name}</b> · {faNum(hot.n)} نفر
            </button>}
          </div>}
    </Section>
  )
}

// ── 7. رتبه تو ──────────────────────────────────────────────
export function RankWidget({ ctx }) {
  const { C, board, goTab } = ctx
  if (!board.length) return null
  const me = board.find(p => p.me)
  const top = board.slice(0, 3)
  const rows = []
  top.forEach(p => rows.push(p))
  if (me && me.rank > 3) {
    const i = board.indexOf(me)
    ;[board[i - 1], me, board[i + 1]].forEach(p => { if (p && !rows.includes(p)) rows.push(p) })
  }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <Section ctx={ctx} title="رتبه‌بندی" hint={me ? 'رتبه تو ' + faNum(me.rank) + ' از ' + faNum(board.length) : null}
      action={<button className="tl-press" onClick={() => goTab('rank')} style={linkBtn(C)}>همه ›</button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((p, i) => {
          const gap = i > 0 && p.rank - rows[i - 1].rank > 1
          return (
            <div key={p.id}>
              {gap && <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, lineHeight: 1 }}>⋯</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 14, background: p.me ? C.accent + '1c' : 'transparent', border: p.me ? '1px solid ' + C.accent + '55' : '1px solid transparent' }}>
                <span style={{ width: 26, textAlign: 'center', fontSize: p.rank <= 3 ? 18 : 12, fontWeight: 900, color: C.sub }}>{medals[p.rank] || faNum(p.rank)}</span>
                <span style={{ fontSize: 16 }}>{p.avatar}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}{p.me ? ' (تو)' : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{faNum(p.xp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── 8. پیدا کن ──────────────────────────────────────────────
export function ExploreWidget({ ctx }) {
  const { C, setSearch, showToast } = ctx
  const rail = useDragScroll()
  return (
    <Section ctx={ctx} pad={false} title="چه حالی داری؟" hint="با یک ضربه روی نقشه فیلتر کن">
      <div ref={rail} className="tl-hscroll" style={{ ...hscroll, gap: 8, padding: '0 14px' }}>
        {QUICK_FILTERS.map(f => (
          <button key={f.tag} className="tl-press" onClick={() => { setSearch(f.tag); showToast && showToast('🔍 ' + f.tag) }}
            style={{ flexShrink: 0, height: 38, padding: '0 14px', borderRadius: 99, border: '1px solid ' + C.border, background: C.chip, color: C.text, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>{f.icon}</span>{f.tag}
          </button>
        ))}
      </div>
    </Section>
  )
}

// ── 9. میان‌برها ────────────────────────────────────────────
export function ShortcutsWidget({ ctx }) {
  const { C } = ctx
  const tiles = [
    { icon: ICON.gallery, label: L.gallery, href: ROUTE.gallery, color: '#8b5cf6' },
    { icon: ICON.quests, label: L.quests, href: ROUTE.quests, color: '#10b981' },
    { icon: ICON.leaderboard, label: L.leaderboard, href: ROUTE.leaderboard, color: '#f59e0b' },
    { icon: ICON.clans, label: L.clans, href: ROUTE.clans, color: '#3b82f6' },
  ]
  return (
    <Section ctx={ctx} title="میان‌بر">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {tiles.map(t => (
          <a key={t.href} href={t.href} className="tl-tile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 16, background: t.color + '16', border: '1px solid ' + t.color + '40', color: C.text }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 12.5, fontWeight: 900 }}>{t.label}</span>
          </a>
        ))}
      </div>
    </Section>
  )
}
