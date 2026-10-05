'use client'
// برچسب همیشه‌پیدای «حالت نمایشی» و جریان رویدادهای ساختگی — نسخه v3.0
// برچسب عمداً همیشه دیده می‌شود تا هیچ‌کس این عددها را با داده واقعی اشتباه نگیرد.
import { DEMO_USER_COUNT } from '@/components/v3/demo/useDemoSim'

export function DemoLayer({ C, T, Lay, compact, demo, isMobile, onOff }) {
  if (!demo.on) return null
  const fa = (n) => Number(n || 0).toLocaleString('fa')
  const top = isMobile ? (compact ? Lay.chipsTop + 44 : Lay.hudTop + 84) : Lay.hudTop + 44
  const pill = { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: C.text,
    background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow1, maxWidth: '100%', boxSizing: 'border-box' }
  return (
    <div style={{ position: 'absolute', left: Lay.gap, top: 'calc(env(safe-area-inset-top, 0px) + ' + top + 'px)', zIndex: 56, width: isMobile ? 'min(72vw, 290px)' : 320, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
      <button className="tl2-press" onClick={onOff} title="خاموش کردن حالت نمایشی"
        style={{ ...pill, background: C.danger, color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
        🎬 حالت نمایشی · داده ساختگی <span style={{ opacity: 0.85 }}>✕</span>
      </button>
      <div style={{ ...pill, color: C.sub, fontSize: 10.5 }}>
        <b style={{ color: C.text }}>{fa(DEMO_USER_COUNT)}</b> کاربر · <b style={{ color: C.text }}>{fa(demo.counts.checkins)}</b> چک‌این · <b style={{ color: C.text }}>{fa(demo.counts.badges)}</b> نشان · <b style={{ color: C.text }}>{fa(demo.counts.quests)}</b> کمپین
      </div>
      {demo.feed.map((e, i) => (
        <div key={e.key} style={{ ...pill, opacity: 1 - i * 0.2, animation: 'tl2Slide .35s cubic-bezier(.2,.9,.3,1) both', pointerEvents: 'none' }}>
          <span style={{ flexShrink: 0 }}>{e.icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{e.text}</span>
          {e.tail && <span style={{ flexShrink: 0, color: C.accent, fontWeight: 900 }}>{e.tail}</span>}
        </div>
      ))}
    </div>
  )
}
