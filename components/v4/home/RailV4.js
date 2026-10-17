'use client'
// ستون ابزار نقشه — نسخه v4.0
// دسکتاپ: یک ستون شیشه‌ای عمودی در لبه چپ، زیر نوار بالا، که با یک ضربه باز می‌شود و نام هر ابزار را نشان می‌دهد.
//   ردیف روشن یا زیر ماوس یک قرص توپر است که به لبه داخلی ستون می‌چسبد، با گوشه‌های وارونه.
//   همه دکمه‌های سمت چپ صفحه اینجا جمع‌اند: کشف نقشه، پوسته، نوشته‌ها، مرزها، دنبال کردن رویداد، حالت روشن و تیره، بزرگ‌نمایی و مرکز شهر.
// موبایل: همان ابزارها به شکل یک ستون باریک فقط آیکونی در پایین چپ.
import { useEffect, useState } from 'react'
import { CITIES } from '@/lib/constants'
import { alpha } from '@/components/v2/theme'
import { Icon } from '@/components/v4/icons'
import { ExploreLine, ExploreRing } from '@/components/v3/map/ExploreProgress'
import { skinInfoV4 } from '@/components/v4/map/skinsV4'
import { V4_FLAGS } from '@/components/v4/flags'

const OPEN_KEY = 'tl_rail_open'

export function useRailOpen() {
  const [open, setOpen] = useState(!!V4_FLAGS.railStartsOpen)
  useEffect(() => { try { const v = localStorage.getItem(OPEN_KEY); if (v === '1' || v === '0') setOpen(v === '1') } catch (e) {} }, [])
  const toggle = () => setOpen(v => { const n = !v; try { localStorage.setItem(OPEN_KEY, n ? '1' : '0') } catch (e) {} return n })
  return [open, toggle]
}

function tools(p) {
  const { C, labels, boundaryMode, follow, onToggleFollow, themeMode, skinId, city } = p
  const list = [
    { key: 'skin', icon: 'layers', label: 'پوسته نقشه', sub: skinInfoV4(skinId).label, onClick: () => p.setShowSkin(true) },
    { key: 'labels', icon: labels ? 'type' : 'typeOff', label: 'نوشته‌های نقشه', sub: labels ? 'دیده می‌شوند' : 'پنهان', on: labels, onClick: p.toggleLabels, tut: 'map-labels' },
    { key: 'boundary', icon: 'polygon', label: 'مرزها', sub: boundaryMode === 'off' ? 'خاموش' : boundaryMode === 'district' ? 'مناطق تهران' : 'استان‌ها', on: boundaryMode !== 'off', onClick: () => p.setShowBoundary(true), tut: 'boundary-btn' },
  ]
  if (onToggleFollow) list.push({ key: 'follow', icon: follow ? 'crosshair' : 'crosshairOff', label: 'دنبال کردن رویداد', sub: follow ? 'روشن' : 'خاموش', on: follow, onClick: onToggleFollow, tut: 'map-follow' })
  list.push({ key: 'theme', icon: themeMode === 'dark' ? 'moon' : 'sun', label: themeMode === 'dark' ? 'حالت تیره' : 'حالت روشن', sub: 'ضربه برای عوض کردن', onClick: p.toggleMode })
  if (p.isMobile) list.push({ key: 'city', icon: 'pin', label: CITIES[city].name, sub: 'شهر', onClick: () => p.setShowCity(true) })
  return list
}

