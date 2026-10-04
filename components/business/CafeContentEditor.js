'use client'
// تب «صفحه کافه» در پنل کافه‌دار — مدیریت عکس‌ها و منویی که در پنجره‌ی کافه
// به همه نشان داده می‌شود. فقط صاحبِ تأییدشده‌ی کافه (و مالک اپ) می‌تواند
// چیزی بنویسد؛ این را دیتابیس با can_manage_cafe() کنترل می‌کند، نه این صفحه.
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/game/gameSystem'
import { onColor } from '@/lib/theme/ui'
import { getColor } from '@/lib/constants'
import { CAFE_SHAPES, shapeKeyFor } from '@/components/v2/map/pins'
import {
  listPhotos, photoUrl, uploadPhoto, updatePhotoCaption, deletePhoto,
  listMenu, groupMenu, formatToman, saveMenuItem, deleteMenuItem,
  setCafeIcon, setCafeMotto, setCafeCapacityFull, setCafeFeaturedItem,
} from '@/lib/cafeContent'

const MAX_PHOTOS = 30
const ERR = {
  photo_limit: 'حداکثر 30 عکس برای هر کافه',
  menu_limit: 'حداکثر 200 آیتم منو برای هر کافه',
  too_large: 'این عکس حتی بعد از فشرده‌سازی از 2 مگابایت بزرگ‌تر است',
  not_an_image: 'فقط فایل عکس قابل آپلود است',
  invalid_icon: 'این آیکون معتبر نیست',
  item_not_found: 'این آیتم توی منوی همین کافه پیدا نشد',
}
const errText = (e) => {
  const m = (e && e.message) || ''
  for (const k of Object.keys(ERR)) if (m.includes(k)) return ERR[k]
  if (e && (e.status === 401 || e.status === 403)) return 'اجازه‌ی ویرایش این کافه را نداری'
  return 'ثبت نشد — دوباره امتحان کن'
}

