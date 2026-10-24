'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه کلن — نسخه v4.0
//  /clan                 کلن من، یا اگر کلنی ندارم: ساختن، پیوستن با کد و کاوش کلن‌ها
//  /clan?tab=meetups     یک زبانه مشخص از کلن من؛ اعلان‌ها به همین پیوندها می‌آیند
//  /clan?c=12            نمای عمومی یک کلن دیگر با دکمه پیوستن یا درخواست
//  /clan?join=ABC234     پیوستن با کد دعوت؛ اگر وارد نشده باشد، کد نگه داشته می‌شود تا بعد از ورود
//  /clan?create=1        باز شدن فرم ساختن کلن
//  /clan?tab=meetups&at=<کافه>  فرم دورهمی با همان کافه؛ از برگه کافه می‌آید
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/game/gameSystem'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Card, Chip, Empty, Field, SectionHead, Skeleton, Stat, Tag } from '@/components/v4/kit/kit'
import { V4Page } from '@/components/v4/kit/V4Page'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'
import { ToastV4, useToastV4 } from '@/components/v4/kit/Toast'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import { ClanCreateSheet } from '@/components/v4/clan/ClanForm'
import { ClanHomeV4, Ranks } from '@/components/v4/clan/ClanHomeV4'
import { ClanRow, fa } from '@/components/v4/clan/parts'
import {
  JOIN_MODE_TEXT, ROLE_LABEL, clanBrowse, clanError, clanJoin, clanRequestCancel, clanView, faUntil, useClanHome,
} from '@/lib/clan/clans'

const JOIN_KEY = 'tl_clan_join'

function readParams() {
  try {
    const sp = new URLSearchParams(window.location.search)
    const c = sp.get('c'), join = String(sp.get('join') || '').trim().toUpperCase()
    const at = String(sp.get('at') || '')
    return { c: /^\d{1,12}$/.test(c || '') ? Number(c) : null, join: /^[A-Z2-9]{6}$/.test(join) ? join : null, tab: sp.get('tab') || 'overview', create: sp.get('create') === '1', at: /^[0-9a-f-]{36}$/i.test(at) ? at : null }
  } catch (e) { return { tab: 'overview' } }
}
function cleanUrl(keep) {
  try {
    const u = new URL(window.location.href)
    ;['join', 'create', 'c'].forEach(k => { if (!keep || !keep.includes(k)) u.searchParams.delete(k) })
    window.history.replaceState(null, '', u.pathname + (u.search || ''))
  } catch (e) {}
}

export default function ClanPageV4() {
  const [params, setParams] = useState(null)
  const [uid, setUid] = useState(undefined)
  useEffect(() => {
    const p = readParams()
    setParams(p)
    const s = getSession()
    const id = (s && s.user && s.user.id) || null
    setUid(id)
    // کد دعوت پیش از ورود نگه داشته می‌شود؛ صفحه اصلی بعد از ورود دوباره این‌جا می‌آورد
    if (!id && p.join) { try { localStorage.setItem(JOIN_KEY, p.join) } catch (e) {} }
  }, [])
  if (!params || uid === undefined) return <V4Page title="کلن"><Skeleton h={180} n={1} /></V4Page>
  if (!uid) {
    return (
      <V4Page title="کلن">
        <Empty icon="users" title="اول وارد شو" text={params.join ? 'کد دعوتت نگه داشته شد؛ بعد از ورود مستقیم به همین کلن می‌آیی.' : 'برای ساختن کلن یا پیوستن به کلن دوستانت وارد حساب شو.'} action={<Btn href="/">ورود</Btn>} />
      </V4Page>
    )
  }
  return <ClanRoot params={params} />
}

function ClanRoot({ params }) {
  const { toast, showToast } = useToastV4()
  const { data, loading, reload } = useClanHome(true)
  const [view, setView] = useState(params.c)
  const [join, setJoin] = useState(params.join)
  const mineId = data && data.ok && data.clan ? data.clan.id : null
  const showingOther = view && view !== mineId
  const title = showingOther ? 'کلن' : mineId ? 'کلن من' : 'کلن‌ها'
  return (
    <V4Page title={title} back={showingOther ? 'history' : '/'} backLabel={showingOther ? 'برگشت' : 'برگشت به نقشه'} maxWidth={620}>
      <Body params={params} data={data} loading={loading} reload={reload} view={showingOther ? view : null} setView={setView} join={join} setJoin={setJoin} showToast={showToast} />
      <ToastV4 toast={toast} />
    </V4Page>
  )
}

