'use client'
// ویجت کلن در داشبورد v4.0 — از همان منبع زنده صفحه کلن (useClanHome)
// عضو کلن: نشان، هدف هفته با سه صندوق، دورهمی بعدی با دکمه «میام» و پیوند به زبانه کلن پنل.
// بدون کلن: یک دعوت کوتاه به ساختن یا پیوستن. حساب کسب‌وکار این ویجت را نمی‌بیند.
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { Btn, Card, SectionHead } from '@/components/v4/kit/kit'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import { MeetupCard, TierBar, fa } from '@/components/v4/clan/parts'
import { faUntil, useClanHome } from '@/lib/clan/clans'

const wrap = { margin: '0 12px 12px' }

export function ClanWidgetV4({ ctx }) {
  const { C, T, goTab, showToast } = ctx
  const { data } = useClanHome(true)
  if (!data || !data.ok) return null
  if (!data.clan) {
    if (data.business) return null
    return (
      <Card style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="users" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: 13.5, fontWeight: 900 }}>کلن نداری</b>
            <span style={{ display: 'block', fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>با دوستانت هدف هفته را پر کنید و صندوق XP باز کنید.</span>
          </span>
          <Btn size="sm" href="/clan">شروع</Btn>
        </div>
      </Card>
    )
  }
  const clan = data.clan
  const week = data.week || {}
  const meetup = (data.meetups || []).find(m => m.status === 'open')
  return (
    <Card style={wrap}>
      <SectionHead title="کلن من" hint={'هدف هفته · ' + (week.ends_at ? faUntil(week.ends_at) + ' مانده' : 'شنبه از نو')}
        action={<button type="button" className="tl4-press" onClick={() => goTab('clan')} style={{ fontSize: 11.5, fontWeight: 800, color: C.text, background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}>همه<Icon name="chevronLeft" size={14} /></button>} />
      <a href="/clan" className="tl4-press" style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.text, textDecoration: 'none' }}>
        <ClanEmblem clan={clan} size={40} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</span>
          <span style={{ display: 'block', fontSize: 11, color: C.sub, marginTop: 2 }}>سطح {fa(clan.level)} · {fa(clan.members)} عضو · {fa(clan.week)} امتیاز این هفته</span>
        </span>
      </a>
      <TierBar week={week} compact />
      {meetup && <div style={{ marginTop: 8 }}><MeetupCard m={meetup} showToast={showToast} compact /></div>}
    </Card>
  )
}
