'use client'
// ─────────────────────────────────────────────────────────────
//  ویجت‌های داشبورد نسخه v4.0 — همه از کیت v4: یک کارت، یک گوشه، یک نوار پیشرفت، آیکون خطی و بی‌رنگ
//  استثناهای رنگی همان فهرست نسخه است: حلقه و نشان لول، تصویر رویدادها و «پیشنهاد امروز»، و نقطه سبز آنلاین.
//  هر ویجت فقط ctx را می‌گیرد و ترتیبشان در DashboardV4 است.
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import { EventArt } from '@/components/events/EventArt'
import { districtLabel, faNum, timeLeft } from '@/lib/events/format'
import { QUICK_FILTERS } from '@/lib/constants'
import { L, ROUTE } from '@/lib/theme/labels'
import { useDragScroll } from '@/lib/theme/ui'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { DayArc } from '@/components/v4/ui/DayArc'
import { CircleCard } from '@/components/v4/ui/AvatarStack'
import { Btn, Card, Chip, SectionHead, faDigits } from '@/components/v4/kit/kit'
import { Meter, XpBar } from '@/components/v4/kit/Meter'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'
import { ReferralInline } from '@/components/v4/growth/Referral'
import { useMe } from '@/lib/profile/people'

const wrap = { margin: '0 12px 12px' }
const more = (C) => ({ fontSize: 11.5, fontWeight: 800, color: C.text, textDecoration: 'none', background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2 })
function MoreLink({ C, href, onClick }) {
  const inner = <>همه<Icon name="chevronLeft" size={14} /></>
  return href ? <a href={href} className="tl4-press" style={more(C)}>{inner}</a> : <button type="button" className="tl4-press" onClick={onClick} style={more(C)}>{inner}</button>
}

