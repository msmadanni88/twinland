'use client'
// ─────────────────────────────────────────────────────────────
//  پروفایل عمومی یک نفر — نسخه v4.0
//  فقط همان چیزهایی را نشان می‌دهد که سرور برگردانده؛ هر چه آن نفر پنهان کرده اصلاً به مرورگر نمی‌رسد.
//  همین نما برای سه جا به کار می‌رود: برگه پروفایل روی نقشه، صفحه /profile?u=، و پیش‌نمایش پروفایل خودم از چشم دیگران.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { CITIES } from '@/lib/constants'
import { LEVELS, getLevelInfo } from '@/lib/game/gameSystem'
import { fetchPublicProfile, privacyOf } from '@/lib/profile/people'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Card, Empty, Skeleton, Stat, Tag } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { LevelBadge, XpBar } from '@/components/v4/kit/Meter'

const fa = (n) => Number(n || 0).toLocaleString('fa')

export function joinedLabel(iso) {
  if (!iso) return ''
  try { return 'عضو از ' + new Date(iso + 'T12:00:00Z').toLocaleDateString('fa-IR-u-ca-persian', { month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }) } catch (e) { return '' }
}

// داده پروفایل خودم را همان‌طور که دیگران می‌بینند فیلتر می‌کند (برای پیش‌نمایش)
export function asOthersSee(pub, publicCard) {
  if (!pub || !pub.ok) return pub
  const p = privacyOf(pub.privacy)
  if (!p.profile_public) return { ok: false, error: 'private', card: { ...(publicCard || pub.card) } }
  return {
    ...pub, self: false, privacy: undefined,
    card: publicCard || pub.card,
    xp: p.show_stats ? pub.xp : null,
    stats: p.show_stats ? pub.stats : null,
    badges: p.show_badges ? pub.badges : null,
    items: p.show_badges ? pub.items : null,
    clan: p.show_clan ? pub.clan : null,
    email: p.show_email ? pub.email || pub._email || null : null,
  }
}

export function PublicProfileView({ data, loading, onRetry }) {
  const { C, T } = useV4()
  if (loading || !data) return <div style={{ paddingTop: 4 }}><Skeleton h={180} n={1} /><div style={{ height: 10 }} /><Skeleton h={70} n={2} /></div>
  if (!data.ok && data.error !== 'private') {
    const msg = data.error === 'auth' ? 'برای دیدن پروفایل دیگران اول وارد شو.' : data.error === 'missing' ? 'این پروفایل پیدا نشد.' : 'پروفایل لود نشد.'
    return <Empty icon="user" title="پروفایل در دسترس نیست" text={msg} action={onRetry && data.error === 'network' ? <button onClick={onRetry} className="tl4-press" style={{ border: 'none', background: 'none', color: C.text, fontWeight: 900, fontFamily: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>دوباره</button> : null} />
  }
  const card = data.card || {}
  const level = LEVELS.find(l => l.level === (data.level || card.level)) || LEVELS[0]
  if (data.error === 'private') {
    return (
      <Card style={{ textAlign: 'center', padding: '26px 16px' }}>
        <UserAvatar person={card} size={84} />
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10 }}>{card.name}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: C.sub, padding: '6px 12px', borderRadius: R.pill, background: T.chip, border: '1px solid ' + T.hair }}>
          <Icon name="lock" size={14} />این پروفایل خصوصی است
        </div>
      </Card>
    )
  }
  const info = data.xp != null ? getLevelInfo(data.xp) : null
  const city = data.city && CITIES[data.city] ? CITIES[data.city].name : null
  const meta = [
    city && { icon: 'pin', text: city },
    data.joined && { icon: 'calendar', text: joinedLabel(data.joined) },
    data.clan && { icon: 'users', text: 'کلن ' + data.clan.name },
    data.email && { icon: 'mail', text: data.email, ltr: true },
  ].filter(Boolean)
  const stats = data.stats
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ textAlign: 'center', padding: '22px 16px 18px' }}>
        <UserAvatar person={card} size={92} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 19, fontWeight: 900 }}>{card.name}</span>
          {data.self && <Tag strong>تو</Tag>}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 6, fontSize: 12, color: C.sub, fontWeight: 700 }}>
          <LevelBadge level={level} size={22} />لول {fa(level.level)} · {level.name}
        </div>
        {data.bio && <div style={{ fontSize: 13, lineHeight: 1.9, color: C.text, marginTop: 10, overflowWrap: 'anywhere' }}>{data.bio}</div>}
        {meta.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {meta.map((m, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: R.pill, background: T.chip, border: '1px solid ' + T.hair, fontSize: 11.5, fontWeight: 700, color: C.text, maxWidth: '100%' }}>
                <Icon name={m.icon} size={14} color={C.sub} /><span style={{ direction: m.ltr ? 'ltr' : 'rtl', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</span>
              </span>
            ))}
          </div>
        )}
        {info && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
              <span style={{ fontWeight: 900 }}>{fa(data.xp)} <span style={{ color: C.sub, fontWeight: 700 }}>XP</span></span>
              <span style={{ color: C.sub, fontWeight: 700 }}>{info.next ? fa(Math.max(0, info.next.minXP - data.xp)) + ' تا ' + info.next.name : 'بالاترین لول'}</span>
            </div>
            <XpBar levelInfo={info} size="md" />
          </div>
        )}
      </Card>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
          <Stat icon="pin" value={Number(stats.checkins) || 0} label="چک‌این" />
          <Stat icon="coffee" value={Number(stats.cafes) || 0} label="کافه" />
          <Stat icon="flame" value={Number(stats.streak) || 0} label="روز پشت هم" />
          <Stat icon="image" value={Number(data.items) || 0} label="آیتم" />
        </div>
      )}

      {Array.isArray(data.badges) && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>نشان‌ها</div>
          {data.badges.length === 0
            ? <div style={{ fontSize: 12.5, color: C.sub }}>هنوز نشانی نگرفته.</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
                {data.badges.map((b, i) => (
                  <div key={i} title={b.title} style={{ borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, lineHeight: 1.2 }}>{b.icon || '•'}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  </div>
                ))}
              </div>}
        </Card>
      )}

      {!stats && !Array.isArray(data.badges) && !data.self && (
        <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', padding: 8 }}>این کاربر آمار و نشان‌هایش را پنهان کرده است.</div>
      )}
    </div>
  )
}

// برگه پروفایل یک نفر روی نقشه
export function usePublicProfile(id) {
  const [state, setState] = useState({ loading: true, data: null })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!id) return
    let alive = true
    setState({ loading: true, data: null })
    fetchPublicProfile(id).then(d => { if (alive) setState({ loading: false, data: d }) })
    return () => { alive = false }
  }, [id, n])
  return { ...state, retry: () => setN(x => x + 1) }
}
