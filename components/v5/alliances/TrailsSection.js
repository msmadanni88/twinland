'use client'
// ─────────────────────────────────────────────────────────────
//  بخش «مسیرها» — نسخه v5.0
//  TrailsSection: بالای زبانه ماموریت‌ها. مسیرهای در حال رفتن و جایزه‌های من، بعد مسیرها و همکاری‌های نزدیک.
//  TrailsMini: یک ردیف کوتاه بالای داشبورد که به همین بخش می‌برد.
//  داده: useMyAlliances و فهرست نزدیک که صفحه اصلی یک بار می‌گیرد.
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Chip, Empty, SectionHead, Skeleton } from '@/components/v4/kit/kit'
import { TrailCard } from '@/components/v5/alliances/TrailCard'
import { leftText, progressOf } from '@/lib/alliances/alliances'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function TrailsSection({ near, nearLoaded, mine, mineLoaded, onPlace, onRoute }) {
  const { T } = useV4()
  const [filter, setFilter] = useState('all')
  const going = useMemo(() => (mine || []).filter(a => { const p = progressOf(a); return p.active || (a.coupons || []).some(k => k.status === 'issued' || k.status === 'pending_proof') }), [mine])
  const others = (near || []).filter(a => !going.some(g => g.id === a.id))
    .filter(a => filter === 'all' || (filter === 'trail' ? (a.kind === 'trail' || a.kind === 'event') : a.kind === filter))
  const kinds = new Set((near || []).map(a => a.kind === 'event' ? 'trail' : a.kind))
  if (!nearLoaded && !mineLoaded) return <div style={{ padding: '12px 12px 0' }}><Skeleton h={96} n={2} /></div>
  if (!going.length && !(near || []).length) return null
  return (
    <div style={{ padding: '12px 12px 4px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid ' + T.hair }}>
      {going.length > 0 && <>
        <SectionHead title={'مسیرها و جایزه‌های من · ' + fa(going.length)} hint="قدم‌های بعدی و کدهایی که در صندوق نشان می‌دهی" />
        {going.map(a => <TrailCard key={'m' + a.id} a={a} onPlace={onPlace} onRoute={onRoute} />)}
      </>}
      {(near || []).length > 0 && <>
        <SectionHead title="مسیرها و همکاری‌های نزدیک" hint="چند مکان کنار هم با جایزه مشترک؛ پیاده، محله‌ای یا شهری" style={{ marginTop: going.length ? 6 : 0 }} />
        {kinds.size > 1 && (
          <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            <Chip on={filter === 'all'} onClick={() => setFilter('all')}>همه</Chip>
            {kinds.has('trail') && <Chip on={filter === 'trail'} icon="route" onClick={() => setFilter('trail')}>مسیر</Chip>}
            {kinds.has('bounceback') && <Chip on={filter === 'bounceback'} icon="handshake" onClick={() => setFilter('bounceback')}>بازگشت متقابل</Chip>}
            {kinds.has('clan_sponsor') && <Chip on={filter === 'clan_sponsor'} icon="users" onClick={() => setFilter('clan_sponsor')}>حامی کلن</Chip>}
          </div>
        )}
        {others.slice(0, 12).map(a => <TrailCard key={'n' + a.id} a={a} onPlace={onPlace} onRoute={onRoute} />)}
        {!others.length && <Empty icon="route" title="در این دسته چیزی نزدیک نیست" />}
      </>}
    </div>
  )
}

export function TrailsMini({ near, mine, onOpen }) {
  const { C, T } = useV4()
  const going = (mine || []).find(a => progressOf(a).active)
  const coupons = (mine || []).reduce((n, a) => n + (a.coupons || []).filter(k => k.status === 'issued' || k.status === 'pending_proof').length, 0)
  const n = (near || []).length
  if (!going && !coupons && !n) return null
  const p = going ? progressOf(going) : null
  return (
    <div style={{ padding: '12px 12px 0' }}>
    <button type="button" className="tl4-press" onClick={onOpen}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: R.box, border: '1px solid ' + (going ? C.text : T.hair), background: T.chip, color: C.text, fontFamily: 'inherit', textAlign: 'right', cursor: 'pointer', boxSizing: 'border-box' }}>
      <span style={{ width: 36, height: 36, borderRadius: R.box, background: going ? C.accent : 'transparent', color: going ? T.onAccent : C.text, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="route" size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {going ? 'مسیر «' + going.title + '»' : coupons ? fa(coupons) + ' جایزه همکاری منتظر توست' : fa(n) + ' مسیر و همکاری نزدیک توست'}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: C.sub, marginTop: 2 }}>
          {going ? 'قدم ' + fa(p.done) + ' از ' + fa(p.need) + (going.mine && going.mine.deadline ? ' · ' + leftText(going.mine.deadline) : '') : 'چند مکان کنار هم، با جایزه هر کدام'}
        </span>
      </span>
      <Icon name="chevronLeft" size={16} color={C.sub} />
    </button>
    </div>
  )
}
