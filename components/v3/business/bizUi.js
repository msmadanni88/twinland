'use client'
// اجزای پایه پنل کسب‌وکار نسخه v3.0: رنگ‌ها، کارت، عدد کلیدی و نمودارها.
// نمودارها ساده و بدون کتابخانه‌اند: یک محور، خط نازک، راهنمای زیر موس، و متن همیشه با رنگ متن.
import { useEffect, useRef, useState } from 'react'
import { isDarkC, onColor } from '@/lib/theme/ui'

export const fa = (n) => Number(n || 0).toLocaleString('fa')
export const pctOf = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

// رنگ‌های نمودار: ترتیب دسته‌ها ثابت است و با رتبه عوض نمی‌شود. رنگ وضعیت جداست و همیشه با آیکون می‌آید.
export function bizTokens(C) {
  const dark = isDarkC(C)
  return {
    dark,
    series: dark ? ['#3987e5', '#d95926', '#199e70', '#c98500'] : ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
    seq: dark ? ['#184f95', '#1c5cab', '#2a78d6', '#5598e7', '#9ec5f4'] : ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'],
    good: dark ? '#0ca30c' : '#006300', bad: '#d03b3b', warn: dark ? '#fab219' : '#9a6a00',
    grid: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)',
    axis: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.2)',
    muted: '#898781',
    shadow: dark ? '0 1px 0 rgba(255,255,255,.03) inset, 0 8px 24px -14px rgba(0,0,0,.7)' : '0 1px 2px rgba(0,0,0,.04), 0 10px 26px -18px rgba(0,0,0,.25)',
  }
}

export function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.max(0, Math.floor(el.clientWidth)))
    set()
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', set); return () => window.removeEventListener('resize', set) }
    const ro = new ResizeObserver(set); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

export function Card({ C, K, title, hint, action, children, pad = 16, style }) {
  return (
    <section style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: pad, boxShadow: K.shadow, minWidth: 0, ...(style || {}) }}>
      {(title || action) && (
        <header style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>{title}</h3>}
            {hint && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3, lineHeight: 1.7 }}>{hint}</div>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

// تغییر نسبت به دوره قبل: همیشه با پیکان و نوشته، نه فقط رنگ
export function Delta({ K, now, prev, suffix = 'نسبت به قبل' }) {
  if (prev == null || now == null) return null
  if (!prev && !now) return <span style={{ fontSize: 11, color: K.muted, fontWeight: 700 }}>بدون تغییر</span>
  const up = now >= prev
  const p = prev > 0 ? Math.round(((now - prev) / prev) * 100) : null
  return (
    <span style={{ fontSize: 11, fontWeight: 800, color: now === prev ? K.muted : (up ? K.good : K.bad), whiteSpace: 'nowrap' }}>
      {now === prev ? '● ' : up ? '▲ ' : '▼ '}{p == null ? 'تازه' : fa(Math.abs(p)) + ' درصد'} <span style={{ color: K.muted, fontWeight: 600 }}>{suffix}</span>
    </span>
  )
}

export function Kpi({ C, K, label, value, unit, delta, hint, icon, spark }) {
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: '14px 16px', boxShadow: K.shadow, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.sub, fontWeight: 700 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{unit}</span>}
      </div>
      {delta}
      {hint && <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>{hint}</div>}
      {spark}
    </div>
  )
}

export function Empty({ C, icon = '📭', title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '26px 12px', color: C.sub }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{title}</div>
      {text && <div style={{ fontSize: 12, marginTop: 5, lineHeight: 1.8 }}>{text}</div>}
    </div>
  )
}

export function Legend({ C, items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
      {items.map(it => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.sub, fontWeight: 700 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color, flexShrink: 0 }} />{it.label}{it.value != null && <b style={{ color: C.text }}>{it.value}</b>}
        </span>
      ))}
    </div>
  )
}

function Tip({ C, x, w, lines }) {
  const left = Math.max(4, Math.min(w - 150, x - 75))
  return (
    <div style={{ position: 'absolute', top: 0, left, width: 146, pointerEvents: 'none', background: C.bg, border: '1px solid ' + C.border, borderRadius: 10, padding: '6px 9px', fontSize: 11, color: C.text, boxShadow: '0 8px 20px -10px rgba(0,0,0,.5)', zIndex: 3, lineHeight: 1.7 }}>
      {lines.map((l, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? C.text : C.sub }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{l.color && <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />}{l.label}</span>
        {l.value != null && <b style={{ color: C.text }}>{l.value}</b>}
      </div>)}
    </div>
  )
}

