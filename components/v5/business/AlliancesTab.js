'use client'
// ─────────────────────────────────────────────────────────────
//  زبانه همکاری پنل کسب‌وکار — نسخه v5.0
//  همکاری به شکل قرارداد: پیشنهاد، شرایط متقابل، پذیرش دقیقاً همان نسخه، فعال، توقف، پایان.
//  پیشنهاد همکار با دلیل روشن: مشتری مشترک با کف گروه، فاصله و زمان پیاده، مکمل بودن، رقیب نزدیک.
//  ساخت قدم‌به‌قدم با پیش‌نمایش کارتی که کاربر می‌بیند. هر کار را خود دیتابیس بررسی می‌کند.
//  ظاهر همان پنل v3 کسب‌وکار است: Card، Btn و Empty از bizUi.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn, Card, Empty, fa } from '@/components/v3/business/bizUi'
import { onColor } from '@/lib/theme/ui'
import { catInfo } from '@/lib/places/categories'
import {
  EVENT_TEXT, KIND, STATUS, TIER, accept, action, dateText, distText, errText, listBusiness, opKey, pauseText, propose, suggest, updateTerms, walkText, windowText,
} from '@/lib/alliances/alliances'

const KIND_EMOJI = { trail: '🧭', bounceback: '🔁', event: '📅', clan_sponsor: '🛡' }
const PARTNER_RULE = { trail: [1, 4], bounceback: [1, 1], event: [0, 1], clan_sponsor: [0, 0] }
const isoIn = (days) => new Date(Date.now() + days * 86400000).toISOString()
const localInput = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16) }

function inputStyle(C) {
  return { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'inherit' }
}
function Label({ C, children, hint }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 5 }}>{children}{hint && <span style={{ fontWeight: 600, color: C.sub }}> · {hint}</span>}</div>
}
function Pill({ C, children, strong, warn }) {
  return <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
    background: strong ? C.accent : warn ? 'rgba(208,59,59,.12)' : C.chip, color: strong ? onColor(C.accent) : warn ? '#d03b3b' : C.sub }}>{children}</span>
}

