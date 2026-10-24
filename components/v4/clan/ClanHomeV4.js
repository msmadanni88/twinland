'use client'
// ─────────────────────────────────────────────────────────────
//  کلن من — نسخه v4.0
//  سربرگ با نشان، سطح، اعضا، پاتوق و رتبه هفته؛ و شش زبانه:
//   نمای کلی: هدف هفته و سه صندوق، دورهمی بعدی، پرچم مناطق و خبرها
//   اعضا: درخواست‌ها، اعضا با امتیاز هفته و کل، نقش‌ها، بیرون کردن و انتقال رهبری، دعوت
//   دورهمی: ساختن، «میام»، لغو و تاریخچه
//   تابلو: پیام کوتاه بدون پیوند و شماره، پاک کردن و گزارش
//   رتبه‌ها: کلن‌های هفته و کل، و پرچم ۲۲ منطقه
//   تنظیمات: فقط رهبر و معاون؛ ترک کلن و انحلال
// ─────────────────────────────────────────────────────────────
import { districtLabel } from '@/lib/events/format'
import { useEffect, useRef, useState } from 'react'
import { faAgo } from '@/lib/format'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Card, Chip, Empty, SectionHead, Segmented, Skeleton, Stat, Tag, TextArea, faDigits } from '@/components/v4/kit/kit'
import { Meter } from '@/components/v4/kit/Meter'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import { ClanForm, MeetupSheet } from '@/components/v4/clan/ClanForm'
import { ClanRow, ConfirmSheet, EventRow, InviteCard, MeetupCard, TierBar, TierChests, fa } from '@/components/v4/clan/parts'
import {
  JOIN_MODE_TEXT, ROLE_LABEL, clanBrowse, clanCodeRegen, clanDecide, clanDisband, clanDistricts, clanError, clanKick, clanLeave,
  clanSetRole, clanTransfer, meetupCancel, postCreate, postDelete, postReport, getCafe, faUntil,
} from '@/lib/clan/clans'

export const CLAN_TABS = [['overview', 'نمای کلی', 'grid'], ['members', 'اعضا', 'users'], ['meetups', 'دورهمی', 'calendar'], ['board', 'تابلو', 'chat'], ['ranks', 'رتبه‌ها', 'trophy'], ['settings', 'تنظیمات', 'sliders']]

const endsIn = (iso) => faUntil(iso)

