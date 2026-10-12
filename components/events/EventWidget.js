'use client'
// ویجت رویداد — یک طراحی، چند اندازه. همه‌جای سایت از همین‌ها استفاده می‌کند:
//   EventCard : کارت افقی داشبورد و صفحه ماموریت‌ها
//   EventRow  : ردیف فشرده تاریخچه و فهرست‌ها
//   EventChip : برچسب کوچک تخفیف، XP، آیتم، زمان
// ev باید خروجی normEvent باشد. فقط به رنگ‌های پالت C وابسته است، پس در هر صفحه‌ای کار می‌کند.
import { EventArt } from '@/components/events/EventArt'
import { artTone } from '@/lib/events/art'
import { RARITY_TONE, districtLabel, faNum, timeLeft } from '@/lib/events/format'
import { onColor } from '@/lib/theme/ui'

export function EventChip({ art, text, tone, C, solid }) {
  const c = tone || C.accent
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: art ? '0 8px 0 6px' : '0 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
      background: solid ? c : c + '1c', color: solid ? onColor(c) : C.text, border: solid ? 'none' : '1px solid ' + c + '40' }}>
      {art && <EventArt artKey={art} size={14} plate={false} tone={solid ? onColor(c) : c} />}
      {text}
    </span>
  )
}

export function EventChips({ ev, C, max = 4 }) {
  const t = timeLeft(ev.endsAt)
  const list = []
  if (ev.discountPct > 0) list.push(<EventChip key="d" C={C} art="tag" tone="#18a572" text={faNum(ev.discountPct) + '٪ تخفیف'} />)
  if (ev.rewardXp > 0) list.push(<EventChip key="x" C={C} art="star" tone="#e8a317" text={'+' + faNum(ev.rewardXp) + ' XP'} />)
  if (ev.collectible) list.push(<EventChip key="c" C={C} art="gem" tone={RARITY_TONE[ev.collectible.rarity] || '#7c5cff'} text="آیتم" />)
  if (t) list.push(<EventChip key="t" C={C} art="clock" tone={t.urgent ? '#e5484d' : '#6b7a90'} text={t.text} />)
  return <>{list.slice(0, max)}</>
}

export function PromoMark({ C }) {
  return <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: C.gold || '#e8a317', color: onColor(C.gold || '#e8a317'), lineHeight: 1.4 }}>ویژه</span>
}

// کارت افقی: عکس، عنوان، کافه، برچسب‌ها و در صورت چند مرحله‌ای بودن نوار پیشرفت
export function EventCard({ ev, C, onClick, width = 236, idx = 0, newBadge }) {
  const tone = artTone(ev.artKey)
  const pct = ev.done ? 100 : Math.min(100, Math.round((ev.progress / (ev.target || 1)) * 100))
  return (
    <button className={'tl-tile ' + (newBadge ? 'tl-new' : 'tl-in')} onClick={onClick} disabled={!onClick}
      style={{ width, flexShrink: 0, textAlign: 'right', fontFamily: 'inherit', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
        borderRadius: 22, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, color: C.text,
        background: 'linear-gradient(155deg,' + tone + '26,' + C.card + ' 62%)', border: '1px solid ' + tone + '40',
        opacity: ev.done ? 0.62 : 1, animationDelay: Math.min(idx * 55, 400) + 'ms' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <EventArt artKey={ev.artKey} size={58} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.title}</div>
          <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.cafeName}{ev.district ? ' · ' + districtLabel(ev.district) : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', minHeight: 22 }}>
        {ev.done ? <EventChip C={C} tone="#18a572" text="انجام شد ✓" solid /> : <EventChips ev={ev} C={C} />}
      </div>
      {ev.target > 1 && (
        <div>
          <div style={{ height: 6, borderRadius: 99, background: C.chip, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: ev.done ? '#18a572' : tone, borderRadius: 99, transition: 'width .6s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.sub, marginTop: 4 }}>
            <span>{faNum(ev.done ? ev.target : ev.progress)} از {faNum(ev.target)} چک‌این</span><span>{faNum(pct)}٪</span>
          </div>
        </div>
      )}
      {ev.promo && <span style={{ position: 'absolute', top: 10, left: 10 }}><PromoMark C={C} /></span>}
    </button>
  )
}

// ردیف فشرده برای تاریخچه: عکس کوچک، عنوان، کافه و جایزه
export function EventRow({ ev, C, right, sub, onClick }) {
  const tone = artTone(ev.artKey)
  return (
    <div className="tl-row" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 16, cursor: onClick ? 'pointer' : 'default', background: tone + '10', border: '1px solid ' + tone + '30' }}>
      <EventArt artKey={ev.artKey} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.cafeName}{ev.district ? ' · ' + districtLabel(ev.district) : ''}</div>
        {sub && <div style={{ fontSize: 10.5, color: C.sub, opacity: 0.8, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}
