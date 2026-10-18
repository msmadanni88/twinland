'use client'
// حالت روشن و تیره نسخه v4.0 — یک hook برای صفحه اصلی و همه صفحه‌های دیگر.
// پالت همیشه سیاه و سفید v4 است و انتخاب پالت کاربر برای نسخه‌های دیگر دست نمی‌خورد.
// عوض کردن حالت در یک صفحه به بقیه صفحه‌ها و زبانه‌های باز هم می‌رسد.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_MODE, buildC, loadPrefs, saveMode, V4_PALETTE } from '@/lib/theme/palettes'
import { v4Tokens } from '@/components/v4/theme'

const EVT = 'tl-v4-mode'

export function useV4Theme() {
  const [themeMode, setThemeMode] = useState(DEFAULT_MODE)
  useEffect(() => {
    setThemeMode(loadPrefs().mode)
    const sync = () => setThemeMode(loadPrefs().mode)
    const onStorage = (e) => { if (!e || e.key === 'tl_thememode') sync() }
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', onStorage) }
  }, [])
  const C = useMemo(() => buildC(V4_PALETTE, themeMode), [themeMode])
  const T = useMemo(() => v4Tokens(C), [C])
  const toggleMode = useCallback(() => {
    setThemeMode(m => {
      const n = m === 'dark' ? 'light' : 'dark'
      saveMode(n)
      setTimeout(() => { try { window.dispatchEvent(new Event(EVT)) } catch (e) {} }, 0)
      return n
    })
  }, [])
  return { C, T, themeMode, toggleMode }
}
