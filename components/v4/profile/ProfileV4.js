'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه پروفایل — نسخه v4.0
//   /profile          پروفایل خودم: چهره، اسم، درباره من، لول و امتیاز، آمار، فعالیت، نشان‌ها و تنظیمات
//   /profile?u=<id>   پروفایل عمومی یک نفر دیگر، فقط چیزهایی که خودش اجازه داده
//   /profile?edit=1   پروفایل خودم با پنجره ویرایش باز
//   /profile?tab=settings  مستقیم به تنظیمات و حریم خصوصی
//  همه قطعه‌ها از کیت v4 می‌آیند تا با صفحه اصلی یکی باشد.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { CITIES } from '@/lib/constants'
import { getLevelInfo, getSession } from '@/lib/game/gameSystem'
import { ROUTE } from '@/lib/theme/labels'
import { exportMyData, useMe } from '@/lib/profile/people'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { V4Page } from '@/components/v4/kit/V4Page'
import { Btn, Card, Chip, Empty, ListRow, Segmented, SectionHead, Skeleton, Stat, Tag, Toggle } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { LevelBadge, Meter, XpBar } from '@/components/v4/kit/Meter'
import { ToastV4, useToastV4 } from '@/components/v4/kit/Toast'
import { useV4Theme } from '@/components/v4/useV4Theme'
import { EditProfileSheet } from '@/components/v4/profile/EditProfileSheet'
import { PrivacySettings } from '@/components/v4/profile/PrivacySettings'
import { PublicProfileView, asOthersSee, joinedLabel, usePublicProfile } from '@/components/v4/profile/PublicProfileView'
import { useMyActivity } from '@/components/v4/profile/useMyActivity'
import { ReferralInline, useReferral } from '@/components/v4/growth/Referral'
import { BadgeTile, ReferralTierRow } from '@/components/v4/growth/ReferralBadge'
import { SheetV4 } from '@/components/v4/ui/Sheet'

const fa = (n) => Number(n || 0).toLocaleString('fa')

function readParams() {
  try { const sp = new URLSearchParams(window.location.search); return { u: sp.get('u'), edit: sp.get('edit') === '1', tab: sp.get('tab') } } catch (e) { return {} }
}

export default function ProfileV4() {
  const [params, setParams] = useState(null)
  const [uid, setUid] = useState(undefined)
  useEffect(() => {
    setParams(readParams())
    const s = getSession()
    setUid((s && s.user && s.user.id) || null)
  }, [])
  if (!params || uid === undefined) return <V4Page title="پروفایل"><Skeleton h={200} n={1} /></V4Page>
  const other = params.u && /^[0-9a-f-]{36}$/i.test(params.u) && params.u !== uid ? params.u : null
  if (other) return <OtherProfile id={other} />
  if (!uid) {
    return (
      <V4Page title="پروفایل">
        <Empty icon="user" title="اول وارد شو" text="برای دیدن و ساختن پروفایلت وارد حساب شو." action={<Btn href="/">ورود</Btn>} />
      </V4Page>
    )
  }
  return <MyProfile params={params} />
}

function OtherProfile({ id }) {
  const { loading, data, retry } = usePublicProfile(id)
  return (
    <V4Page title={data && data.card ? data.card.name : 'پروفایل'} back="history" backLabel="برگشت">
      <PublicProfileView data={data} loading={loading} onRetry={retry} />
    </V4Page>
  )
}

function MyProfile({ params }) {
  const { toast, showToast } = useToastV4()
  return (
    <V4Page title="پروفایل من">
      <MyProfileBody params={params} showToast={showToast} />
      <ToastV4 toast={toast} />
    </V4Page>
  )
}