// ── یک همکاری با طرف‌ها، نتیجه، خط زمانی و دکمه‌های همان حالت ──────────────
function AllianceItem({ C, K, a, biz, busy, run }) {
  const [edit, setEdit] = useState(null)   // null | 'terms' | 'budget'
  const me = (a.parties || []).find(p => p.is_me) || {}
  const [reward, setReward] = useState(me.reward || '')
  const [bt, setBt] = useState(me.budget_total || '')
  const [bd, setBd] = useState(me.budget_daily || '')
  const [title, setTitle] = useState(a.title)
  const open = a.status === 'proposed' || a.status === 'countered'
  const live = a.status === 'active' || a.status === 'scheduled' || a.status === 'paused'
  const needMe = open && !a.my_accepted
  const r = a.results || {}
  const inp = inputStyle(C)
  const save = async () => {
    const spec = edit === 'budget' ? { budget_total: bt === '' ? null : Number(bt), budget_daily: bd === '' ? null : Number(bd) }
      : { reward, budget_total: bt === '' ? null : Number(bt), budget_daily: bd === '' ? null : Number(bd), title }
    const ok = await run(() => updateTerms(a.id, biz.id, spec), edit === 'budget' ? 'بودجه به‌روز شد' : 'شرایط تازه فرستاده شد؛ طرف مقابل باید نسخه تازه را بپذیرد')
    if (ok) setEdit(null)
  }
  return (
    <div style={{ border: '1px solid ' + (needMe ? C.accent : C.border), borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 9, background: C.card }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>{KIND_EMOJI[a.kind] || '🤝'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>{a.title}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            <Pill C={C}>{(KIND[a.kind] || {}).label}</Pill>
            <Pill C={C} strong={a.status === 'active'} warn={a.status === 'paused'}>{STATUS[a.status] || a.status}</Pill>
            {(a.kind === 'trail' || a.kind === 'event') && <Pill C={C}>{(TIER[a.tier] || {}).label}{a.window_hours ? ' · ' + windowText(a.window_hours) : ''}</Pill>}
            <Pill C={C}>نسخه {fa(a.terms_version)}</Pill>
            {a.require_presence && <Pill C={C}>کد حضور لازم</Pill>}
          </div>
        </div>
      </div>
      {a.blurb && <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>{a.blurb}</div>}
      {a.status === 'paused' && <div style={{ fontSize: 12, color: K.warn, fontWeight: 800 }}>⏸ {pauseText(a.pause_reason)}</div>}
      <div style={{ fontSize: 11.5, color: C.sub }}>از {dateText(a.starts_at)} تا {dateText(a.ends_at)}{a.coupon_days ? ' · اعتبار کوپن ' + fa(a.coupon_days) + ' روز' : ''}{a.need ? ' · ' + fa(a.need) + ' قدم لازم' : ''}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(a.parties || []).map(p => (
          <div key={p.cafe_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: C.chip }}>
            <span style={{ fontSize: 13 }}>{p.accepted ? '✅' : '⏳'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}{p.is_me ? ' · شما' : ''}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                {catInfo(p.category).label}{!p.is_me && p.distance_m != null ? ' · ' + distText(p.distance_m) : ''}
                {' · '}{p.reward ? 'جایزه: ' + p.reward : 'بدون جایزه'}
                {p.budget_total ? ' · سقف ' + fa(p.budget_total) : ''}{p.budget_daily ? ' · روزی ' + fa(p.budget_daily) : ''}
                {live || a.status === 'ended' ? ' · داده ' + fa(p.issued) + ' · استفاده ' + fa(p.redeemed) : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(live || a.status === 'ended') && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ background: C.chip, borderRadius: 10, padding: '6px 10px' }}>🏁 تکمیل: <b>{r.completions != null ? fa(r.completions) : r.completions_small ? 'کمتر از ۵' : '۰'}</b></span>
          <span style={{ background: C.chip, borderRadius: 10, padding: '6px 10px' }}>🧭 در حال رفتن: <b>{r.runs_active != null ? fa(r.runs_active) : r.runs_small ? 'کمتر از ۵' : '۰'}</b></span>
          <span style={{ background: C.chip, borderRadius: 10, padding: '6px 10px' }}>🎟 کوپن شما: <b>{fa(r.my_issued)}</b> داده، <b>{fa(r.my_redeemed)}</b> استفاده</span>
        </div>
      )}

      {(a.events || []).length > 0 && (
        <details>
          <summary style={{ fontSize: 11.5, color: C.sub, cursor: 'pointer', fontWeight: 700 }}>خط زمانی · {fa(a.events.length)} رخداد</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {a.events.map((e, i) => (
              <div key={i} style={{ fontSize: 11.5, color: C.text, display: 'flex', gap: 6 }}>
                <span style={{ color: C.sub, flexShrink: 0 }}>{dateText(e.at)}</span>
                <span>{e.by ? '«' + e.by + '» ' : ''}{EVENT_TEXT[e.kind] || e.kind}{e.data && e.data.version ? ' · نسخه ' + fa(e.data.version) : ''}{e.data && e.data.reason ? ' · ' + pauseText(e.data.reason) : ''}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {edit && (
        <div style={{ border: '1px solid ' + C.border, borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {edit === 'terms' && <>
            <div><Label C={C}>عنوان</Label><input style={inp} value={title} maxLength={60} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label C={C} hint="خالی یعنی بدون جایزه">جایزه شما</Label><input style={inp} value={reward} maxLength={80} onChange={e => setReward(e.target.value)} placeholder="مثلاً ده درصد تخفیف قهوه" /></div>
          </>}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><Label C={C} hint="کل">سقف جایزه</Label><input style={inp} inputMode="numeric" value={bt} onChange={e => setBt(e.target.value.replace(/\D/g, ''))} placeholder="بی‌سقف" /></div>
            <div style={{ flex: 1 }}><Label C={C} hint="در روز">سقف روزانه</Label><input style={inp} inputMode="numeric" value={bd} onChange={e => setBd(e.target.value.replace(/\D/g, ''))} placeholder="بی‌سقف" /></div>
          </div>
          {edit === 'budget' && <div style={{ fontSize: 11, color: C.sub }}>بعد از شروع، سقف کل فقط بالا می‌رود و نسخه تازه نمی‌خواهد.</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn C={C} small disabled={busy} onClick={save}>{edit === 'budget' ? 'ذخیره بودجه' : 'فرستادن شرایط تازه'}</Btn>
            <Btn C={C} small kind="ghost" onClick={() => setEdit(null)}>انصراف</Btn>
          </div>
        </div>
      )}

      {!edit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {needMe && <>
            <Btn C={C} small disabled={busy} onClick={() => run(() => accept(a.id, biz.id, a.terms_version, opKey()), 'نسخه ' + fa(a.terms_version) + ' را پذیرفتی')}>پذیرفتن نسخه {fa(a.terms_version)}</Btn>
            <Btn C={C} small kind="soft" disabled={busy} onClick={() => setEdit('terms')}>تغییر شرایط</Btn>
            <Btn C={C} small kind="danger" disabled={busy} onClick={() => run(() => action(a.id, biz.id, 'decline'), 'پیشنهاد رد شد')}>رد کردن</Btn>
          </>}
          {open && a.my_accepted && <>
            <Btn C={C} small kind="soft" disabled={busy} onClick={() => setEdit('terms')}>تغییر شرایط</Btn>
            <Btn C={C} small kind="ghost" disabled={busy} onClick={() => run(() => action(a.id, biz.id, 'withdraw'), 'پیشنهاد پس گرفته شد')}>پس گرفتن</Btn>
          </>}
          {(a.status === 'active' || a.status === 'scheduled') && <Btn C={C} small kind="ghost" disabled={busy} onClick={() => run(() => action(a.id, biz.id, 'pause', 'توقف دستی'), 'همکاری متوقف شد')}>توقف</Btn>}
          {a.status === 'paused' && <Btn C={C} small disabled={busy} onClick={() => run(() => action(a.id, biz.id, 'resume'), 'همکاری ادامه پیدا کرد')}>ادامه</Btn>}
          {live && <Btn C={C} small kind="soft" disabled={busy} onClick={() => setEdit('budget')}>بودجه</Btn>}
          {live && <Btn C={C} small kind="danger" disabled={busy} onClick={() => { if (window.confirm('همکاری «' + a.title + '» تمام شود؟ کوپن‌های داده‌شده تا تاریخ خودشان معتبر می‌مانند.')) run(() => action(a.id, biz.id, 'end'), 'همکاری تمام شد') }}>پایان</Btn>}
        </div>
      )}
    </div>
  )
}

// ── ساخت همکاری تازه، قدم‌به‌قدم ─────────────────────────────
function Wizard({ C, K, biz, hasDevice, sugg, onDone }) {
  const [kind, setKind] = useState(null)
  const [picked, setPicked] = useState([])
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [reward, setReward] = useState('')
  const [bt, setBt] = useState('')
  const [bd, setBd] = useState('')
  const [days, setDays] = useState('30')
  const [start, setStart] = useState(() => localInput(new Date(Date.now() + 86400000)))
  const [hours, setHours] = useState('3')
  const [req, setReq] = useState('')
  const [couponDays, setCouponDays] = useState('14')
  const [pres, setPres] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const keyRef = useRef(null)
  const inp = inputStyle(C)
  const rule = kind ? PARTNER_RULE[kind] : [0, 0]
  const items = sugg || []
  const partners = picked.map(id => items.find(x => x.business_id === id)).filter(Boolean)
  const places = 1 + partners.length
  const tierOf = (m) => (m == null || m <= 600 ? 'walk' : m <= 3000 ? 'area' : 'city')
  const maxDist = partners.reduce((m, p) => Math.max(m, p.distance_m || 0), 0)
  const tier = tierOf(maxDist)
  const tierWarn = kind === 'trail' && ((tier === 'walk' && places > 4) || (tier === 'area' && places > 3))
  const okPartners = picked.length >= rule[0] && picked.length <= rule[1]
  const rewardNeeded = kind === 'clan_sponsor' || (kind === 'bounceback' && !reward.trim())
  const can = kind && okPartners && title.trim().length >= 3 && !tierWarn && !(kind === 'clan_sponsor' && !reward.trim())

  const toggle = (id) => {
    keyRef.current = null
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : (rule[1] === 1 ? [id] : p.length >= rule[1] ? p : p.concat(id)))
  }
  const chooseKind = (k) => {
    keyRef.current = null
    setKind(k); setPicked(prev => prev.slice(0, PARTNER_RULE[k][1])); setErr(null)
    if (!title) setTitle(k === 'trail' ? 'مسیر ' + (biz.cafes && biz.cafes.name ? biz.cafes.name : '') : k === 'clan_sponsor' ? 'دورهمی کلن با جایزه' : '')
  }
  async function send() {
    setErr(null); setBusy(true)
    if (!keyRef.current) keyRef.current = opKey()
    const spec = { kind, title: title.trim(), blurb: blurb.trim() || null, reward: reward.trim() || null, partners: picked,
      budget_total: bt ? Number(bt) : null, budget_daily: bd ? Number(bd) : null, coupon_days: Number(couponDays) || 14, require_presence: pres }
    if (kind === 'event') {
      const s = new Date(start)
      spec.starts_at = s.toISOString(); spec.ends_at = new Date(s.getTime() + (Number(hours) || 3) * 3600000).toISOString()
    } else { spec.ends_at = isoIn(Number(days) || 30) }
    if (kind === 'trail' && req) spec.required_steps = Number(req)
    const r = await propose(biz.id, spec, keyRef.current)
    setBusy(false)
    if (!r || !r.ok) { setErr(errText(r)); return }
    keyRef.current = null
    onDone(r)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <Label C={C}>۱. نوع همکاری</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {Object.keys(KIND).map(k => (
            <button key={k} className="tl-press" onClick={() => chooseKind(k)}
              style={{ textAlign: 'right', padding: 11, borderRadius: 14, border: '1.5px solid ' + (kind === k ? C.accent : C.border), background: kind === k ? C.chip : C.bg, color: C.text, fontFamily: 'inherit', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{KIND_EMOJI[k]} {KIND[k].label}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4, lineHeight: 1.8 }}>{KIND[k].hint}</div>
            </button>
          ))}
        </div>
      </div>

      {kind && rule[1] > 0 && (
        <div>
          <Label C={C} hint={rule[0] === rule[1] ? fa(rule[1]) + ' همکار' : (rule[0] ? fa(rule[0]) + ' تا ' : 'حداکثر ') + fa(rule[1]) + ' همکار'}>۲. همکار</Label>
          {items.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
              {items.map(x => {
                const on = picked.includes(x.business_id)
                const allowed = (x.kinds || []).includes(kind) || kind === 'event'
                const disabled = x.busy || !allowed
                return (
                  <button key={x.business_id} className="tl-press" disabled={disabled && !on} onClick={() => toggle(x.business_id)}
                    style={{ textAlign: 'right', padding: 10, borderRadius: 14, border: '1.5px solid ' + (on ? C.accent : C.border), background: on ? C.chip : C.bg, color: C.text, fontFamily: 'inherit', cursor: disabled && !on ? 'default' : 'pointer', opacity: disabled && !on ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{on ? '✓ ' : ''}{x.name}</span>
                      <Pill C={C}>{catInfo(x.category).label}</Pill>
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 4, lineHeight: 1.8 }}>
                      {x.shared != null ? fa(x.shared) + ' مشتری مشترک · ' : ''}{distText(x.distance_m)}{x.walk_min && x.walk_min <= 45 ? ' · ' + walkText(x.walk_min) : ''} · رده {(TIER[x.tier] || {}).label}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                      {x.complement >= 0.8 && <Pill C={C}>مکمل</Pill>}
                      {x.competitor && <Pill C={C} warn>رقیب نزدیک</Pill>}
                      {x.busy && <Pill C={C} warn>ظرفیت همکاری پر</Pill>}
                      {!allowed && <Pill C={C} warn>این نوع برای این فاصله نیست</Pill>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : <Empty C={C} icon="🔎" title="هنوز کسب‌وکار تأییدشده دیگری نیست" text="هر کسب‌وکاری که مالکیتش تأیید شود این‌جا با دلیل پیشنهاد می‌آید. تا آن موقع «رویداد مشترک» بدون همکار یا «حامی کلن» را بساز." />}
          {kind === 'trail' && partners.length > 0 && <div style={{ fontSize: 11.5, color: tierWarn ? '#d03b3b' : C.sub, marginTop: 6 }}>
            رده تقریبی: {(TIER[tier] || {}).label} · {(TIER[tier] || {}).hint}{tierWarn ? ' · برای این فاصله توقف زیادی انتخاب شده' : ''}
          </div>}
        </div>
      )}

      {kind && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Label C={C}>{rule[1] > 0 ? '۳' : '۲'}. شرایط</Label>
          <input style={inp} value={title} maxLength={60} onChange={e => { keyRef.current = null; setTitle(e.target.value) }} placeholder="عنوان، مثلاً مسیر نان و قهوه" />
          <textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={blurb} maxLength={200} onChange={e => { keyRef.current = null; setBlurb(e.target.value) }} placeholder="یک جمله برای کاربر، اختیاری" />
          <div><Label C={C} hint={rewardNeeded ? 'لازم' : 'اختیاری؛ هر طرف جایزه خودش را پشت پیشخوان خودش می‌دهد'}>جایزه شما</Label>
            <input style={inp} value={reward} maxLength={80} onChange={e => { keyRef.current = null; setReward(e.target.value) }} placeholder={kind === 'clan_sponsor' ? 'مثلاً کیک رایگان برای دورهمی' : 'مثلاً ده درصد تخفیف'} /></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}><Label C={C}>سقف کل جایزه</Label><input style={inp} inputMode="numeric" value={bt} onChange={e => { keyRef.current = null; setBt(e.target.value.replace(/\D/g, '')) }} placeholder="مثلاً 100" /></div>
            <div style={{ flex: '1 1 120px' }}><Label C={C}>سقف روزانه</Label><input style={inp} inputMode="numeric" value={bd} onChange={e => { keyRef.current = null; setBd(e.target.value.replace(/\D/g, '')) }} placeholder="مثلاً 10" /></div>
            <div style={{ flex: '1 1 120px' }}><Label C={C}>اعتبار کوپن، روز</Label><input style={inp} inputMode="numeric" value={couponDays} onChange={e => { keyRef.current = null; setCouponDays(e.target.value.replace(/\D/g, '')) }} /></div>
          </div>
          {kind === 'event' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 200px' }}><Label C={C}>شروع</Label><input style={inp} type="datetime-local" value={start} onChange={e => { keyRef.current = null; setStart(e.target.value) }} /></div>
              <div style={{ flex: '1 1 100px' }}><Label C={C}>مدت، ساعت</Label><input style={inp} inputMode="numeric" value={hours} onChange={e => { keyRef.current = null; setHours(e.target.value.replace(/\D/g, '')) }} /></div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}><Label C={C} hint="از همین الان، بعد از پذیرش همه">مدت، روز</Label><input style={inp} inputMode="numeric" value={days} onChange={e => { keyRef.current = null; setDays(e.target.value.replace(/\D/g, '')) }} /></div>
              {kind === 'trail' && places >= 3 && <div style={{ flex: '1 1 120px' }}><Label C={C} hint={'از ' + fa(places)}>قدم لازم</Label><input style={inp} inputMode="numeric" value={req} onChange={e => { keyRef.current = null; setReq(e.target.value.replace(/\D/g, '')) }} placeholder={fa(places)} /></div>}
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: hasDevice ? C.text : C.sub }}>
            <input type="checkbox" checked={pres} disabled={!hasDevice} onChange={e => { keyRef.current = null; setPres(e.target.checked) }} />
            کوپن فقط بعد از زدن کد حضور صندوق باز شود{!hasDevice ? ' · اول در زبانه کارکنان یک دستگاه صندوق بساز' : ''}
          </label>

          <div style={{ border: '1px dashed ' + C.border, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 800, marginBottom: 6 }}>پیش‌نمایش آنچه کاربر می‌بیند</div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>{KIND_EMOJI[kind]} {title || 'عنوان همکاری'}</div>
            {blurb && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{blurb}</div>}
            <ol style={{ margin: '8px 0 0', padding: '0 18px 0 0', fontSize: 12.5, lineHeight: 2 }}>
              <li>{(biz.cafes && biz.cafes.name) || 'مکان شما'}{reward ? ' · جایزه: ' + reward : ''}</li>
              {partners.map(p => <li key={p.business_id}>{p.name} · جایزه را خودشان تعیین می‌کنند</li>)}
            </ol>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>
              {kind === 'trail' ? 'پایان مسیر: ۴۰ امتیاز، هر قدم ۱۰، و ۴۰ امتیاز برای کلن کاربر' : kind === 'event' ? 'حضور در بازه: ۲۰ امتیاز' : kind === 'bounceback' ? 'فقط برای مشتری تازه طرف دیگر' : 'برای همه حاضران دورهمی کلن در مکان شما'}
            </div>
          </div>

          {err && <div style={{ fontSize: 12.5, color: '#d03b3b', fontWeight: 800 }}>⚠️ {err}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn C={C} disabled={busy || !can} onClick={send}>{busy ? 'در حال فرستادن…' : rule[1] > 0 && picked.length ? 'فرستادن پیشنهاد' : 'ساختن و شروع'}</Btn>
          </div>
          {picked.length > 0 && <div style={{ fontSize: 11, color: C.sub }}>بعد از فرستادن، هر همکار جایزه خودش را می‌گذارد و نسخه نهایی را می‌پذیرد؛ با پذیرش همه، همکاری شروع می‌شود.</div>}
        </div>
      )}
    </div>
  )
}

export function AlliancesTab({ C, K, biz, legacy = null }) {
  const [data, setData] = useState(null)
  const [sugg, setSugg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const [wizard, setWizard] = useState(false)
  const load = useCallback(async () => {
    const [l, s] = await Promise.all([listBusiness(biz.id), suggest(biz.id)])
    setData(l && l.ok ? l : { ok: false, items: [] })
    setSugg(s && s.ok ? s.items || [] : [])
  }, [biz.id])
  useEffect(() => { setData(null); load() }, [load])
  const run = async (fn, okText) => {
    setBusy(true); setNote(null)
    const r = await fn()
    setBusy(false)
    if (!r || !r.ok) { setNote({ ok: false, text: errText(r) }); load(); return false }
    setNote({ ok: true, text: okText }); load(); return true
  }
  const items = (data && data.items) || []
  const needMe = items.filter(a => (a.status === 'proposed' || a.status === 'countered') && !a.my_accepted)
  const live = items.filter(a => a.status === 'active' || a.status === 'scheduled' || a.status === 'paused')
  const waiting = items.filter(a => (a.status === 'proposed' || a.status === 'countered') && a.my_accepted)
  const past = items.filter(a => ['ended', 'declined', 'withdrawn', 'expired'].includes(a.status))
  const list = (arr) => <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{arr.map(a => <AllianceItem key={a.id + ':' + a.terms_version + ':' + a.status} C={C} K={K} a={a} biz={biz} busy={busy} run={run} />)}</div>

  if (!data) return <Card C={C} K={K}><Empty C={C} icon="⏳" title="در حال بارگذاری همکاری‌ها…" /></Card>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {note && <div style={{ fontSize: 12.5, fontWeight: 800, color: note.ok ? K.good : K.bad, padding: '0 4px' }}>{note.ok ? '✅ ' : '⚠️ '}{note.text}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, color: C.sub }}>همکاری فعال: <b style={{ color: C.text }}>{fa(data.active_count || 0)}</b> از ۵</span>
        <span style={{ fontSize: 12.5, color: C.sub }}>· دستگاه صندوق: <b style={{ color: C.text }}>{data.has_device ? 'دارد' : 'ندارد'}</b></span>
        <span style={{ flex: 1 }} />
        <Btn C={C} small kind={wizard ? 'ghost' : 'primary'} onClick={() => setWizard(v => !v)}>{wizard ? 'بستن فرم' : '+ همکاری تازه'}</Btn>
      </div>
      {wizard && <Card C={C} K={K} title="ساختن همکاری تازه" hint="پیشنهادها بر اساس مشتری مشترک، مکمل بودن نوع مکان و فاصله مرتب شده‌اند. عدد مشتری مشترک زیر ۵ نشان داده نمی‌شود.">
        <Wizard C={C} K={K} biz={biz} hasDevice={!!data.has_device} sugg={sugg} onDone={(r) => { setWizard(false); setNote({ ok: true, text: r.status === 'proposed' ? 'پیشنهاد فرستاده شد' + (r.warning === 'competitor' ? '؛ توجه: یکی از طرف‌ها هم‌نوع و نزدیک شماست' : '') : 'همکاری ساخته شد و ' + (r.status === 'active' ? 'فعال است' : 'زمان‌بندی شد') }); load() }} />
      </Card>}
      {needMe.length > 0 && <Card C={C} K={K} title={'منتظر پاسخ شما · ' + fa(needMe.length)} hint="شرایط را ببین؛ پذیرش فقط همین نسخه را تأیید می‌کند. هر تغییری نسخه تازه می‌سازد.">{list(needMe)}</Card>}
      <Card C={C} K={K} title="همکاری‌های فعال" hint="جایزه هر طرف پشت پیشخوان خودش داده می‌شود؛ کد کوپن را در زبانه کارکنان تأیید کن">
        {live.length ? list(live) : <Empty C={C} icon="🤝" title="همکاری فعالی نداری" text="با «همکاری تازه» یک مسیر مشترک، بازگشت متقابل، رویداد یا حامی کلن بساز." />}
      </Card>
      {waiting.length > 0 && <Card C={C} K={K} title={'فرستاده‌شده، منتظر طرف مقابل · ' + fa(waiting.length)}>{list(waiting)}</Card>}
      {past.length > 0 && <Card C={C} K={K} title={'گذشته · ' + fa(past.length)}><details><summary style={{ fontSize: 12, color: C.sub, cursor: 'pointer' }}>نمایش</summary><div style={{ marginTop: 10 }}>{list(past)}</div></details></Card>}
      {legacy && <Card C={C} K={K} title="پیام‌های همکاری قبلی" hint="پیشنهادهای ساده نسخه قبل، بدون قرارداد"><details><summary style={{ fontSize: 12, color: C.sub, cursor: 'pointer' }}>نمایش</summary><div style={{ marginTop: 10 }}>{legacy}</div></details></Card>}
      <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, padding: '0 4px' }}>🔒 هیچ عددی کمتر از ۵ نفر بین دو کسب‌وکار نشان داده نمی‌شود و زمان بازدید هیچ کاربری به کسب‌وکار نمی‌رسد.</div>
    </div>
  )
}