export function RailV4(p) {
  const { C, T, Lay, isMobile, hidden, liftBy = 0, open, onToggleOpen, mapInst, city, hex, showExplore, onExplore } = p
  if (hidden) return null
  const recenter = () => { const c = CITIES[city]; mapInst.current && mapInst.current.flyTo([c.lat, c.lng], c.zoom) }
  const list = tools(p)

  if (isMobile) {
    const sq = {
      width: 40, height: 40, borderRadius: 12, border: 'none', padding: 0, background: 'transparent', color: C.text, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
    return (
      <div className="tl4-glass" style={{ position: 'absolute', left: Lay.gap, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock + liftBy) + 'px)', zIndex: 60,
        display: 'flex', flexDirection: 'column', gap: 2, padding: 4, borderRadius: 16, boxShadow: T.shadow1, background: T.glassStrong,
        transition: 'bottom .3s cubic-bezier(.34,1.56,.64,1)', animation: 'tl2Slide .45s .1s both cubic-bezier(.2,.9,.3,1)' }}>
        {list.map(it => (
          <button key={it.key} data-tut={it.tut} className={'tl4-btn' + (it.on ? ' is-on' : '')} aria-label={it.label} aria-pressed={it.on == null ? undefined : !!it.on} title={it.label} onClick={it.onClick} style={sq}>
            <Icon name={it.icon} size={19} />
          </button>
        ))}
        <span style={{ height: 1, margin: '2px 6px', background: T.hair }} />
        <button className="tl4-btn" aria-label="مرکز شهر" title="مرکز شهر" onClick={recenter} style={sq}><Icon name="focus" size={19} /></button>
      </div>
    )
  }

  // ── دسکتاپ ──
  const W = open ? Lay.railWOpen : Lay.railW
  // پنجره کوتاه: ردیف‌ها کوتاه‌تر تا ستون به داک نرسد
  const rowH = typeof window !== 'undefined' && window.innerHeight < 780 ? 38 : 44
  const row = (it) => (
    <button key={it.key} data-tut={it.tut} className={'tl4-row r' + (it.on ? ' is-on' : '')} onClick={it.onClick}
      aria-label={it.label} aria-pressed={it.on == null ? undefined : !!it.on}
      style={{ display: 'flex', alignItems: 'center', gap: 12, height: rowH, width: '100%', boxSizing: 'border-box', border: 'none', cursor: 'pointer',
        padding: '0 0 0 9px', color: C.text, fontFamily: 'inherit', textAlign: 'left', direction: 'ltr' }}>
      <span style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {it.custom || <Icon name={it.icon} size={20} />}
      </span>
      <span className="tl4-rail-label" style={{ direction: 'rtl', textAlign: 'right', flex: 1, minWidth: 0, maxWidth: open ? 160 : 0, opacity: open ? 1 : 0, paddingRight: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
        {it.sub && <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.72, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</span>}
      </span>
      {!open && <span className="tl4-tipbox" style={{ direction: 'rtl' }}>{it.label}{it.sub ? ' · ' + it.sub : ''}</span>}
    </button>
  )
  const explore = showExplore ? {
    key: 'explore', label: 'کشف نقشه', onClick: onExplore,
    sub: open ? <ExploreLine p={hex && hex.progress} /> : null,
    custom: (
      <ExploreRing size={28} ring={hex && hex.progress ? hex.progress.ring : 0} color={(hex && hex.ink) || C.text} track={alpha(C.text, 0.14)}>
        <Icon name="compass" size={15} />
      </ExploreRing>
    ),
  } : null
  return (
    <nav aria-label="ابزار نقشه" style={{ position: 'absolute', left: Lay.gap, top: 'calc(env(safe-area-inset-top, 0px) + ' + Lay.chipsTop + 'px)', zIndex: 260, width: W,
      transition: 'width .28s cubic-bezier(.2,.9,.3,1)', display: 'flex', flexDirection: 'column', padding: '14px 0 14px 6px', boxSizing: 'border-box',
      background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderRadius: T.radius.xl,
      boxShadow: T.shadow2 + ',' + T.highlight, animation: 'tl2Slide .45s .08s both cubic-bezier(.2,.9,.3,1)' }}>
      {row({ key: 'open', icon: open ? 'chevronLeft' : 'sidebar', label: open ? 'بستن ستون' : 'باز کردن ستون', sub: open ? 'ابزار نقشه' : null, onClick: onToggleOpen })}
      <span style={{ height: 1, margin: '6px 12px 8px 6px', background: T.hair }} />
      {explore && row(explore)}
      {list.map(row)}
      <span style={{ height: 1, margin: '8px 12px 8px 6px', background: T.hair }} />
      {row({ key: 'zin', icon: 'plus', label: 'بزرگ‌نمایی', onClick: () => mapInst.current && mapInst.current.zoomIn() })}
      {row({ key: 'zout', icon: 'minus', label: 'کوچک‌نمایی', onClick: () => mapInst.current && mapInst.current.zoomOut() })}
      {row({ key: 'center', icon: 'focus', label: 'مرکز شهر', sub: CITIES[city].name, onClick: recenter })}
    </nav>
  )
}