export function CafeContentEditor({ C, biz, isPending, onReload }) {
  const [section, setSection] = useState('photos')
  if (isPending) return (
    <div style={{ textAlign: 'center', color: C.sub, fontSize: 12.5, padding: '22px 8px' }}>بعد از تأیید مالکیت، می‌توانی عکس و منوی کافه را اضافه کنی.</div>
  )
  return <div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
      {[['photos', '📷 عکس‌ها'], ['menu', '📋 منو'], ['storefront', '🏠 ویترین']].map(([k, label]) => (
        <button key={k} onClick={() => setSection(k)} style={{ padding: '7px 13px', borderRadius: 10, border: '1px solid ' + (section === k ? C.accent : C.border), background: section === k ? C.accent + '18' : 'transparent', color: section === k ? C.accent : C.sub, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{label}</button>
      ))}
    </div>
    {section === 'photos' && <PhotoManager C={C} cafeId={biz.cafe_id} />}
    {section === 'menu' && <MenuManager C={C} cafeId={biz.cafe_id} />}
    {section === 'storefront' && <StorefrontManager C={C} biz={biz} onReload={onReload} />}
  </div>
}

// ── ویترین: آیکون انتخابی، شعار، آیتم ویژه، ظرفیت ────────────────────────────
function StorefrontManager({ C, biz, onReload }) {
  const cafe = biz.cafes || {}
  const cafeId = biz.cafe_id
  const color = getColor(cafe.name || cafeId)
  const [iconId, setIconId] = useState(cafe.icon_id != null ? cafe.icon_id : null)
  const [motto, setMotto] = useState(cafe.motto || '')
  const [isFull, setIsFull] = useState(!!cafe.is_full)
  const [featuredId, setFeaturedId] = useState(cafe.featured_menu_item_id != null ? cafe.featured_menu_item_id : null)
  const [menu, setMenu] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const token = () => { const s = getSession(); return s && s.access_token }

  useEffect(() => { listMenu(cafeId).then(setMenu).catch(() => setMenu([])) }, [cafeId])

  async function pickIcon(id) {
    setIconId(id); setBusy(true); setMsg(null)
    try { await setCafeIcon(cafeId, id, token()); setMsg({ t: 'آیکون کافه ذخیره شد', bad: false }); onReload && onReload() }
    catch (e) { setMsg({ t: errText(e), bad: true }) }
    setBusy(false)
  }
  async function saveMotto() {
    setBusy(true); setMsg(null)
    try { const r = await setCafeMotto(cafeId, motto, token()); setMotto((r && r.motto) || ''); setMsg({ t: 'شعار ذخیره شد', bad: false }); onReload && onReload() }
    catch (e) { setMsg({ t: errText(e), bad: true }) }
    setBusy(false)
  }
  async function toggleFull() {
    const next = !isFull; setIsFull(next); setBusy(true); setMsg(null)
    try { await setCafeCapacityFull(cafeId, next, token()); onReload && onReload() }
    catch (e) { setIsFull(!next); setMsg({ t: errText(e), bad: true }) }
    setBusy(false)
  }
  async function pickFeatured(id) {
    setFeaturedId(id); setBusy(true); setMsg(null)
    try { await setCafeFeaturedItem(cafeId, id, token()); setMsg({ t: 'آیتم ویژه ذخیره شد', bad: false }); onReload && onReload() }
    catch (e) { setMsg({ t: errText(e), bad: true }) }
    setBusy(false)
  }

  const tileBtn = (on) => ({ aspectRatio: '1 / 1', borderRadius: 12, border: on ? '2px solid ' + C.accent : '1px solid ' + C.border, background: C.chip, padding: 3, cursor: 'pointer', opacity: busy ? 0.6 : 1 })

  return <div>
    <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 6 }}>🏠 آیکون کافه روی نقشه</div>
    <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, lineHeight: 1.8 }}>فعلاً رایگان است — بعد از عرضه‌ی اشتراک، این بخش ویژه می‌شود. این انتخاب در پوسته‌های «کارتونی» و «طرح مدادی» نقشه دیده می‌شود.</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 18 }}>
      <button onClick={() => pickIcon(null)} disabled={busy} title="خودکار بر اساس شناسه کافه" style={{ ...tileBtn(iconId == null), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🎲</button>
      {CAFE_SHAPES.map((shape, i) => (
        <button key={i} onClick={() => pickIcon(i)} disabled={busy} style={tileBtn(iconId === i)}>
          <svg viewBox="0 0 44 44" width="100%" height="100%" dangerouslySetInnerHTML={{ __html: shape(shapeKeyFor(color)) }} />
        </button>
      ))}
    </div>

    <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 6 }}>💬 شعار کوتاه کافه</div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <input value={motto} maxLength={60} onChange={e => setMotto(e.target.value)} placeholder="مثلاً: بهترین اسپرسوی این محل"
        style={{ flex: 1, minWidth: 0, background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 10px', fontSize: 12.5, color: C.text, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <button onClick={saveMotto} disabled={busy} style={{ background: C.accent, color: onColor(C.accent), border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>ذخیره</button>
    </div>
    <div style={{ fontSize: 10, color: C.sub, marginBottom: 18 }}>{motto.length.toLocaleString('fa')} از ۶۰ حرف — روی نقشه با hover یا لمس طولانی دیده می‌شود</div>

    <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>⭐ آیتم ویژه یا امضای کافه</div>
    {menu === null
      ? <div style={{ color: C.sub, fontSize: 12, marginBottom: 18 }}>در حال گرفتن منو…</div>
      : menu.length === 0
        ? <div style={{ color: C.sub, fontSize: 12, marginBottom: 18 }}>اول از تب «منو» چندتا آیتم اضافه کن</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.sub, padding: '7px 10px' }}>
              <input type="radio" checked={featuredId == null} disabled={busy} onChange={() => pickFeatured(null)} /> هیچ‌کدام
            </label>
            {menu.map(it => (
              <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.text, background: featuredId === it.id ? C.accent + '18' : C.chip, borderRadius: 10, padding: '8px 10px' }}>
                <input type="radio" checked={featuredId === it.id} disabled={busy} onChange={() => pickFeatured(it.id)} /> {it.name}
              </label>
            ))}
          </div>}

    <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>🚫 ظرفیت</div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.chip, borderRadius: 12, padding: '10px 12px' }}>
      <input type="checkbox" checked={isFull} disabled={busy} onChange={toggleFull} />
      <span style={{ fontSize: 12.5, color: C.text }}>الان جا نداریم — نشان «ظرفیت تکمیل» روی نقشه نشان داده شود</span>
    </label>

    {msg && <div style={{ fontSize: 11.5, color: msg.bad ? C.danger : C.green, marginTop: 10 }}>{msg.t}</div>}
  </div>
}

