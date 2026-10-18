'use client'
// ─────────────────────────────────────────────────────────────
//  ویرایش پروفایل — نسخه v4.0
//  چهره: عکس از گوشی یا کامپیوتر، یکی از آواتارهای آماده، یا بدون تصویر (حرف اول نام).
//    گذاشتن عکس اجباری نیست. عکس در مرورگر مربع و کوچک می‌شود و اطلاعات پنهانش پاک می‌شود.
//    انتخاب چهره همان لحظه ذخیره می‌شود؛ نام، درباره من و شهر با دکمه ذخیره.
//  همه بررسی‌ها دوباره در سرور انجام می‌شود (update_my_profile)، پس دور زدن این فرم چیزی را باز نمی‌کند.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { CITIES } from '@/lib/constants'
import { visiblePresets } from '@/lib/profile/presets'
import { PROFILE_ERRORS, clearAvatar, prepareAvatar, updateMyProfile, uploadAvatar } from '@/lib/profile/people'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Chip, Field, TextArea } from '@/components/v4/kit/kit'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { SheetV4 } from '@/components/v4/ui/Sheet'

const PHOTO_ERR = {
  type: 'این فایل عکس نیست', decode: 'این عکس باز نشد؛ یک عکس دیگر امتحان کن', too_big: 'این عکس خیلی بزرگ است',
  encode: 'عکس آماده نشد؛ یک عکس دیگر امتحان کن', upload: 'عکس بالا نرفت؛ اتصال را بررسی کن و دوباره امتحان کن',
}