export function ClanHomeV4({ home, showToast, initialTab = 'overview', reload, meetupCafe = null }) {
  const { C, T } = useV4()
  const clan = home.clan
  const me = home.me || {}
  const staff = me.role === 'leader' || me.role === 'officer'
  const tabs = CLAN_TABS.filter(([k]) => k !== 'settings' || staff)
  const [tab, setTab] = useState(tabs.some(([k]) => k === initialTab) ? initialTab : 'overview')
  const [meetupOpen, setMeetupOpen] = useState(false)
  const [meetupAt, setMeetupAt] = useState(null)
  const barRef = useRef(null)
  // زبانه انتخاب‌شده روی گوشی همیشه جلوی چشم است
  useEffect(() => {
    const on = barRef.current && barRef.current.querySelector('[aria-selected="true"]')
    if (on && on.scrollIntoView) { try { on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) } catch (e) {} }
  }, [tab])
  // از برگه کافه با ?tab=meetups&at=<کافه> می‌آید: فرم دورهمی با همان کافه باز می‌شود
  useEffect(() => {
    if (!meetupCafe) return
    let alive = true
    getCafe(meetupCafe).then(c => { if (alive && c) { setMeetupAt(c); setMeetupOpen(true) } })
    return () => { alive = false }
  }, [meetupCafe])
  const closeMeetup = () => {
    setMeetupOpen(false); setMeetupAt(null)
    try { const u = new URL(window.location.href); if (u.searchParams.has('at')) { u.searchParams.delete('at'); window.history.replaceState(null, '', u.pathname + u.search) } } catch (e) {}
  }
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const pendingReq = (home.requests || []).length

  const go = (k) => {
    setTab(k)
    try { const u = new URL(window.location.href); u.searchParams.set('tab', k); window.history.replaceState(null, '', u.pathname + u.search) } catch (e) {}
  }
  const run = async (fn, ok) => {
    setBusy(true)
    const r = await fn()
    setBusy(false)
    setConfirm(null)
    if (!r.ok) { showToast(clanError(r), 'warn'); return r }
    if (ok) showToast(ok)
    return r
  }
  const lvlPct = clan.level_next ? Math.round(((clan.points - clan.level_min) / Math.max(1, clan.level_next - clan.level_min)) * 100) : 100
  const nextMeetup = (home.meetups || []).find(m => m.status === 'open')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* سربرگ */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ClanEmblem clan={clan} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</div>
            {clan.motto && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>{clan.motto}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Tag strong>{ROLE_LABEL[me.role] || 'عضو'}</Tag>
              <Tag>{JOIN_MODE_TEXT[clan.join_mode]}</Tag>
              {home.rank && home.rank.week ? <Tag>رتبه {fa(home.rank.week)} هفته</Tag> : null}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.sub, marginBottom: 6 }}>
            <span>سطح {fa(clan.level)} · {fa(clan.points)} امتیاز کلن</span>
            <span>{clan.level_next ? fa(clan.level_next - clan.points) + ' تا سطح ' + fa(clan.level + 1) : 'بالاترین سطح'}</span>
          </div>
          <Meter value={lvlPct} segments={5} size="md" label={'پیشرفت سطح کلن ' + lvlPct + ' درصد'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          <Stat icon="users" value={fa(clan.members) + ' از ' + fa(clan.cap)} label="اعضا" onClick={() => go('members')} />
          <Stat icon="trophy" value={clan.week} label="امتیاز این هفته" onClick={() => go('ranks')} />
          <Stat icon="flag" value={(home.districts || []).filter(d => d.held).length} label="پرچم منطقه" onClick={() => go('ranks')} />
        </div>
        {clan.home && (
          <a href={'/?cafe=' + clan.home.id} className="tl4-press" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '9px 12px', borderRadius: R.box,
            background: T.chip, border: '1px solid ' + T.hair, color: C.text, textDecoration: 'none' }}>
            <Icon name="coffee" size={17} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>پاتوق کلن: <b style={{ fontWeight: 900 }}>{clan.home.name}</b>{clan.home.district ? ' · ' + faDigits(districtLabel(clan.home.district)) : ''}</span>
            <Icon name="chevronLeft" size={15} color={C.sub} />
          </a>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn style={{ flex: 1 }} icon="calendar" onClick={() => setMeetupOpen(true)}>دورهمی تازه</Btn>
          <Btn kind="ghost" icon="share" onClick={() => { go('members'); setTimeout(() => { try { document.getElementById('clan-invite').scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (e) {} }, 120) }}>دعوت</Btn>
        </div>
      </Card>

      <div ref={barRef} className="tl4-noscroll" style={{ overflowX: 'auto' }}>
        <Segmented options={tabs.map(([k, l, i]) => [k, k === 'members' && pendingReq && staff ? l + ' · ' + fa(pendingReq) : l, i])} value={tab} onChange={go} label="بخش‌های کلن" style={{ minWidth: 560 }} />
      </div>

      {tab === 'overview' && <Overview home={home} go={go} nextMeetup={nextMeetup} onMeetup={() => setMeetupOpen(true)} showToast={showToast} />}
      {tab === 'members' && <Members home={home} staff={staff} busy={busy} setConfirm={setConfirm} run={run} showToast={showToast} />}
      {tab === 'meetups' && <Meetups home={home} onNew={() => setMeetupOpen(true)} setConfirm={setConfirm} run={run} showToast={showToast} />}
      {tab === 'board' && <Board home={home} setConfirm={setConfirm} run={run} showToast={showToast} />}
      {tab === 'ranks' && <Ranks home={home} />}
      {tab === 'settings' && staff && (
        <Card>
          <SectionHead title="تنظیمات کلن" hint={me.role === 'leader' ? 'همه چیز را می‌توانی عوض کنی.' : 'معاون فقط شعار کلن را عوض می‌کند.'} />
          <ClanForm clan={clan} role={me.role} showToast={showToast} onDone={() => reload && reload()} />
        </Card>
      )}

      {/* ترک و انحلال، برای همه در پایین صفحه */}
      <Card>
        <SectionHead title="عضویت" />
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9, marginBottom: 10 }}>
          عضو از {me.joined_at ? new Date(me.joined_at).toLocaleDateString('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', timeZone: 'Asia/Tehran' }) : '-'}.
          {' '}بعد از ترک کلن تا ۲۴ ساعت نمی‌شود به کلن دیگری پیوست.
          {me.role === 'leader' ? ' اگر رهبر کلن را ترک کند، رهبری به معاون یا قدیمی‌ترین عضو می‌رسد.' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn kind="ghost" icon="logout" disabled={busy} onClick={() => setConfirm({ title: 'ترک کلن', text: 'مطمئنی؟ امتیازی که به کلن داده‌ای برای کلن می‌ماند و تا ۲۴ ساعت به کلن دیگری نمی‌توانی بپیوندی.', confirm: 'ترک کلن', danger: true,
            go: () => run(clanLeave, 'از کلن بیرون آمدی') })}>ترک کلن</Btn>
          {me.role === 'leader' && <Btn kind="text" icon="trash" disabled={busy} onClick={() => setConfirm({ title: 'انحلال کلن', text: 'کلن برای همه اعضا بسته می‌شود و دورهمی‌های باز لغو می‌شوند. این کار برگشت ندارد.', confirm: 'انحلال کلن', danger: true,
            go: () => run(clanDisband, 'کلن منحل شد') })}>انحلال کلن</Btn>}
        </div>
      </Card>

      <MeetupSheet open={meetupOpen} onClose={closeMeetup} home={meetupAt || clan.home} showToast={showToast} />
      <ConfirmSheet open={!!confirm} title={confirm && confirm.title} text={confirm && confirm.text} confirm={confirm && confirm.confirm} danger={confirm && confirm.danger}
        busy={busy} onConfirm={() => confirm && confirm.go()} onClose={() => setConfirm(null)} />
    </div>
  )
}

