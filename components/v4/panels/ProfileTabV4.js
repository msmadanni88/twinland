'use client'
// پروفایل — زبانه پنل، نسخه v4.0: خلاصه پروفایل با همان چهره، نوار امتیاز و آمار صفحه پروفایل کامل
import { useMe } from '@/lib/profile/people'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Card, ListRow, Skeleton, Stat, Tag } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { LevelBadge, XpBar } from '@/components/v4/kit/Meter'
import { ReferralInline } from '@/components/v4/growth/Referral'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function ProfileTabV4({ xp, levelInfo, streak, checkedIn, userName, showToast }) {
  const { C, T } = useV4()
  const me = useMe()
  const lv = levelInfo.current
  const card = (me && me.card) || { name: userName || 'کاربر' }
  const pv = me && me.privacy
  const privacySub = pv ? [pv.profile_public ? 'پروفایل عمومی' : 'پروفایل خصوصی', pv.show_email ? 'ایمیل دیده می‌شود' : 'ایمیل پنهان'].join(' · ') : '…'
  return (
    <div style={{ padding: '12px 12px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/profile?edit=1" aria-label="عوض کردن چهره" className="tl4-press" style={{ position: 'relative', flexShrink: 0 }}>
            {me ? <UserAvatar person={card} size={60} /> : <span style={{ display: 'block', width: 60, height: 60, borderRadius: '50%', background: T.chip }} />}
            <span style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderRadius: '50%', background: C.accent, color: T.onAccent, border: '2px solid ' + C.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={12} stroke={2} /></span>
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</span>
              {pv && !pv.profile_public && <Tag>خصوصی</Tag>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5, color: C.sub, fontWeight: 700 }}>
              <LevelBadge level={lv} size={20} />لول {fa(lv.level)} · {lv.name}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, margin: '14px 0 6px' }}>
          <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(xp)} <span style={{ color: C.sub, fontWeight: 700 }}>XP</span></span>
          <span style={{ color: C.sub, fontWeight: 700 }}>{levelInfo.next ? fa(Math.max(0, levelInfo.next.minXP - xp)) + ' تا ' + levelInfo.next.name : 'بالاترین لول'}</span>
        </div>
        <XpBar levelInfo={levelInfo} size="md" />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Btn href="/profile" style={{ flex: 1 }} icon="user">پروفایل کامل</Btn>
          <Btn kind="ghost" href="/profile?edit=1" icon="edit">ویرایش</Btn>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
        <Stat icon="flame" value={streak} label="روز پشت هم" />
        <Stat icon="coffee" value={checkedIn ? checkedIn.size : 0} label="کافه" />
        <Stat icon="star" value={lv.level} label="لول" />
      </div>
      {!me && <Skeleton h={56} n={1} />}
      {me && <ListRow icon="lock" title="حریم خصوصی" sub={privacySub} href="/profile?tab=settings" />}
      <Card><ReferralInline showToast={showToast} /></Card>
    </div>
  )
}
