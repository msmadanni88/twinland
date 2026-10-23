'use client'
// ─────────────────────────────────────────────────────────────
//  پنجره جایزه دعوت — نسخه v4.0
//  دو حالت دارد:
//   خوش‌آمد: کسی که با پیوند دعوت ثبت‌نام کرده، همان لحظه چهره دعوت‌کننده و جایزه هر دو نفر را می‌بیند
//   جایزه: دعوت‌کننده وقتی دوستش آمد، چهره دوست، جایزه و اگر نشان تازه‌ای گرفت، خود نشان را می‌بیند
//  منبع: نتیجه claim_referral همان لحظه ثبت‌نام، و اعلان‌های خوانده‌نشده referral_* برای وقتی که کاربر آن لحظه آنلاین نبود.
//  هر اعلان فقط یک بار پنجره می‌شود و با بستن پنجره خوانده‌شده حساب می‌شود.
//  با باز شدن پنجره، امتیاز، کارت خودم و کارت دعوت همه‌جا تازه می‌شوند.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { takeReferralMessage } from '@/lib/growth/entry'
import { fetchCards, loadMe, useMe } from '@/lib/profile/people'
import { REFERRAL_TIERS, nextTier } from '@/lib/growth/referralTiers'
import { useV4 } from '@/components/v4/kit/context'
import { Btn } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { R } from '@/components/v4/theme'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { ReferralBadge } from '@/components/v4/growth/ReferralBadge'
import { ReferralSheetV4, bustReferral, useReferral } from '@/components/v4/growth/Referral'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const TYPES = ['referral_welcome', 'referral_reward', 'referral_join', 'referral_badge']
const SEEN_KEY = 'tl_ref_popup_seen'

function readSeen() { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) } catch (e) { return new Set() } }
function addSeen(ids) {
  try {
    const s = readSeen(); ids.forEach(i => s.add(String(i)))
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(s).slice(-80)))
  } catch (e) {}
}
const idFromLink = (link) => { const m = /[?&]u=([\w-]{1,64})/.exec(String(link || '')); return m ? m[1] : null }
const between = (s, a, b) => { const t = String(s || ''); const i = t.indexOf(a); if (i < 0) return ''; const j = t.indexOf(b, i + a.length); return j < 0 ? '' : t.slice(i + a.length, j).trim() }

// از اعلان‌های خوانده‌نشده یک پنجره می‌سازد؛ چند اعلان پشت سر هم یکی می‌شوند
function fromNotifications(list, seen) {
  const fresh = (list || []).filter(n => n && !n.read && TYPES.includes(n.type) && !seen.has(String(n.id)))
  if (!fresh.length) return null
  const welcome = fresh.find(n => n.type === 'referral_welcome')
  const joins = fresh.filter(n => n.type === 'referral_reward' || n.type === 'referral_join')
  const badgeN = fresh.find(n => n.type === 'referral_badge')
  const badge = badgeN ? (REFERRAL_TIERS.slice().reverse().find(t => String(badgeN.title || '').includes(t.title)) || null) : null
  const ids = fresh.map(n => n.id)
  if (welcome) {
    return { kind: 'welcome', ids, personId: idFromLink(welcome.link), name: between(welcome.body, 'با دعوت ', ' آمدی'), both: String(welcome.body || '').includes('هر دو') }
  }
  const last = joins[0]
  return {
    kind: 'reward', ids, count: joins.length,
    personId: last ? idFromLink(last.link) : null,
    name: last ? String(last.body || '').split(' با پیوند تو')[0] : '',
    both: last ? last.type === 'referral_reward' : false,
    badge,
  }
}

