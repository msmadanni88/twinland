'use client'
// انتخاب پوسته نقشه — نسخه v2.0
// جای چهار حالت رنگی قدیم را گرفته؛ هر پوسته همان نقشه واقعی را با شکل خودش می‌کشد.
import { SKINS } from '@/components/v2/map/skins'

// پیش‌نمای کوچک هر پوسته با رنگ‌های خودش: زمین، راه، آب و سبزه
function Preview({ s }) {
  const [land, road, water, green] = s.swatch
  return (
    <svg viewBox="0 0 120 70" width="100%" height="70" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', borderRadius: 12 }}>
      <rect width="120" height="70" fill={land} />
      <path d="M-4 52 C20 40 30 62 58 56 S100 60 126 44 V74 H-4 Z" fill={water} />
      <circle cx="26" cy="20" r="13" fill={green} />
      <circle cx="40" cy="27" r="9" fill={green} />
      <path d="M-4 34 C30 30 50 12 124 18" fill="none" stroke={road} strokeWidth="4" strokeLinecap="round" />
      <path d="M70 -4 C66 20 84 30 80 50" fill="none" stroke={road} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {s.dark && <>
        <circle cx="78" cy="30" r="15" fill={road} opacity="0.28" />
        <circle cx="78" cy="30" r="6" fill="#ffe2ad" opacity="0.8" />
      </>}
    </svg>
  )
}

export function SkinPicker({ C, T, setShowSkin, setSkinId, showSkin, showToast, skinId }) {
  if (!showSkin) return null
  return (
    <div onClick={() => setShowSkin(false)} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'tl2Fade .2s' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="پوسته نقشه"
        style={{ width: '100%', maxWidth: 480, padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 26px)', borderRadius: T.radius.xl + 'px ' + T.radius.xl + 'px 0 0',
          background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderBottom: 'none', boxShadow: T.shadow2,
          animation: 'tl2Sheet .3s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ width: 42, height: 5, borderRadius: 99, background: T.hairStrong, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 17, fontWeight: 900, color: C.text, marginBottom: 4 }}>
          <img src="/map_skin.svg" alt="" width={30} height={30} style={{ objectFit: 'contain' }} />پوسته نقشه
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.sub, marginBottom: 14 }}>همان نقشه واقعی، با شکل دلخواه تو</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKINS.map(s => {
            const on = s.id === skinId
            return (
              <button key={s.id} className="tl2-press" aria-pressed={on}
                onClick={() => { setSkinId(s.id); setShowSkin(false); showToast('پوسته «' + s.label + '» فعال شد') }}
                style={{ position: 'relative', textAlign: 'right', padding: 8, borderRadius: 18, background: on ? T.accentSoft : T.chip, color: C.text,
                  border: '2px solid ' + (on ? C.accent : 'transparent'), boxShadow: on ? T.glow(C.accent) : 'none' }}>
                <Preview s={s} />
                <div style={{ fontSize: 14, fontWeight: 900, margin: '9px 4px 2px' }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: C.sub, margin: '0 4px 3px', lineHeight: 1.5 }}>{s.hint}</div>
                {on && <span style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderRadius: '50%', background: C.accent, color: T.onAccent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
