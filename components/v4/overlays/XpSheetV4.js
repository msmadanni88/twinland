'use client'
// پنجره امتیاز و لول — نسخه v4.0: همان اطلاعات XPPanel، با قاب برگه v4، نوار پیشرفت مشترک و آیکون خطی
import { LEVELS } from '@/lib/game/gameSystem'
import { XP_CONFIG } from '@/lib/constants'
import { Icon } from '@/components/v4/icons'
import { R, V4_COLOR } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { LevelBadge, XpBar } from '@/components/v4/kit/Meter'
import { SheetV4 } from '@/components/v4/ui/Sheet'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const WAYS = [
  { icon: 'pin', label: 'چک‌این در کافه', note: 'هر کافه', xp: XP_CONFIG.checkin },
  { icon: 'star', label: 'کافه برتر', note: 'کافه‌های ستاره‌دار', xp: XP_CONFIG.checkin_top },
  { icon: 'sunrise', label: 'اولین چک‌این روز', note: 'جایزه روزانه', xp: XP_CONFIG.checkin_first },
  { icon: 'flame', label: 'روزهای پشت هم', note: 'از روز سوم', xp: XP_CONFIG.streak_bonus },
  { icon: 'target', label: 'رویدادها', note: 'رویدادهای ویژه کافه‌ها', xp: XP_CONFIG.event_bonus },
]

export function XpSheetV4({ xp, levelInfo, streak, onClose }) {
  const { C, T } = useV4()
  const { current, next } = levelInfo
  return (
    <SheetV4 open onClose={onClose} title="امتیاز و لول" icon="star" maxWidth={540}>
      <div style={{ borderRadius: R.box, padding: 16, background: T.chip, border: '1px solid ' + T.hair }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LevelBadge level={current} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>لول {fa(current.level)}</div>
            <div style={{ fontSize: 19, fontWeight: 900 }}>{current.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fa(xp)} <span style={{ fontSize: 12, color: C.sub }}>XP</span></div>
          </div>
          {streak >= 2 && (
            <div style={{ textAlign: 'center', borderRadius: R.box, padding: '8px 12px', background: V4_COLOR.streakGrad, color: '#fff' }}>
              <Icon name="flame" size={20} stroke={2} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 17, fontWeight: 900 }}>{fa(streak)}</div>
              <div style={{ fontSize: 9.5, fontWeight: 800 }}>روز</div>
            </div>
          )}
        </div>
        {next && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
              <span style={{ color: C.sub }}>تا {next.name}</span>
              <span style={{ fontWeight: 900 }}>{fa(Math.max(0, next.minXP - xp))} XP مانده</span>
            </div>
            <XpBar levelInfo={levelInfo} size="lg" />
          </div>
        )}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 900, margin: '18px 0 8px' }}>راه‌های گرفتن امتیاز</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {WAYS.map((w, i) => (
          <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderTop: i ? '1px solid ' + T.hair : 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={w.icon} size={17} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{w.label}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{w.note}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>+{fa(w.xp)}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 900, margin: '18px 0 8px' }}>همه لول‌ها</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
        {LEVELS.map(l => {
          const now = l.level === current.level, past = xp >= l.minXP
          return (
            <div key={l.level} style={{ borderRadius: R.box, padding: 12, background: T.chip, border: '1px solid ' + (now ? C.text : T.hair), opacity: past ? 1 : 0.5 }}>
              <LevelBadge level={l} size={34} />
              <div style={{ fontSize: 12.5, fontWeight: 900, marginTop: 6 }}>{l.name}</div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{fa(l.minXP)} XP</div>
              {now && <div style={{ fontSize: 10, fontWeight: 900, marginTop: 4 }}>الان اینجایی</div>}
            </div>
          )
        })}
      </div>
    </SheetV4>
  )
}
