'use client'
// کمان روزها — نسخه v4.0
// هفت روز اخیر روی یک کمان: قدیمی‌ترین سمت راست، امروز سمت چپ و درشت‌تر با رنگ شعله استریک.
// روزهای چک‌این‌شده توپر، بقیه فقط خط دور. وسط کمان تاریخ شمسی امروز و تعداد روزهای پشت سر هم.
import { useMemo } from 'react'
import { V4_COLOR } from '@/components/v4/theme'
import { Icon } from '@/components/v4/icons'

export const dayKey = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()

const fmt = (opts) => { try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts) } catch (e) { return null } }
const F_DAY = fmt({ day: 'numeric' })
const F_TITLE = fmt({ day: 'numeric', month: 'long' })
const F_WEEK = fmt({ weekday: 'long' })
const F_WEEK_S = fmt({ weekday: 'narrow' })
const fa = (n) => Number(n || 0).toLocaleString('fa')

export function DayArc({ C, T, days = [], streak = 0, count = 7, width = 300, compact = false }) {
  const W = width, H = compact ? 132 : 150
  const R = W * 0.4, cx = W / 2, cy = H - (compact ? 8 : 4)
  const list = useMemo(() => {
    const set = new Set(days)
    const out = []
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i)
      out.push({ d, on: set.has(dayKey(d)), today: i === 0, num: F_DAY ? F_DAY.format(d) : fa(d.getDate()), wk: F_WEEK_S ? F_WEEK_S.format(d) : '' })
    }
    return out
  }, [days, count])
  const a = 0.2
  const pts = list.map((x, i) => {
    const th = 2 * Math.PI - a - i * (Math.PI - 2 * a) / (count - 1)
    return { ...x, x: cx + R * Math.cos(th), y: cy + R * Math.sin(th), lx: cx + (R + 21) * Math.cos(th), ly: cy + (R + 21) * Math.sin(th) }
  })
  const arcPath = 'M' + (cx + R * Math.cos(2 * Math.PI - a)) + ' ' + (cy + R * Math.sin(2 * Math.PI - a)) +
    ' A' + R + ' ' + R + ' 0 0 0 ' + (cx + R * Math.cos(Math.PI + a)) + ' ' + (cy + R * Math.sin(Math.PI + a))
  const now = new Date()
  const title = F_TITLE ? F_TITLE.format(now) : ''
  const weekday = F_WEEK ? F_WEEK.format(now) : ''
  const gid = 'tl4arc' + (compact ? 'c' : 'f')
  return (
    <div style={{ position: 'relative', width: W, maxWidth: '100%', height: H, margin: '0 auto' }} aria-label={'هفت روز اخیر، استریک ' + fa(streak) + ' روز'}>
      <svg width={W} height={H} viewBox={'0 0 ' + W + ' ' + H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB13D" /><stop offset=".55" stopColor="#FF7A1A" /><stop offset="1" stopColor="#F2471C" />
          </linearGradient>
        </defs>
        <path d={arcPath} fill="none" stroke={T.hairStrong} strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
        {pts.map((p, i) => {
          const r = p.today ? (compact ? 16 : 18) : (compact ? 11.5 : 13)
          const fill = p.today ? (p.on ? 'url(#' + gid + ')' : (T.dark ? '#121214' : '#FFFFFF')) : (p.on ? C.text : (T.dark ? '#121214' : '#FFFFFF'))
          const stroke = p.today ? (p.on ? 'none' : V4_COLOR.streak) : (p.on ? 'none' : T.hairStrong)
          const ink = p.on ? (p.today ? '#FFFFFF' : (T.dark ? '#0A0A0A' : '#FFFFFF')) : (p.today ? V4_COLOR.streak : C.sub)
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={p.today && !p.on ? 1.8 : 1.2} strokeDasharray={p.today && !p.on ? '3 3' : undefined} />
              <text x={p.x} y={p.y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={p.today ? (compact ? 12 : 13) : (compact ? 9.5 : 10.5)} fontWeight="800" fill={ink} style={{ fontFamily: 'inherit' }}>{p.num}</text>
              {!compact && <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight={p.today ? 900 : 600} fill={p.today ? C.text : C.sub} style={{ fontFamily: 'inherit' }}>{p.wk}</text>}
            </g>
          )
        })}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: compact ? 4 : 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pointerEvents: 'none' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.sub }}>{weekday}</div>
        <div style={{ fontSize: compact ? 17 : 20, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 900, color: streak > 0 ? V4_COLOR.streak : C.sub }}>
          <Icon name="flame" size={14} stroke={2} />{streak > 0 ? fa(streak) + ' روز پشت سر هم' : 'امروز شروع کن'}
        </div>
      </div>
    </div>
  )
}
