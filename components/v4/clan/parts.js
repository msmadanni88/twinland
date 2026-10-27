'use client'
// ─────────────────────────────────────────────────────────────
//  قطعه‌های مشترک کلن: نوار هدف هفته، ردیف کلن، کارت دورهمی، ردیف خبر، کارت دعوت و پنجره تأیید
//  هم صفحه کلن، هم زبانه پنل و هم داشبورد همین‌ها را نشان می‌دهند.
// ─────────────────────────────────────────────────────────────
import { districtLabel } from '@/lib/events/format'
import { useState } from 'react'
import { faAgo } from '@/lib/format'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Tag } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { ClanEmblem, clanTint } from '@/components/v4/clan/ClanEmblem'
import { JOIN_MODE_TEXT, TIER_NAMES, clanError, clanInviteText, clanJoinLink, meetupRsvp, meetupWhen } from '@/lib/clan/clans'

export const fa = (n) => Number(n || 0).toLocaleString('fa')
const faD = (s) => String(s == null ? '' : s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])

// ── نوار هدف هفته با سه صندوق ───────────────────────────────
export function TierBar({ week, compact = false, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const tiers = (week && week.tiers) || []
  const count = (week && week.checkins) || 0
  const top = tiers.length ? tiers[tiers.length - 1].need : 10
  const pct = Math.max(0, Math.min(100, (count / Math.max(1, top)) * 100))
  const next = tiers.find(x => !x.reached)
  return (
    <div>
      <div style={{ position: 'relative', height: compact ? 8 : 10, borderRadius: R.pill, background: T.hairStrong, margin: compact ? '10px 0 6px' : '14px 0 8px' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: pct + '%', borderRadius: R.pill, background: C.accent, transition: 'width .8s cubic-bezier(.34,1.2,.64,1)' }} />
        {tiers.map(x => {
          const pos = Math.min(100, (x.need / Math.max(1, top)) * 100)
          return (
            <span key={x.tier} title={'صندوق ' + TIER_NAMES[x.tier - 1]}
              style={{ position: 'absolute', top: '50%', right: 'calc(' + pos + '% - ' + (compact ? 9 : 11) + 'px)', transform: 'translateY(-50%)',
                width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: '50%', boxSizing: 'border-box',
                background: x.reached ? C.accent : C.card, border: '2px solid ' + (x.reached ? C.accent : T.hairStrong), color: x.reached ? T.onAccent : C.sub,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={x.reached ? 'check' : 'gift'} size={compact ? 10 : 12} stroke={2.2} />
            </span>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: compact ? 11 : 12, color: C.sub, gap: 8 }}>
        <span><b style={{ color: C.text, fontWeight: 900 }}>{fa(count)}</b> چک‌این کلن این هفته</span>
        <span>{next ? fa(Math.max(0, next.need - count)) + ' تا صندوق ' + TIER_NAMES[next.tier - 1] : 'هر سه صندوق باز شد'}</span>
      </div>
    </div>
  )
}

// سه صندوق با جایزه و وضعیت
export function TierChests({ week, myCheckins = 0, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const tiers = (week && week.tiers) || []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
      {tiers.map(x => (
        <div key={x.tier} style={{ borderRadius: R.box, padding: '10px 6px', textAlign: 'center', background: x.reached ? T.accentSoft : T.chip,
          border: '1px solid ' + (x.reached ? T.hairStrong : T.hair), opacity: x.reached || !tiers.some(y => y.tier < x.tier && !y.reached) ? 1 : 0.6 }}>
          <span style={{ display: 'flex', justifyContent: 'center', color: x.reached ? C.text : C.sub }}><Icon name={x.claimed ? 'check' : 'gift'} size={20} /></span>
          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{TIER_NAMES[x.tier - 1]}</div>
          <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{fa(x.need)} چک‌این</div>
          <div style={{ fontSize: 11, fontWeight: 900, marginTop: 4 }}>+{fa(x.xp)} امتیاز</div>
          <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
            {x.claimed ? 'گرفتی' : x.reached ? (myCheckins > 0 ? 'در راه است' : 'با یک چک‌این مال تو') : 'بسته'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ردیف یک کلن در فهرست‌ها ─────────────────────────────────
export function ClanRow({ clan, rank, metric, mine = false, end, href, onClick, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  // بخش اصلی ردیف پیوند یا دکمه است و دکمه انتهایی کنارش می‌نشیند، نه داخلش (دکمه تو در تو مجاز نیست)
  const Main = href ? 'a' : onClick ? 'button' : 'div'
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 0 10px', borderRadius: R.box, color: C.text,
      background: mine ? T.accentSoft : T.chip, border: '1px solid ' + (mine ? T.hairStrong : T.hair) }}>
      <Main href={href} type={Main === 'button' ? 'button' : undefined} onClick={onClick} className={href || onClick ? 'tl4-press' : undefined}
        style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px 9px 2px', border: 'none', background: 'none', textDecoration: 'none', color: C.text,
          fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'right', cursor: href || onClick ? 'pointer' : 'default' }}>
        {rank != null && <span style={{ width: 22, textAlign: 'center', fontSize: 12.5, fontWeight: 900, color: rank <= 3 ? C.text : C.sub, fontVariantNumeric: 'tabular-nums' }}>{fa(rank)}</span>}
        <ClanEmblem clan={clan} size={40} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 900 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</span>
            {mine && <Tag strong>کلن تو</Tag>}
          </span>
          <span style={{ display: 'block', fontSize: 11, color: C.sub, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fa(clan.members)} از {fa(clan.cap)} عضو · {JOIN_MODE_TEXT[clan.join_mode] || ''}{clan.home ? ' · پاتوق ' + clan.home.name : ''}
          </span>
        </span>
        {end === undefined && metric != null ? (
          <span style={{ textAlign: 'center', flexShrink: 0, paddingLeft: 2 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(metric)}</span>
            <span style={{ display: 'block', fontSize: 9.5, color: C.sub }}>امتیاز</span>
          </span>
        ) : null}
      </Main>
      {end !== undefined && end !== null ? <span style={{ flexShrink: 0, paddingLeft: 0 }}>{end}</span> : null}
    </div>
  )
}

// ── چهره‌های روی هم ─────────────────────────────────────────
export function Faces({ people = [], max = 5, size = 26, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const shown = people.slice(0, max)
  const more = people.length - shown.length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', direction: 'ltr' }}>
      {shown.map((p, i) => (
        <span key={(p && p.id) || i} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px ' + C.card, display: 'inline-flex' }}>
          <UserAvatar person={p} size={size} />
        </span>
      ))}
      {more > 0 && <span style={{ marginLeft: -8, width: size, height: size, borderRadius: '50%', background: T.chip, boxShadow: '0 0 0 2px ' + C.card,
        fontSize: 10, fontWeight: 900, color: C.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>+{fa(more)}</span>}
    </span>
  )
}

// ── کارت دورهمی ─────────────────────────────────────────────
const STATUS = { open: 'باز', done: 'برگزار شد', expired: 'برگزار نشد', cancelled: 'لغو شد' }
export function MeetupCard({ m, onCancel, showToast, compact = false, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const [busy, setBusy] = useState(false)
  const live = m.status === 'open'
  const toggle = async () => {
    setBusy(true)
    const r = await meetupRsvp(m.id, !m.me_going)
    setBusy(false)
    if (!r.ok) showToast && showToast(clanError(r), 'warn')
    else showToast && showToast(m.me_going ? 'از فهرست آمدن‌ها برداشته شدی' : 'ثبت شد؛ همه می‌بینند که می‌آیی')
  }
  return (
    <div style={{ borderRadius: R.box, padding: compact ? 10 : 12, background: live ? T.chip : 'transparent', border: '1px solid ' + T.hair, opacity: live ? 1 : 0.75 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ width: 40, height: 40, borderRadius: R.box, background: live ? C.accent : T.chip, color: live ? T.onAccent : C.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={m.status === 'done' ? 'check' : 'calendar'} size={19} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <a href={'/?cafe=' + m.cafe.id} className="tl4-press" style={{ display: 'block', fontSize: 13.5, fontWeight: 900, color: C.text, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.cafe.name}
          </a>
          <span style={{ display: 'block', fontSize: 11.5, color: C.sub, marginTop: 2 }}>{meetupWhen(m.at)}{m.cafe.district ? ' · ' + faD(districtLabel(m.cafe.district)) : ''}</span>
          {m.note && <span style={{ display: 'block', fontSize: 12, color: C.text, marginTop: 6, lineHeight: 1.8 }}>{m.note}</span>}
        </span>
        <Tag strong={live}>{STATUS[m.status] || ''}</Tag>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <Faces people={m.going || []} max={5} size={24} />
        <span style={{ fontSize: 11, color: C.sub, flex: 1, minWidth: 80 }}>
          {m.status === 'done' ? fa(m.attended) + ' نفر آمدند' : fa((m.going || []).length) + ' نفر می‌آیند'}
        </span>
        {live && <Btn size="sm" kind={m.me_going ? 'ghost' : 'primary'} icon={m.me_going ? 'check' : 'users'} disabled={busy} onClick={toggle}>{m.me_going ? 'می‌آیم' : 'میام'}</Btn>}
        {live && !compact && <Btn size="sm" kind="ghost" icon="map" href={'/?cafe=' + m.cafe.id}>نقشه</Btn>}
        {live && m.can_cancel && onCancel && <Btn size="sm" kind="text" onClick={() => onCancel(m)}>لغو</Btn>}
      </div>
    </div>
  )
}

// ── خبرهای کلن ──────────────────────────────────────────────
const EVENT_ICON = { created: 'flame', joined: 'users', left: 'arrowLeft', kicked: 'x', role: 'shield', leader: 'crown', leader_auto: 'crown',
  settings: 'sliders', meetup: 'calendar', meetup_cancel: 'x', meetup_done: 'check', tier: 'gift', level: 'arrowUp', trail_done: 'route' }
export function eventText(e) {
  const a = e.actor || 'یک نفر', b = e.target || 'یک نفر', d = e.data || {}
  switch (e.kind) {
    case 'created': return a + ' کلن را ساخت'
    case 'joined': return a + ' به کلن پیوست' + (d.via === 'code' ? ' با کد دعوت' : '')
    case 'left': return a + ' کلن را ترک کرد'
    case 'kicked': return b + ' از کلن بیرون شد'
    case 'role': return b + (d.role === 'officer' ? ' معاون شد' : ' عضو عادی شد')
    case 'leader': return 'رهبری به ' + b + ' رسید'
    case 'leader_auto': return 'رهبر غایب بود و رهبری به ' + b + ' رسید'
    case 'settings': return a + ' تنظیمات کلن را به‌روز کرد'
    case 'meetup': return a + ' دورهمی گذاشت در «' + (d.cafe || 'کافه') + '»'
    case 'meetup_cancel': return 'دورهمی «' + (d.cafe || 'کافه') + '» لغو شد'
    case 'meetup_done': return 'دورهمی «' + (d.cafe || 'کافه') + '» با ' + fa(d.count) + ' نفر برگزار شد'
    case 'tier': return 'صندوق ' + (TIER_NAMES[(d.tier || 1) - 1]) + ' این هفته باز شد'
    case 'level': return 'کلن سطح ' + fa(d.level) + ' شد'
    case 'trail_done': return a + ' مسیر «' + (d.title || 'مسیر') + '» را تمام کرد و ' + fa(d.points) + ' امتیاز برای کلن آورد'
    default: return 'تغییر تازه در کلن'
  }
}
export function EventRow({ e, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <span style={{ width: 30, height: 30, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.sub }}>
        <Icon name={EVENT_ICON[e.kind] || 'bell'} size={15} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.7 }}>{eventText(e)}</span>
      <span style={{ fontSize: 10.5, color: C.sub, flexShrink: 0 }}>{faAgo(e.at)}</span>
    </div>
  )
}

// ── دعوت به کلن: کد، کپی، ارسال ─────────────────────────────
export function InviteCard({ clan, code, canRegen, onRegen, showToast, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  if (!code) return null
  const link = clanJoinLink(code)
  const copy = async () => {
    try { await navigator.clipboard.writeText(clanInviteText(clan.name) + ' ' + link); showToast && showToast('پیوند دعوت کلن کپی شد') }
    catch (e) { showToast && showToast('کپی نشد؛ کد را دستی بفرست', 'warn') }
  }
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: clan.name, text: clanInviteText(clan.name), url: link }); return } } catch (e) { return }
    copy()
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="tl4-press" onClick={copy} aria-label={'کپی کد دعوت ' + code}
          style={{ flex: 1, minWidth: 0, height: 44, borderRadius: R.box, border: '1px dashed ' + T.hairStrong, background: T.chip, color: C.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 20, fontWeight: 900, letterSpacing: 5, direction: 'ltr' }}>
          {code}<Icon name="copy" size={16} />
        </button>
        <Btn icon="share" onClick={share}>ارسال</Btn>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ flex: 1, fontSize: 11, color: C.sub, lineHeight: 1.8 }}>با این کد یا پیوند، دوستت در هر حالتی مستقیم عضو می‌شود.</span>
        {canRegen && <Btn size="sm" kind="text" icon="refresh" onClick={onRegen}>کد تازه</Btn>}
      </div>
    </div>
  )
}

// ── پنجره تأیید ─────────────────────────────────────────────
export function ConfirmSheet({ open, title, text, confirm = 'باشه', danger = false, busy = false, onConfirm, onClose }) {
  const { C } = useV4()
  if (!open) return null
  return (
    <SheetV4 open onClose={onClose} title={title} icon={danger ? 'shield' : 'help'} maxWidth={420} zIndex={2600}>
      <div style={{ fontSize: 13, lineHeight: 2, color: C.sub }}>{text}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Btn style={{ flex: 1 }} disabled={busy} onClick={onConfirm}>{busy ? 'صبر کن…' : confirm}</Btn>
        <Btn kind="ghost" onClick={onClose}>انصراف</Btn>
      </div>
    </SheetV4>
  )
}

// ── سربرگ کوچک کلن برای کارت‌ها ─────────────────────────────
export function ClanHead({ clan, sub, size = 52, end, C: c, T: t }) {
  const { C } = useV4({ C: c, T: t })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ClanEmblem clan={clan} size={size} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{sub}</div>}
      </div>
      {end}
    </div>
  )
}

export { clanTint }