// ── عکس‌ها ──────────────────────────────────────────────────────────────────
function PhotoManager({ C, cafeId }) {
  const [photos, setPhotos] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const token = () => { const s = getSession(); return s && s.access_token }

  const reload = () => listPhotos(cafeId).then(setPhotos).catch(() => setPhotos([]))
  useEffect(() => { setPhotos(null); reload() }, [cafeId])

  async function onPick(e) {
    const files = Array.from(e.target.files || []); e.target.value = ''
    if (!files.length) return
    const room = MAX_PHOTOS - (photos ? photos.length : 0)
    if (room <= 0) { setMsg({ t: ERR.photo_limit, bad: true }); return }
    setBusy(true); setMsg(null)
    let ok = 0, lastErr = null
    for (const f of files.slice(0, room)) {
      try { await uploadPhoto(cafeId, f, token()); ok++ } catch (err) { lastErr = err }
    }
    setBusy(false)
    await reload()
    if (lastErr) setMsg({ t: (ok ? ok.toLocaleString('fa') + ' عکس آپلود شد؛ ' : '') + errText(lastErr), bad: true })
    else setMsg({ t: ok.toLocaleString('fa') + ' عکس اضافه شد', bad: false })
  }

  async function onCaption(p, caption) {
    if ((p.caption || '') === caption) return
    try { await updatePhotoCaption(p.id, caption, token()); setPhotos(ps => ps.map(x => x.id === p.id ? { ...x, caption } : x)) }
    catch (err) { setMsg({ t: errText(err), bad: true }) }
  }

  async function onDelete(p) {
    if (typeof window !== 'undefined' && !window.confirm('این عکس حذف شود؟')) return
    try { await deletePhoto(p, token()); setPhotos(ps => ps.filter(x => x.id !== p.id)) }
    catch (err) { setMsg({ t: errText(err), bad: true }) }
  }

  if (photos === null) return <div style={{ color: C.sub, fontSize: 12, padding: '14px 0' }}>در حال گرفتن عکس‌ها…</div>
  return <div>
    <label style={{ display: 'block', border: '1.5px dashed ' + C.border, borderRadius: 14, padding: '16px 10px', textAlign: 'center', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, marginBottom: 12 }}>
      <input type="file" accept="image/*" multiple disabled={busy} onChange={onPick} style={{ display: 'none' }} />
      <div style={{ fontSize: 22 }}>{busy ? '⏳' : '➕'}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginTop: 4 }}>{busy ? 'در حال آپلود…' : 'افزودن عکس'}</div>
      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3 }}>{photos.length.toLocaleString('fa')} از {MAX_PHOTOS.toLocaleString('fa')} · عکس‌ها خودکار کوچک و فشرده می‌شوند</div>
    </label>
    {msg && <div style={{ fontSize: 11.5, color: msg.bad ? C.danger : C.green, marginBottom: 10 }}>{msg.t}</div>}
    {photos.length === 0
      ? <div style={{ color: C.sub, fontSize: 12, textAlign: 'center', padding: '8px 0' }}>هنوز عکسی اضافه نشده</div>
      : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {photos.map(p => (
            <div key={p.id} style={{ background: C.chip, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1 / 1', background: C.bg }}>
                <img src={photoUrl(p.storage_path)} alt={p.caption || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: 7, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input defaultValue={p.caption || ''} maxLength={140} placeholder="توضیح کوتاه" onBlur={e => onCaption(p, e.target.value.trim())}
                  style={{ flex: 1, minWidth: 0, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 7px', fontSize: 11, color: C.text, fontFamily: 'inherit' }} />
                <button onClick={() => onDelete(p)} title="حذف" style={{ background: 'transparent', border: 'none', fontSize: 15, cursor: 'pointer', padding: 2 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>}
  </div>
}

// ── منو ─────────────────────────────────────────────────────────────────────
const EMPTY_ITEM = { id: null, section: '', name: '', description: '', price_toman: '', is_available: true }

function MenuManager({ C, cafeId }) {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const token = () => { const s = getSession(); return s && s.access_token }

  const reload = () => listMenu(cafeId).then(setItems).catch(() => setItems([]))
  useEffect(() => { setItems(null); setForm(EMPTY_ITEM); reload() }, [cafeId])

  const sections = items ? Array.from(new Set(items.map(i => (i.section || '').trim()).filter(Boolean))) : []

  async function onSave() {
    if (!form.name.trim()) { setMsg({ t: 'نام آیتم را بنویس', bad: true }); return }
    setBusy(true); setMsg(null)
    try {
      await saveMenuItem(cafeId, form, token())
      setForm({ ...EMPTY_ITEM, section: form.section })
      await reload()
      setMsg({ t: form.id ? 'ذخیره شد' : 'به منو اضافه شد', bad: false })
    } catch (err) { setMsg({ t: errText(err), bad: true }) }
    setBusy(false)
  }

  async function onDelete(it) {
    if (typeof window !== 'undefined' && !window.confirm('«' + it.name + '» از منو حذف شود؟')) return
    try { await deleteMenuItem(it.id, token()); setItems(xs => xs.filter(x => x.id !== it.id)); if (form.id === it.id) setForm(EMPTY_ITEM) }
    catch (err) { setMsg({ t: errText(err), bad: true }) }
  }

  async function toggleAvailable(it) {
    try { await saveMenuItem(cafeId, { ...it, is_available: !it.is_available }, token()); setItems(xs => xs.map(x => x.id === it.id ? { ...x, is_available: !it.is_available } : x)) }
    catch (err) { setMsg({ t: errText(err), bad: true }) }
  }

  const inp = { width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 10px', fontSize: 12.5, color: C.text, fontFamily: 'inherit', boxSizing: 'border-box' }
  if (items === null) return <div style={{ color: C.sub, fontSize: 12, padding: '14px 0' }}>در حال گرفتن منو…</div>
  return <div>
    <div style={{ background: C.chip, borderRadius: 14, padding: 12, marginBottom: 14, display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{form.id ? '✏️ ویرایش آیتم' : '➕ آیتم تازه'}</div>
      <input list={'menu-sections-' + cafeId} value={form.section} maxLength={40} placeholder="دسته — مثلاً نوشیدنی گرم" onChange={e => setForm({ ...form, section: e.target.value })} style={inp} />
      <datalist id={'menu-sections-' + cafeId}>{sections.map(s => <option key={s} value={s} />)}</datalist>
      <input value={form.name} maxLength={80} placeholder="نام — مثلاً اسپرسو" onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
      <input value={form.price_toman} inputMode="numeric" placeholder="قیمت به تومان — اختیاری" onChange={e => setForm({ ...form, price_toman: e.target.value })} style={inp} />
      <textarea value={form.description || ''} maxLength={200} rows={2} placeholder="توضیح کوتاه — اختیاری" onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text }}>
        <input type="checkbox" checked={form.is_available !== false} onChange={e => setForm({ ...form, is_available: e.target.checked })} /> موجود است
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={busy} style={{ flex: 1, background: C.accent, color: onColor(C.accent), border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>{busy ? '…' : form.id ? 'ذخیره' : 'افزودن به منو'}</button>
        {form.id && <button onClick={() => setForm(EMPTY_ITEM)} style={{ background: 'transparent', color: C.sub, border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: 'inherit' }}>انصراف</button>}
      </div>
      {msg && <div style={{ fontSize: 11.5, color: msg.bad ? C.danger : C.green }}>{msg.t}</div>}
    </div>

    {items.length === 0
      ? <div style={{ color: C.sub, fontSize: 12, textAlign: 'center', padding: '8px 0' }}>منو هنوز خالی است</div>
      : groupMenu(items).map(g => (
          <div key={g.section || '_'} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: C.accent, marginBottom: 4 }}>{g.section || 'بدون دسته'}</div>
            {g.items.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid ' + C.border, opacity: it.is_available ? 1 : 0.55 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>{it.price_toman !== null && it.price_toman !== undefined ? formatToman(it.price_toman) : 'بدون قیمت'}{it.is_available ? '' : ' · ناموجود'}</div>
                </div>
                <button onClick={() => toggleAvailable(it)} title="موجود یا ناموجود" style={{ background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '4px 7px', fontSize: 10.5, color: C.sub, fontFamily: 'inherit' }}>{it.is_available ? 'ناموجود کن' : 'موجود کن'}</button>
                <button onClick={() => setForm({ ...it, price_toman: it.price_toman === null || it.price_toman === undefined ? '' : String(it.price_toman), description: it.description || '' })} title="ویرایش" style={{ background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => onDelete(it)} title="حذف" style={{ background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        ))}
  </div>
}