// ── سلام و پیشرفت ───────────────────────────────────────────
export function HeroV4({ ctx }) {
  const { C, T, levelInfo, xp, streak, userName, checkinDays, setShowXP, goTab } = ctx
  const me = useMe()
  const lv = levelInfo.current
  const RR = 36, CIRC = 2 * Math.PI * RR
  const pct = Math.min(100, levelInfo.progress || 0)
  const remain = levelInfo.next ? Math.max(0, levelInfo.next.minXP - xp) : 0
  return (
    <Card style={{ margin: '12px 12px 12px', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="tl4-press" onClick={() => setShowXP(true)} aria-label="جزئیات امتیاز" style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle cx="44" cy="44" r={RR} fill="none" stroke={T.hairStrong} strokeWidth="7" />
            <circle cx="44" cy="44" r={RR} fill="none" stroke={lv.color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.34,1.2,.64,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{lv.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: C.sub, marginTop: 3 }}>لول {faNum(lv.level)}</span>
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* چهره خودم کنار سلام؛ همان UserAvatar همه‌جا، ضربه پروفایل را باز می‌کند */}
          <button type="button" className="tl4-press" onClick={() => goTab && goTab('profile')} aria-label="پروفایل من"
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, margin: '0 0 2px', cursor: 'pointer', fontFamily: 'inherit', maxWidth: '100%' }}>
            <UserAvatar person={(me && me.card) || { name: userName }} size={30} C={C} T={T} />
            <span style={{ fontSize: 12.5, color: C.text, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>سلام{userName ? '، ' + userName : ''}</span>
          </button>
          <div style={{ fontSize: 25, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 }}>{faNum(xp)} <span style={{ fontSize: 12.5, color: C.sub }}>XP</span></div>
          <div style={{ fontSize: 11, color: C.sub, margin: '2px 0 7px' }}>{lv.name}{levelInfo.next ? ' · ' + faNum(remain) + ' تا ' + levelInfo.next.name : ' · بالاترین لول'}</div>
          <XpBar levelInfo={levelInfo} size="md" />
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid ' + T.hair }}>
        <DayArc C={C} T={T} days={checkinDays} streak={streak} width={300} />
      </div>
    </Card>
  )
}

// ── حلقه تو و دعوت دوست ─────────────────────────────────────
export function CircleWidget({ ctx }) {
  const { C, T, goTab, showToast } = ctx
  return (
    <Card style={wrap}>
      <CircleCard C={C} T={T} onOpen={() => goTab('clan')} />
      <div style={{ height: 1, background: T.hair, margin: '14px 0' }} />
      <ReferralInline showToast={showToast} compact />
    </Card>
  )
}

// ── پیشنهاد امروز: تصویر رویداد رنگی می‌ماند ────────────────
export function TodayV4({ ctx }) {
  const { C, T, events, checkedToday, openEvent, streak } = ctx
  const pick = events.find(e => !e.done)
  if (!pick) {
    return (
      <Card style={wrap}>
        <SectionHead title="امروز" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>
          {checkedToday ? 'چک‌این امروزت ثبت شده' + (streak >= 2 ? ' و ' + faNum(streak) + ' روز پشت هم آمده‌ای' : '') + '. فردا هم بیا.' : 'یک چک‌این امروز، روزهای پشت همت را نگه می‌دارد. یک کافه را روی نقشه انتخاب کن.'}
        </div>
      </Card>
    )
  }
  return (
    <Card style={wrap}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, marginBottom: 10 }}>{checkedToday ? 'یکی دیگر برای امروز' : 'پیشنهاد امروز'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <EventArt artKey={pick.artKey} size={64} style={{ borderRadius: R.box }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, lineHeight: 1.5 }}>{pick.title}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{pick.cafeName}{pick.district ? ' · ' + faDigits(districtLabel(pick.district)) : ''}</div>
          {pick.rewardLabel && <div style={{ fontSize: 11.5, fontWeight: 800, color: C.text, marginTop: 4 }}>{pick.rewardLabel}{pick.rewardXp > 0 ? ' · +' + faNum(pick.rewardXp) + ' XP' : ''}</div>}
        </div>
      </div>
      <Btn block onClick={() => openEvent(pick)} style={{ marginTop: 12 }}>برو به {pick.cafeName}</Btn>
    </Card>
  )
}

// ── در جریان است ────────────────────────────────────────────
export function EventsV4({ ctx }) {
  const { C, T, events, ready, openEvent } = ctx
  const rail = useDragScroll()
  return (
    <Card style={wrap} pad={0}>
      <div style={{ padding: '14px 14px 0' }}>
        <SectionHead title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>در جریان است<span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} /></span>}
          hint="رویدادهای زنده کافه‌ها" action={<MoreLink C={C} href={ROUTE.quests} />} />
      </div>
      {!ready ? <div style={{ padding: '0 14px 14px', fontSize: 12, color: C.sub }}>در حال بارگذاری…</div>
        : events.length === 0 ? <div style={{ padding: '0 14px 14px', fontSize: 12, color: C.sub, lineHeight: 1.9 }}>الان رویداد فعالی نیست. کافه‌دارها که چیزی منتشر کنند، همین‌جا دیده می‌شود.</div>
        : <div ref={rail} className="tl4-noscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px 14px', scrollSnapType: 'x mandatory' }}>
            {events.map(ev => {
              const left = timeLeft(ev.endsAt)
              return (
                <button key={ev.id} type="button" className="tl4-press" onClick={() => openEvent(ev)}
                  style={{ flexShrink: 0, width: 168, scrollSnapAlign: 'start', textAlign: 'right', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: 12, color: C.text, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <EventArt artKey={ev.artKey} size={44} style={{ borderRadius: R.box }} />
                  <div style={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.55, marginTop: 8, height: 39, overflow: 'hidden' }}>{ev.title}</div>
                  <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.cafeName}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: C.text, marginTop: 6, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.rewardXp > 0 ? '+' + faNum(ev.rewardXp) + ' XP' : ev.rewardLabel || ''}</span>
                    {left && <span style={{ color: C.sub, flexShrink: 0 }}>{left.text}</span>}
                  </div>
                </button>
              )
            })}
          </div>}
    </Card>
  )
}

