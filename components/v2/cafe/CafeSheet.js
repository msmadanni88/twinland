'use client'
// پنجره کافه — نسخه v2.0
// کاور بزرگ، هویت کافه، چهار صفحه، و دکمه چک‌این همیشه پایین و در دسترس.
// فقط داده واقعی نشان داده می‌شود؛ ساعت کاری و امتیاز ستاره‌ای ساختگی نسخه قبل حذف شد.
import { CafeRating } from '@/components/v3/cafe/CafeRating'
import { trackPlace, withUtm } from '@/lib/track'
import { useEffect, useState } from 'react'
import { onColor } from '@/lib/theme/ui'
import { L, ICON } from '@/lib/theme/labels'
import { XP_CONFIG, getColor } from '@/lib/constants'
import { claimCafe, ownerClaimDirect } from '@/components/cafe/cafeClaims'
import { CafeGallery } from '@/components/cafe/CafeGallery'
import { CafeMenu } from '@/components/cafe/CafeMenu'
import { CafeMyRewards } from '@/components/cafe/CafeMyRewards'
import { alpha, mix } from '@/components/v2/theme'
import { useCafeSheetData } from '@/components/v2/cafe/useCafeSheetData'

const PAGES = [['about', 'درباره'], ['gallery', 'گالری'], ['menu', 'منو'], ['rewards', 'جایزه‌های من']]