export function ReferralCelebrationV4({ notifications, onMark, onXp, onPerson, showToast, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const me = useMe()
  const [pop, setPop] = useState(null)
  const [person, setPerson] = useState(null)
  const [invite, setInvite] = useState(false)
  const popRef = useRef(null)
  popRef.current = pop

  // همان لحظه ثبت‌نام با پیوند دعوت
  useEffect(() => {
    const take = () => {
      const m = takeReferralMessage()
      if (!m || !m.msg) return
      if (m.ok && m.res && m.res.ok) {
        if (m.res.xp != null && onXp) onXp(Number(m.res.xp) || 0)
        setPerson(m.res.inviter || null)
        setPop({ kind: 'welcome', ids: [], fromClaim: true, personId: m.res.inviter && m.res.inviter.id, name: (m.res.inviter && m.res.inviter.name) || '', both: !!m.res.both })
      } else if (showToast) showToast(m.msg, m.ok ? undefined : 'warn')
    }
    take()
    window.addEventListener('tl-referral', take)
    return () => window.removeEventListener('tl-referral', take)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // اعلان‌هایی که کاربر آن لحظه ندیده بود
  useEffect(() => {
    if (popRef.current) return
    const p = fromNotifications(notifications, readSeen())
    if (!p) return
    const tm = setTimeout(() => { if (!popRef.current) { addSeen(p.ids); setPerson(null); setPop(p) } }, 900)
    return () => clearTimeout(tm)
  }, [notifications])

  // با باز شدن پنجره، چهره نفر دیگر و همه شمارها تازه می‌شوند
  useEffect(() => {
    if (!pop) return
    loadMe(true)
    bustReferral()
    if (pop.personId && !(person && person.id === pop.personId)) {
      fetchCards([pop.personId]).then(m => { if (m && m[pop.personId]) setPerson(m[pop.personId]) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop])

  // اعلان خوش‌آمدی که همراه نتیجه ثبت‌نام آمده، پنجره دوم نشود
  useEffect(() => {
    if (!pop || !pop.fromClaim) return
    const w = (notifications || []).filter(n => n.type === 'referral_welcome' && !n.read).map(n => n.id)
    if (w.length) { addSeen(w); w.forEach(id => onMark && onMark(id)) }
  }, [pop, notifications, onMark])

  const close = () => {
    if (pop && pop.ids) pop.ids.forEach(id => onMark && onMark(id))
    setPop(null)
  }

  const ref = useReferral(!!pop && pop.kind === 'reward')
  if (invite) return <ReferralSheetV4 showToast={showToast} onClose={() => setInvite(false)} />
  if (!pop) return null

  const other = person || (pop.name ? { name: pop.name } : null)
  const otherName = (person && person.name) || pop.name || 'دوستت'
  const meCard = me && me.card
  const welcome = pop.kind === 'welcome'
  const count = ref && ref.ok ? Number(ref.invited) || 0 : null
  const nxt = count != null ? nextTier(count) : null

  return (
    <SheetV4 open onClose={close} title={welcome ? 'خوش آمدی' : 'جایزه دعوت'} icon="gift" maxWidth={440} zIndex={2600}>
      <div style={{ textAlign: 'center', padding: '4px 4px 2px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14, direction: 'ltr' }}>
          <div style={{ zIndex: 2, borderRadius: '50%', boxShadow: '0 0 0 3px ' + C.card }}>
            <UserAvatar person={welcome ? other : meCard} size={68} C={C} T={T} />
          </div>
          <div style={{ marginLeft: -16, borderRadius: '50%', boxShadow: '0 0 0 3px ' + C.card }}>
            <UserAvatar person={welcome ? meCard : other} size={68} C={C} T={T} />
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: R.pill, background: C.accent, color: T.onAccent,
          fontSize: 15, fontWeight: 900, animation: 'tl4RefPop .55s cubic-bezier(.2,.9,.3,1.2) both' }}>
          <span>+{fa(150)}</span><span style={{ fontSize: 11, fontWeight: 800, opacity: 0.85 }}>امتیاز</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: C.text, marginTop: 14, lineHeight: 1.7 }}>
          {welcome ? 'با دعوت ' + otherName + ' آمدی' : (pop.count > 1 ? fa(pop.count) + ' دوست با دعوت تو آمدند' : otherName + ' با دعوت تو آمد')}
        </div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9, marginTop: 4 }}>
          {welcome
            ? (pop.both ? 'تو و ' + otherName + ' هر کدام ' + fa(150) + ' امتیاز گرفتید. حالا اولین کافه‌ات را روی نقشه پیدا کن.' : fa(150) + ' امتیاز خوش‌آمد گرفتی. حالا اولین کافه‌ات را روی نقشه پیدا کن.')
            : (pop.both ? 'هر دو ' + fa(150) + ' امتیاز گرفتید و امتیازت همه‌جا به‌روز شد.' : 'دوستت امتیازش را گرفت. سقف ۲۰ جایزه دعوت در ۳۰ روز پر شده است.')}
        </div>
      </div>

      {!welcome && pop.badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, animation: 'tl4Pop .5s .25s both' }}>
          <ReferralBadge code={pop.badge.code} size={64} C={C} T={T} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>نشان تازه</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{pop.badge.title}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>برای {fa(pop.badge.need)} دعوت موفق</div>
          </div>
        </div>
      )}

      {!welcome && nxt && (
        <div style={{ fontSize: 11.5, color: C.sub, textAlign: 'center', marginTop: 12 }}>
          {fa(nxt.need - count)} دعوت دیگر تا نشان «{nxt.title}»
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {welcome
          ? <>
              <Btn style={{ flex: 1 }} onClick={close}>بزن بریم</Btn>
              {person && person.id && person.public !== false && onPerson && <Btn kind="ghost" icon="user" onClick={() => { const id = person.id; close(); onPerson(id) }}>پروفایل {otherName}</Btn>}
            </>
          : <>
              <Btn style={{ flex: 1 }} icon="share" onClick={() => { close(); setInvite(true) }}>دعوت دوست دیگر</Btn>
              <Btn kind="ghost" onClick={close}>باشه</Btn>
            </>}
      </div>
    </SheetV4>
  )
}