function Body({ params, data, loading, reload, view, setView, join, setJoin, showToast }) {
  if (loading || !data) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={200} n={1} /><Skeleton h={60} n={3} /></div>
  if (!data.ok) return <Empty icon="wifiOff" title="کلن باز نشد" text={clanError(data)} action={<Btn icon="refresh" onClick={reload}>دوباره</Btn>} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {join && <JoinByCode code={join} inClan={!!data.clan} onDone={() => { setJoin(null); cleanUrl() }} showToast={showToast} />}
      {view
        ? <ClanPublic id={view} mine={data.clan} showToast={showToast} onBack={() => { setView(null); cleanUrl() }} />
        : data.clan
          ? <ClanHomeV4 home={data} showToast={showToast} initialTab={params.tab} reload={reload} meetupCafe={params.at} />
          : <NoClan home={data} openCreate={params.create} focus={params.tab} showToast={showToast} onOpen={(id) => setView(id)} />}
    </div>
  )
}

// ── پیوستن با کد ───────────────────────────────────────────
function JoinByCode({ code, inClan, onDone, showToast }) {
  const { C, T } = useV4()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    setBusy(true); setErr('')
    const r = await clanJoin(null, code)
    setBusy(false)
    if (!r.ok) { setErr(clanError(r)); return }
    showToast('به کلن پیوستی؛ خوش آمدی')
    onDone()
  }
  return (
    <Card style={{ border: '1px solid ' + T.hairStrong }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 46, height: 46, borderRadius: R.box, background: C.accent, color: T.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="users" size={22} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900 }}>دعوت به کلن</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>کد <b style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: 2, color: C.text }}>{code}</b> برایت فرستاده شده.</div>
        </div>
      </div>
      {inClan
        ? <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9, marginTop: 10 }}>الان عضو یک کلن هستی. برای پیوستن به این کلن اول از کلن فعلی‌ات بیرون بیا؛ کد تا وقتی کلن آن را عوض نکرده کار می‌کند.</div>
        : <>{err && <div role="alert" style={{ fontSize: 12.5, marginTop: 10, padding: '8px 10px', borderRadius: R.box, background: T.accentSoft }}>{err}</div>}</>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!inClan && <Btn style={{ flex: 1 }} icon="check" disabled={busy} onClick={go}>{busy ? 'صبر کن…' : 'پیوستن به کلن'}</Btn>}
        <Btn kind="ghost" onClick={onDone}>بستن</Btn>
      </div>
    </Card>
  )
}

// ── بدون کلن: ساختن، کد، کاوش ───────────────────────────────
const SORTS = [['week', 'فعال این هفته'], ['all', 'پرامتیاز'], ['members', 'پرجمعیت'], ['new', 'تازه']]