// canClaim: دکمه «صاحب این کافه هستید؟» فقط برای حساب کافه‌دار؛ مالک اپ همیشه دکمه مدیریت مستقیم را دارد
// noPlay: حساب کسب‌وکار بازی نمی‌کند، پس دکمه چک‌این ندارد
export function CafeSheet({ noPlay = false, canClaim = false, C, T, cafe, live, favs, setFavs, checkedIn, isAdmin, onClose, onCheckin, showToast }) {
  const [wide, setWide] = useState(false)
  const [page, setPage] = useState('about')
  useEffect(() => { setPage('about') }, [cafe.id])
  useEffect(() => {
    const check = () => setWide(window.innerWidth >= 760)
    check(); window.addEventListener('resize', check)
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('resize', check); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const d = useCafeSheetData({ cafe, favs, setFavs, showToast })
  const color = getColor(cafe.name)
  const isChecked = checkedIn.has(cafe.id)
  const isFav = favs.has(cafe.id)
  const xpAmount = cafe.is_top ? XP_CONFIG.checkin_top : XP_CONFIG.checkin
  const liveNow = live[cafe.id] || 0
  const heroH = wide ? 168 : 150
  const where = cafe.description || cafe.address || cafe.district
  // از کجا به این برگه رسیده‌ایم — نقشه، جست‌وجو، یا یک کمپین. همراه هر رویداد ثبت می‌شود تا بعداً اثر هر کمپین جدا دیده شود
  const from = cafe._from || {}
  const track = (type, channel) => trackPlace(cafe.id, type, { channel, source: from.source || 'map', refType: from.refType, refId: from.refId })
  useEffect(() => { track('view') }, [cafe.id])
  // اطلاعات تماس و ساعت کار — فقط وقتی برای این مکان ثبت شده باشد
  const web = cafe.website ? (/^https?:\/\//i.test(cafe.website) ? cafe.website : 'https://' + cafe.website) : null
  const ig = cafe.instagram ? String(cafe.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '') : null
  const info = [
    cafe.address && cafe.address !== where ? ['📍', cafe.address, null] : null,
    cafe.opening_hours ? ['🕒', cafe.opening_hours, null] : null,
    cafe.phone ? ['📞', cafe.phone, 'tel:' + String(cafe.phone).split(/[;,]/)[0].replace(/[^0-9+]/g, ''), 'phone'] : null,
    web ? ['🌐', cafe.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''), withUtm(web, 'place_sheet', from.refId), 'website'] : null,
    ig ? ['📷', '@' + ig, 'https://instagram.com/' + ig, 'instagram'] : null,
  ].filter(Boolean)

  const sheet = wide
    ? { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw,460px)', maxHeight: '88dvh', borderRadius: T.radius.xl + 4, animation: 'tl2Pop .3s cubic-bezier(.2,.9,.3,1)' }
    : { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90dvh', borderRadius: (T.radius.xl + 4) + 'px ' + (T.radius.xl + 4) + 'px 0 0', animation: 'tl2Sheet .34s cubic-bezier(.2,.9,.3,1)' }

  const tile = { flex: 1, minWidth: 0, background: T.chip, border: '1px solid ' + T.hair, borderRadius: 16, padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 10 }
  const actions = [
    { icon: ICON.hearts, label: L.hearts, active: isFav, fn: d.toggleFav },
    { icon: '📤', label: 'اشتراک', fn: () => { track('share'); d.share() } },
    { icon: '🗺', label: 'مسیر', fn: () => { track('click', 'directions'); window.open('https://www.google.com/maps?q=' + cafe.lat + ',' + cafe.lng, '_blank', 'noopener') } },
    { icon: '💬', label: 'نظر', fn: () => showToast('💬 به زودی!') },
  ]

  return (
    <div role="dialog" aria-modal="true" aria-label={cafe.name} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'tl2Fade .25s' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ ...sheet, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.card, border: '1px solid ' + T.hair, boxShadow: T.shadow2 }}>

        <div className="tl-vscroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* کاور */}
          <div style={{ position: 'relative', height: heroH, flexShrink: 0, overflow: 'hidden',
            background: 'radial-gradient(120% 140% at 85% -10%,' + mix(color, C.card, 0.05) + ',' + mix(color, C.bg, 0.45) + ' 55%,' + mix(color, C.bg, 0.8) + ')' }}>
            {d.cover
              ? <img src={d.cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div aria-hidden style={{ position: 'absolute', left: -10, top: -18, fontSize: 150, opacity: 0.16, transform: 'rotate(-14deg)', lineHeight: 1 }}>☕</div>}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,' + C.card + ' 0,' + alpha(C.card, 0.55) + ' 38%,' + alpha(C.card, 0) + ' 75%)' }} />
            {!wide && <div style={{ position: 'absolute', top: 8, left: '50%', marginLeft: -21, width: 42, height: 5, borderRadius: 99, background: alpha(C.text, 0.35) }} />}
            <button className="tl2-press" aria-label="بستن" onClick={onClose}
              style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: '50%', border: '1px solid ' + T.hair, background: T.glassStrong,
                backdropFilter: T.blur, WebkitBackdropFilter: T.blur, color: C.text, fontSize: 14, fontWeight: 900, zIndex: 2 }}>✕</button>
            {liveNow > 0 && (
              <div style={{ position: 'absolute', top: 12, right: 12, height: 30, padding: '0 11px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6,
                background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, fontSize: 12, fontWeight: 800, color: C.text }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 3px ' + alpha(C.green, 0.25) }} />
                {liveNow.toLocaleString('fa')} نفر الان اینجا
              </div>
            )}
          </div>

          {/* هویت کافه */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 18px', marginTop: -44, position: 'relative' }}>
            <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              background: 'radial-gradient(circle at 30% 25%,' + mix(isChecked ? C.green : color, '#FFFFFF', 0.25) + ',' + (isChecked ? C.green : color) + ')',
              border: '3px solid ' + C.card, boxShadow: T.glow(isChecked ? C.green : color, 0.6), color: onColor(isChecked ? C.green : color) }}>
              {isChecked ? '✓' : '☕'}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <div style={{ fontSize: 21, fontWeight: 900, color: C.text, lineHeight: 1.35 }}>{cafe.name}</div>
              {where && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {where}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 18px 0' }}>
            {cafe.is_top && <span style={{ height: 26, padding: '0 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 900, background: C.gold, color: onColor(C.gold) }}>★ کافه برتر</span>}
            {isChecked && <span style={{ height: 26, padding: '0 10px', borderRadius: 99, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 900, background: alpha(C.green, 0.16), color: C.green }}>✓ امروز اینجا بودی</span>}
            {(cafe.tags || []).map(t => <span key={t} style={{ height: 26, padding: '0 10px', borderRadius: 99, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700, background: T.chip, color: C.text, border: '1px solid ' + T.hair }}>{t}</span>)}
          </div>

          {info.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 18px 0' }}>
            {info.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: C.text, lineHeight: 1.7 }}>
              <span style={{ flexShrink: 0 }}>{r[0]}</span>
              {r[2]
                ? <a href={r[2]} onClick={() => track('click', r[3])} target={r[2].startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer" dir="ltr" style={{ color: C.accent, fontWeight: 700, textDecoration: 'none', overflowWrap: 'anywhere' }}>{r[1]}</a>
                : <span style={{ color: C.sub, overflowWrap: 'anywhere', unicodeBidi: 'plaintext' }}>{r[1]}</span>}
            </div>)}
          </div>}

          <CafeRating C={C} T={T} cafe={cafe} isChecked={isChecked} noPlay={noPlay} showToast={showToast} onOut={(ch) => track('click', ch)} />

          {/* صفحه‌ها */}
          <div style={{ padding: '14px 18px 0' }}>
            <div className="tl2-noscroll" style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 16, background: T.chip, overflowX: 'auto' }}>
              {PAGES.map(([k, label]) => {
                const on = page === k
                return <button key={k} className="tl2-press" onClick={() => setPage(k)}
                  style={{ flex: 1, flexShrink: 0, height: 36, padding: '0 10px', border: 'none', borderRadius: 13, fontSize: 12.5, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap',
                    background: on ? C.card : 'transparent', color: on ? C.text : C.sub, boxShadow: on ? T.shadow1 : 'none' }}>{label}</button>
              })}
            </div>
          </div>

          <div style={{ padding: '16px 18px 18px' }}>
            {page === 'gallery' && <CafeGallery C={C} cafeId={cafe.id} canManageHint={isAdmin} />}
            {page === 'menu' && <CafeMenu C={C} cafeId={cafe.id} canManageHint={isAdmin} />}
            {page === 'rewards' && <CafeMyRewards C={C} cafeId={cafe.id} uid={d.uid} token={d.token} showToast={showToast} />}
            {page === 'about' && <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={tile}>
                  <span style={{ fontSize: 22 }}>{ICON.checkin}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 900, color: isChecked ? C.green : C.text }}>{isChecked ? 'رفتی!' : '+' + xpAmount + ' ' + L.xp}</span>
                    <span style={{ display: 'block', fontSize: 11, color: C.sub }}>پاداش {L.checkin}</span>
                  </span>
                </div>
                <div style={tile}>
                  <span style={{ fontSize: 22 }}>👥</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 900, color: C.text }}>{liveNow.toLocaleString('fa')} نفر</span>
                    <span style={{ display: 'block', fontSize: 11, color: C.sub }}>در ۲ ساعت اخیر</span>
                  </span>
                </div>
              </div>

              {!d.evLoading && d.cafeEvents.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: C.sub, marginBottom: 8 }}>{ICON.events} {L.events}ی فعال این کافه</div>
                  {d.cafeEvents.map(ev => {
                    const cd = ev.collectible_defs
                    const prog = d.evProgress[ev.id]
                    const done = !!(prog && prog.completed)
                    const enrolled = !!prog && !done
                    const busy = d.joiningId === ev.id
                    return (
                      <div key={ev.id} style={{ borderRadius: 18, padding: 12, marginBottom: 8, background: T.accentSoft, border: '1px solid ' + alpha(C.accent, 0.3) }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <span style={{ width: 42, height: 42, borderRadius: 14, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: T.shadow1 }}>{(cd && cd.icon) || ev.icon || ICON.events}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{ev.title}{cd ? ' — ' + cd.title : ''}</div>
                            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>🎁 {ev.reward_label}{ev.reward_xp > 0 ? ' · +' + ev.reward_xp + ' ' + L.xp : ''}{ev.discount_pct > 0 ? ' · 🏷️' + ev.discount_pct + '٪' : ''}</div>
                          </div>
                        </div>
                        <button className="tl2-press" onClick={() => d.joinEvent(ev)} disabled={done || enrolled || busy}
                          style={{ width: '100%', marginTop: 10, height: 38, border: 'none', borderRadius: 12, fontSize: 12.5, fontWeight: 900, opacity: busy ? 0.6 : 1,
                            background: done ? C.green : enrolled ? C.chip : C.accent, color: done ? onColor(C.green) : enrolled ? C.text : T.onAccent }}>
                          {done ? '✅ جایزه‌ت رو گرفتی'
                            : enrolled ? ('📍 ثبت‌نام شدی — ' + L.checkin + ' ' + (prog.progress || 0).toLocaleString('fa') + ' از ' + (ev.target_count || 1).toLocaleString('fa'))
                              : busy ? '…' : '🎯 شرکت در رویداد'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {actions.map(a => (
                  <button key={a.label} className="tl2-press" onClick={a.fn}
                    style={{ height: 66, borderRadius: 16, border: '1px solid ' + (a.active ? alpha(C.danger, 0.5) : T.hair), background: a.active ? alpha(C.danger, 0.12) : T.chip,
                      color: a.active ? C.danger : C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: a.active ? 900 : 700 }}>
                    <span style={{ fontSize: 21, lineHeight: 1 }}>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </>}
          </div>
        </div>

        {/* دکمه‌های ثابت پایین */}
        <div style={{ flexShrink: 0, padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)', borderTop: '1px solid ' + T.hair, background: C.card }}>
          {noPlay ? <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: C.sub, lineHeight: 1.9, padding: '6px 4px' }}>🏪 با حساب کسب‌وکار وارد شده‌ای. چک‌این و امتیاز فقط برای حساب کاربری است.</div> : <button className="tl2-press" onClick={onCheckin} disabled={isChecked}
            style={{ width: '100%', height: 54, border: 'none', borderRadius: 18, fontSize: 16, fontWeight: 900,
              background: isChecked ? alpha(C.green, 0.18) : T.grad, color: isChecked ? C.green : T.onAccent,
              boxShadow: isChecked ? 'none' : T.glow(C.accent, 0.6), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isChecked ? '✅ امروز ' + L.checkin + ' کردی' : <>{ICON.checkin} {L.checkin} <span style={{ fontSize: 12.5, fontWeight: 900, padding: '3px 9px', borderRadius: 99, background: alpha(T.onAccent, 0.16) }}>+{xpAmount} {L.xp}</span></>}
          </button>}
          {(isAdmin || canClaim) && <button onClick={() => isAdmin ? ownerClaimDirect(cafe, showToast) : claimCafe(cafe, showToast)}
            style={{ width: '100%', marginTop: 8, height: 34, border: 'none', background: 'transparent', color: C.sub, fontSize: 12, fontWeight: 700 }}>
            {isAdmin ? ICON.business + ' مدیریت مستقیم این کافه، صاحب اپ' : ICON.business + ' صاحب این کافه هستید؟'}
          </button>}
        </div>
      </div>
    </div>
  )
}
