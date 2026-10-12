'use client'
// تصویر یک ویجت رویداد. اگر فایل واقعی برای کلید ثبت شده باشد همان نشان داده می‌شود،
// وگرنه طرح موقت کدکشیده. ev یا artKey را بده.
import { ART_SVG } from '@/components/events/artSvgs'
import { artTone, realArtSrc, resolveArtKey } from '@/lib/events/art'
import { lighten } from '@/lib/events/format'

export function EventArt({ ev, artKey, size = 44, tone, plate = true, style }) {
  const key = artKey || resolveArtKey(ev)
  const c = tone || artTone(key)
  const l = lighten(c, 0.5)
  const src = realArtSrc(key)
  const Draw = ART_SVG[key] || ART_SVG.star
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0,
      background: plate ? 'linear-gradient(150deg,' + c + '38,' + c + '12)' : 'none',
      border: plate ? '1px solid ' + c + '45' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <div style={{ width: plate ? '78%' : '100%', height: plate ? '78%' : '100%' }}>
        {src
          ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          : <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>{Draw({ c, l })}</svg>}
      </div>
    </div>
  )
}
