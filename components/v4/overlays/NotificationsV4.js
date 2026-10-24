'use client'
// اعلان‌ها — نسخه v4.0: قاب برگه v4، آیکون خطی بر اساس نوع اعلان، بدون ایموجی رنگی
import { faAgo } from '@/lib/format'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Empty } from '@/components/v4/kit/kit'
import { SheetV4 } from '@/components/v4/ui/Sheet'

const TYPE_ICON = {
  collectible: 'image', quest_complete: 'target', level_up: 'arrowUp', league_win: 'trophy', redeemed: 'gift',
  referral_join: 'users', referral_reward: 'gift', referral_welcome: 'gift', referral_badge: 'medal', comment_reply: 'chat', comment_hidden: 'shield', explore: 'compass',
  clan_request: 'users', clan_join: 'users', clan_accept: 'check', clan_decline: 'x', clan_kick: 'x', clan_role: 'shield', clan_leader: 'crown',
  clan_disband: 'x', clan_meetup: 'calendar', clan_meetup_cancel: 'calendar', clan_meetup_done: 'check', clan_tier: 'gift', clan_level: 'arrowUp',
}
// ایموجی اول عنوان در نسخه‌های قبل بود؛ اینجا آیکون خطی جایش را می‌گیرد
const clean = (s) => String(s || '').replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '')

export function NotificationsV4({ notifications, onMark, onMarkAll, onClose }) {
  const { C, T } = useV4()
  const unread = notifications.some(n => !n.read)
  return (
    <SheetV4 open onClose={onClose} title="اعلان‌ها" icon="bell" maxWidth={540}
      actions={unread ? <Btn kind="ghost" size="sm" onClick={onMarkAll}>خواندن همه</Btn> : null}>
      {notifications.length === 0
        ? <Empty icon="bell" title="اعلانی نداری" text="با چک‌این و شرکت در رویدادها، خبرها همین‌جا می‌آید." />
        : <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n, i) => (
              <a key={n.id} href={n.link || '#'} onClick={(e) => { if (!n.link) e.preventDefault(); onMark(n.id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: C.text, padding: '11px 2px', borderTop: i ? '1px solid ' + T.hair : 'none', opacity: n.read ? 0.6 : 1 }}>
                <span style={{ width: 38, height: 38, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={TYPE_ICON[n.type] || 'bell'} size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: n.read ? 700 : 900 }}>{clean(n.title)}</span>
                  {n.body && <span style={{ display: 'block', fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>{n.body}</span>}
                  <span style={{ display: 'block', fontSize: 10.5, color: C.sub, marginTop: 3 }}>{faAgo(n.created_at)}</span>
                </span>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.text, flexShrink: 0 }} />}
              </a>
            ))}
          </div>}
    </SheetV4>
  )
}