function MyProfileBody({ params, showToast }) {
  const { C, T } = useV4()
  const { themeMode, toggleMode } = useV4Theme()
  const me = useMe()
  const act = useMyActivity()
  const [tab, setTab] = useState(params.tab === 'settings' ? 'settings' : params.tab === 'badges' ? 'badges' : 'activity')
  const [edit, setEdit] = useState(!!params.edit)
  const [preview, setPreview] = useState(false)
  const [filter, setFilter] = useState('all')
  const [shown, setShown] = useState(40)
  useEffect(() => { track('profile_view', { self: true, ui: 'v4' }) }, [])

  if (!me) return <><Skeleton h={230} n={1} /><div style={{ height: 12 }} /><Skeleton h={64} n={3} /></>

  const xp = (me.row && me.row.xp) || (me.profile && me.profile.xp) || 0
  const levelInfo = getLevelInfo(xp)
  const lv = levelInfo.current
  const streak = (me.profile && me.profile.stats && me.profile.stats.streak) || 0
  const city = me.row && me.row.city && CITIES[me.row.city] ? CITIES[me.row.city].name : null
  const pv = me.privacy
  const card = me.card
  const remain = levelInfo.next ? Math.max(0, levelInfo.next.minXP - xp) : 0
  const profileLink = typeof window !== 'undefined' ? window.location.origin + '/profile?u=' + me.id : ''

  async function shareProfile() {
    track('profile_share')
    try { if (navigator.share) { await navigator.share({ title: card.name + ' در TwinLand', url: profileLink }); return } } catch (e) { return }
    try { await navigator.clipboard.writeText(profileLink); showToast('پیوند پروفایلت کپی شد') } catch (e) { showToast('کپی نشد', 'warn') }
  }
  async function download() {
    showToast('در حال آماده کردن فایل…')
    const d = await exportMyData()
    if (!d) { showToast('فایل آماده نشد', 'warn'); return }
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'twinland-my-data-' + new Date().toISOString().slice(0, 10) + '.json'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    track('data_export')
  }
  function logout() {
    try { localStorage.removeItem('tl_session') } catch (e) {}
    track('logout', { from: 'profile' })
    window.location.href = '/'
  }

  const FILTERS = [['all', 'همه'], ['checkin', 'چک‌این'], ['xp', 'امتیاز'], ['quest', 'رویداد'], ['award', 'نشان و آیتم'], ['clan', 'کلن']]
  const tl = act.timeline.filter(i => filter === 'all' || i.cat === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* کارت اصلی */}
      <Card style={{ padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="button" className="tl4-press" onClick={() => setEdit(true)} aria-label="عوض کردن چهره"
            style={{ position: 'relative', border: 'none', background: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
            <UserAvatar person={card} size={84} />
            <span style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderRadius: '50%', background: C.accent, color: T.onAccent, border: '3px solid ' + C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={15} stroke={2} />
            </span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 19, fontWeight: 900, overflowWrap: 'anywhere' }}>{card.name}</span>
              {!pv.profile_public && <Tag><span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="lock" size={11} />خصوصی</span></Tag>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, fontSize: 12, color: C.sub, fontWeight: 700 }}>
              <LevelBadge level={lv} size={22} />لول {fa(lv.level)} · {lv.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 11.5, color: C.sub }}>
              {city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={13} />{city}</span>}
              {me.profile && me.profile.joined && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={13} />{joinedLabel(me.profile.joined)}</span>}
            </div>
          </div>
        </div>

        {!me.nameConfirmed && (
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: R.box, background: T.chip, border: '1px dashed ' + T.hairStrong, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="user" size={18} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.8, color: C.text }}>دیگران الان تو را با نام «{card.name}» می‌بینند. اسم خودت را ثبت کن تا با اسم خودت دیده شوی.</div>
            <Btn size="sm" onClick={() => setEdit(true)}>ثبت اسم</Btn>
          </div>
        )}

        <button type="button" onClick={() => setEdit(true)} className="tl4-press"
          style={{ display: 'block', width: '100%', textAlign: 'right', marginTop: 12, padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer',
            fontSize: 13, lineHeight: 1.9, color: me.row && me.row.bio ? C.text : C.sub, overflowWrap: 'anywhere' }}>
          {(me.row && me.row.bio) || 'یک جمله درباره خودت بنویس…'}
        </button>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(xp)} <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>XP</span></span>
            <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{levelInfo.next ? fa(remain) + ' تا ' + levelInfo.next.name : 'بالاترین لول'}</span>
          </div>
          <XpBar levelInfo={levelInfo} size="lg" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Btn icon="edit" onClick={() => setEdit(true)} style={{ flex: 1 }}>ویرایش پروفایل</Btn>
          <Btn kind="ghost" icon="eye" onClick={() => setPreview(true)} aria-label="پیش‌نمایش از چشم دیگران" title="پیش‌نمایش از چشم دیگران" />
          {pv.profile_public && <Btn kind="ghost" icon="share" onClick={shareProfile} aria-label="فرستادن پیوند پروفایل" title="فرستادن پیوند پروفایل" />}
        </div>
      </Card>

      {/* آمار */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
        <Stat icon="pin" value={act.stats.checkins} label="چک‌این" />
        <Stat icon="coffee" value={act.stats.cafes} label="کافه" />
        <Stat icon="map" value={act.stats.districts} label="منطقه" />
        <Stat icon="flame" value={streak} label="روز پشت هم" />
      </div>

      <Segmented value={tab} onChange={setTab} label="بخش‌های پروفایل"
        options={[['activity', 'فعالیت', 'clock'], ['badges', 'نشان‌ها', 'medal'], ['settings', 'تنظیمات', 'sliders']]} />

      {tab === 'activity' && (
        <Card>
          <SectionHead title="فعالیت‌ها" hint="همه کارهایت در TwinLand، تازه‌ترین بالا" />
          <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
            {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => { setFilter(k); setShown(40) }}>{l}</Chip>)}
          </div>
          {act.loading ? <Skeleton h={52} n={4} />
            : tl.length === 0 ? <Empty icon="clock" title="هنوز چیزی اینجا نیست" text="با اولین چک‌این، فعالیت‌هایت اینجا جمع می‌شود." style={{ padding: '12px 8px' }} />
            : <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tl.slice(0, shown).map((it, i) => (
                  <div key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderTop: i ? '1px solid ' + T.hair : 'none' }}>
                    <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} size={17} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
                      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>{faWhen(it.at)}{it.sub ? ' · ' + it.sub : ''}</div>
                    </div>
                    {it.amount > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>+{fa(it.amount)}</span>}
                  </div>
                ))}
                {tl.length > shown && <Btn kind="ghost" block onClick={() => setShown(n => n + 40)} style={{ marginTop: 8 }}>نمایش بیشتر</Btn>}
              </div>}
        </Card>
      )}

      {tab === 'badges' && <BadgesTab act={act} />}

      {tab === 'settings' && (<>
        <Card>
          <SectionHead title="حریم خصوصی" hint="خودت انتخاب کن دیگران چه چیزهایی از تو ببینند. ایمیلت به‌طور پیش‌فرض پنهان است." action={<Btn kind="ghost" size="sm" icon="eye" onClick={() => setPreview(true)}>پیش‌نمایش</Btn>} />
          <PrivacySettings me={me} showToast={showToast} />
        </Card>
        <Card>
          <SectionHead title="دعوت دوست" />
          <ReferralInline showToast={showToast} />
        </Card>
        <Card>
          <SectionHead title="حساب" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ListRow icon="mail" title="ایمیل حساب" sub={<span style={{ direction: 'ltr', display: 'inline-block' }}>{me.email || '—'}</span>} end={<Tag>{pv.show_email ? 'دیده می‌شود' : 'پنهان'}</Tag>} />
            <ListRow icon={themeMode === 'dark' ? 'moon' : 'sun'} title={themeMode === 'dark' ? 'حالت تیره' : 'حالت روشن'} end={<Toggle on={themeMode === 'dark'} onChange={toggleMode} label="حالت تیره" />} />
            <ListRow icon="image" title="کلکسیون" sub={fa(act.stats.items) + ' آیتم'} href={ROUTE.gallery} />
            <ListRow icon="download" title="دانلود داده‌های من" sub="همه داده‌های حسابت در یک فایل" onClick={download} />
            <ListRow icon="logout" title="خروج از حساب" onClick={logout} />
          </div>
        </Card>
      </>)}

      <EditProfileSheet open={edit} onClose={() => setEdit(false)} me={me} showToast={showToast} />
      <SheetV4 open={preview} onClose={() => setPreview(false)} title="دیگران تو را این‌طور می‌بینند" icon="eye" maxWidth={520} zIndex={3300}>
        <PublicProfileView data={asOthersSee(me.profile, me.publicCard)} />
      </SheetV4>
    </div>
  )
}

