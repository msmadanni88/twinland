'use client'
// ─────────────────────────────────────────────────────────────
//  «همکارهای این مکان» در برگه مکان — نسخه v5.0
//  همکاری‌های فعال همین مکان با فاصله و زمان پیاده هر شریک، پیشرفت من، و جای زدن کد حضور صندوق.
//  کد حضور فقط وقتی نشان داده می‌شود که یکی از همکاری‌ها آن را بخواهد یا جایزه‌ای از من منتظرش باشد.
//  اگر همکاری‌ای نباشد هیچ چیز نشان داده نمی‌شود.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn } from '@/components/v4/kit/kit'
import { catIcon } from '@/lib/places/categories'
import { KIND, distText, errText, progressOf, usePlaceAlliances, verifyPresence, walkText } from '@/lib/alliances/alliances'
import { CouponRow } from '@/components/v5/alliances/TrailCard'
import { track } from '@/lib/analytics'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function PlaceAlliances({ cafeId, onPlace, onRoute, showToast }) {
  const { C, T } = useV4()
  const { items, reload } = usePlaceAlliances(cafeId)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  if (!items.length) return null
  const pending = items.some(a => (a.coupons || []).some(k => k.status === 'pending_proof'))
  const wantsCode = pending || items.some(a => a.require_presence)

  async function send() {
    setBusy(true)
    const r = await verifyPresence(cafeId, code)
    setBusy(false)
    track('presence_verify', { ok: !!(r && r.ok) })
    if (!r || !r.ok) { showToast && showToast(errText(r), 'warn'); return }
    setCode('')
    showToast && showToast(r.released > 0 ? fa(r.released) + ' جایزه باز شد؛ کد در بخش مسیرهای من است' : 'حضورت ثبت شد')
    reload()
  }

  return (
    <div style={{ marginBottom: 14, padding: 12, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="handshake" size={17} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 900 }}>همکارهای این مکان</span>
      </div>
      {items.map(a => {
        const kind = KIND[a.kind] || KIND.trail
        const others = (a.places || []).filter(p => p.cafe_id !== cafeId)
        const here = (a.places || []).find(p => p.cafe_id === cafeId)
        const p = progressOf(a)
        const isPath = a.kind === 'trail' || a.kind === 'event'
        return (
          <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, borderTop: '1px solid ' + T.hair }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={kind.icon} size={16} color={C.sub} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 900 }}>{a.title}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: C.sub, marginTop: 1 }}>
                  {a.kind_fa || kind.label}
                  {isPath ? (p.complete ? ' · تمامش کردی' : p.active ? ' · قدم ' + fa(p.done) + ' از ' + fa(p.need) : ' · ' + fa(p.need) + ' قدم') : ''}
                  {here && here.reward ? ' · جایزه این‌جا: ' + here.reward : ''}
                </span>
              </span>
              {isPath && onRoute && others.length > 0 && <Btn size="sm" kind="ghost" icon="route" onClick={() => onRoute(a)} aria-label="نمایش مسیر روی نقشه" />}
            </div>
            {others.length > 0 && (
              <div className="tl4-noscroll" style={{ display: 'flex', gap: 7, overflowX: 'auto' }}>
                {others.map(o => (
                  <button key={o.cafe_id} type="button" className="tl4-press" onClick={() => onPlace && onPlace(o.cafe_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, maxWidth: 220, padding: '6px 10px', borderRadius: R.box, background: C.card, border: '1px solid ' + T.hair, color: C.text, fontFamily: 'inherit', textAlign: 'right', cursor: 'pointer' }}>
                    <Icon name={o.done ? 'check' : catIcon(o.category)} size={15} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                      <span style={{ display: 'block', fontSize: 10, color: C.sub }}>{o.walk_min && o.walk_min <= 40 ? walkText(o.walk_min) : distText(o.distance_m)}{o.reward ? ' · ' + o.reward : ''}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {(a.coupons || []).filter(k => k.status === 'issued' || k.status === 'pending_proof').map(k => <CouponRow key={k.id} k={k} />)}
          </div>
        )
      })}
      {wantsCode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid ' + T.hair }}>
          <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.8 }}>{pending ? 'جایزه‌ای منتظر اثبات حضور است. ' : ''}کد شش‌رقمی صفحه صندوق را بزن؛ هر ۳۰ ثانیه عوض می‌شود.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={code} onChange={e => setCode(e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 6))} inputMode="numeric" placeholder="کد حضور" aria-label="کد حضور"
              style={{ flex: 1, minWidth: 0, height: 40, borderRadius: R.box, border: '1px solid ' + (code ? C.accent : T.hair), background: C.card, color: C.text, fontSize: 16, fontWeight: 900, letterSpacing: 4, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }} />
            <Btn size="md" icon="qr" disabled={busy || code.length !== 6} onClick={send}>ثبت</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
