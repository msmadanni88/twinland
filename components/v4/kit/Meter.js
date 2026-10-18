'use client'
// ─────────────────────────────────────────────────────────────
//  نوار پیشرفت و نشان لول — نسخه v4.0
//  همه نوارهای پیشرفت سایت از همین یک جزء می‌آیند: امتیاز تا لول بعد، کشف شهر، کلکسیون، ماموریت‌ها.
//  شکلشان یکی است: چند خانه کنار هم، سیاه و سفید. سه اندازه دارند: sm، md و lg.
//  نشان لول تنها چیز رنگی این بخش است.
// ─────────────────────────────────────────────────────────────
import { SegmentBar } from '@/components/v4/ui/SegmentBar'
import { useV4 } from '@/components/v4/kit/context'
import { alpha } from '@/components/v2/theme'

const SIZES = { sm: { h: 4, gap: 2 }, md: { h: 6, gap: 3 }, lg: { h: 8, gap: 3 } }

// value از 0 تا 100. segments پیش‌فرض 5؛ برای ماموریت چندمرحله‌ای تعداد مرحله‌ها.
export function Meter({ value = 0, segments = 5, size = 'md', label, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const s = SIZES[size] || SIZES.md
  const n = Math.max(1, Math.min(10, Math.round(segments) || 5))
  return (
    <span aria-label={label} style={{ display: 'block', width: '100%', ...style }}>
      <SegmentBar value={value} segments={n} height={s.h} gap={s.gap} color={C.text} track={T.hairStrong} />
    </span>
  )
}

// نوار امتیاز تا لول بعد؛ همان Meter با نام روشن‌تر
export function XpBar({ levelInfo, size = 'md', style, C, T }) {
  const pct = Math.max(0, Math.min(100, (levelInfo && levelInfo.progress) || 0))
  return <Meter value={pct} segments={5} size={size} style={style} C={C} T={T} label={'پیشرفت تا لول بعد ' + Math.round(pct) + ' درصد'} />
}

// نشان لول: دایره با حاشیه رنگ لول و آیکون لول
export function LevelBadge({ level, size = 30, style, C: c, T: t }) {
  const { C } = useV4({ C: c, T: t })
  const col = (level && level.color) || C.accent
  return (
    <span aria-label={level ? 'لول ' + level.level + '، ' + level.name : 'لول'}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.5), lineHeight: 1, background: alpha(col, 0.16), boxShadow: 'inset 0 0 0 ' + Math.max(2, Math.round(size / 15)) + 'px ' + col, ...style }}>
      {level ? level.icon : ''}
    </span>
  )
}
