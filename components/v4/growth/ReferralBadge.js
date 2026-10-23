'use client'
// ─────────────────────────────────────────────────────────────
//  نشان دعوت — یک طرح برای همه جاها: پروفایل، پروفایل عمومی، پنجره جایزه و پنجره دعوت
//  هر پله ارزشمندتر دیده می‌شود: حلقه ساده، حلقه دوتایی، حلقه با خط‌های دور، گل‌میخ و در آخر تاج.
//  رنگ از کمیابی می‌آید، مثل بقیه آیتم‌ها: معمولی خاکستری، کمیاب آبی، حماسی بنفش، افسانه‌ای طلایی.
// ─────────────────────────────────────────────────────────────
import { REFERRAL_TIERS, tierByCode } from '@/lib/growth/referralTiers'
import { RARITY_TONE } from '@/lib/events/format'
import { useV4 } from '@/components/v4/kit/context'
import { R } from '@/components/v4/theme'

const fa = (n) => Number(n || 0).toLocaleString('fa')

function rosette(cx, cy, r1, r2, n) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1
    const a = (Math.PI * i) / n - Math.PI / 2
    pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2))
  }
  return pts.join(' ')
}

export function ReferralBadge({ code, size = 56, locked = false, title, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const tier = tierByCode(code) || REFERRAL_TIERS[0]
  const step = REFERRAL_TIERS.indexOf(tier)
  const tone = locked ? (T.dark ? '#52525B' : '#A1A1AA') : (RARITY_TONE[tier.rarity] || '#94a3b8')
  const disc = T.dark ? '#18181B' : '#FFFFFF'
  const label = title || (tier.title + ' · ' + fa(tier.need) + ' دعوت')
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label} style={{ display: 'block', opacity: locked ? 0.45 : 1, overflow: 'visible' }}>
      <title>{label}</title>
      {step >= 3 && <polygon points={rosette(32, 31, 31, 27.2, 16)} fill={tone} opacity={locked ? 0.5 : 0.9} />}
      {step === 4 && !locked && <circle cx="32" cy="31" r="32.5" fill="none" stroke={tone} strokeWidth="1" opacity="0.35" />}
      <circle cx="32" cy="31" r="25" fill={disc} stroke={tone} strokeWidth={step >= 1 ? 2.4 : 2} />
      {step >= 1 && <circle cx="32" cy="31" r="21" fill="none" stroke={tone} strokeWidth="1.1" opacity="0.8" />}
      {step === 2 && Array.from({ length: 12 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 12
        return <line key={i} x1={32 + 27.2 * Math.cos(a)} y1={31 + 27.2 * Math.sin(a)} x2={32 + 30 * Math.cos(a)} y2={31 + 30 * Math.sin(a)} stroke={tone} strokeWidth="1.6" strokeLinecap="round" />
      })}
      {/* دو آدم کنار هم */}
      <g fill="none" stroke={locked ? tone : C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="27" cy="25.5" r="4.6" />
        <path d="M18.4 40.5c.9-5 4.4-7.8 8.6-7.8s7.7 2.8 8.6 7.8" />
        <circle cx="39.5" cy="27.3" r="3.8" opacity="0.85" />
        <path d="M36.8 33.6c4.1-.5 7.6 1.9 8.7 6.4" opacity="0.85" />
      </g>
      {step === 4 && <path d="M22 4.5l4.4 4.6L32 1.6l5.6 7.5 4.4-4.6-1.8 9.2H23.8z" fill={tone} stroke={disc} strokeWidth="1" strokeLinejoin="round" />}
      <g>
        <rect x={tier.need >= 10 ? 19.5 : 23} y="50" width={tier.need >= 10 ? 25 : 18} height="13.5" rx="6.75" fill={tone} stroke={disc} strokeWidth="1.2" />
        <text x="32" y="60.2" textAnchor="middle" fontSize="9.6" fontWeight="900" fill={disc} style={{ fontFamily: "'Estedad','Vazirmatn',sans-serif" }}>{fa(tier.need)}</text>
      </g>
    </svg>
  )
}

// کاشی نشان برای جدول نشان‌ها؛ نشان دعوت با طرح خودش و بقیه با آیکون ذخیره‌شده
export function BadgeTile({ badge, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const ref = badge && tierByCode(badge.code)
  return (
    <div title={badge && badge.title} style={{ borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: '10px 6px', textAlign: 'center', minWidth: 0 }}>
      {ref
        ? <div style={{ display: 'flex', justifyContent: 'center' }}><ReferralBadge code={badge.code} size={44} C={C} T={T} /></div>
        : <div style={{ fontSize: 24, lineHeight: 1.2 }}>{(badge && badge.icon) || '•'}</div>}
      <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge && badge.title}</div>
    </div>
  )
}

// ردیف همه پله‌ها با پیشرفت؛ برای پنجره دعوت و زبانه نشان‌ها
export function ReferralTierRow({ count = 0, size = 50, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const n = Number(count) || 0
  const next = REFERRAL_TIERS.find(x => n < x.need)
  return (
    <div>
      <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, justifyContent: 'space-between', overflowX: 'auto' }}>
        {REFERRAL_TIERS.map(x => (
          <div key={x.code} style={{ flex: '1 0 56px', textAlign: 'center', minWidth: 56 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><ReferralBadge code={x.code} size={size} locked={n < x.need} C={C} T={T} /></div>
            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4, color: n >= x.need ? C.text : C.sub, whiteSpace: 'nowrap' }}>{x.title}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 8, lineHeight: 1.8, textAlign: 'center' }}>
        {next
          ? (n > 0 ? fa(n) + ' دعوت موفق · ' : '') + fa(next.need - n) + ' دعوت دیگر تا نشان «' + next.title + '»'
          : 'همه نشان‌های دعوت را گرفته‌ای'}
      </div>
    </div>
  )
}
