'use client'
// امتیاز TwinLand برای هر مکان و پیوند به نقشه‌های دیگر.
// فقط کسی که در همین مکان چک‌این کرده می‌تواند ستاره بدهد؛ قاعده در دیتابیس اجرا می‌شود، نه فقط در ظاهر.
// امتیاز سرویس‌های دیگر کپی یا ذخیره نمی‌شود — فقط پیوند داده می‌شود.
import { useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'

const fa = (n) => Number(n || 0).toLocaleString('fa')

function rpc(name, body) {
  const s = getSession()
  if (!s || !s.access_token) return Promise.resolve(null)
  return fetch(SB_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => (r.ok ? r.json() : null)).catch(() => null)
}

export function CafeRating({ C, T, cafe, isChecked = false, noPlay = false, showToast }) {
  const [sum, setSum] = useState(null)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(0)

  useEffect(() => {
    let alive = true
    setSum(null)
    rpc('cafe_rating', { p_cafe_id: cafe.id }).then(r => { if (alive && r && r.ok) setSum(r) })
    return () => { alive = false }
  }, [cafe.id, isChecked])

  async function rate(n) {
    if (busy) return
    setBusy(true)
    const r = await rpc('rate_cafe', { p_cafe_id: cafe.id, p_stars: n })
    setBusy(false)
    if (r && r.ok) { setSum(r); showToast && showToast('⭐ امتیازت ثبت شد. ممنون!') }
    else showToast && showToast(r && r.error === 'checkin_required' ? 'برای امتیاز دادن اول باید این‌جا چک‌این کنی' : 'امتیاز ثبت نشد، دوباره امتحان کن', 'warn')
  }

  const count = sum ? sum.count : 0
  const mine = sum ? sum.mine : null
  const canRate = !noPlay && (isChecked || (sum && sum.can_rate))
  const q = encodeURIComponent(cafe.name || '')
  const links = [
    ['Google Maps', cafe.google_url || 'https://www.google.com/maps/search/' + q + '/@' + cafe.lat + ',' + cafe.lng + ',17z'],
    cafe.neshan_url ? ['نشان', cafe.neshan_url] : null,
    ['بلد', 'https://balad.ir/location?latitude=' + cafe.lat + '&longitude=' + cafe.lng + '&zoom=17'],
  ].filter(Boolean)
  const shown = hover || mine || 0

  return (
    <div style={{ margin: '12px 18px 0', padding: 12, borderRadius: 16, background: T.chip, border: '1px solid ' + T.hair }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'center' }}>{count > 0 ? '⭐ ' + fa(sum.avg) : '⭐ —'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: C.text }}>امتیاز TwinLand</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{count > 0 ? fa(count) + ' رای · فقط از کسانی که این‌جا چک‌این کرده‌اند' : 'هنوز کسی امتیاز نداده · فقط چک‌این‌کرده‌ها رای می‌دهند'}</div>
        </div>
      </div>
      {canRate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + T.hair }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.text, flexShrink: 0 }}>{mine ? 'امتیاز تو' : 'این‌جا چطور بود؟'}</span>
          <div role="radiogroup" aria-label="امتیاز" style={{ display: 'flex', gap: 2, direction: 'ltr' }} onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" role="radio" aria-checked={mine === n} aria-label={n + ' ستاره'} disabled={busy} className="tl2-press"
                onMouseEnter={() => setHover(n)} onClick={() => rate(n)}
                style={{ width: 34, height: 34, border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0, opacity: busy ? 0.5 : 1, filter: n <= shown ? 'none' : 'grayscale(1) opacity(.35)' }}>⭐</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + T.hair }}>
        <span style={{ fontSize: 11, color: C.sub, flexShrink: 0 }}>نظر مردم در نقشه‌های دیگر:</span>
        {links.map(l => <a key={l[0]} href={l[1]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 800, color: C.accent, textDecoration: 'none', background: C.card, border: '1px solid ' + T.hair, borderRadius: 99, padding: '3px 10px' }}>{l[0]} ↗</a>)}
      </div>
    </div>
  )
}
