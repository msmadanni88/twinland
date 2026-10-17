'use client'
// ویجت‌های تازه داشبورد نسخه v4.0
//  HeroV4: سلام، حلقه لول رنگی، امتیاز و استریک رنگی، و کمان هفت روز اخیر به‌جای ردیف مربع‌ها
//  CircleWidget: «حلقه تو» با چهره‌های روی هم‌افتاده و دکمه دعوت
import { faNum } from '@/lib/events/format'
import { DayArc } from '@/components/v4/ui/DayArc'
import { CircleCard } from '@/components/v4/ui/AvatarStack'
import { SegmentBar } from '@/components/v4/ui/SegmentBar'

const card = (C, T) => ({ margin: '0 12px 12px', borderRadius: 24, background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow1, color: C.text })

export function HeroV4({ ctx }) {
  const { C, T, levelInfo, xp, streak, userName, checkinDays, setShowXP } = ctx
  const lv = levelInfo.current
  const R = 36, CIRC = 2 * Math.PI * R
  const pct = Math.min(100, levelInfo.progress || 0)
  const remain = levelInfo.next ? Math.max(0, levelInfo.next.minXP - xp) : 0
  return (
    <section style={{ ...card(C, T), margin: '12px 12px 12px', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="tl4-press" onClick={() => setShowXP(true)} aria-label="جزئیات امتیاز" style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle cx="44" cy="44" r={R} fill="none" stroke={T.hairStrong} strokeWidth="7" />
            <circle cx="44" cy="44" r={R} fill="none" stroke={lv.color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.34,1.2,.64,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{lv.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: C.sub, marginTop: 3 }}>لول {faNum(lv.level)}</span>
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>سلام{userName ? '، ' + userName : ''}</div>
          <div style={{ fontSize: 25, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 }}>{faNum(xp)} <span style={{ fontSize: 12.5, color: C.sub }}>XP</span></div>
          <div style={{ fontSize: 11, color: C.sub, margin: '2px 0 7px' }}>{lv.name}{levelInfo.next ? ' · ' + faNum(remain) + ' تا ' + levelInfo.next.name : ' · بالاترین لول'}</div>
          <SegmentBar value={pct} segments={5} height={5} gap={3} color={C.text} track={T.hairStrong} />
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid ' + T.hair }}>
        <DayArc C={C} T={T} days={checkinDays} streak={streak} width={300} />
      </div>
    </section>
  )
}

export function CircleWidget({ ctx }) {
  const { C, T, goTab, onInvite } = ctx
  return (
    <section style={{ ...card(C, T), padding: '14px 14px' }}>
      <CircleCard C={C} T={T} onInvite={onInvite} onOpen={() => goTab('clan')} />
    </section>
  )
}