function NoClan({ home, openCreate, focus, showToast, onOpen }) {
  const { C, T } = useV4()
  const [create, setCreate] = useState(!!openCreate && !home.business)
  const [code, setCode] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('week')
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    let alive = true
    const tm = setTimeout(() => { clanBrowse(q, sort, 40).then(r => { if (alive) setList(r.ok ? r.list : []) }) }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(tm) }
  }, [q, sort])
  const reloadList = () => clanBrowse(q, sort, 40).then(r => setList(r.ok ? r.list : []))
  // از جدول رتبه‌بندی با ?tab=ranks می‌آید؛ بخش رتبه کلن‌ها را جلوی چشم بیاور
  useEffect(() => {
    if (focus !== 'ranks') return
    const tm = setTimeout(() => { try { document.getElementById('clan-ranks').scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (e) {} }, 450)
    return () => clearTimeout(tm)
  }, [focus])
  const join = async (c) => {
    setBusy(c.id)
    const r = await clanJoin(c.id, null)
    setBusy(null)
    if (!r.ok) { showToast(clanError(r), 'warn'); return }
    showToast(r.pending ? 'درخواستت فرستاده شد؛ با پذیرش رهبر خبرت می‌کنیم' : 'به «' + c.name + '» پیوستی')
    if (r.pending) reloadList()
  }
  const cancel = async (clanId) => { setBusy(clanId); const r = await clanRequestCancel(clanId); setBusy(null); if (r.ok) { showToast('درخواست پس گرفته شد'); reloadList() } }
  const joinCode = async () => {
    const c = code.trim().toUpperCase()
    if (!/^[A-Z2-9]{6}$/.test(c)) { showToast('کد دعوت شش حرف و عدد انگلیسی است', 'warn'); return }
    setBusy('code')
    const r = await clanJoin(null, c)
    setBusy(null)
    if (!r.ok) { showToast(clanError(r), 'warn'); return }
    showToast('به کلن پیوستی؛ خوش آمدی')
  }
  const blocked = home.business ? 'business' : home.cooldown_until ? 'cooldown' : null
  return (<>
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 52, height: 52, borderRadius: R.box, background: C.accent, color: T.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="users" size={26} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>کلن یعنی اکیپ کافه‌گردی</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.8 }}>با دوستانت کلن بساز یا به یک کلن بپیوند.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
        {[['calendar', 'دورهمی در کافه', 'سه نفر بیایید، هر نفر ۳۰ امتیاز'], ['gift', 'سه صندوق هفته', 'هر چک‌این کلن را جلو می‌برد'], ['flag', 'پرچم منطقه', 'بیشترین امتیاز ماه هر منطقه']].map(([i, t, s]) => (
          <div key={t} style={{ borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: '10px 8px', textAlign: 'center' }}>
            <span style={{ display: 'flex', justifyContent: 'center' }}><Icon name={i} size={20} /></span>
            <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{t}</div>
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, lineHeight: 1.6 }}>{s}</div>
          </div>
        ))}
      </div>
      {blocked === 'business' && <div style={{ fontSize: 12.5, marginTop: 12, padding: '10px 12px', borderRadius: R.box, background: T.accentSoft }}>{clanError({ error: 'business' })}</div>}
      {blocked === 'cooldown' && <div style={{ fontSize: 12.5, marginTop: 12, padding: '10px 12px', borderRadius: R.box, background: T.accentSoft }}>
        تازه از کلنی بیرون آمده‌ای؛ پیوستن به کلن دیگر تا {faUntil(home.cooldown_until)} دیگر بسته است. ساختن کلن تازه آزاد است.</div>}
      {!home.business && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Btn style={{ flex: 1 }} icon="plus" disabled={!!home.create_after} onClick={() => setCreate(true)}>ساختن کلن</Btn>
        </div>
      )}
      {home.create_after && <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>هر هفت روز یک کلن می‌شود ساخت.</div>}
    </Card>

    {!home.business && (
      <Card>
        <SectionHead title="پیوستن با کد دعوت" hint="کدی که دوستت فرستاده" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Field value={code} onChange={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="مثلاً K7Q2MX" label="کد دعوت کلن" style={{ flex: 1 }}
            inputStyle={{ direction: 'ltr', textAlign: 'center', letterSpacing: 4, fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 900 }} />
          <Btn icon="check" disabled={busy === 'code' || code.length !== 6 || blocked === 'cooldown'} onClick={joinCode}>پیوستن</Btn>
        </div>
      </Card>
    )}

    {(home.requests || []).length > 0 && (
      <Card>
        <SectionHead title="درخواست‌های من" hint="منتظر پذیرش رهبر" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {home.requests.map(r => r.clan && (
            <ClanRow key={r.id} clan={r.clan} onClick={() => onOpen(r.clan.id)}
              end={<Btn size="sm" kind="ghost" disabled={busy === r.clan.id} onClick={(e) => { e.stopPropagation(); cancel(r.clan.id) }}>پس گرفتن</Btn>} />
          ))}
        </div>
      </Card>
    )}

    <Card>
      <SectionHead title="کاوش کلن‌ها" />
      <Field icon="search" value={q} onChange={setQ} onClear={() => setQ('')} placeholder="جستجوی اسم یا شعار کلن" label="جستجوی کلن" />
      <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '10px 0' }}>
        {SORTS.map(([k, l]) => <Chip key={k} on={sort === k} onClick={() => setSort(k)}>{l}</Chip>)}
      </div>
      {!list ? <Skeleton h={58} n={4} /> : list.length === 0
        ? <Empty icon="users" title={q ? 'کلنی با این اسم نیست' : 'هنوز کلنی ساخته نشده'} text={q ? 'اسم دیگری را امتحان کن یا خودت کلن بساز.' : 'اولین کلن TwinLand را تو بساز.'}
            action={!home.business && <Btn icon="plus" onClick={() => setCreate(true)}>ساختن کلن</Btn>} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {list.map(c => (
              <ClanRow key={c.id} clan={c} rank={sort === 'week' || sort === 'all' ? c.rank : null} onClick={() => onOpen(c.id)}
                end={home.business ? null : c.pending
                  ? <Tag>درخواست رفت</Tag>
                  : c.join_mode === 'invite'
                    ? <Tag>با کد</Tag>
                    : <Btn size="sm" disabled={busy === c.id || blocked === 'cooldown' || c.members >= c.cap} onClick={(e) => { e.stopPropagation(); join(c) }}>
                        {c.members >= c.cap ? 'پر' : c.join_mode === 'request' ? 'درخواست' : 'پیوستن'}
                      </Btn>} />
            ))}
          </div>}
    </Card>

    <div id="clan-ranks" style={{ scrollMarginTop: 70 }}><Ranks home={null} /></div>
    <ClanCreateSheet open={create} onClose={() => setCreate(false)} showToast={showToast} />
  </>)
}

