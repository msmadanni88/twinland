'use client'
// کلن — زبانه پنل، نسخه v4.0
// خلاصه زنده کلن من از همان منبع صفحه کلن: نشان و سطح، هدف و صندوق‌های هفته، دورهمی بعدی با دکمه «میام»،
// پنج عضو فعال این هفته و پیوند به هر زبانه صفحه کامل. اگر کلنی نداشته باشم: ساختن، پیوستن با کد و کلن‌های برتر.
import { useEffect, useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Card, Empty, Field, SectionHead, Skeleton, Tag } from '@/components/v4/kit/kit'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import { ClanRow, EventRow, MeetupCard, TierBar, fa } from '@/components/v4/clan/parts'
import { ROLE_LABEL, clanBrowse, clanError, faUntil, useClanHome } from '@/lib/clan/clans'

const go = (href) => { try { window.location.href = href } catch (e) {} }

export function ClanTabV4({ showToast }) {
  const { data, loading, reload } = useClanHome(true)
  if (loading || !data) return <div style={{ padding: 12 }}><Skeleton h={150} n={1} /><div style={{ height: 10 }} /><Skeleton h={56} n={3} /></div>
  if (!data.ok) return (
    <div style={{ padding: 12 }}>
      <Empty icon="wifiOff" title="کلن باز نشد" text={clanError(data)} action={<Btn icon="refresh" onClick={reload}>دوباره</Btn>} />
    </div>
  )
  return data.clan ? <Mine home={data} showToast={showToast} /> : <NoClanTab home={data} />
}

function Mine({ home, showToast }) {
  const { C, T } = useV4()
  const clan = home.clan
  const me = home.me || {}
  const week = home.week || {}
  const next = (home.meetups || []).find(m => m.status === 'open')
  const top = (home.members || []).slice().sort((a, b) => (b.week || 0) - (a.week || 0)).slice(0, 5)
  const held = (home.districts || []).filter(d => d.held).length
  const reqs = (home.requests || []).length
  const lastNews = (home.events || []).slice(0, 3)
  return (
    <div style={{ padding: '12px 12px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ padding: 14 }}>
        <a href="/clan" className="tl4-press" style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.text, textDecoration: 'none' }}>
          <ClanEmblem clan={clan} size={54} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: C.sub, marginTop: 3 }}>
              سطح {fa(clan.level)} · {fa(clan.members)} عضو{home.rank && home.rank.week ? ' · رتبه ' + fa(home.rank.week) + ' هفته' : ''}
            </span>
          </span>
          <Tag strong>{ROLE_LABEL[me.role] || 'عضو'}</Tag>
        </a>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
            <b style={{ fontWeight: 900 }}>هدف هفته</b>
            <span style={{ color: C.sub, fontSize: 11.5 }}>{week.ends_at ? faUntil(week.ends_at) + ' مانده' : ''}</span>
          </div>
          <TierBar week={week} compact />
          <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>
            {me.week_checkins ? 'تو این هفته ' + fa(me.week_checkins) + ' چک‌این برای کلن زدی.' : 'برای گرفتن جایزه صندوق‌ها، این هفته دست‌کم یک چک‌این بزن.'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
          <Mini icon="trophy" value={fa(clan.week)} label="امتیاز هفته" href="/clan?tab=ranks" />
          <Mini icon="flag" value={fa(held)} label="پرچم منطقه" href="/clan?tab=ranks" />
          <Mini icon="users" value={reqs ? fa(reqs) : fa(clan.members)} label={reqs ? 'درخواست تازه' : 'اعضا'} href="/clan?tab=members" hot={reqs > 0} />
        </div>
      </Card>

      <Card>
        <SectionHead title="دورهمی بعدی" action={<Btn size="sm" kind="text" href="/clan?tab=meetups">همه</Btn>} />
        {next
          ? <MeetupCard m={next} showToast={showToast} compact />
          : <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.sub, lineHeight: 1.8 }}>
              <span style={{ flex: 1 }}>دورهمی بازی نیست. با چند نفر از کلن در یک کافه چک‌این بزنید تا هر نفر ۳۰ و کلن ۵۰ امتیاز بگیرد.</span>
              <Btn size="sm" icon="calendar" href="/clan?tab=meetups">بساز</Btn>
            </div>}
      </Card>

      <Card>
        <SectionHead title="فعال‌های این هفته" hint="روی هر نفر بزن تا پروفایلش را ببینی" action={<Btn size="sm" kind="text" href="/clan?tab=members">اعضا</Btn>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: R.box, background: m.me ? T.accentSoft : 'transparent', border: '1px solid ' + (m.me ? T.hairStrong : 'transparent') }}>
              <span style={{ width: 18, textAlign: 'center', fontWeight: 900, color: C.sub, fontSize: 12 }}>{fa(i + 1)}</span>
              <PersonLink id={m.id} label={(m.card && m.card.name) || ''} style={{ flex: 1, gap: 10, minWidth: 0 }}>
                <UserAvatar person={m.card} size={34} />
                <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m.card && m.card.name) || 'کاربر'}</span>{m.me && <Tag strong>تو</Tag>}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: C.sub }}>{ROLE_LABEL[m.role] || 'عضو'}</span>
                </span>
              </PersonLink>
              <span style={{ fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(m.week)}</span>
            </div>
          ))}
        </div>
      </Card>

      {lastNews.length > 0 && (
        <Card>
          <SectionHead title="تازه‌های کلن" action={<Btn size="sm" kind="text" href="/clan">همه</Btn>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{lastNews.map(e => <EventRow key={e.id} e={e} />)}</div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Btn kind="ghost" icon="chat" href="/clan?tab=board">تابلوی کلن</Btn>
        <Btn kind="ghost" icon="share" href="/clan?tab=members">دعوت دوست</Btn>
      </div>
      <Btn block icon="users" href="/clan">صفحه کامل کلن</Btn>
    </div>
  )
}

function Mini({ icon, value, label, href, hot }) {
  const { C, T } = useV4()
  return (
    <a href={href} className="tl4-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '9px 4px', borderRadius: R.box, textDecoration: 'none',
      background: hot ? T.accentSoft : T.chip, border: '1px solid ' + (hot ? T.hairStrong : T.hair), color: C.text }}>
      <Icon name={icon} size={16} color={hot ? C.accent : C.sub} />
      <b style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
      <span style={{ fontSize: 10.5, color: C.sub }}>{label}</span>
    </a>
  )
}

