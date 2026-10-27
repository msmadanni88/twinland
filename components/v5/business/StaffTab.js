'use client'
// ─────────────────────────────────────────────────────────────
//  زبانه کارکنان و صندوق پنل کسب‌وکار — نسخه v5.0
//  صفحه دستگاه صندوق: کد شش‌رقمی که هر ۳۰ ثانیه عوض می‌شود و کاربر در برگه مکان می‌زند.
//  تأیید کد کوپن همکاری و کد جایزه رویداد، برای صاحب، مدیر و کارمند.
//  صاحب و مدیر: ساختن و برداشتن دستگاه، دعوت کارکنان با کد ۴۸ ساعته، و برداشتن عضو.
//  راز کد چرخان هیچ‌وقت به مرورگر نمی‌آید؛ فقط خود کد از تابع امن می‌رسد.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn, Card, Empty, fa } from '@/components/v3/business/bizUi'
import { deviceAdd, deviceList, deviceRevoke, errText, opKey, presenceCode, staffInvite, staffJoin, staffList, staffRedeem, staffRemove } from '@/lib/alliances/alliances'

const ROLE = { owner: 'صاحب', manager: 'مدیر', staff: 'کارمند' }
const faCode = (s) => String(s || '').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])

function CodeScreen({ C, device, onClose, full }) {
  const [code, setCode] = useState(null)
  const [left, setLeft] = useState(30)
  const [err, setErr] = useState(null)
  const exp = useRef(0)
  const pulling = useRef(false)
  useEffect(() => {
    let alive = true
    const pull = async () => {
      if (pulling.current) return
      pulling.current = true
      const r = await presenceCode(device.id)
      pulling.current = false
      if (!alive) return
      if (!r || !r.ok) { setErr(errText(r)); exp.current = Date.now() + 10000; return }
      setErr(null); setCode(r.code); exp.current = Date.now() + Math.max(1, r.seconds_left) * 1000; setLeft(r.seconds_left)
    }
    pull()
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((exp.current - Date.now()) / 1000))
      setLeft(l)
      if (l <= 0) pull()
    }, 1000)
    return () => { alive = false; clearInterval(t) }
  }, [device.id])
  const box = full
    ? { position: 'fixed', inset: 0, zIndex: 9000, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 20 }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '14px 8px' }
  return (
    <div style={box}>
      <div style={{ fontSize: full ? 18 : 13, fontWeight: 900, color: C.text }}>کد حضور · {device.label}</div>
      {err ? <div style={{ color: '#d03b3b', fontWeight: 800 }}>{err}</div> : (
        <div aria-live="polite" style={{ direction: 'ltr', unicodeBidi: 'isolate', fontSize: full ? 'min(22vw, 140px)' : 46, fontWeight: 900, letterSpacing: full ? '0.12em' : 8, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {code ? faCode(code.slice(0, 3)) + ' ' + faCode(code.slice(3)) : '······'}
        </div>
      )}
      <div style={{ width: full ? 'min(80vw, 520px)' : '100%', height: 6, borderRadius: 99, background: C.chip, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: (Math.max(0, Math.min(30, left)) / 30 * 100) + '%', background: C.accent, transition: 'width 1s linear' }} />
      </div>
      <div style={{ fontSize: full ? 15 : 11.5, color: C.sub, textAlign: 'center', lineHeight: 1.9 }}>
        مشتری این کد را در برگه همین مکان در TwinLand می‌زند. {fa(left)} ثانیه تا کد بعدی.
      </div>
      {full && <Btn C={C} kind="ghost" onClick={onClose}>بستن صفحه صندوق</Btn>}
    </div>
  )
}

export function StaffTab({ C, K, biz, role }) {
  const boss = role === 'owner' || role === 'manager'
  const [devices, setDevices] = useState(null)
  const [dev, setDev] = useState(null)
  const [full, setFull] = useState(false)
  const [staff, setStaff] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const [label, setLabel] = useState('')
  const keyRef = useRef(null)
  const input = { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'inherit' }

  const load = useCallback(async () => {
    const d = await deviceList(biz.id)
    const items = d && d.ok ? d.items || [] : []
    setDevices(items)
    setDev(cur => (cur && items.some(x => x.id === cur.id)) ? cur : (items[0] || null))
    if (boss) { const s = await staffList(biz.id); setStaff(s && s.ok ? s : { members: [], invites: [] }) }
  }, [biz.id, boss])
  useEffect(() => { load() }, [load])

  const say = (ok, text) => setNote({ ok, text })
  async function redeem() {
    if (!keyRef.current) keyRef.current = opKey()
    setBusy(true); setNote(null)
    const r = await staffRedeem(code.trim(), keyRef.current)
    setBusy(false)
    if (!r || !r.ok) { say(false, errText(r)); keyRef.current = null; return }
    keyRef.current = null
    say(true, 'تأیید شد: ' + r.reward + (r.kind === 'alliance' ? ' · کوپن همکاری' : ' · جایزه رویداد'))
    setCode('')
  }
  async function addDevice() {
    setBusy(true); const r = await deviceAdd(biz.id, label.trim() || 'صندوق'); setBusy(false)
    if (!r || !r.ok) { say(false, errText(r)); return }
    setLabel(''); say(true, 'دستگاه «' + r.label + '» ساخته شد'); load()
  }
  async function revoke(d) {
    if (!window.confirm('دستگاه «' + d.label + '» برداشته شود؟ کدش دیگر کار نمی‌کند.')) return
    setBusy(true); const r = await deviceRevoke(biz.id, d.id); setBusy(false)
    if (!r || !r.ok) { say(false, errText(r)); return }
    say(true, 'دستگاه برداشته شد'); load()
  }
  async function invite(r0) {
    setBusy(true); const r = await staffInvite(biz.id, r0); setBusy(false)
    if (!r || !r.ok) { say(false, errText(r)); return }
    say(true, 'کد دعوت ' + ROLE[r.role] + ' ساخته شد: ' + r.code); load()
  }
  async function remove(m) {
    if (!window.confirm((m.card && m.card.name ? '«' + m.card.name + '»' : 'این نفر') + ' از کارکنان برداشته شود؟')) return
    setBusy(true); const r = await staffRemove(biz.id, m.id); setBusy(false)
    if (!r || !r.ok) { say(false, errText(r)); return }
    say(true, 'برداشته شد'); load()
  }
  const link = (c) => { try { return window.location.origin + '/business?join=' + c } catch (e) { return '/business?join=' + c } }
  const copy = (t) => { try { navigator.clipboard.writeText(t); say(true, 'رونوشت شد') } catch (e) {} }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {note && <div style={{ fontSize: 12.5, fontWeight: 800, color: note.ok ? K.good : K.bad, padding: '0 4px' }}>{note.ok ? '✅ ' : '⚠️ '}{note.text}</div>}

      <Card C={C} K={K} title="تأیید کد در صندوق" hint="کد کوپن همکاری یا کد جایزه رویداد را از گوشی مشتری بخوان و این‌جا بزن">
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...input, direction: 'ltr', textAlign: 'center', letterSpacing: 3, fontWeight: 900, textTransform: 'uppercase' }} value={code} maxLength={12}
            onChange={e => { keyRef.current = null; setCode(e.target.value.replace(/\s/g, '')) }} placeholder="T7KX2M9P" aria-label="کد مشتری" />
          <Btn C={C} disabled={busy || code.trim().length < 4} onClick={redeem}>تأیید</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 8, lineHeight: 1.8 }}>هر کد فقط یک بار پذیرفته می‌شود. کد خودت را نمی‌توانی تأیید کنی.</div>
      </Card>

      <Card C={C} K={K} title="صفحه صندوق، کد حضور" hint="این صفحه را روی تبلت یا گوشی صندوق باز بگذار؛ کد هر ۳۰ ثانیه عوض می‌شود و عکسش به درد کسی نمی‌خورد"
        action={dev ? <Btn C={C} small kind="soft" onClick={() => setFull(true)}>تمام‌صفحه</Btn> : null}>
        {devices === null ? <Empty C={C} icon="⏳" title="در حال بارگذاری…" />
          : !devices.length ? <Empty C={C} icon="📟" title="هنوز دستگاه صندوقی نساخته‌ای" text={boss ? 'از پایین یک دستگاه بساز.' : 'از صاحب یا مدیر شعبه بخواه یک دستگاه بسازد.'} />
          : <>
              {devices.length > 1 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {devices.map(d => <Btn key={d.id} C={C} small kind={dev && dev.id === d.id ? 'primary' : 'soft'} onClick={() => setDev(d)}>{d.label}</Btn>)}
              </div>}
              {dev && <CodeScreen C={C} device={dev} />}
            </>}
      </Card>
      {full && dev && <CodeScreen C={C} device={dev} full onClose={() => setFull(false)} />}

      {boss && <Card C={C} K={K} title={'دستگاه‌های صندوق · ' + fa((devices || []).length) + ' از ۳'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {(devices || []).map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: C.chip }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>📟 {d.label}</span>
              <Btn C={C} small kind="danger" disabled={busy} onClick={() => revoke(d)}>برداشتن</Btn>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={input} value={label} maxLength={40} onChange={e => setLabel(e.target.value)} placeholder="اسم دستگاه، مثلاً صندوق طبقه اول" />
          <Btn C={C} disabled={busy || (devices || []).length >= 3} onClick={addDevice}>ساختن</Btn>
        </div>
      </Card>}

      {boss && <Card C={C} K={K} title="کارکنان" hint="کارمند فقط صفحه صندوق و تأیید کد را می‌بیند؛ مدیر بقیه پنل را هم دارد. کارکنان در محل کار خودشان چک‌این ندارند.">
        {!staff ? <Empty C={C} icon="⏳" title="در حال بارگذاری…" /> : <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(staff.members || []).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: C.chip }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m.card && (m.card.name || m.card.username)) || 'کاربر'}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{ROLE[m.role]}</span>
                {m.role !== 'owner' && <Btn C={C} small kind="danger" disabled={busy} onClick={() => remove(m)}>برداشتن</Btn>}
              </div>
            ))}
          </div>
          {(staff.invites || []).length > 0 && <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>کدهای دعوت باز</div>
            {staff.invites.map(i => (
              <div key={i.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, border: '1px dashed ' + C.border }}>
                <span style={{ fontFamily: 'ui-monospace,monospace', direction: 'ltr', fontWeight: 900, letterSpacing: 2 }}>{i.code}</span>
                <span style={{ flex: 1, fontSize: 11.5, color: C.sub }}>{ROLE[i.role]}</span>
                <Btn C={C} small kind="soft" onClick={() => copy(link(i.code))}>رونوشت پیوند</Btn>
              </div>
            ))}
          </div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <Btn C={C} small disabled={busy} onClick={() => invite('staff')}>دعوت کارمند</Btn>
            {role === 'owner' && <Btn C={C} small kind="soft" disabled={busy} onClick={() => invite('manager')}>دعوت مدیر</Btn>}
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 8, lineHeight: 1.8 }}>هر کد ۴۸ ساعت اعتبار دارد و یک بار مصرف است. پیوند را برای همکارت بفرست؛ با حساب کاربری خودش باز کند.</div>
        </>}
      </Card>}
    </div>
  )
}

