'use client'
// نوار کلن در برگه کافه — فقط نسخه v4.0
// دورهمی باز کلن من در همین کافه با دکمه «میام»، کلن‌هایی که این کافه پاتوقشان است، و ساختن دورهمی همین‌جا.
// اگر چیزی برای نشان دادن نباشد و کاربر کلن نداشته باشد، هیچ چیز نشان داده نمی‌شود.
import { useEffect, useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn } from '@/components/v4/kit/kit'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import { fa } from '@/components/v4/clan/parts'
import { cafeClanInfo, clanError, loadClanHome, meetupRsvp, meetupWhen } from '@/lib/clan/clans'

export function CafeClanStrip({ cafeId, showToast }) {
  const { C, T } = useV4()
  const [info, setInfo] = useState(null)
  const [mine, setMine] = useState(null)
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    let alive = true
    setInfo(null)
    cafeClanInfo(cafeId).then(r => { if (alive) setInfo(r && r.ok ? r : null) })
    loadClanHome(false).then(h => { if (alive) setMine(h && h.ok ? h.clan : null) })
    return () => { alive = false }
  }, [cafeId])
  if (!info) return null
  const homes = info.home || []
  const meets = info.meetups || []
  if (!homes.length && !meets.length && !mine) return null

  const rsvp = async (m) => {
    setBusy(m.id)
    const r = await meetupRsvp(m.id, !m.me_going)
    setBusy(null)
    if (!r.ok) { showToast && showToast(clanError(r), 'warn'); return }
    setInfo(v => ({ ...v, meetups: v.meetups.map(x => x.id === m.id ? { ...x, me_going: !m.me_going, going: Math.max(0, (x.going || 0) + (m.me_going ? -1 : 1)) } : x) }))
    showToast && showToast(m.me_going ? 'از فهرست آمدن‌ها برداشته شدی' : 'ثبت شد؛ کلن می‌بیند که می‌آیی')
  }

  return (
    <div style={{ marginBottom: 14, padding: 12, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {meets.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 38, height: 38, borderRadius: R.box, background: C.accent, color: T.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="calendar" size={18} />
          </span>
          <a href="/clan?tab=meetups" className="tl4-press" style={{ flex: 1, minWidth: 0, color: C.text, textDecoration: 'none' }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 900 }}>دورهمی کلنت همین‌جاست</span>
            <span style={{ display: 'block', fontSize: 11, color: C.sub, marginTop: 2 }}>{meetupWhen(m.at)} · {fa(m.going)} نفر می‌آیند</span>
          </a>
          <Btn size="sm" kind={m.me_going ? 'ghost' : 'primary'} icon={m.me_going ? 'check' : 'users'} disabled={busy === m.id} onClick={() => rsvp(m)}>{m.me_going ? 'می‌آیم' : 'میام'}</Btn>
        </div>
      ))}

      {homes.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 900, color: C.sub, marginBottom: 8 }}>پاتوق این کلن‌هاست</div>
          <div className="tl4-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {homes.map(c => (
              <a key={c.id} href={mine && mine.id === c.id ? '/clan' : '/clan?c=' + c.id} className="tl4-press"
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '6px 10px 6px 8px', borderRadius: R.box, background: C.card, border: '1px solid ' + T.hair, color: C.text, textDecoration: 'none', maxWidth: 200 }}>
                <ClanEmblem clan={c} size={30} showLevel={false} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: C.sub }}>سطح {fa(c.level)} · {fa(c.members)} عضو</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {mine && !meets.length && (
        <a href={'/clan?tab=meetups&at=' + cafeId} className="tl4-press" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: C.text, textDecoration: 'none' }}>
          <Icon name="calendar" size={16} color={C.sub} />
          <span style={{ flex: 1 }}>با کلنت این‌جا دورهمی بگذار؛ سه نفر بیایید، هر نفر ۳۰ امتیاز</span>
          <Icon name="chevronLeft" size={14} color={C.sub} />
        </a>
      )}
    </div>
  )
}
