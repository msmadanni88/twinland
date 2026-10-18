'use client'
// ─────────────────────────────────────────────────────────────
//  کیت ظاهر نسخه v4.0 — قطعه‌های مشترک همه صفحه‌ها، پنل‌ها و پنجره‌ها
//
//  هر صفحه و پنجره تازه فقط از همین قطعه‌ها ساخته شود تا شکل، اندازه نوشته، رنگ و گوشه‌ها
//  همه‌جا یکی بماند. گوشه همه مستطیل‌ها R.box است (theme.js). قرص‌ها کاملاً گردند.
//  رنگ از زمینه V4Provider می‌آید؛ ورودی C و T اختیاری است.
//
//  اندازه نوشته‌ها:
//   عنوان صفحه 17 · عنوان کارت 14 · متن 13 · متن فرعی 11.5 · برچسب کوچک 10.5
//   وزن: عنوان 900، متن 600 تا 800
// ─────────────────────────────────────────────────────────────
import { R } from '@/components/v4/theme'
import { Icon } from '@/components/v4/icons'
import { useV4 } from '@/components/v4/kit/context'

export const FS = { page: 17, title: 14, body: 13, sub: 11.5, tiny: 10.5 }
const fa = (n) => Number(n || 0).toLocaleString('fa')
// رقم‌های لاتین داخل نوشته فارسی (مثل منطقه‌ها که در داده لاتین‌اند) فارسی می‌شوند
export const faDigits = (s) => String(s == null ? '' : s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])

// ── کارت شیشه‌ای ───────────────────────────────────────────
export function Card({ children, pad = 14, style, as: Tag = 'section', solid = false, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  return (
    <Tag {...rest} style={{ borderRadius: R.box, padding: pad, color: C.text, boxSizing: 'border-box',
      background: solid ? C.card : T.glass, backdropFilter: solid ? undefined : T.blur, WebkitBackdropFilter: solid ? undefined : T.blur,
      border: '1px solid ' + T.hair, boxShadow: T.shadow1, ...style }}>
      {children}
    </Tag>
  )
}

export function SectionHead({ title, hint, action, style, C: c, T: t }) {
  const { C } = useV4({ C: c, T: t })
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: FS.title, fontWeight: 900, color: C.text }}>{title}</div>
        {hint && <div style={{ fontSize: FS.tiny, color: C.sub, marginTop: 1, lineHeight: 1.7 }}>{hint}</div>}
      </div>
      {action}
    </header>
  )
}

// ── دکمه‌ها ────────────────────────────────────────────────
// kind: primary (توپر) · ghost (شیشه‌ای با حاشیه) · quiet (فقط نوشته)
export function Btn({ kind = 'primary', size = 'md', icon, children, block = false, href, style, disabled, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  const h = size === 'sm' ? 34 : size === 'lg' ? 48 : 42
  const base = {
    height: h, padding: children ? (size === 'sm' ? '0 12px' : '0 16px') : 0, width: children ? (block ? '100%' : undefined) : h,
    borderRadius: R.box, fontFamily: 'inherit', fontSize: size === 'sm' ? 12 : 13, fontWeight: 900, cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxSizing: 'border-box', textDecoration: 'none', whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1, flexShrink: 0,
  }
  const look = kind === 'primary'
    ? { background: C.accent, color: T.onAccent, border: '1px solid transparent' }
    : kind === 'ghost'
      ? { background: T.chip, color: C.text, border: '1px solid ' + T.hair }
      : { background: 'transparent', color: C.text, border: '1px solid transparent' }
  const inner = <>{icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} stroke={kind === 'primary' ? 2 : 1.75} />}{children}</>
  if (href) return <a href={href} className="tl4-press" style={{ ...base, ...look, ...style }} {...rest}>{inner}</a>
  return <button type="button" className="tl4-press" disabled={disabled} style={{ ...base, ...look, ...style }} {...rest}>{inner}</button>
}

