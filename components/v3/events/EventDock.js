'use client'
// ─────────────────────────────────────────────────────────────
//  نوار رویداد پایین صفحه + سینی ویجت‌ها — نسخه v3.0
//
//  نوار: یک قرص شیشه‌ای عرض‌کامل، وسط‌چین، با عنوان رویداد فعلی.
//  سینی: بالای نوار، نشان‌های همان رویداد (تصویر، جایزه، تخفیف، زمان، XP، آیتم).
//        با عوض شدن رویداد، نشان‌ها به پایین و پشت نوار می‌روند و نشان‌های بعدی با همان
//        جهش بقیه سایت بالا می‌آیند.
//  داده: از useEventFeed می‌آید که رتبه‌بندی را دیتابیس انجام می‌دهد.
//  برگشت به نوار قدیمی: V3_FLAGS.eventWidgets را false کن (components/v3/flags.js)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react'
import { EventArt } from '@/components/events/EventArt'
import { useEventFeed } from '@/components/events/useEventFeed'
import { artTone } from '@/lib/events/art'
import { RARITY_TONE, districtLabel, faNum, timeLeft } from '@/lib/events/format'
import { alpha, mix } from '@/components/v2/theme'
import { trackPlace } from '@/lib/track'
import { track } from '@/lib/analytics'

// همان منحنی جهش بقیه سایت (دکمه‌ها و گره‌های نقشه) با همان زمان
const BOUNCE = 'cubic-bezier(.34,1.56,.64,1)'
const UP_MS = 240
const OUT_MS = 200
const ROTATE_MS = 6000
// اندازه‌ها. فاصله بین نشان‌ها، بین نشان‌ها و نوار، و بین نوار و داک پایین همه برابر DOCK_GAP است، در موبایل و دسکتاپ
export const DOCK_GAP = 8
export const DOCK_BAR_H = 29      // 27 × 1.05
export const DOCK_BADGE_H = 72    // ارتفاع هر نشان. نسبت عرض به ارتفاع حدود 1.1 است و با اندازه صفحه عوض نمی‌شود
const TRAY_TOP = 14               // جای بالا برای جهش و درخشش
// بالا آمدن دکمه‌های کنار نقشه در موبایل: بالای بالاترین نشان به اضافه یک فاصله
export const DOCK_RAIL_LIFT = DOCK_BAR_H + DOCK_GAP + DOCK_BADGE_H + DOCK_GAP - 2
export const DOCK_SLOTS = { mobile: 4, desktop: 5 }
// متن روی نشان اصلی همیشه سفید است و زمینه‌اش کمی تیره می‌شود تا روی هر رنگی خوانا بماند
const hero = (tone) => 'linear-gradient(160deg,' + tone + ',' + mix(tone, '#000000', 0.3) + ')'