// ── در دست انجام ────────────────────────────────────────────
export function QuestsV4({ ctx }) {
  const { C, T, events, openEvent } = ctx
  const mine = events.filter(e => e.progress > 0 && !e.done && e.target > 1)
  if (!mine.length) return null
  return (
    <Card style={wrap}>
      <SectionHead title="در دست انجام" hint="چند چک‌این تا جایزه مانده" action={<MoreLink C={C} href={ROUTE.quests} />} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mine.slice(0, 3).map(ev => {
          const pct = Math.min(100, Math.round((ev.progress / ev.target) * 100))
          return (
            <button key={ev.id} type="button" className="tl4-press" onClick={() => openEvent(ev)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', padding: 0, textAlign: 'right', fontFamily: 'inherit', color: C.text, cursor: 'pointer' }}>
              <EventArt artKey={ev.artKey} size={40} style={{ borderRadius: R.box }} />
              <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: C.sub, margin: '2px 0 6px' }}>{faNum(ev.target - ev.progress)} چک‌این تا {ev.rewardLabel || 'جایزه'}</span>
                <Meter value={pct} segments={Math.min(10, ev.target)} size="sm" />
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 900, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{faNum(ev.progress)}/{faNum(ev.target)}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ── کشف شهر ─────────────────────────────────────────────────
const districtNo = (s) => { const m = String(s || '').match(/\d+/); return m ? Number(m[0]) : null }

export function CityV4({ ctx }) {
  const { C, T, cafes, checkedIn } = ctx
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
    <Card style={wrap}>
      <SectionHead title="کشف شهر" hint={faNum(cafesSeen) + ' کافه دیده‌ای'} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{faNum(seen.size)}</span>
        <span style={{ fontSize: 12, color: C.sub }}>از {faNum(all.length)} منطقه</span>
        <span style={{ marginRight: 'auto', fontSize: 12, fontWeight: 900 }}>{faNum(pct)}٪</span>
      </div>
      <Meter value={pct} segments={5} size="md" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {all.map(n => {
          const on = seen.has(n)
          return <span key={n} style={{ minWidth: 30, height: 28, padding: '0 6px', borderRadius: R.box, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            background: on ? C.accent : T.chip, color: on ? T.onAccent : C.sub, border: '1px solid ' + (on ? 'transparent' : T.hair) }}>{faNum(n)}</span>
        })}
      </div>
    </Card>
  )
}

// ── نبض شهر ─────────────────────────────────────────────────
export function PulseV4({ ctx }) {
  const { C, T, cafes, live, totalLive, setSelCafe } = ctx
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
    <Card style={wrap}>
      <SectionHead title="نبض شهر" hint="چند ساعت اخیر"
        action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 900 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />{faNum(totalLive)} نفر در کافه‌ها</span>} />
      {top.length === 0
        ? <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>الان شهر آرام است. اولین چک‌این را تو بزن.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {top.map(r => (
              <div key={r.d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 62, fontSize: 11.5, fontWeight: 800 }}>منطقه {faNum(r.d)}</span>
                <div style={{ flex: 1, height: 6, borderRadius: R.pill, background: T.hairStrong, overflow: 'hidden' }}><div style={{ height: '100%', width: Math.max(8, (r.n / max) * 100) + '%', borderRadius: R.pill, background: C.text }} /></div>
                <span style={{ width: 24, textAlign: 'left', fontSize: 11.5, fontWeight: 900, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{faNum(r.n)}</span>
              </div>
            ))}
            {hot && <button className="tl4-press" onClick={() => setSelCafe(hot.c)} style={{ marginTop: 2, textAlign: 'right', border: '1px solid ' + T.hair, background: T.chip, color: C.text, borderRadius: R.box, padding: '9px 12px', fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer' }}>
              شلوغ‌ترین کافه: <b>{hot.c.name}</b> · {faNum(hot.n)} نفر
            </button>}
          </div>}
    </Card>
  )
}

// ── رتبه تو: چهره‌ها همان UserAvatar، بدون مدال رنگی ───────
export function RankV4({ ctx }) {
  const { C, T, board, goTab } = ctx
  if (!board || !board.length) return null
  const me = board.find(p => p.me)
  const rows = board.slice(0, 3)
  if (me && me.rank > 3) {
    const i = board.indexOf(me)
    ;[board[i - 1], me, board[i + 1]].forEach(p => { if (p && !rows.includes(p)) rows.push(p) })
  }
  return (
    <Card style={wrap}>
      <SectionHead title={L.leaderboard} hint={me ? 'رتبه تو ' + faNum(me.rank) + ' از ' + faNum(board.length) : 'روی اسم هر نفر بزن تا پروفایلش را ببینی'} action={<MoreLink C={C} onClick={() => goTab('rank')} />} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((p, i) => {
          const gap = i > 0 && p.rank - rows[i - 1].rank > 1
          return (
            <div key={p.id || p.key || i}>
              {gap && <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, lineHeight: 1 }}>⋯</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: R.box, background: p.me ? T.accentSoft : 'transparent', border: '1px solid ' + (p.me ? T.hairStrong : 'transparent') }}>
                <span style={{ width: 22, textAlign: 'center', fontSize: 12.5, fontWeight: 900, color: p.rank <= 3 ? C.text : C.sub, fontVariantNumeric: 'tabular-nums' }}>{faNum(p.rank)}</span>
                <PersonLink id={p.id} label={p.name} style={{ flex: 1, gap: 10 }}>
                  <UserAvatar person={p} size={32} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}{p.me ? ' (تو)' : ''}</span>
                </PersonLink>
                <span style={{ fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{faNum(p.xp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── پیدا کن ─────────────────────────────────────────────────
const FILTER_ICON = { 'صبحانه': 'sunrise', 'شبانه': 'moon', 'کتاب': 'book', 'موسیقی': 'music', 'دنج': 'sofa', 'اسپشالتی': 'coffee' }
export function ExploreV4({ ctx }) {
  const { C, setSearch, showToast } = ctx
  const rail = useDragScroll()
  return (
    <Card style={wrap} pad={0}>
      <div style={{ padding: '14px 14px 0' }}><SectionHead title="امروز چه حالی داری؟" hint="با یک ضربه نقشه را فیلتر کن" /></div>
      <div ref={rail} className="tl4-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 14px 14px' }}>
        {QUICK_FILTERS.map(f => <Chip key={f.tag} icon={FILTER_ICON[f.tag] || 'search'} onClick={() => { setSearch(f.tag); showToast && showToast('فیلتر: ' + f.tag) }}>{f.tag}</Chip>)}
      </div>
    </Card>
  )
}

// ── میان‌برها: کاشی‌های بی‌رنگ با آیکون خطی ──────────────────
export function ShortcutsV4({ ctx }) {
  const { C, T } = ctx
  const tiles = [
    { icon: 'image', label: L.gallery, href: ROUTE.gallery },
    { icon: 'list', label: L.quests, href: ROUTE.quests },
    { icon: 'trophy', label: L.leaderboard, href: ROUTE.leaderboard },
    { icon: 'users', label: L.clans, href: ROUTE.clans },
  ]
  return (
    <Card style={wrap}>
      <SectionHead title="میان‌بر" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {tiles.map(t => (
          <a key={t.href} href={t.href} className="tl4-press" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, color: C.text }}>
            <Icon name={t.icon} size={20} />
            <span style={{ fontSize: 12.5, fontWeight: 900 }}>{t.label}</span>
          </a>
        ))}
      </div>
    </Card>
  )
}