// ── نمای عمومی یک کلن ───────────────────────────────────────
function ClanPublic({ id, mine, showToast, onBack }) {
  const { C, T } = useV4()
  const [d, setD] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = () => clanView(id).then(setD)
  useEffect(() => { setD(null); load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!d) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={180} n={1} /><Skeleton h={56} n={3} /></div>
  if (!d.ok || !d.clan) return <Empty icon="users" title="این کلن پیدا نشد" text="شاید منحل شده باشد." action={<Btn onClick={onBack}>کلن‌ها</Btn>} />
  const c = d.clan
  const can = d.can || {}
  const join = async () => {
    setBusy(true)
    const r = await clanJoin(c.id, null)
    setBusy(false)
    if (!r.ok) { showToast(clanError(r), 'warn'); return }
    showToast(r.pending ? 'درخواستت فرستاده شد' : 'به «' + c.name + '» پیوستی')
    if (r.pending) load(); else onBack()
  }
  const cancel = async () => { setBusy(true); await clanRequestCancel(c.id); setBusy(false); showToast('درخواست پس گرفته شد'); load() }
  let action = null
  if (d.status === 'member') action = <Btn block icon="users" onClick={onBack}>رفتن به کلن من</Btn>
  else if (d.status === 'pending') action = <Btn block kind="ghost" disabled={busy} onClick={cancel}>درخواست فرستاده شد · پس گرفتن</Btn>
  else if (d.status === 'other') action = <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>عضو کلن «{mine && mine.name}» هستی. برای پیوستن به این کلن اول از کلن فعلی‌ات بیرون بیا.</div>
  else if (can.business) action = <div style={{ fontSize: 12.5, color: C.sub }}>{clanError({ error: 'business' })}</div>
  else if (can.cooldown_until) action = <div style={{ fontSize: 12.5, color: C.sub }}>{clanError({ error: 'cooldown' })}</div>
  else if (can.full) action = <div style={{ fontSize: 12.5, color: C.sub }}>ظرفیت این کلن پر است.</div>
  else if (c.join_mode === 'invite') action = <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>این کلن فقط با کد دعوت عضو می‌گیرد. کد را از یکی از اعضا بگیر و در صفحه کلن‌ها بزن.</div>
  else if (!can.level_ok) action = <div style={{ fontSize: 12.5, color: C.sub }}>برای پیوستن دست‌کم لول {fa(c.min_level)} لازم است.</div>
  else action = <Btn block size="lg" icon={c.join_mode === 'request' ? 'users' : 'check'} disabled={busy} onClick={join}>{c.join_mode === 'request' ? 'درخواست عضویت' : 'پیوستن به کلن'}</Btn>
  return (<>
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ClanEmblem clan={c} size={68} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
          {c.motto && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>{c.motto}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <Tag>{JOIN_MODE_TEXT[c.join_mode]}</Tag>
            {c.min_level > 1 && <Tag>از لول {fa(c.min_level)}</Tag>}
            <Tag>سطح {fa(c.level)}</Tag>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
        <Stat value={fa(c.members) + '/' + fa(c.cap)} label="اعضا" />
        <Stat value={d.rank ? d.rank.week : 0} label="رتبه هفته" />
        <Stat value={d.meetups_done || 0} label="دورهمی" />
        <Stat value={(d.districts || []).length} label="پرچم" />
      </div>
      {c.home && (
        <a href={'/?cafe=' + c.home.id} className="tl4-press" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '9px 12px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, color: C.text, textDecoration: 'none' }}>
          <Icon name="coffee" size={17} /><span style={{ flex: 1, fontSize: 12.5 }}>پاتوق: <b style={{ fontWeight: 900 }}>{c.home.name}</b></span><Icon name="chevronLeft" size={15} color={C.sub} />
        </a>
      )}
      <div style={{ marginTop: 14 }}>{action}</div>
    </Card>
    <Card>
      <SectionHead title="اعضا" hint={d.hidden_members ? fa(d.hidden_members) + ' نفر عضویتشان را پنهان کرده‌اند' : ''} />
      {(d.members || []).length === 0
        ? <div style={{ fontSize: 12.5, color: C.sub }}>اعضای این کلن عضویتشان را پنهان کرده‌اند.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {d.members.map(m => (
              <PersonLink key={m.id} id={m.card && m.card.id} label={m.card && m.card.name} style={{ gap: 10, padding: '7px 8px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
                <UserAvatar person={m.card} size={34} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.card && m.card.name}</span>
                {m.role !== 'member' && <Tag strong={m.role === 'leader'}>{ROLE_LABEL[m.role]}</Tag>}
              </PersonLink>
            ))}
          </div>}
    </Card>
    {(d.districts || []).length > 0 && (
      <Card>
        <SectionHead title="پرچم‌های این ماه" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{d.districts.map(x => <Tag key={x}>منطقه {fa(x)}</Tag>)}</div>
      </Card>
    )}
  </>)
}