function shortText(s, n) {
  const t = String(s || '')
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

// نشان‌هایی که برای یک رویداد ساخته می‌شود، به ترتیب اولویت
function badgesFor(ev, max) {
  const t = timeLeft(ev.endsAt)
  const list = []
  list.push({ k: 'main', art: ev.artKey, label: ev.cafeName, sub: districtLabel(ev.district) || 'کافه', tone: artTone(ev.artKey), hero: true })
  if (ev.rewardLabel) list.push({ k: 'reward', art: ev.discountPct > 0 ? null : 'gift', label: shortText(ev.rewardLabel, 26), sub: 'جایزه', tone: '#e0577a' })
  if (ev.discountPct > 0) list.push({ k: 'disc', art: 'tag', label: faNum(ev.discountPct) + '٪', sub: 'تخفیف', tone: '#18a572' })
  if (t) list.push({ k: 'time', art: 'clock', label: t.text, sub: 'مانده', tone: t.urgent ? '#e5484d' : '#6b7a90' })
  if (ev.rewardXp > 0) list.push({ k: 'xp', art: 'star', label: '+' + faNum(ev.rewardXp), sub: 'XP', tone: '#e8a317' })
  if (ev.collectible) list.push({ k: 'col', art: 'gem', label: shortText(ev.collectible.title || 'آیتم', 22), sub: 'آیتم', tone: RARITY_TONE[ev.collectible.rarity] || '#7c5cff' })
  if (ev.target > 1) list.push({ k: 'prog', art: 'pin', label: faNum(ev.target) + ' چک‌این', sub: 'مرحله', tone: '#3aa0e0' })
  // اگر جایزه تخفیف است، نشان تخفیف جای نشان جایزه را می‌گیرد و جایزه بعد از آن می‌آید
  return list.filter(b => b.art !== null).slice(0, max)
}

export function EventDock({ C, T, Lay, cafes, getPos, isMobile, onActiveCafeChange, rightInset, setSelCafe }) {
  const { events: all } = useEventFeed({ slot: 'bar', limit: 12, getPos })
  const events = useMemo(() => {
    const open = all.filter(e => !e.done)
    return open.length ? open : all
  }, [all])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('in')
  const timerRef = useRef(null)
  const holdRef = useRef(false)
  const touchXRef = useRef(null)
  const loggedRef = useRef(new Set())
  const wrapRef = useRef(null)
  const textRef = useRef(null)
  const [marquee, setMarquee] = useState({ on: false, shift: 0, dur: 8 })

  const safeIdx = events.length ? idx % events.length : 0
  const ev = events.length ? events[safeIdx] : null

  function goTo(next) {
    if (events.length < 2 || phase === 'out') return
    setPhase('out')
    setTimeout(() => { setIdx(((next % events.length) + events.length) % events.length); setPhase('in') }, OUT_MS + 90)
  }
  const step = (d) => goTo(safeIdx + d)

  // چرخش خودکار؛ با نگه داشتن انگشت یا ماوس روی سینی می‌ایستد.
  // تابع و شاخص تازه از طریق ref خوانده می‌شود تا رندرهای پی‌درپی صفحه، زمان‌سنج را از نو نکنند.
  const liveRef = useRef({})
  liveRef.current = { goTo, safeIdx }
  useEffect(() => {
    if (events.length < 2) return
    clearInterval(timerRef.current)
    const delay = marquee.on ? Math.max(ROTATE_MS, (marquee.dur * 2 + 3) * 1000) : ROTATE_MS
    timerRef.current = setInterval(() => {
      if (!holdRef.current && !document.hidden) liveRef.current.goTo(liveRef.current.safeIdx + 1)
    }, delay)
    return () => clearInterval(timerRef.current)
  }, [events.length, marquee.on, marquee.dur])

  // کافه فعال روی نقشه هایلایت شود
  useEffect(() => {
    // رنگ رویداد هم همراه شناسه می‌رود تا نشانگر روی نقشه با نشان رویداد هم‌رنگ باشد
    onActiveCafeChange && onActiveCafeChange(ev ? ev.cafeId : null, ev ? artTone(ev.artKey) : null)
    return () => { onActiveCafeChange && onActiveCafeChange(null) }
  }, [ev && ev.id])

  // دیده شدن رویداد برای آمار کسب‌وکار: هر رویداد در هر نشست یک بار
  useEffect(() => {
    if (!ev || document.hidden || loggedRef.current.has(ev.id)) return
    loggedRef.current.add(ev.id)
    trackPlace(ev.cafeId, 'impression', { source: 'banner', refType: 'quest', refId: ev.id })
  }, [ev && ev.id])

  // زیرنویس روان وقتی متن از نوار بلندتر است
  useEffect(() => {
    const wrap = wrapRef.current, txt = textRef.current
    if (!wrap || !txt) { setMarquee({ on: false, shift: 0, dur: 8 }); return }
    const t = setTimeout(() => {
      const overflow = txt.scrollWidth - wrap.clientWidth
      setMarquee(overflow > 6 ? { on: true, shift: overflow, dur: Math.max(3, overflow / 28) } : { on: false, shift: 0, dur: 8 })
    }, 350)
    return () => clearTimeout(t)
  }, [ev && ev.id, isMobile])

  if (!ev) return null

  const openCafe = () => {
    track('event_dock_tap', { event_id: String(ev.id), cafe_id: ev.cafeId })
    const cafe = cafes.find(c => c.id === ev.cafeId)
    if (cafe) setSelCafe({ ...cafe, _from: { source: 'banner', refType: 'quest', refId: String(ev.id) } })
    else if (typeof window !== 'undefined') window.location.href = '/quests'
  }
  const onTouchStart = (e) => { holdRef.current = true; touchXRef.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    holdRef.current = false
    if (touchXRef.current == null) return
    const dx = e.changedTouches[0].clientX - touchXRef.current
    if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1)
    touchXRef.current = null
  }

  const slots = isMobile ? DOCK_SLOTS.mobile : DOCK_SLOTS.desktop
  const badges = badgesFor(ev, slots)
  const dots = events.length > 1 ? events.map((e, i) => i) : []
  const dotWin = dots.length > 7 ? dots.filter(i => Math.abs(i - safeIdx) <= 3) : dots
  // نوار درست بالای داک پایین، با همان فاصله DOCK_GAP. کادر بیرونی همان کادر داک است، پس هر دو وسط‌چین و هم‌عرض می‌مانند.
  const bottom = 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.dockBottom + Lay.dockH + DOCK_GAP) + 'px)'
  const outerStyle = { position: 'absolute', left: Lay.gap, right: rightInset, bottom, zIndex: 40, pointerEvents: 'none', display: 'flex', justifyContent: 'center', transition: 'right .35s ease' }
  const innerStyle = { width: Lay.dockW || '100%', maxWidth: '100%' }
  // عرض هر نشان: اندازه ثابت از روی تعداد جایگاه‌ها. جایگاه‌ها کل عرض نوار و داک را پر می‌کنند، پس لبه‌ها با نوار هم‌خط است. با کمتر بودن نشان‌ها کشیده نمی‌شود.
  const slotW = 'calc((100% - ' + (DOCK_GAP * (slots - 1)) + 'px) / ' + slots + ')'

  return (
    <div data-tut="event-banner" style={outerStyle}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tl4Up{from{transform:translateY(${DOCK_BADGE_H + DOCK_GAP + 12}px) scale(.92);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes tl4Down{from{transform:translateY(0) scale(1);opacity:1}to{transform:translateY(${DOCK_BADGE_H + DOCK_GAP + 12}px) scale(.94);opacity:0}}
        .tl4-b{animation:tl4Up ${UP_MS}ms ${BOUNCE} both}
        .tl4-out .tl4-b{animation:tl4Down ${OUT_MS}ms ease-in both}
        .tl4-b{transition:transform .14s ${BOUNCE}}
        .tl4-b:active{transform:scale(.95)}
        .tl4-l{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
      ` }} />
      <div style={innerStyle}>
        {/* سینی نشان‌ها: از لبه بالای نوار بالا می‌آید. برش فقط لبه پایین است تا درخشش کناره‌ها بریده نشود */}
        <div className={phase === 'out' ? 'tl4-out' : ''} key={ev.id + ':' + phase}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') holdRef.current = true }} onPointerLeave={(e) => { if (e.pointerType === 'mouse') holdRef.current = false }}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ position: 'relative', height: TRAY_TOP + DOCK_BADGE_H + DOCK_GAP, paddingTop: TRAY_TOP, boxSizing: 'border-box', clipPath: 'inset(-40px -40px 0px -40px)', display: 'flex', gap: DOCK_GAP, alignItems: 'flex-start', pointerEvents: 'auto',
            justifyContent: 'center' }}>
          {badges.map((b, i) => {
            const solid = b.hero
            const long = String(b.label).length > 9
            return (
              <button key={b.k} className="tl4-b" onClick={openCafe} aria-label={b.sub + ': ' + b.label}
                style={{ animationDelay: (phase === 'out' ? i * 25 : i * 55) + 'ms', flex: '0 0 ' + slotW, width: slotW, minWidth: 0, height: DOCK_BADGE_H, boxSizing: 'border-box', padding: '5px 3px 4px',
                  borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontFamily: 'inherit', cursor: 'pointer', position: 'relative',
                  background: solid ? hero(b.tone) : T.glassStrong,
                  backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
                  border: '1px solid ' + (solid ? alpha(b.tone, 0.9) : T.hair), boxShadow: solid ? T.glow(b.tone, 0.5) : T.shadow1,
                  color: solid ? '#ffffff' : C.text, textShadow: solid ? '0 1px 2px rgba(0,0,0,.35)' : 'none' }}>
                <EventArt artKey={b.art} size={long ? 24 : 30} plate={!solid} tone={solid ? undefined : b.tone}
                  style={solid ? { background: 'rgba(255,255,255,.92)', border: 'none', borderRadius: 12 } : undefined} />
                <div className="tl4-l" style={{ fontSize: long ? 10 : 11, fontWeight: 900, lineHeight: 1.2, maxWidth: '100%', textAlign: 'center', padding: '0 2px', wordBreak: 'break-word' }}>{b.label}</div>
                <div style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, opacity: solid ? 0.9 : 0.7, color: solid ? 'inherit' : C.sub }}>{b.sub}</div>
                {solid && ev.promo && <span style={{ position: 'absolute', top: -6, left: 6, fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: 'rgba(255,255,255,.94)', color: '#2a2118', textShadow: 'none' }}>ویژه</span>}
              </button>
            )
          })}
        </div>

        {/* نوار رویداد */}
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={openCafe}
          style={{ position: 'relative', zIndex: 2, height: DOCK_BAR_H, boxSizing: 'border-box', borderRadius: 99, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto', cursor: 'pointer',
            background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, boxShadow: T.shadow1,
            fontSize: 11.5, color: C.sub }}>
          <button aria-label="رویداد بعدی" onClick={(e) => { e.stopPropagation(); step(1) }} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 14, padding: '0 3px', flexShrink: 0, fontFamily: 'inherit', lineHeight: 1 }}>‹</button>
          <span key={ev.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0, animation: 'evSlide .3s ease', paddingBottom: dotWin.length ? 2 : 0 }}>
            <EventArt artKey={ev.artKey} size={19} plate={false} />
            <span ref={wrapRef} style={{ whiteSpace: 'nowrap', overflow: 'hidden', minWidth: 0, lineHeight: 1.1 }}>
              <span ref={textRef} className={marquee.on ? 'tl-shuttle' : ''} style={{ display: 'inline-block', fontWeight: 800, color: C.text, lineHeight: 1.1, '--shift': marquee.shift + 'px', '--dur': marquee.dur + 's' }}>{ev.cafeName}: {ev.title}</span>
            </span>
          </span>
          <button aria-label="رویداد قبلی" onClick={(e) => { e.stopPropagation(); step(-1) }} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 14, padding: '0 3px', flexShrink: 0, fontFamily: 'inherit', lineHeight: 1 }}>›</button>
          {dotWin.length > 0 && (
            <div style={{ position: 'absolute', left: '50%', bottom: 3, transform: 'translateX(-50%)', display: 'flex', gap: 3, pointerEvents: 'none' }}>
              {dotWin.map(i => (
                <span key={i} style={{ width: i === safeIdx ? 11 : 3, height: 3, borderRadius: 99, background: i === safeIdx ? C.accent : alpha(C.text, 0.22), transition: 'width .3s ' + BOUNCE }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