// ── نمای کلی ────────────────────────────────────────────────
function Overview({ home, go, nextMeetup, onMeetup, showToast }) {
  const { C, T } = useV4()
  const week = home.week || {}
  const me = home.me || {}
  return (<>
    <Card>
      <SectionHead title="هدف این هفته" hint={endsIn(week.ends_at) + ' مانده · شنبه از نو'} />
      <TierBar week={week} />
      <TierChests week={week} myCheckins={me.week_checkins || 0} />
      <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginTop: 10 }}>
        {me.week_checkins > 0
          ? 'تو این هفته ' + fa(me.week_checkins) + ' چک‌این و ' + fa(me.week_points) + ' امتیاز به کلن داده‌ای.'
          : 'جایزه صندوق فقط به کسی می‌رسد که خودش این هفته دست‌کم یک چک‌این زده باشد.'}
      </div>
    </Card>

    <Card>
      <SectionHead title="دورهمی بعدی" action={<Btn size="sm" kind="ghost" onClick={() => go('meetups')}>همه</Btn>} />
      {nextMeetup
        ? <MeetupCard m={nextMeetup} showToast={showToast} />
        : <Empty icon="calendar" title="دورهمی بازی نیست" text="یک کافه و ساعت بگذار؛ اگر سه نفر بیایند، هر نفر ۳۰ امتیاز می‌گیرد." action={<Btn icon="plus" onClick={onMeetup}>دورهمی تازه</Btn>} style={{ padding: '12px 8px' }} />}
    </Card>

    <Card>
      <SectionHead title="پرچم مناطق این ماه" hint={endsIn(home.season_ends) + ' تا پایان ماه'} action={<Btn size="sm" kind="ghost" onClick={() => go('ranks')}>همه مناطق</Btn>} />
      {(home.districts || []).length === 0
        ? <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>هر چک‌این اعضا در یک منطقه تهران، امتیاز همان منطقه را برای کلن می‌آورد. بیشترین امتیاز ماه یعنی پرچم آن منطقه.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {home.districts.slice(0, 5).map(d => (
              <div key={d.district} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, background: d.held ? T.accentSoft : T.chip, border: '1px solid ' + (d.held ? T.hairStrong : T.hair) }}>
                <Icon name={d.held ? 'flag' : 'map'} size={17} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800 }}>منطقه {fa(d.district)}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{d.held ? 'پرچم دست ماست · ' + fa(d.pts) : fa(d.pts) + ' در برابر ' + fa(d.leader_pts) + (d.leader ? ' «' + d.leader.name + '»' : '')}</span>
              </div>
            ))}
          </div>}
    </Card>

    <Card>
      <SectionHead title="خبرهای کلن" />
      {(home.events || []).length === 0
        ? <div style={{ fontSize: 12.5, color: C.sub }}>هنوز خبری نیست.</div>
        : <div>{home.events.slice(0, 12).map((e, i) => <div key={e.id} style={{ borderTop: i ? '1px solid ' + T.hair : 'none' }}><EventRow e={e} /></div>)}</div>}
    </Card>
  </>)
}