// پیوستن کارمند با کد دعوت؛ هم در حالت خالی پنل و هم در زبانه حساب
export function JoinStaffCard({ C, K, onJoined, initial = '' }) {
  const [code, setCode] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const input = { flex: 1, minWidth: 0, boxSizing: 'border-box', borderRadius: 12, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', direction: 'ltr', textAlign: 'center', letterSpacing: 3, fontWeight: 900 }
  async function join() {
    setBusy(true); setNote(null)
    const r = await staffJoin(code.trim())
    setBusy(false)
    if (!r || !r.ok) { setNote({ ok: false, text: errText(r) }); return }
    setNote({ ok: true, text: 'به «' + r.org + '» پیوستی، نقش: ' + (ROLE[r.role] || r.role) }); setCode('')
    onJoined && onJoined(r)
  }
  return (
    <Card C={C} K={K} title="کد دعوت کارکنان داری؟" hint="صاحب یا مدیر شعبه کد هشت‌حرفی می‌دهد">
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={input} value={code} maxLength={8} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABCD2345" aria-label="کد دعوت" />
        <Btn C={C} disabled={busy || code.length !== 8} onClick={join}>پیوستن</Btn>
      </div>
      {note && <div style={{ fontSize: 12.5, fontWeight: 800, color: note.ok ? K.good : K.bad, marginTop: 8 }}>{note.text}</div>}
    </Card>
  )
}
