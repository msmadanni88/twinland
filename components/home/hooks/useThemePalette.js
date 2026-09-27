'use client'
// پالت رنگ و حالت روز/شب، ذخیره‌شده در مرورگر — جداشده از TwinLand.js
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_MODE, DEFAULT_PALETTE, buildC, loadPrefs, saveMode, savePalette } from '@/lib/theme/palettes'

export function useThemePalette() {
  const [paletteKey, setPaletteKey] = useState(DEFAULT_PALETTE)
  const [themeMode,  setThemeMode]  = useState(DEFAULT_MODE)

  // ساخت آبجکت رنگ از پالت فعال (هر بار که پالت یا حالت روز/شب عوض شه)
  const C = useMemo(()=>buildC(paletteKey, themeMode), [paletteKey, themeMode])

  // خواندن انتخاب ذخیره‌شده کاربر هنگام بازشدن
  useEffect(()=>{
    const p = loadPrefs()
    setPaletteKey(p.palette)
    setThemeMode(p.mode)
  },[])

  function pickPalette(key){ setPaletteKey(key); savePalette(key) }
  function toggleMode(){ const next = themeMode==='dark'?'light':'dark'; setThemeMode(next); saveMode(next) }
  return { C, paletteKey, pickPalette, themeMode, toggleMode }
}
