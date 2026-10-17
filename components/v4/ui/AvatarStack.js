'use client'
// «حلقه تو» — نسخه v4.0
// چهره‌های روی هم‌افتاده از آدم‌هایی که به تو وصل‌اند: کسانی که دعوت کردی، کسی که دعوتت کرد، و هم‌کلنی‌ها.
// داده از تابع my_circle در سرور می‌آید که فقط نام، چهره و لول برمی‌گرداند؛ شناسه هیچ‌کس به مرورگر نمی‌رسد.
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { Icon } from '@/components/v4/icons'

const fa = (n) => Number(n || 0).toLocaleString('fa')
let cache = null, cacheAt = 0

export function useMyCircle(enabled = true) {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (!enabled) return
    if (cache && Date.now() - cacheAt < 60e3) { setData(cache); return }
    const s = getSession()
    if (!s || !s.access_token) { setData({ total: 0, people: [] }); return }
    let alive = true
    fetch(SB_URL + '/rest/v1/rpc/my_circle', { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const v = d && Array.isArray(d.people) ? d : { total: 0, people: [] }
        cache = v; cacheAt = Date.now()
        if (alive) setData(v)
      })
      .catch(() => { if (alive) setData({ total: 0, people: [] }) })
    return () => { alive = false }
  }, [enabled])
  return data
}

export function AvatarStack({ C, T, people = [], total = 0, max = 5, size = 32, ring }) {
  const shown = people.slice(0, max)
  const extra = Math.max(0, (total || people.length) - shown.length)
  const edge = ring || (T.dark ? '#121214' : '#FFFFFF')
  const disc = (i) => ({
    width: size, height: size, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
    marginInlineStart: i === 0 ? 0 : -Math.round(size * 0.32), border: '2px solid ' + edge,
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 20 - i,
  })
  if (!shown.length) {
    return (
      <div style={{ display: 'flex' }} aria-hidden="true">
        {[0, 1, 2].map(i => <span key={i} style={{ ...disc(i), background: T.chip, border: '1.5px dashed ' + T.hairStrong, color: C.sub }}><Icon name="user" size={size * 0.48} /></span>)}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} aria-label={fa(total || people.length) + ' نفر در حلقه تو'}>
      {shown.map((p, i) => (
        <span key={i} title={p.name} style={{ ...disc(i), background: T.dark ? '#1D1D20' : '#F1F1F3', fontSize: size * 0.5, lineHeight: 1 }}>{p.avatar || '☕'}</span>
      ))}
      {extra > 0 && <span style={{ ...disc(shown.length), background: C.accent, color: T.onAccent, fontSize: size * 0.34, fontWeight: 900 }}>+{fa(extra)}</span>}
    </div>
  )
}

// کارت کامل: عنوان، چهره‌ها و دکمه دعوت. ضربه روی چهره‌ها کلن را باز می‌کند.
export function CircleCard({ C, T, onInvite, onOpen, compact = false, style }) {
  const d = useMyCircle(true)
  const people = (d && d.people) || []
  const total = (d && d.total) || 0
  const kinds = { invited: 0, inviter: 0, clan: 0 }
  people.forEach(p => { if (kinds[p.kind] != null) kinds[p.kind]++ })
  const hint = !d ? 'در حال خواندن…'
    : total === 0 ? 'هنوز کسی در حلقه‌ات نیست. یک دوست دعوت کن؛ هر دو امتیاز می‌گیرید.'
    : fa(total) + ' نفر · ' + [kinds.clan ? 'هم‌کلنی' : null, kinds.invited || kinds.inviter ? 'دعوتی' : null].filter(Boolean).join(' و ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <button onClick={onOpen} aria-label="باز کردن کلن" className="tl4-btn"
        style={{ background: 'none', border: 'none', padding: 0, cursor: onOpen ? 'pointer' : 'default', display: 'flex', borderRadius: 99 }}>
        <AvatarStack C={C} T={T} people={people} total={total} max={4} size={compact ? 30 : 34} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>حلقه تو</div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: compact ? 'nowrap' : 'normal' }}>{hint}</div>
      </div>
      {onInvite && (
        <button className="tl4-press" onClick={onInvite}
          style={{ flexShrink: 0, height: 34, padding: '0 12px', borderRadius: 99, border: '1px solid ' + T.hair, background: C.accent, color: T.onAccent, fontFamily: 'inherit', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <Icon name="gift" size={15} stroke={2} />دعوت
        </button>
      )}
    </div>
  )
}
