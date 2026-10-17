'use client'
// نوار پیشرفت چندتکه‌ای نسخه v4.0 — چند خانه کنار هم که یکی‌یکی پر می‌شوند
export function SegmentBar({ value = 0, segments = 5, height = 6, gap = 3, color, track, radius = 99, style }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const filled = v * segments / 100
  return (
    <span role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}
      style={{ display: 'flex', gap, width: '100%', height, ...style }}>
      {Array.from({ length: segments }, (_, i) => {
        const f = Math.max(0, Math.min(1, filled - i))
        return (
          <span key={i} style={{ flex: 1, height: '100%', borderRadius: radius, background: track, overflow: 'hidden', display: 'block' }}>
            <span style={{ display: 'block', height: '100%', width: (f * 100) + '%', background: color, borderRadius: radius, transition: 'width .6s cubic-bezier(.2,.8,.3,1)' }} />
          </span>
        )
      })}
    </span>
  )
}
