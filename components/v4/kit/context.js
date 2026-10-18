'use client'
// زمینه مشترک نسخه v4.0: رنگ‌ها (C)، توکن‌ها (T) و راه باز کردن پروفایل یک نفر.
// صفحه اصلی و همه صفحه‌های دیگر v4.0 این را در بالاترین لایه می‌گذارند، پس هر جزء کیت
// بدون گرفتن ورودی رنگ، خودش درست دیده می‌شود. اگر جزئی بیرون از این زمینه بیاید،
// همان ورودی‌های C و T را می‌گیرد یا با رنگ روشن پیش‌فرض کار می‌کند.
import { createContext, useContext } from 'react'
import { buildC, V4_PALETTE } from '@/lib/theme/palettes'
import { v4Tokens } from '@/components/v4/theme'

const FALLBACK_C = buildC(V4_PALETTE, 'light')
const FALLBACK = { C: FALLBACK_C, T: v4Tokens(FALLBACK_C), openPerson: null }

export const V4Context = createContext(FALLBACK)

export function V4Provider({ C, T, openPerson, children }) {
  return <V4Context.Provider value={{ C, T, openPerson: openPerson || null }}>{children}</V4Context.Provider>
}

// رنگ‌ها از ورودی، وگرنه از زمینه
export function useV4(props) {
  const ctx = useContext(V4Context)
  return {
    C: (props && props.C) || ctx.C,
    T: (props && props.T) || ctx.T,
    openPerson: ctx.openPerson,
  }
}

// باز کردن پروفایل یک نفر: در صفحه اصلی برگه پروفایل روی نقشه باز می‌شود، در صفحه‌های دیگر صفحه پروفایل او
export function usePersonOpener() {
  const { openPerson } = useContext(V4Context)
  return (id) => {
    if (!id) return
    if (openPerson) { openPerson(id); return }
    try { window.location.href = '/profile?u=' + encodeURIComponent(id) } catch (e) {}
  }
}
