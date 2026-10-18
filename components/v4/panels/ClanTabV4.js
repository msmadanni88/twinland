'use client'
// کلن — زبانه پنل، نسخه v4.0
// همان داده ClanTab (کلن فعال، جایگاه و پنج عضو برتر)، با کارت v4، چهره‌های مشترک و پیوند به پروفایل هر عضو.
import { useEffect, useState } from 'react'
import { ROUTE } from '@/lib/theme/labels'
import { clanLevel, fetchClanMembers, fetchClanStandings, fetchMyClans, getSession } from '@/lib/game/gameSystem'
import { fetchCards } from '@/lib/profile/people'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Card, Empty, SectionHead, Skeleton, Tag } from '@/components/v4/kit/kit'
import { PersonLink, UserAvatar } from '@/components/v4/kit/UserAvatar'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const ROLE = { leader: 'رهبر', officer: 'افسر' }

export function ClanTabV4() {
  const { C, T } = useV4()
  const [clan, setClan] = useState(null)
  const [standing, setStanding] = useState(null)
  const [members, setMembers] = useState([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const sess = getSession()
    let alive = true
    ;(async () => {
      const [mine, stand] = await Promise.all([fetchMyClans(sess), fetchClanStandings(sess)])
      if (!alive) return
      const active = mine.find(m => m.is_active) || mine[0] || null
      setClan(active)
      if (active) {
        setStanding(stand.find(s => s.id === active.clan_id) || null)
        const mem = (await fetchClanMembers(sess, active.clan_id)).slice(0, 8)
        const cards = await fetchCards(mem.map(m => m.user_id))
        if (alive) setMembers(mem.map(m => ({ ...m, card: cards[m.user_id] || { name: m.name } })))
      }
      setLoaded(true)
    })()
    return () => { alive = false }
  }, [])

  if (!loaded) return <div style={{ padding: 12 }}><Skeleton h={120} n={1} /><div style={{ height: 10 }} /><Skeleton h={56} n={3} /></div>
  if (!clan) return (
    <div style={{ padding: 12 }}>
      <Empty icon="users" title="هنوز عضو کلنی نیستی" text="یک کلن بساز یا با کد به کلن دوستانت بپیوند." action={<Btn href="/clan">رفتن به کلن‌ها</Btn>} />
    </div>
  )
  const c = clan.clans || {}
  return (
    <div style={{ padding: '12px 12px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ textAlign: 'center', padding: '18px 14px' }}>
        <span style={{ width: 56, height: 56, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.emblem}</span>
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 8 }}>{c.name}</div>
        {standing && <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>سطح {fa(clanLevel(standing.xp_total))} · رتبه {fa(standing.rank)} · {fa(standing.xp_total)} XP</div>}
      </Card>
      <Card>
        <SectionHead title="اعضای برتر" hint="روی هر نفر بزن تا پروفایلش را ببینی" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {members.map((m, i) => (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: R.box, background: m.me ? T.accentSoft : 'transparent', border: '1px solid ' + (m.me ? T.hairStrong : 'transparent') }}>
              <span style={{ width: 20, textAlign: 'center', fontWeight: 900, color: C.sub, fontSize: 12.5 }}>{fa(i + 1)}</span>
              <PersonLink id={m.user_id} label={m.card.name} style={{ flex: 1, gap: 10 }}>
                <UserAvatar person={m.card} size={36} />
                <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.card.name}</span>{m.me && <Tag strong>تو</Tag>}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: C.sub }}>{ROLE[m.role] || 'عضو'}</span>
                </span>
              </PersonLink>
              <span style={{ fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(m.xp)} XP</span>
            </div>
          ))}
        </div>
      </Card>
      <Btn kind="ghost" block href={ROUTE.clans}>صفحه کامل کلن</Btn>
    </div>
  )
}