// ── اعضا ────────────────────────────────────────────────────
function Members({ home, staff, busy, setConfirm, run, showToast }) {
  const { C, T } = useV4()
  const me = home.me || {}
  const [menu, setMenu] = useState(null)
  const requests = home.requests || []
  return (<>
    {staff && requests.length > 0 && (
      <Card>
        <SectionHead title="درخواست‌های عضویت" hint={fa(requests.length) + ' نفر منتظرند'} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {requests.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
              <PersonLink id={r.card && r.card.id} label={r.card && r.card.name} style={{ flex: 1, gap: 10, minWidth: 0 }}>
                <UserAvatar person={r.card} size={36} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card && r.card.name}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: C.sub }}>لول {fa(r.level)} · {faAgo(r.at)}</span>
                </span>
              </PersonLink>
              <Btn size="sm" icon="check" disabled={busy} onClick={() => run(() => clanDecide(r.id, true), 'عضو تازه پذیرفته شد')}>پذیرش</Btn>
              <Btn size="sm" kind="ghost" disabled={busy} onClick={() => run(() => clanDecide(r.id, false), 'درخواست رد شد')}>رد</Btn>
            </div>
          ))}
        </div>
      </Card>
    )}

    <Card>
      <SectionHead title="اعضا" hint={'مرتب بر اساس امتیاز این هفته · ' + fa((home.members || []).length) + ' از ' + fa(home.clan.cap)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(home.members || []).map(m => {
          const canAct = !m.me && ((me.role === 'leader') || (me.role === 'officer' && m.role === 'member'))
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, background: m.me ? T.accentSoft : T.chip, border: '1px solid ' + (m.me ? T.hairStrong : T.hair) }}>
              <PersonLink id={m.card && m.card.id} label={m.card && m.card.name} style={{ flex: 1, gap: 10, minWidth: 0 }}>
                <UserAvatar person={m.card} size={38} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.card && m.card.name}</span>
                    {m.role !== 'member' && <Tag strong={m.role === 'leader'}>{ROLE_LABEL[m.role]}</Tag>}
                    {m.me && <Tag>تو</Tag>}
                  </span>
                  <span style={{ display: 'block', fontSize: 10.5, color: C.sub }}>کل {fa(m.total)} امتیاز برای کلن</span>
                </span>
              </PersonLink>
              <span style={{ textAlign: 'center', flexShrink: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(m.week)}</span>
                <span style={{ display: 'block', fontSize: 9.5, color: C.sub }}>این هفته</span>
              </span>
              {canAct && <button type="button" className="tl4-btn" aria-label={'کارهای مربوط به ' + (m.card && m.card.name)} onClick={() => setMenu(m)}
                style={{ width: 32, height: 32, borderRadius: R.box, border: '1px solid ' + T.hair, background: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <Icon name="sliders" size={15} />
              </button>}
            </div>
          )
        })}
      </div>
    </Card>

    <Card id="clan-invite" style={{ scrollMarginTop: 70 }}>
      <SectionHead title="دعوت به کلن" hint="کد یا پیوند را برای دوستانت بفرست" />
      <InviteCard clan={home.clan} code={home.code} canRegen={staff} showToast={showToast}
        onRegen={() => run(clanCodeRegen, 'کد تازه ساخته شد؛ کد قبلی دیگر کار نمی‌کند')} />
    </Card>

    {menu && (
      <SheetV4 open onClose={() => setMenu(null)} title={menu.card && menu.card.name} icon="user" maxWidth={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {me.role === 'leader' && menu.role === 'member' && <Btn block kind="ghost" icon="shield" disabled={busy} onClick={() => { setMenu(null); run(() => clanSetRole(menu.id, 'officer'), 'معاون تازه انتخاب شد') }}>معاون کن</Btn>}
          {me.role === 'leader' && menu.role === 'officer' && <Btn block kind="ghost" icon="user" disabled={busy} onClick={() => { setMenu(null); run(() => clanSetRole(menu.id, 'member'), 'دوباره عضو عادی شد') }}>عضو عادی کن</Btn>}
          {me.role === 'leader' && <Btn block kind="ghost" icon="crown" disabled={busy} onClick={() => { const m = menu; setMenu(null); setConfirm({ title: 'سپردن رهبری', text: 'رهبری کلن به «' + (m.card && m.card.name) + '» می‌رسد و تو معاون می‌شوی.', confirm: 'سپردن رهبری', go: () => run(() => clanTransfer(m.id), 'رهبری سپرده شد') }) }}>سپردن رهبری</Btn>}
          <Btn block kind="ghost" icon="x" disabled={busy} onClick={() => { const m = menu; setMenu(null); setConfirm({ title: 'بیرون کردن از کلن', text: '«' + (m.card && m.card.name) + '» از کلن بیرون می‌شود و می‌تواند به کلن دیگری بپیوندد.', confirm: 'بیرون کن', danger: true, go: () => run(() => clanKick(m.id), 'از کلن بیرون شد') }) }}>بیرون کردن از کلن</Btn>
          <Btn block kind="text" href={'/profile?u=' + (menu.card && menu.card.id)}>دیدن پروفایل</Btn>
        </div>
      </SheetV4>
    )}
  </>)
}