function NoClanTab({ home }) {
  const { C } = useV4()
  const [code, setCode] = useState('')
  const [list, setList] = useState(null)
  useEffect(() => {
    let alive = true
    clanBrowse('', 'week', 5).then(r => { if (alive) setList(r && r.ok ? (r.list || []) : []) })
    return () => { alive = false }
  }, [])
  const clean = code.trim().toUpperCase()
  const valid = /^[A-Z2-9]{6}$/.test(clean)
  const pending = (home.requests || []).length
  if (home.business) return (
    <div style={{ padding: 12 }}>
      <Empty icon="shield" title="کلن برای حساب کاربر است" text="حساب کسب‌وکار نمی‌تواند کلن بسازد یا عضو شود. از پنل کسب‌وکار، رویداد و تخفیف برای کلن‌ها بگذار." />
    </div>
  )
  return (
    <div style={{ padding: '12px 12px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 48, height: 48, borderRadius: R.box, background: C.accent, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="users" size={24} />
          </span>
          <span style={{ flex: 1 }}>
            <b style={{ display: 'block', fontSize: 15, fontWeight: 900 }}>با دوستانت کلن بساز</b>
            <span style={{ display: 'block', fontSize: 11.5, color: C.sub, marginTop: 3, lineHeight: 1.8 }}>هدف هفتگی مشترک، صندوق‌های XP، دورهمی در کافه و پرچم منطقه</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Btn style={{ flex: 1 }} icon="plus" disabled={!!home.create_after && new Date(home.create_after) > new Date()} href="/clan?create=1">ساختن کلن</Btn>
          <Btn kind="ghost" icon="search" href="/clan">کاوش</Btn>
        </div>
        {home.cooldown_until && new Date(home.cooldown_until) > new Date() && (
          <div style={{ fontSize: 11, color: C.sub, marginTop: 8 }}>تا یک روز بعد از ترک کلن، پیوستن دوباره ممکن نیست.</div>
        )}
      </Card>
      <Card>
        <SectionHead title="کد دعوت داری؟" />
        <form onSubmit={(e) => { e.preventDefault(); if (valid) go('/clan?join=' + clean) }} style={{ display: 'flex', gap: 8 }}>
          <Field icon="link" value={code} onChange={(v) => setCode(String(v).toUpperCase().slice(0, 6))} placeholder="کد ۶ حرفی" style={{ flex: 1 }} inputStyle={{ direction: 'ltr', textAlign: 'center', letterSpacing: 3, fontWeight: 900 }} aria-label="کد دعوت کلن" />
          <Btn type="submit" disabled={!valid}>پیوستن</Btn>
        </form>
        {pending > 0 && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8 }}>{fa(pending)} درخواست پیوستن در انتظار پاسخ داری.</div>}
      </Card>
      <Card>
        <SectionHead title="کلن‌های برتر این هفته" action={<Btn size="sm" kind="text" href="/clan?tab=ranks">همه</Btn>} />
        {list === null ? <Skeleton h={52} n={3} />
          : list.length === 0 ? <div style={{ fontSize: 12, color: C.sub }}>هنوز کلنی ساخته نشده. اولین کلن را تو بساز.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map(c => <ClanRow key={c.id} clan={c} rank={c.rank} metric={c.week_points} href={'/clan?c=' + c.id} />)}
              </div>}
      </Card>
    </div>
  )
}