const BADGES = [
  { icon: '🥇', name: 'اولین چک‌این', ok: s => s.checkins >= 1 },
  { icon: '☕', name: '۱۰ کافه', ok: s => s.cafes >= 10 },
  { icon: '🗺️', name: '۵ منطقه', ok: s => s.districts >= 5 },
  { icon: '👑', name: '۵۰ چک‌این', ok: s => s.checkins >= 50 },
  { icon: '💎', name: '۲۰ کافه', ok: s => s.cafes >= 20 },
  { icon: '❤️', name: '۱۰ علاقه‌مندی', ok: s => s.favs >= 10 },
]

function BadgesTab({ act }) {
  const { C, T } = useV4()
  const earned = act.awards.filter(a => a.kind === 'badge')
  const items = act.awards.filter(a => a.kind !== 'badge')
  const goals = BADGES.map(b => ({ ...b, done: b.ok(act.stats) }))
  const ref = useReferral(true)
  return (<>
    <Card>
      <SectionHead title="نشان‌ها" hint={earned.length ? fa(earned.length) + ' نشان گرفته‌ای' : 'با چک‌این و رویدادها نشان می‌گیری'} />
      {earned.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8, marginBottom: 12 }}>
          {earned.map(b => <BadgeTile key={b.id} badge={b} />)}
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 900, margin: '4px 0 8px' }}>نشان‌های دعوت</div>
      <div style={{ padding: '12px 6px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, marginBottom: 12 }}>
        <ReferralTierRow count={ref && ref.ok ? Number(ref.invited) || 0 : 0} size={48} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, margin: '4px 0 8px' }}>هدف‌های بعدی</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
        {goals.map(g => (
          <div key={g.name} style={{ borderRadius: R.box, background: T.chip, border: '1px solid ' + (g.done ? T.hairStrong : T.hair), padding: '10px 6px', textAlign: 'center', opacity: g.done ? 1 : 0.45, filter: g.done ? 'none' : 'grayscale(1)' }}>
            <div style={{ fontSize: 24 }}>{g.icon}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{g.name}</div>
            {g.done && <div style={{ fontSize: 9.5, color: C.sub, marginTop: 2 }}>گرفتی</div>}
          </div>
        ))}
      </div>
    </Card>
    <Card>
      <SectionHead title="کلکسیون" hint={fa(items.length) + ' آیتم جمع کرده‌ای'} action={<Btn kind="ghost" size="sm" href={ROUTE.gallery}>دیدن همه</Btn>} />
      {items.length === 0
        ? <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>با کامل کردن رویدادهای کافه‌ها آیتم کلکسیونی می‌گیری.</div>
        : <div className="tl4-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {items.slice(0, 12).map(a => (
              <div key={a.id} title={a.title} style={{ flexShrink: 0, width: 72, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: '10px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{a.icon || '•'}</div>
                <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
              </div>
            ))}
          </div>}
    </Card>
  </>)
}

function faWhen(iso) {
  try {
    const d = new Date(iso)
    const mins = Math.floor((Date.now() - d.getTime()) / 60000)
    if (mins < 1) return 'همین الان'
    if (mins < 60) return fa(mins) + ' دقیقه پیش'
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return fa(hrs) + ' ساعت پیش'
    return d.toLocaleDateString('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' })
  } catch (e) { return '' }
}