// ── دورهمی‌ها ───────────────────────────────────────────────
function Meetups({ home, onNew, setConfirm, run, showToast }) {
  const { C } = useV4()
  const list = home.meetups || []
  const live = list.filter(m => m.status === 'open')
  const past = list.filter(m => m.status !== 'open')
  const cancel = (m) => setConfirm({ title: 'لغو دورهمی', text: 'دورهمی «' + m.cafe.name + '» لغو می‌شود و به کسانی که «میام» زده‌اند خبر می‌رسد.', confirm: 'لغو دورهمی', danger: true, go: () => run(() => meetupCancel(m.id), 'دورهمی لغو شد') })
  return (<>
    <Card>
      <SectionHead title="دورهمی‌های باز" hint={'هم‌زمان حداکثر ' + fa(home.meetup_cap) + ' دورهمی'} action={<Btn size="sm" icon="plus" onClick={onNew}>تازه</Btn>} />
      {live.length === 0
        ? <Empty icon="calendar" title="دورهمی بازی نیست" text="کافه و ساعت را انتخاب کن؛ به همه اعضا خبر می‌رسد." action={<Btn icon="plus" onClick={onNew}>دورهمی تازه</Btn>} style={{ padding: '12px 8px' }} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{live.map(m => <MeetupCard key={m.id} m={m} onCancel={cancel} showToast={showToast} />)}</div>}
      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.9, marginTop: 10 }}>
        شرط برگزاری: دست‌کم سه نفر از کلن، یا دو نفر اگر کلن کمتر از چهار عضو دارد، از نیم ساعت قبل تا سه ساعت بعد در همان کافه چک‌این کنند. هر نفر روزی یک جایزه دورهمی می‌گیرد.
      </div>
    </Card>
    {past.length > 0 && (
      <Card>
        <SectionHead title="دورهمی‌های گذشته" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{past.map(m => <MeetupCard key={m.id} m={m} compact />)}</div>
      </Card>
    )}
  </>)
}

