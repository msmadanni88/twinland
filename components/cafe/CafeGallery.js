'use client'
// صفحه‌ی «گالری» در پنجره‌ی کافه — فقط عکس‌های واقعی که صاحب کافه گذاشته.
// اگر عکسی نیست، حالت خالی نشان داده می‌شود؛ هیچ عکس نمونه‌ای ساخته نمی‌شود.
import { useEffect, useState } from 'react'
import { listPhotos, photoUrl } from '@/lib/cafeContent'
import { onColor } from '@/lib/theme/ui'

export function CafeGallery({ C, cafeId, canManageHint }) {
  const [photos, setPhotos] = useState(null)   // null = در حال بارگذاری
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(null)       // عکس بازشده در نمای بزرگ

  useEffect(() => {
    let alive = true
    setPhotos(null); setFailed(false)
    listPhotos(cafeId)
      .then(rows => { if (alive) setPhotos(rows) })
      .catch(() => { if (alive) { setPhotos([]); setFailed(true) } })
    return () => { alive = false }
  }, [cafeId])

  if (photos === null) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>در حال گرفتن عکس‌ها…</div>
  if (failed) return <div style={{ textAlign: 'center', color: C.sub, fontSize: 12, padding: '28px 0' }}>عکس‌ها بار نشدند — دوباره امتحان کن</div>
  if (photos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '26px 8px' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>هنوز عکسی برای این کافه اضافه نشده</div>
      {canManageHint && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6 }}>از پنل کافه‌دار، تب «صفحه کافه» عکس اضافه کن</div>}
    </div>
  )

  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
      {photos.map(p => (
        <button key={p.id} onClick={() => setOpen(p)} style={{ padding: 0, border: 'none', background: C.chip, borderRadius: 12, overflow: 'hidden', aspectRatio: '1 / 1', cursor: 'zoom-in' }}>
          <img src={photoUrl(p.storage_path)} alt={p.caption || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </button>
      ))}
    </div>
    {open && (
      <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}>
        <img src={photoUrl(open.storage_path)} alt={open.caption || ''} style={{ maxWidth: '100%', maxHeight: '82dvh', borderRadius: 14, objectFit: 'contain' }} />
        {open.caption && <div style={{ color: onColor('#000000'), fontSize: 13, marginTop: 12, textAlign: 'center' }}>{open.caption}</div>}
      </div>
    )}
  </>
}