// نمودار خطی: یک یا دو سری روی یک محور. series: [{ name, color, values: [] }]
export function TrendChart({ C, K, labels, series, height = 190 }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const n = labels.length
  const padL = 8, padR = 8, padT = 26, padB = 22
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const top = Math.ceil(max / 4) * 4 || 4
  const iw = Math.max(1, w - padL - padR), ih = height - padT - padB
  const X = (i) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const Y = (v) => padT + ih - (v / top) * ih
  const path = (vals) => vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('')
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    setHover(Math.max(0, Math.min(n - 1, Math.round(((cx - padL) / iw) * (n - 1)))))
  }
  const ticks = [0, top / 2, top]
  const xl = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1]
  return (
    <div ref={ref} style={{ position: 'relative', height, direction: 'ltr' }}>
      {w > 0 && n > 0 && (
        <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={onMove} onTouchMove={onMove} style={{ display: 'block', touchAction: 'pan-y' }}>
          {ticks.map(t => <g key={t}>
            <line x1={padL} x2={w - padR} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? K.axis : K.grid} strokeWidth="1" />
            <text x={w - padR} y={Y(t) - 4} textAnchor="end" fontSize="10" fill={K.muted}>{fa(t)}</text>
          </g>)}
          {series.length === 1 && <path d={path(series[0].values) + 'L' + X(n - 1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z'} fill={series[0].color} opacity="0.1" />}
          {series.map(s => <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
          {xl.map(i => <text key={i} x={X(i)} y={height - 5} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill={K.muted}>{labels[i]}</text>)}
          {hover != null && <g>
            <line x1={X(hover)} x2={X(hover)} y1={padT} y2={padT + ih} stroke={K.axis} strokeWidth="1" />
            {series.map(s => <circle key={s.name} cx={X(hover)} cy={Y(s.values[hover] || 0)} r="4.5" fill={s.color} stroke={C.card} strokeWidth="2" />)}
          </g>}
        </svg>
      )}
      {hover != null && w > 0 && <Tip C={C} x={X(hover)} w={w} lines={[{ label: labels[hover] }].concat(series.map(s => ({ label: s.name, color: s.color, value: fa(s.values[hover] || 0) })))} />}
    </div>
  )
}

// نمودار میله‌ای با راهنمای زیر موس. hi: شماره میله‌ای که پررنگ‌تر است.
export function BarsChart({ C, K, data, color, height = 170, labelEvery = 1, hi = -1, unit = '' }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const n = data.length
  const padT = 26, padB = 22
  const max = Math.max(1, ...data.map(d => d.value))
  const ih = height - padT - padB
  const slot = n ? w / n : 0, bw = Math.max(2, Math.min(34, slot - 2))
  return (
    <div ref={ref} style={{ position: 'relative', height, direction: 'ltr' }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }} onMouseLeave={() => setHover(null)}>
          <line x1="0" x2={w} y1={padT + ih} y2={padT + ih} stroke={K.axis} strokeWidth="1" />
          {data.map((d, i) => {
            const h = d.value > 0 ? Math.max(3, (d.value / max) * ih) : 0
            const x = i * slot + (slot - bw) / 2, y = padT + ih - h
            const r = Math.min(4, bw / 2, h)
            return <g key={i} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              <rect x={i * slot} y={padT} width={slot} height={ih + padB} fill="transparent" />
              {h > 0 && <path d={'M' + x + ' ' + (y + h) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (y + h) + 'Z'}
                fill={color} opacity={hover === i ? 1 : (hi < 0 || hi === i ? 0.92 : 0.45)} />}
              {i % labelEvery === 0 && <text x={i * slot + slot / 2} y={height - 5} textAnchor="middle" fontSize="10" fill={K.muted}>{d.label}</text>}
            </g>
          })}
        </svg>
      )}
      {hover != null && w > 0 && data[hover] && <Tip C={C} x={hover * slot + slot / 2} w={w} lines={[{ label: data[hover].full || data[hover].label }, { label: unit || 'چک‌این', color, value: fa(data[hover].value) }]} />}
    </div>
  )
}

// نوار تکه‌تکه افقی با فاصله 2 پیکسلی و راهنمای همیشه‌پیدا
export function SegBar({ C, parts }) {
  const total = parts.reduce((a, p) => a + (p.value || 0), 0)
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, height: 14, borderRadius: 7, overflow: 'hidden', background: total ? 'transparent' : C.chip }}>
        {parts.filter(p => p.value > 0).map(p => <div key={p.label} title={p.label + ': ' + fa(p.value)} style={{ flex: p.value, background: p.color, minWidth: 3 }} />)}
      </div>
      <Legend C={C} items={parts.map(p => ({ label: p.label, color: p.color, value: fa(p.value) + (total ? ' · ' + fa(pctOf(p.value, total)) + ' درصد' : '') }))} />
    </div>
  )
}

// نوار گرمایی 24 ساعته: یک رنگ، از روشن به تیره
export function HeatStrip({ C, K, title, hours }) {
  const max = Math.max(1, ...hours)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 54, flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: C.text }}>{title}</div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2, direction: 'ltr' }}>
        {hours.map((v, h) => {
          const step = v <= 0 ? -1 : Math.min(4, Math.floor((v / max) * 4.999))
          return <div key={h} title={'ساعت ' + fa(h) + ': ' + fa(v)} style={{ height: 22, borderRadius: 4, background: step < 0 ? C.chip : K.seq[step] }} />
        })}
      </div>
    </div>
  )
}

export function Btn({ C, children, onClick, kind = 'primary', disabled, small, style, title }) {
  const base = { border: '1px solid transparent', borderRadius: 11, padding: small ? '6px 11px' : '9px 15px', fontSize: small ? 12 : 13, fontWeight: 800, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1, whiteSpace: 'nowrap' }
  const kinds = {
    primary: { background: C.accent, color: onColor(C.accent) },
    ghost: { background: 'transparent', color: C.text, border: '1px solid ' + C.border },
    soft: { background: C.chip, color: C.text },
    danger: { background: 'transparent', color: '#d03b3b', border: '1px solid rgba(208,59,59,.4)' },
  }
  return <button className="tl-press" title={title} disabled={disabled} onClick={onClick} style={{ ...base, ...kinds[kind], ...(style || {}) }}>{children}</button>
}
