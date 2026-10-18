'use client'
// ─────────────────────────────────────────────────────────────
//  چهره هر نفر در کل سایت — نسخه v4.0
//  هر جا عکس یا نام کسی دیده می‌شود همین جزء است، پس هر تغییری اینجا همه‌جا یکسان دیده می‌شود.
//
//  ترتیب نمایش:
//   1. عکس پروفایل، اگر گذاشته و برای دیگران پنهانش نکرده
//   2. آواتار آماده‌ای که انتخاب کرده
//   3. حرف اول نام عمومی روی یک دایره خنثی
//  ایموجی قدیمی چهره در این نسخه نشان داده نمی‌شود.
//
//  ورودی person همان کارت عمومی سرور است: { id, name, photo, preset, level, public }.
//  شکل‌های قدیمی هم پذیرفته می‌شوند: { name, avatar } که avatar یا آدرس عکس است یا ایموجی.
//
//  PersonLink: نام یا چهره‌ای که با ضربه پروفایل آن نفر را باز می‌کند. اگر شناسه نباشد (نمونه یا پروفایل خصوصی در نظرها) فقط نمایش است.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { presetSrc } from '@/lib/profile/presets'
import { usePersonOpener, useV4 } from '@/components/v4/kit/context'

const isUrl = (v) => typeof v === 'string' && /^(https?:)?\/\//.test(v)

export function avatarSource(person) {
  if (!person) return { kind: 'initial', letter: '؟' }
  const photo = person.photo || (isUrl(person.avatar) ? person.avatar : null)
  if (photo) return { kind: 'photo', src: photo }
  const pre = presetSrc(person.preset)
  if (pre) return { kind: 'preset', src: pre }
  const name = String(person.name || '').trim()
  return { kind: 'initial', letter: name ? Array.from(name)[0] : '؟' }
}

export function UserAvatar({ person, size = 40, ring = false, ringColor, title, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const src = avatarSource(person)
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [src.src])
  const showImg = (src.kind === 'photo' || src.kind === 'preset') && !broken
  const letter = src.kind === 'initial' ? src.letter : Array.from(String((person && person.name) || '؟').trim() || '؟')[0]
  const bw = ring ? Math.max(2, Math.round(size / 20)) : 0
  return (
    <span role="img" aria-label={title || (person && person.name) || 'کاربر'} title={title}
      style={{ width: size, height: size, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', boxSizing: 'border-box', position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: T.dark ? '#26262B' : '#E4E4E7', color: C.text,
        boxShadow: ring ? '0 0 0 ' + bw + 'px ' + (ringColor || C.text) : 'inset 0 0 0 1px ' + T.hair, ...style }}>
      {showImg
        ? <img src={src.src} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false}
            onError={() => setBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span aria-hidden="true" style={{ fontSize: Math.round(size * 0.42), fontWeight: 900, lineHeight: 1, transform: 'translateY(1px)' }}>{letter}</span>}
    </span>
  )
}

// ضربه روی چهره یا نام → پروفایل آن نفر. children هر چیزی می‌تواند باشد.
export function PersonLink({ id, children, label, style, className }) {
  const open = usePersonOpener()
  if (!id) return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, ...style }}>{children}</span>
  return (
    <button type="button" className={'tl4-press' + (className ? ' ' + className : '')} onClick={(e) => { e.stopPropagation(); open(id) }}
      aria-label={label ? 'پروفایل ' + label : 'دیدن پروفایل'}
      style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'inherit',
        display: 'inline-flex', alignItems: 'center', minWidth: 0, ...style }}>
      {children}
    </button>
  )
}