// ── تابلو ───────────────────────────────────────────────────
function Board({ home, setConfirm, run, showToast }) {
  const { C, T } = useV4()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const send = async () => {
    const b = text.trim()
    if (b.length < 2) return
    setSending(true)
    const r = await postCreate(b)
    setSending(false)
    if (!r.ok) { showToast(clanError(r), 'warn'); return }
    setText('')
  }
  return (<>
    <Card>
      <SectionHead title="پیام به کلن" hint="بدون پیوند و شماره تلفن · فقط اعضا می‌بینند" />
      <TextArea value={text} onChange={setText} maxLength={200} rows={2} placeholder="مثلاً: جمعه ساعت ۶ کی پایه است؟" label="پیام به کلن" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Btn icon="chat" disabled={sending || text.trim().length < 2} onClick={send}>{sending ? 'صبر کن…' : 'فرستادن'}</Btn>
      </div>
    </Card>
    <Card>
      <SectionHead title="تابلو" />
      {(home.posts || []).length === 0
        ? <Empty icon="chat" title="هنوز پیامی نیست" text="اولین پیام را تو بگذار." style={{ padding: '12px 8px' }} />
        : <div>
            {home.posts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i ? '1px solid ' + T.hair : 'none' }}>
                <PersonLink id={p.card && p.card.id} label={p.card && p.card.name}><UserAvatar person={p.card} size={34} /></PersonLink>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 900 }}>{p.card && p.card.name}</span>
                    <span style={{ fontSize: 10.5, color: C.sub }}>{faAgo(p.at)}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.9, marginTop: 2, overflowWrap: 'anywhere' }}>{p.body}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {p.can_delete && <Btn size="sm" kind="text" icon="trash" onClick={() => setConfirm({ title: 'پاک کردن پیام', text: 'این پیام از تابلو برداشته می‌شود.', confirm: 'پاک کن', danger: true, go: () => run(() => postDelete(p.id), 'پیام برداشته شد') })}>پاک کردن</Btn>}
                    {!p.mine && !p.reported && <Btn size="sm" kind="text" icon="shield" onClick={() => run(() => postReport(p.id), 'گزارش ثبت شد؛ با سه گزارش پیام پنهان می‌شود')}>گزارش</Btn>}
                    {!p.mine && p.reported && <span style={{ fontSize: 10.5, color: C.sub, padding: '6px 4px' }}>گزارش دادی</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>}
    </Card>
  </>)
}

// ── رتبه‌ها و پرچم مناطق ────────────────────────────────────
export function Ranks({ home }) {
  const { C, T } = useV4()
  const [sort, setSort] = useState('week')
  const [list, setList] = useState(null)
  const [dist, setDist] = useState(null)
  const mine = home && home.clan ? home.clan.id : null
  useEffect(() => {
    let alive = true
    setList(null)
    clanBrowse(null, sort, 50).then(r => { if (alive) setList(r.ok ? r.list : []) })
    return () => { alive = false }
  }, [sort])
  useEffect(() => {
    let alive = true
    clanDistricts().then(r => { if (alive) setDist(r.ok ? r : { list: [] }) })
    return () => { alive = false }
  }, [])
  return (<>
    <Card>
      <SectionHead title="رتبه کلن‌ها" />
      <Segmented options={[['week', 'این هفته', 'clock'], ['all', 'همه زمان‌ها', 'trophy']]} value={sort} onChange={setSort} label="بازه رتبه‌بندی" style={{ marginBottom: 10 }} />
      {!list ? <Skeleton h={58} n={4} /> : list.length === 0
        ? <Empty icon="users" title="هنوز کلنی نیست" text="اولین کلن را تو بساز." />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {list.map(c => <ClanRow key={c.id} clan={c} rank={c.rank} mine={c.id === mine} metric={sort === 'week' ? c.week_points : c.points} href={c.id === mine ? undefined : '/clan?c=' + c.id} />)}
          </div>}
    </Card>
    <Card>
      <SectionHead title="پرچم مناطق تهران" hint={dist && dist.ends_at ? endsIn(dist.ends_at) + ' تا پایان فصل این ماه' : ''} />
      {!dist ? <Skeleton h={44} n={3} /> : (dist.list || []).length === 0
        ? <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>این ماه هنوز هیچ کلنی در منطقه‌ای امتیاز نگرفته. اولین چک‌این اعضای هر کلن، اولین پرچم را می‌کارد.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dist.list.map(d => (
              <a key={d.district} href={d.holder && d.holder.id !== mine ? '/clan?c=' + d.holder.id : undefined} className="tl4-press"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, textDecoration: 'none', color: C.text,
                  background: d.held ? T.accentSoft : T.chip, border: '1px solid ' + (d.held ? T.hairStrong : T.hair) }}>
                <span style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>منطقه {fa(d.district)}</span>
                {d.holder && <ClanEmblem clan={d.holder} size={28} showLevel={false} />}
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.holder ? d.holder.name : '-'}</span>
                <span style={{ fontSize: 11, color: C.sub, flexShrink: 0 }}>{fa(d.pts)}{d.mine != null && !d.held ? ' · ما ' + fa(d.mine) : ''}</span>
              </a>
            ))}
          </div>}
    </Card>
  </>)
}