export function EditProfileSheet({ open, onClose, me, showToast }) {
  const { C, T } = useV4()
  const row = (me && me.row) || {}
  const card = (me && me.card) || {}
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('tehran')
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [err, setErr] = useState('')
  const [presetsOpen, setPresetsOpen] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // اسمی که همان ابتدای ایمیل است پیشنهاد نمی‌شود تا کسی ناخواسته ایمیلش را عمومی نکند
    const local = String((me && me.email) || '').split('@')[0].toLowerCase()
    const dn = row.display_name || ''
    setName(me && me.nameConfirmed ? dn : (dn && dn.trim().toLowerCase() !== local ? dn : ''))
    setBio(row.bio || '')
    setCity(row.city && CITIES[row.city] ? row.city : 'tehran')
    setErr(''); setPresetsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onFile(e) {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    setPhotoBusy(true); setErr('')
    try {
      const prepared = await prepareAvatar(f)
      const r = await uploadAvatar(prepared)
      if (r.ok) { showToast && showToast('عکس پروفایلت عوض شد'); track('avatar_set', { kind: 'photo' }) }
      else setErr(PROFILE_ERRORS[r.error] || PHOTO_ERR[r.error] || 'عکس ذخیره نشد')
    } catch (x) {
      setErr(PHOTO_ERR[x && x.message] || 'عکس ذخیره نشد')
    }
    setPhotoBusy(false)
  }
  async function pickPreset(id) {
    setPhotoBusy(true); setErr('')
    const r = await clearAvatar(id)
    setPhotoBusy(false)
    if (r.ok) { showToast && showToast('آواتار انتخاب شد'); track('avatar_set', { kind: 'preset' }) }
    else setErr(PROFILE_ERRORS[r.error] || 'ذخیره نشد')
  }
  async function noImage() {
    setPhotoBusy(true); setErr('')
    const r = await clearAvatar(null)
    setPhotoBusy(false)
    if (r.ok) { showToast && showToast('چهره برداشته شد'); track('avatar_set', { kind: 'none' }) }
    else setErr(PROFILE_ERRORS[r.error] || 'ذخیره نشد')
  }

  async function save() {
    if (busy) return
    const patch = {}
    const n = name.trim().replace(/\s+/g, ' ')
    if (n && (n !== (row.display_name || '') || !(me && me.nameConfirmed))) patch.display_name = n
    if ((bio.trim() || '') !== (row.bio || '')) patch.bio = bio.trim()
    if (city !== row.city) patch.city = city
    if (!Object.keys(patch).length) { onClose && onClose(); return }
    if (patch.display_name != null && (patch.display_name.length < 2 || patch.display_name.length > 30)) { setErr(PROFILE_ERRORS.name_len); return }
    setBusy(true); setErr('')
    const r = await updateMyProfile(patch)
    setBusy(false)
    if (r.ok) { showToast && showToast('پروفایلت ذخیره شد'); track('profile_edit', { fields: Object.keys(patch).join(',') }); onClose && onClose() }
    else setErr(PROFILE_ERRORS[r.error] || 'ذخیره نشد؛ دوباره امتحان کن')
  }

  const hasPhoto = !!row.avatar_path
  const presets = visiblePresets()
  const label = { fontSize: 12, fontWeight: 900, color: C.text, margin: '16px 0 8px' }
  return (
    <SheetV4 open={open} onClose={onClose} title="ویرایش پروفایل" icon="edit" maxWidth={520} zIndex={3300}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <UserAvatar person={card} size={84} />
          {photoBusy && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'tl4Spin .8s linear infinite' }} />
          </span>}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" onChange={onFile} style={{ display: 'none' }} />
          <Btn icon="camera" size="sm" disabled={photoBusy} onClick={() => fileRef.current && fileRef.current.click()} block>{hasPhoto ? 'عوض کردن عکس' : 'گذاشتن عکس'}</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" size="sm" icon="grid" disabled={photoBusy} onClick={() => setPresetsOpen(v => !v)} style={{ flex: 1 }}>آواتار آماده</Btn>
            {(hasPhoto || row.avatar_preset) && <Btn kind="ghost" size="sm" icon="trash" disabled={photoBusy} onClick={noImage} style={{ flex: 1 }}>بدون تصویر</Btn>}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8, marginTop: 8 }}>گذاشتن عکس اختیاری است. اگر نخواهی، یکی از آواتارها یا حرف اول اسمت نشان داده می‌شود.</div>

      {presetsOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 10, marginTop: 12, padding: 12, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
          {presets.map(p => {
            const on = !hasPhoto && row.avatar_preset === p.id
            return (
              <button key={p.id} type="button" className="tl4-press" disabled={photoBusy} onClick={() => pickPreset(p.id)} aria-label={'آواتار ' + p.label} aria-pressed={on}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                <UserAvatar person={{ preset: p.id, name: p.label }} size={52} ring={on} />
              </button>
            )
          })}
        </div>
      )}

      <div style={label}>اسم</div>
      <Field value={name} onChange={v => setName(v.slice(0, 30))} placeholder="اسمی که دیگران می‌بینند" maxLength={30} />
      {!(me && me.nameConfirmed) && <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8, marginTop: 6 }}>تا اسمت را اینجا ثبت نکنی، دیگران نام «{card.name}» را می‌بینند تا ایمیلت پیدا نباشد.</div>}

      <div style={label}>درباره من</div>
      <TextArea value={bio} onChange={setBio} maxLength={160} rows={2} placeholder="یک جمله کوتاه؛ مثلاً کافه محبوبت یا قهوه‌ای که دوست داری" />

      <div style={label}>شهر</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(CITIES).map(([k, v]) => <Chip key={k} on={city === k} onClick={() => setCity(k)}>{v.name}</Chip>)}
      </div>

      {err && <div role="alert" style={{ marginTop: 14, padding: '10px 12px', borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hairStrong, fontSize: 12.5, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="help" size={16} />{err}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <Btn onClick={save} disabled={busy} icon="check" style={{ flex: 1 }}>{busy ? 'در حال ذخیره…' : 'ذخیره'}</Btn>
        <Btn kind="ghost" onClick={onClose}>انصراف</Btn>
      </div>
    </SheetV4>
  )
}
