'use client'
// ─────────────────────────────────────────────────────────────
//  فرم‌های کلن: ساختن و ویرایش کلن، انتخاب کافه، و ساختن دورهمی
//  همه بررسی‌ها دوباره در سرور انجام می‌شود؛ این‌جا فقط راهنمایی زودتر است.
// ─────────────────────────────────────────────────────────────
import { districtLabel } from '@/lib/events/format'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Chip, Field, Segmented, TextArea, faDigits } from '@/components/v4/kit/kit'
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { ClanEmblem } from '@/components/v4/clan/ClanEmblem'
import {
  CLAN_COLORS, CLAN_EMBLEMS, JOIN_MODES, clanCreate, clanError, clanUpdate, dayLabel, meetupCreate, searchCafes, tehranISO,
} from '@/lib/clan/clans'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const Label = ({ children, hint }) => {
  const { C } = useV4()
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '14px 0 8px' }}>
      <span style={{ fontSize: 12.5, fontWeight: 900 }}>{children}</span>
      {hint && <span style={{ fontSize: 10.5, color: C.sub }}>{hint}</span>}
    </div>
  )
}

// ── انتخاب کافه با جستجو ────────────────────────────────────
export function CafePicker({ value, onChange, placeholder = 'نام کافه را بنویس…' }) {
  const { C, T } = useV4()
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)
  useEffect(() => {
    const t = q.trim()
    if (t.length < 2) { setList([]); return }
    const my = ++seq.current
    setBusy(true)
    const tm = setTimeout(() => {
      searchCafes(t).then(rows => { if (my === seq.current) { setList(rows); setBusy(false) } })
    }, 280)
    return () => clearTimeout(tm)
  }, [q])
  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: R.box, background: T.chip, border: '1px solid ' + C.accent }}>
        <Icon name="coffee" size={18} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</span>
          {value.district && <span style={{ display: 'block', fontSize: 10.5, color: C.sub }}>{faDigits(districtLabel(value.district))}</span>}
        </span>
        <Btn size="sm" kind="text" icon="x" onClick={() => onChange(null)}>عوض کن</Btn>
      </div>
    )
  }
  return (
    <div>
      <Field icon="search" value={q} onChange={setQ} onClear={() => setQ('')} placeholder={placeholder} label="جستجوی کافه" />
      {q.trim().length >= 2 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {busy && !list.length && <div style={{ fontSize: 12, color: C.sub, padding: 8 }}>در حال جستجو…</div>}
          {!busy && !list.length && <div style={{ fontSize: 12, color: C.sub, padding: 8 }}>کافه‌ای با این نام پیدا نشد.</div>}
          {list.map(c => (
            <button key={c.id} type="button" className="tl4-press" onClick={() => { onChange(c); setQ('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip,
                color: C.text, fontFamily: 'inherit', textAlign: 'right', cursor: 'pointer' }}>
              <Icon name="pin" size={16} color={C.sub} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}{c.branch ? ' · ' + c.branch : ''}</span>
              {c.district && <span style={{ fontSize: 10.5, color: C.sub, flexShrink: 0 }}>{faDigits(districtLabel(c.district))}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── فرم کلن: ساختن یا ویرایش ────────────────────────────────
// role: 'leader' همه چیز را عوض می‌کند، 'officer' فقط شعار را
export function ClanForm({ clan, role = 'leader', onDone, showToast, submitLabel }) {
  const { C, T } = useV4()
  const editing = !!clan
  const full = role === 'leader'
  const [name, setName] = useState((clan && clan.name) || '')
  const [motto, setMotto] = useState((clan && clan.motto) || '')
  const [emblem, setEmblem] = useState((clan && CLAN_EMBLEMS.includes(clan.emblem) && clan.emblem) || 'flame')
  const [color, setColor] = useState(((clan && clan.color) || '#8B5CF6').toUpperCase())
  const [mode, setMode] = useState((clan && clan.join_mode) || 'open')
  const [minLevel, setMinLevel] = useState((clan && clan.min_level) || 1)
  const [home, setHome] = useState((clan && clan.home) || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const preview = useMemo(() => ({ name: name || 'اسم کلن', emblem, color, level: (clan && clan.level) || 1 }), [name, emblem, color, clan])

  const submit = async () => {
    setErr('')
    const n = name.trim()
    if (full && (n.length < 2 || n.length > 24)) { setErr('اسم کلن باید ۲ تا ۲۴ حرف باشد.'); return }
    setBusy(true)
    let r
    if (!editing) {
      r = await clanCreate({ name: n, motto: motto.trim(), emblem, color, join_mode: mode, min_level: minLevel, home_cafe_id: home ? home.id : null })
    } else {
      const p = { motto: motto.trim() }
      if (full) Object.assign(p, { name: n, emblem, color, join_mode: mode, min_level: minLevel, home_cafe_id: home ? home.id : null })
      r = await clanUpdate(p)
    }
    setBusy(false)
    if (!r.ok) { setErr(clanError(r)); return }
    showToast && showToast(editing ? 'تنظیمات کلن ذخیره شد' : 'کلن ساخته شد؛ حالا دوستانت را دعوت کن')
    onDone && onDone(r)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair }}>
        <ClanEmblem clan={preview} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{motto.trim() || 'شعار کلن این‌جا دیده می‌شود'}</div>
        </div>
      </div>

      {full && <>
        <Label hint="۲ تا ۲۴ حرف">اسم کلن</Label>
        <Field value={name} onChange={v => setName(v.slice(0, 24))} placeholder="مثلاً اکیپ قهوه جمعه" label="اسم کلن" />
      </>}

      <Label hint="اختیاری، حداکثر ۱۲۰ حرف">شعار</Label>
      <TextArea value={motto} onChange={setMotto} maxLength={120} rows={2} placeholder="هر جمعه یک کافه تازه" label="شعار کلن" />

      {full && <>
        <Label>نشان</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {CLAN_EMBLEMS.map(k => (
            <button key={k} type="button" aria-pressed={emblem === k} aria-label={'نشان ' + k} className="tl4-press" onClick={() => setEmblem(k)}
              style={{ aspectRatio: '1', borderRadius: R.box, border: '1.5px solid ' + (emblem === k ? color : T.hair), background: emblem === k ? T.accentSoft : T.chip,
                color: emblem === k ? C.text : C.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <Icon name={k} size={19} />
            </button>
          ))}
        </div>

        <Label>رنگ</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CLAN_COLORS.map(k => (
            <button key={k} type="button" aria-pressed={color === k} aria-label={'رنگ ' + k} className="tl4-press" onClick={() => setColor(k)}
              style={{ width: 34, height: 34, borderRadius: '50%', background: k, cursor: 'pointer', padding: 0,
                border: color === k ? '3px solid ' + C.text : '3px solid transparent', boxShadow: color === k ? '0 0 0 2px ' + C.card + ' inset' : 'none' }} />
          ))}
        </div>

        <Label hint="با کد دعوت در هر حالتی می‌شود عضو شد">ورود اعضا</Label>
        <Segmented options={JOIN_MODES} value={mode} onChange={setMode} label="حالت ورود" />

        <Label hint="کمترین لول برای پیوستن بدون کد">حداقل لول</Label>
        <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {[1, 2, 3, 4, 5, 6].map(l => <Chip key={l} on={minLevel === l} onClick={() => setMinLevel(l)}>{l === 1 ? 'همه' : 'لول ' + fa(l)}</Chip>)}
        </div>

        <Label hint="اختیاری؛ در برگه همان کافه دیده می‌شود">پاتوق کلن</Label>
        <CafePicker value={home} onChange={setHome} />
      </>}

      {err && <div role="alert" style={{ marginTop: 12, fontSize: 12.5, color: C.text, padding: '10px 12px', borderRadius: R.box, background: T.accentSoft, border: '1px solid ' + T.hairStrong }}>{err}</div>}
      <Btn block size="lg" style={{ marginTop: 16 }} disabled={busy} onClick={submit} icon={editing ? 'check' : 'plus'}>
        {busy ? 'صبر کن…' : submitLabel || (editing ? 'ذخیره تنظیمات' : 'ساختن کلن')}
      </Btn>
    </div>
  )
}

export function ClanCreateSheet({ open, onClose, onDone, showToast }) {
  if (!open) return null
  return (
    <SheetV4 open onClose={onClose} title="ساختن کلن" icon="users" maxWidth={520}>
      <ClanForm onDone={(r) => { onDone && onDone(r); onClose && onClose() }} showToast={showToast} />
    </SheetV4>
  )
}

// ── ساختن دورهمی ────────────────────────────────────────────
const HOURS = Array.from({ length: 16 }, (_, i) => 8 + i)
const MINUTES = [0, 15, 30, 45]
function nowTehran() {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
    const h = Number(p.find(x => x.type === 'hour').value) % 24, m = Number(p.find(x => x.type === 'minute').value)
    return { h, m }
  } catch (e) { const d = new Date(); return { h: d.getHours(), m: d.getMinutes() } }
}

export function MeetupSheet({ open, onClose, home, showToast, onDone }) {
  const { C, T } = useV4()
  const [cafe, setCafe] = useState(home || null)
  const [day, setDay] = useState(0)
  const start = useMemo(() => { const n = nowTehran(); let h = n.h + 1; if (h < 8) h = 18; return Math.min(23, h) }, [])
  const [hour, setHour] = useState(start)
  const [minute, setMinute] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setCafe(home || null); setErr('') } }, [open, home])
  if (!open) return null
  const at = tehranISO(day, hour, minute)
  const tooSoon = new Date(at).getTime() < Date.now() + 10 * 60e3
  const submit = async () => {
    setErr('')
    if (!cafe) { setErr('اول کافه را انتخاب کن.'); return }
    if (tooSoon) { setErr('ساعت دورهمی باید دست‌کم ۱۰ دقیقه بعد باشد.'); return }
    setBusy(true)
    const r = await meetupCreate(cafe.id, at, note.trim())
    setBusy(false)
    if (!r.ok) { setErr(clanError(r)); return }
    showToast && showToast('دورهمی ساخته شد و به همه اعضا خبر رسید')
    onDone && onDone(r)
    onClose && onClose()
  }
  const sel = { height: 42, borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, color: C.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 800, padding: '0 10px', direction: 'ltr' }
  return (
    <SheetV4 open onClose={onClose} title="دورهمی تازه" icon="calendar" maxWidth={500}>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>
        اگر دست‌کم سه نفر از کلن از نیم ساعت قبل تا سه ساعت بعد در همین کافه چک‌این کنند، هر نفر ۳۰ امتیاز و کلن ۵۰ امتیاز می‌گیرد.
      </div>
      <Label>کافه</Label>
      <CafePicker value={cafe} onChange={setCafe} />
      <Label>روز</Label>
      <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[0, 1, 2, 3, 4, 5, 6].map(d => <Chip key={d} on={day === d} onClick={() => setDay(d)}>{dayLabel(d)}</Chip>)}
      </div>
      <Label hint="به وقت تهران">ساعت</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: 'ltr', justifyContent: 'flex-end' }}>
        <select aria-label="ساعت" value={hour} onChange={e => setHour(Number(e.target.value))} style={sel}>
          {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
        </select>
        <span style={{ fontWeight: 900 }}>:</span>
        <select aria-label="دقیقه" value={minute} onChange={e => setMinute(Number(e.target.value))} style={sel}>
          {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
      </div>
      {tooSoon && <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>این ساعت گذشته یا خیلی نزدیک است؛ ساعت یا روز دیگری را انتخاب کن.</div>}
      <Label hint="اختیاری، حداکثر ۸۰ حرف">یادداشت</Label>
      <Field value={note} onChange={v => setNote(v.slice(0, 80))} placeholder="مثلاً میز کنار پنجره" label="یادداشت دورهمی" />
      {err && <div role="alert" style={{ marginTop: 12, fontSize: 12.5, padding: '10px 12px', borderRadius: R.box, background: T.accentSoft, border: '1px solid ' + T.hairStrong }}>{err}</div>}
      <Btn block size="lg" style={{ marginTop: 16 }} icon="calendar" disabled={busy || !cafe} onClick={submit}>{busy ? 'صبر کن…' : 'ساختن دورهمی'}</Btn>
    </SheetV4>
  )
}
