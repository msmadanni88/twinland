'use client'
// نمایش پیشرفت «کشف نقشه» — نسخه v3.0
// به‌جای «۱ از ۶۶۶»: منطقه‌ای که در آن می‌گردی، چند مکانش را دیده‌ای و چند مکان تا نشان بعدی مانده.
import { districtLabel } from '@/lib/events/format'

const fa = (n) => Number(n || 0).toLocaleString('fa')
// نام منطقه در پایگاه داده رقم لاتین دارد؛ در رابط کاربری همه رقم‌ها فارسی باشند
export const faDigits = (s) => String(s == null ? '' : s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])
const dLabel = (d) => faDigits(districtLabel(d))

// حلقه پیشرفت تا نشان بعدی
export function ExploreRing({ size = 20, ring = 0, color, track, stroke = 2.4, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, ring || 0))
  return (
    <span style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.34,1.56,.64,1)' }} />
      </svg>
      {children}
    </span>
  )
}

// متن کوتاه برای قرص بالای نقشه. هر تکه جداگانه کشیده می‌شود تا رقم‌ها و جداکننده جابه‌جا نشوند
export function exploreLine(p) {
  if (!p || !p.district) return ['اولین چک‌این، نقشه تو را شروع می‌کند']
  const out = [dLabel(p.district), fa(p.seen) + ' از ' + fa(p.total)]
  out.push(p.next ? fa(p.next.need) + ' تا نشان' : 'کامل')
  return out
}
export function ExploreLine({ p, sep }) {
  const parts = exploreLine(p)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
      {parts.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: i === 0 ? 0 : 1, minWidth: 0, opacity: i === 2 ? 0.7 : 1, fontWeight: i === 0 ? 900 : 800 }}>
          {i > 0 && <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: 9, background: sep || 'currentColor', opacity: 0.45, flexShrink: 0 }} />}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', unicodeBidi: 'isolate' }}>{t}</span>
        </span>
      ))}
    </span>
  )
}

// متن کامل برای پیام کوتاه
export function exploreMessage(p) {
  if (!p || !p.district) return '🧭 اولین چک‌این، پایگاهت را می‌سازد. بعد هر کافه تازه یک خانه از نقشه‌ات را روشن می‌کند و خط‌چین‌ها جای کشف بعدی را نشان می‌دهند'
  const d = dLabel(p.district)
  const done = p.reached && p.reached.length ? ' · نشان‌های گرفته: ' + p.reached.map(x => fa(x) + '٪').join('، ') : ''
  if (!p.next) return '🏅 کشف ' + d + ' را کامل کردی: ' + fa(p.seen) + ' از ' + fa(p.total) + ' مکان' + done
  return '🧭 ' + d + ': ' + fa(p.seen) + ' از ' + fa(p.total) + ' مکان را دیده‌ای. ' + fa(p.next.need) + ' مکان تازه دیگر تا نشان ' + fa(p.next.pct) + '٪' + done
}
