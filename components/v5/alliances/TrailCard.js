'use client'
// ─────────────────────────────────────────────────────────────
//  کارت یک همکاری برای کاربر — نسخه v5.0
//  مسیر مشترک و رویداد: قدم‌ها با تیک، مهلت و جایزه هر طرف. بازگشت متقابل و حامی کلن: جایزه و قاعده.
//  کوپن‌های خود کاربر با کد، و کوپنی که منتظر کد حضور است بدون کد.
//  رنگ ندارد و فقط از کیت v4 ساخته شده؛ هر مکان با یک تپ روی نقشه باز می‌شود.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Tag, faDigits } from '@/components/v4/kit/kit'
import { Meter } from '@/components/v4/kit/Meter'
import { catIcon, catInfo } from '@/lib/places/categories'
import { KIND, TIER, distText, leftText, progressOf, walkText, windowText, pauseText } from '@/lib/alliances/alliances'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function CouponRow({ k }) {
  const { C, T } = useV4()
  const [copied, setCopied] = useState(false)
  const live = k.status === 'issued' && k.code
  const copy = () => {
    try { navigator.clipboard.writeText(k.code); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch (e) {}
  }
  const state = k.status === 'redeemed' ? 'استفاده شد' : k.status === 'expired' ? 'تاریخ گذشت' : k.status === 'pending_proof' ? 'منتظر کد حضور' : k.expires_at ? leftText(k.expires_at) : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: R.box, border: '1px dashed ' + (live ? C.text : T.hairStrong), background: live ? T.chip : 'transparent', opacity: live || k.status === 'pending_proof' ? 1 : 0.6 }}>
      <Icon name="ticket" size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900 }}>{k.reward}</div>
        <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{k.place ? '«' + k.place + '» · ' : ''}{state}</div>
      </div>
      {live && (
        <button type="button" className="tl4-press" onClick={copy} aria-label="رونوشت کد"
          style={{ fontFamily: 'ui-monospace,monospace', direction: 'ltr', fontSize: 14, fontWeight: 900, letterSpacing: 2, padding: '6px 10px', borderRadius: R.box,
            border: '1px solid ' + T.hair, background: C.card, color: C.text, cursor: 'pointer' }}>
          {copied ? 'رونوشت شد' : k.code}
        </button>
      )}
    </div>
  )
}

export function TrailCard({ a, onPlace, onRoute, highlightCafe, compact = false }) {
  const { C, T } = useV4()
  const kind = KIND[a.kind] || KIND.trail
  const { steps, done, need, mine, active, complete } = progressOf(a)
  const isPath = a.kind === 'trail' || a.kind === 'event'
  const coupons = a.coupons || []
  const tier = TIER[a.tier]
  return (
    <article style={{ borderRadius: R.box, border: '1px solid ' + (complete ? C.text : T.hair), background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, padding: compact ? 11 : 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: R.box, background: complete ? C.accent : T.chip, color: complete ? T.onAccent : C.text, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={complete ? 'check' : kind.icon} size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, lineHeight: 1.6 }}>{a.title}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 3 }}>
            <Tag>{a.kind_fa || kind.label}</Tag>
            {isPath && tier && <Tag>{tier.label}</Tag>}
            {a.is_platform && <Tag>TwinLand</Tag>}
            {a.status === 'paused' && <Tag strong>متوقف</Tag>}
          </div>
        </div>
        {a.nearest_m != null && a.nearest_m > 30 && !compact && <span style={{ fontSize: 10.5, color: C.sub, flexShrink: 0, marginTop: 4 }}>{distText(a.nearest_m)}</span>}
      </header>

      {a.blurb && !compact && <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>{a.blurb}</div>}
      {a.status === 'paused' && <div style={{ fontSize: 11.5, color: C.sub }}>{pauseText(a.pause_reason)}</div>}

      {isPath && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}><Meter value={need ? Math.min(100, (done / need) * 100) : 0} segments={Math.max(1, need)} size="sm" label={'قدم ' + done + ' از ' + need} /></div>
            <span style={{ fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{complete ? 'تمام شد' : 'قدم ' + fa(done) + ' از ' + fa(need)}</span>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {steps.map((p, i) => (
              <li key={p.cafe_id}>
                <button type="button" className="tl4-press" onClick={() => onPlace && onPlace(p.cafe_id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: R.box, fontFamily: 'inherit', textAlign: 'right', cursor: onPlace ? 'pointer' : 'default',
                    border: '1px solid ' + (highlightCafe === p.cafe_id ? C.text : T.hair), background: p.done ? T.chip : 'transparent', color: C.text }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900,
                    background: p.done ? C.accent : 'transparent', color: p.done ? T.onAccent : C.text, border: '1.5px solid ' + (p.done ? 'transparent' : T.hairStrong) }}>
                    {p.done ? <Icon name="check" size={12} stroke={2.6} /> : faDigits(i + 1)}
                  </span>
                  <Icon name={catIcon(p.category)} size={15} color={C.sub} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: C.sub }}>{catInfo(p.category).label}{p.reward ? ' · جایزه: ' + p.reward : ''}</span>
                  </span>
                  {p.walk_min != null && p.distance_m > 30 && <span style={{ fontSize: 10, color: C.sub, flexShrink: 0 }}>{walkText(p.walk_min)}</span>}
                </button>
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: C.sub }}>
            {active && mine.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.text, fontWeight: 800 }}><Icon name="clock" size={13} />{leftText(mine.deadline)}</span>}
            {!active && !complete && a.window_hours && <span>{a.kind === 'event' ? 'تا ' + leftText(a.ends_at) : 'از قدم اول ' + windowText(a.window_hours) + ' فرصت'}</span>}
            {a.xp_reward > 0 && <span>پایان: {fa(a.xp_reward)} امتیاز</span>}
            {a.step_xp > 0 && a.kind === 'trail' && <span>هر قدم: {fa(a.step_xp)}</span>}
            {a.clan_bonus > 0 && a.kind === 'trail' && <span>کلن: {fa(a.clan_bonus)}</span>}
          </div>
        </div>
      )}

      {!isPath && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9 }}>
            {a.kind === 'bounceback'
              ? 'بعد از چک‌این در یکی، اگر تا حالا به دیگری نرفته باشی کوپنش را می‌گیری.'
              : 'دورهمی کلنت را این‌جا برگزار کنید؛ هر حاضر جایزه می‌گیرد.'}
          </div>
          {(a.places || []).map(p => (
            <button key={p.cafe_id} type="button" className="tl4-press" onClick={() => onPlace && onPlace(p.cafe_id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: R.box, border: '1px solid ' + T.hair, background: 'transparent', color: C.text, fontFamily: 'inherit', textAlign: 'right', cursor: 'pointer' }}>
              <Icon name={catIcon(p.category)} size={16} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10.5, color: C.sub, flexShrink: 0 }}>{p.reward ? 'جایزه: ' + p.reward : distText(p.distance_m)}</span>
            </button>
          ))}
        </div>
      )}

      {coupons.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{coupons.map(k => <CouponRow key={k.id} k={k} />)}</div>}

      {onRoute && isPath && steps.length > 1 && !compact && (
        <Btn size="sm" kind="ghost" icon="route" onClick={() => onRoute(a)} style={{ alignSelf: 'flex-start' }}>نمایش مسیر روی نقشه</Btn>
      )}
    </article>
  )
}
