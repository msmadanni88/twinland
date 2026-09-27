'use client'
// صفحه‌ی «منو» در پنجره‌ی کافه — آیتم‌هایی که صاحب کافه ثبت کرده، دسته‌بندی‌شده.
// قیمت خالی یعنی کافه قیمتی ثبت نکرده؛ آیتم ناموجود کم‌رنگ نشان داده می‌شود.
import { useEffect, useState } from 'react'
import { listMenu, groupMenu, formatToman } from '@/lib/cafeContent'

export function CafeMenu({ C, cafeId, canManageHint }) {
  const [items, setItems] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setItems(null); setFailed(false)
    listMenu(cafeId)
      .then(rows => { if (alive) setItems(rows) })
      .catch(() => { if (alive) { setItems([]); setFailed(true) } })
    return () => { alive = false }
  }, [cafeId])

  if (items === null) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>در حال گرفتن منو…</div>
  if (failed) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>منو بار نشد — دوباره امتحان کن</div>
  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '26px 8px' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📋</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>این کافه هنوز منویش را ثبت نکرده</div>
      {canManageHint && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6 }}>از پنل کافه‌دار، تب «صفحه کافه» منو را اضافه کن</div>}
    </div>
  )

  return <div>
    {groupMenu(items).map(g => (
      <div key={g.section || '_'} style={{ marginBottom: 14 }}>
        {g.section && <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, marginBottom: 6 }}>{g.section}</div>}
        {g.items.map(it => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid ' + C.border, opacity: it.is_available ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{it.name}{!it.is_available && <span style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}> · ناموجود</span>}</div>
              {it.description && <div style={{ fontSize: 11, color: C.sub, marginTop: 3, lineHeight: 1.6 }}>{it.description}</div>}
            </div>
            {it.price_toman !== null && it.price_toman !== undefined && (
              <div style={{ fontSize: 12, fontWeight: 800, color: C.text, flexShrink: 0 }}>{formatToman(it.price_toman)}</div>
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
}