export function IconBtn({ icon, label, on = false, size = 40, style, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  return (
    <button type="button" aria-label={label} title={label} className={'tl4-btn' + (on ? ' is-on' : '')} {...rest}
      style={{ width: size, height: size, borderRadius: R.box, flexShrink: 0, padding: 0, cursor: 'pointer',
        border: '1px solid ' + (on ? 'transparent' : T.hair), background: on ? C.accent : T.chip, color: on ? T.onAccent : C.text,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', ...style }}>
      <Icon name={icon} size={Math.round(size * 0.48)} />
    </button>
  )
}

// ── قرص انتخاب ─────────────────────────────────────────────
export function Chip({ on = false, icon, children, count, style, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  return (
    <button type="button" aria-pressed={on} className="tl4-press" {...rest}
      style={{ flexShrink: 0, height: 34, padding: '0 12px', borderRadius: R.pill, fontFamily: 'inherit', fontSize: 12, fontWeight: on ? 900 : 700, whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        border: '1px solid ' + (on ? 'transparent' : T.hair), background: on ? C.accent : T.chip, color: on ? T.onAccent : C.text, ...style }}>
      {icon && <Icon name={icon} size={15} />}
      {children}
      {count != null && <span style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.7 }}>{fa(count)}</span>}
    </button>
  )
}

export function Tag({ children, strong = false, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  return <span style={{ fontSize: 10, fontWeight: 900, background: strong ? C.accent : T.chip, color: strong ? T.onAccent : C.sub, border: strong ? 'none' : '1px solid ' + T.hair,
    borderRadius: R.pill, padding: '1px 8px', flexShrink: 0, whiteSpace: 'nowrap', lineHeight: 1.7, ...style }}>{children}</span>
}

// ── کلید روشن و خاموش ───────────────────────────────────────
export function Toggle({ on, onChange, label, disabled = false, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled} className="tl4-press"
      onClick={() => !disabled && onChange && onChange(!on)}
      style={{ position: 'relative', width: 46, height: 28, borderRadius: R.pill, border: '1px solid ' + T.hair, cursor: disabled ? 'default' : 'pointer', flexShrink: 0, padding: 0,
        background: on ? C.accent : T.hairStrong, transition: 'background .25s ease', opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: 'absolute', top: 3, right: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: on ? T.onAccent : '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'right .25s cubic-bezier(.2,.9,.3,1)' }} />
    </button>
  )
}

// ── ورودی‌ها ───────────────────────────────────────────────
export function Field({ icon, value, onChange, onClear, placeholder, label, style, inputStyle, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  return (
    <label style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      {icon && <span style={{ position: 'absolute', right: 13, color: C.sub, pointerEvents: 'none', display: 'flex' }}><Icon name={icon} size={17} /></span>}
      <input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} {...rest}
        style={{ width: '100%', height: 42, borderRadius: R.box, border: '1px solid ' + (value ? C.accent : T.hair), background: T.chip, color: C.text,
          fontSize: 13, padding: '0 ' + (icon ? 40 : 14) + 'px 0 ' + (onClear && value ? 40 : 14) + 'px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .2s', ...inputStyle }} />
      {onClear && value ? (
        <button type="button" aria-label="پاک کردن" onClick={onClear} className="tl4-btn"
          style={{ position: 'absolute', left: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.hairStrong, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}>
          <Icon name="x" size={13} stroke={2.2} />
        </button>
      ) : null}
    </label>
  )
}

export function TextArea({ value, onChange, placeholder, maxLength, rows = 3, label, ...rest }) {
  const { C, T } = useV4(rest)
  delete rest.C; delete rest.T
  return (
    <div style={{ borderRadius: R.box, border: '1px solid ' + T.hair, background: T.chip, padding: '10px 12px' }}>
      <textarea value={value} onChange={e => onChange && onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)} rows={rows} maxLength={maxLength} placeholder={placeholder} aria-label={label || placeholder} {...rest}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.9 }} />
      {maxLength && <div style={{ fontSize: 10.5, color: (value || '').length > maxLength - 15 ? C.text : C.sub, textAlign: 'left' }}>{fa((value || '').length)} از {fa(maxLength)}</div>}
    </div>
  )
}

// ── زبانه‌های یک‌ردیفه ──────────────────────────────────────
export function Segmented({ options, value, onChange, label, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  return (
    <div role="tablist" aria-label={label} style={{ display: 'flex', gap: 4, padding: 4, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, ...style }}>
      {options.map(([k, text, icon]) => {
        const on = value === k
        return (
          <button key={k} type="button" role="tab" aria-selected={on} className="tl4-press" onClick={() => onChange(k)}
            style={{ flex: 1, minWidth: 0, height: 36, border: 'none', borderRadius: R.box, fontSize: 12.5, fontWeight: on ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
              background: on ? C.accent : 'transparent', color: on ? T.onAccent : C.sub }}>
            {icon && <Icon name={icon} size={15} />}{text}
          </button>
        )
      })}
    </div>
  )
}

// ── حالت خالی، اسکلت بارگذاری، آمار ─────────────────────────
export function Empty({ icon = 'help', title, text, action, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  return (
    <div style={{ textAlign: 'center', padding: '26px 16px', ...style }}>
      <span style={{ width: 52, height: 52, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, color: C.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={24} />
      </span>
      {title && <div style={{ fontSize: FS.title, fontWeight: 900, color: C.text, marginBottom: 4 }}>{title}</div>}
      {text && <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.9 }}>{text}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}

export function Skeleton({ h = 58, n = 3, gap = 8, C: c, T: t }) {
  const { T } = useV4({ C: c, T: t })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: n }, (_, i) => <div key={i} style={{ height: h, borderRadius: R.box, background: T.chip, animation: 'tl4Pulse 1.4s ease-in-out infinite', animationDelay: i * 0.12 + 's' }} />)}
    </div>
  )
}

export function Stat({ icon, value, label, onClick, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={onClick ? 'tl4-press' : undefined}
      style={{ minWidth: 0, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, padding: '11px 8px', textAlign: 'center', color: C.text, fontFamily: 'inherit', cursor: onClick ? 'pointer' : 'default' }}>
      {icon && <span style={{ display: 'flex', justifyContent: 'center', color: C.sub, marginBottom: 4 }}><Icon name={icon} size={17} /></span>}
      <div style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{typeof value === 'number' ? fa(value) : value}</div>
      <div style={{ fontSize: FS.tiny, color: C.sub, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </Tag>
  )
}

// ردیف فهرست با آیکون، نوشته، توضیح و یک چیز در انتها (کلید، فلش، عدد)
export function ListRow({ icon, title, sub, end, onClick, href, danger = false, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const Tag = href ? 'a' : onClick ? 'button' : 'div'
  return (
    <Tag href={href} type={Tag === 'button' ? 'button' : undefined} onClick={onClick} className={href || onClick ? 'tl4-press' : undefined}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', boxSizing: 'border-box', borderRadius: R.box,
        border: '1px solid ' + T.hair, background: T.chip, color: C.text, textDecoration: 'none', fontFamily: 'inherit', textAlign: 'right', cursor: href || onClick ? 'pointer' : 'default', ...style }}>
      {icon && <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: danger ? C.danger || C.text : C.text }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.7 }}>{sub}</span>}
      </span>
      {end !== undefined ? end : (href || onClick) ? <Icon name="chevronLeft" size={16} color={C.sub} /> : null}
    </Tag>
  )
}
