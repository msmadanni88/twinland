'use client'
// انتخابگرهای نسخه v4.0: پوسته نقشه، شهر و مرزها — همه روی برگه شیشه‌ای و با آیکون خطی
import { BOUNDARY_SOURCES } from '@/components/map/mapLayers'
import { CITIES } from '@/lib/constants'
import { SKINS_V4, MINI } from '@/components/v4/map/skinsV4'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { Icon } from '@/components/v4/icons'

function Preview({ s, dark }) {
  const sw = s.id === MINI ? (dark ? ['#0D0D0F', '#2A2A2F', '#060607', '#121413'] : ['#F2F2F3', '#FFFFFF', '#D8DBE0', '#E5E7E5']) : s.swatch
  const [land, road, water, green] = sw
  return (
    <svg viewBox="0 0 120 70" width="100%" height="64" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', borderRadius: 12 }}>
      <rect width="120" height="70" fill={land} />
      <path d="M-4 52 C20 40 30 62 58 56 S100 60 126 44 V74 H-4 Z" fill={water} />
      <circle cx="26" cy="20" r="13" fill={green} />
      <path d="M-4 34 C30 30 50 12 124 18" fill="none" stroke={road} strokeWidth="4" strokeLinecap="round" />
      <path d="M70 -4 C66 20 84 30 80 50" fill="none" stroke={road} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <circle cx="84" cy="34" r="5" fill="#34C759" stroke={dark && s.id === MINI ? '#0B0B0C' : '#fff'} strokeWidth="1.5" />
    </svg>
  )
}

const card = (C, T, on) => ({
  position: 'relative', textAlign: 'right', padding: 8, borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
  background: on ? T.accentSoft : T.chip, color: C.text, border: '1.5px solid ' + (on ? C.accent : 'transparent'),
})

export function SkinPickerV4({ C, T, show, setShow, skinId, setSkinId, showToast }) {
  return (
    <SheetV4 C={C} T={T} open={show} onClose={() => setShow(false)} title="پوسته نقشه" icon="layers" maxWidth={560}>
      <div className="tl-vscroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 10, maxHeight: '62dvh', overflowY: 'auto', padding: 2 }}>
        {SKINS_V4.map(s => {
          const on = s.id === skinId
          return (
            <button key={s.id} className="tl4-btn" aria-pressed={on} style={card(C, T, on)}
              onClick={() => { setSkinId(s.id); setShow(false); showToast('پوسته «' + s.label + '» فعال شد') }}>
              <Preview s={s} dark={T.dark} />
              <div style={{ fontSize: 13.5, fontWeight: 900, margin: '8px 4px 2px' }}>{s.label}{s.id === MINI ? ' · پیش‌فرض' : ''}</div>
              <div style={{ fontSize: 11, color: C.sub, margin: '0 4px 3px', lineHeight: 1.5 }}>{s.hint}</div>
              {on && <span style={{ position: 'absolute', top: 13, left: 13, width: 22, height: 22, borderRadius: '50%', background: C.accent, color: T.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} stroke={2.4} /></span>}
            </button>
          )
        })}
      </div>
    </SheetV4>
  )
}

export function CityPickerV4({ C, T, show, setShow, city, setCity, showToast }) {
  return (
    <SheetV4 C={C} T={T} open={show} onClose={() => setShow(false)} title="انتخاب شهر" icon="pin">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxHeight: '60dvh', overflowY: 'auto' }}>
        {Object.entries(CITIES).map(([k, v]) => {
          const on = city === k
          return (
            <button key={k} className={'tl4-btn' + (on ? ' is-on' : '')} onClick={() => { setCity(k); setShow(false); showToast(v.name) }}
              style={{ background: T.chip, border: '1px solid ' + T.hair, borderRadius: 14, padding: '12px 6px', fontSize: 12.5, fontWeight: on ? 900 : 600, color: C.text, fontFamily: 'inherit', cursor: 'pointer' }}>{v.name}</button>
          )
        })}
      </div>
    </SheetV4>
  )
}

const BOUNDS = [
  { key: 'off', label: 'خاموش', icon: 'x' },
  { key: 'province', label: 'استان‌های ایران', icon: 'map' },
  { key: 'district', label: 'مناطق ۲۲گانه تهران', icon: 'polygon' },
]
export function BoundaryPickerV4({ C, T, show, setShow, boundaryMode, setBoundaryMode, showToast }) {
  return (
    <SheetV4 C={C} T={T} open={show} onClose={() => setShow(false)} title="مرزهای جغرافیایی" icon="polygon" maxWidth={480}>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 12, lineHeight: 1.7 }}>روی هر منطقه روی نقشه بزن تا انتخاب یا خاموش شود.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BOUNDS.map(o => {
          const on = boundaryMode === o.key
          return (
            <button key={o.key} className={'tl4-btn' + (on ? ' is-on' : '')}
              onClick={() => { setBoundaryMode(o.key); setShow(false); if (o.key !== 'off') showToast((BOUNDARY_SOURCES[o.key] && BOUNDARY_SOURCES[o.key].label) + ' فعال شد') }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.chip, border: '1px solid ' + T.hair, borderRadius: 14, padding: '13px 14px', fontSize: 14, fontWeight: on ? 900 : 600, color: C.text, fontFamily: 'inherit', textAlign: 'right', cursor: 'pointer' }}>
              <Icon name={o.icon} size={19} />{o.label}
            </button>
          )
        })}
      </div>
    </SheetV4>
  )
}
