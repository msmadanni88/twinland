'use client'
// انتخابگر تصویر رویداد برای پنل کافه‌دار.
// کلید انتخاب‌شده در quests.art_key ذخیره می‌شود و همان در نوار رویداد، داشبورد، ماموریت‌ها و تاریخچه دیده می‌شود.
// value خالی یعنی «خودکار»: تصویر از روی دسته‌بندی رویداد انتخاب می‌شود.
import { useMemo, useState } from 'react'
import { EventArt } from '@/components/events/EventArt'
import { ART_GROUPS, ART_LIST, CATEGORY_ART, artLabel } from '@/lib/events/art'

export function ArtPicker({ C, value, onChange, category = 'general' }) {
  const [group, setGroup] = useState('all')
  const auto = CATEGORY_ART[category] || 'star'
  const list = useMemo(() => ART_LIST.filter(a => group === 'all' || a.group === group), [group])
  const shown = value || auto
  const chip = (on) => ({
    flexShrink: 0, padding: '6px 12px', borderRadius: 99, border: '1px solid ' + (on ? C.accent : C.border),
    background: on ? C.accent : C.chip, color: on ? '#fff' : C.text, fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
  })
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <EventArt artKey={shown} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: C.text }}>تصویر ویجت رویداد</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>
            {value ? 'انتخاب شما: ' + artLabel(value) : 'خودکار: ' + artLabel(auto) + ' (از روی دسته‌بندی)'}. همین تصویر روی نوار رویداد پایین نقشه و داشبورد کاربرها دیده می‌شود.
          </div>
        </div>
        {value && <button type="button" onClick={() => onChange('')} style={{ ...chip(false), padding: '6px 10px' }}>خودکار</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
        <button type="button" onClick={() => setGroup('all')} style={chip(group === 'all')}>همه</button>
        {Object.keys(ART_GROUPS).map(g => (
          <button type="button" key={g} onClick={() => setGroup(g)} style={chip(group === g)}>{ART_GROUPS[g].label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))', gap: 8 }}>
        {list.map(a => {
          const on = value === a.key
          return (
            <button type="button" key={a.key} onClick={() => onChange(a.key)} aria-pressed={on} aria-label={a.label}
              style={{ border: '2px solid ' + (on ? C.accent : 'transparent'), background: on ? C.accent + '14' : C.chip, borderRadius: 14, padding: '6px 2px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: 'inherit' }}>
              <EventArt artKey={a.key} size={40} />
              <span style={{ fontSize: 10, color: C.sub, fontWeight: on ? 900 : 600 }}>{a.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
