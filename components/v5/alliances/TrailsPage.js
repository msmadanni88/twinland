'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه «مسیرهای من» — /trails، از نسخه v5.0
//  هر اعلان مسیر و کوپن همکاری به این‌جا می‌آید. در هر نسخه ظاهر با قاب v4 باز می‌شود،
//  چون مسیرهای شهری TwinLand با چک‌این هر نسخه‌ای پیش می‌روند.
//  بالا: جایزه‌های باز و مسیرهای در حال رفتن. پایین: همه مسیرهای فعال شهر.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { V4Page } from '@/components/v4/kit/V4Page'
import { Empty, SectionHead, Segmented, Skeleton, Stat } from '@/components/v4/kit/kit'
import { TrailCard } from '@/components/v5/alliances/TrailCard'
import { alliancesNear, progressOf, useMyAlliances } from '@/lib/alliances/alliances'
import { getSession } from '@/lib/game/gameSystem'
import { track } from '@/lib/analytics'

function Body() {
  const signedIn = !!(getSession() && getSession().user)
  const mine = useMyAlliances(signedIn)
  const [all, setAll] = useState(null)
  const [tab, setTab] = useState('mine')
  useEffect(() => { alliancesNear(null, null, 30).then(r => setAll(Array.isArray(r) ? r : [])); track('trails_page', {}) }, [])
  const going = useMemo(() => mine.items.filter(a => progressOf(a).active), [mine.items])
  const coupons = useMemo(() => mine.items.reduce((n, a) => n + (a.coupons || []).filter(k => k.status === 'issued' || k.status === 'pending_proof').length, 0), [mine.items])
  const done = useMemo(() => mine.items.filter(a => progressOf(a).complete).length, [mine.items])
  const open = (id) => { window.location.href = '/?cafe=' + id }
  useEffect(() => { if (mine.loaded && !mine.items.length) setTab('all') }, [mine.loaded, mine.items.length])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {signedIn && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <Stat icon="route" value={going.length} label="در حال رفتن" />
          <Stat icon="ticket" value={coupons} label="جایزه باز" />
          <Stat icon="check" value={done} label="تمام‌شده" />
        </div>
      )}
      <Segmented options={[['mine', 'مال من', 'user'], ['all', 'همه مسیرها', 'map']]} value={tab} onChange={setTab} label="فهرست مسیرها" />
      {tab === 'mine' && (!mine.loaded ? <Skeleton h={120} n={2} />
        : mine.items.length ? mine.items.map(a => <TrailCard key={a.id} a={a} onPlace={open} />)
        : <Empty icon="route" title="هنوز مسیری را شروع نکرده‌ای" text="در یکی از مکان‌های یک مسیر چک‌این کن تا مسیر شروع شود. فهرست همه مسیرها در زبانه کناری است." />)}
      {tab === 'all' && (all === null ? <Skeleton h={120} n={3} />
        : all.length ? <>
            <SectionHead title="مسیرها و همکاری‌های فعال" hint="روی هر مکان بزن تا روی نقشه باز شود" />
            {all.map(a => <TrailCard key={a.id} a={a} onPlace={open} />)}
          </>
        : <Empty icon="route" title="فعلاً مسیر فعالی نیست" text="به‌زودی مسیرهای نان و قهوه و همکاری مکان‌ها این‌جا می‌آید." />)}
    </div>
  )
}

export default function TrailsPage() {
  return <V4Page title="مسیرها و جایزه‌ها" back="history"><Body /></V4Page>
}
