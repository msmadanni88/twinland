'use client'
// ─────────────────────────────────────────────────────────────
//  هر «سطح» سایت (صفحه اصلی، صفحه ورود، ...) برای هر نسخه ظاهر یک جزء دارد.
//  اگر نسخه‌ای برای یک سطح طراحی جدید نداشته باشد، نزدیک‌ترین نسخه قدیمی‌تر نشان داده می‌شود.
//  نسخه‌های تازه با dynamic import بار می‌شوند تا کاربرانِ نسخه دیگر کدشان را دانلود نکنند.
//  قانون: هیچ ورودی نسخه قدیمی از این فهرست پاک نمی‌شود.
// ─────────────────────────────────────────────────────────────
import AuthGate from '@/components/auth/AuthGate'
import { TwinLand } from '@/components/home/TwinLand'
import { DEFAULT_UI, UI_IDS } from '@/lib/ui/versions'

const SURFACES = {
  home: {
    'v1.0': TwinLand,
  },
  auth: {
    'v1.0': AuthGate,
  },
}

export function resolveSurface(name, version) {
  const table = SURFACES[name]
  if (!table) throw new Error('unknown UI surface: ' + name)
  let i = UI_IDS.indexOf(version)
  if (i < 0) i = UI_IDS.indexOf(DEFAULT_UI)
  for (; i >= 0; i--) {
    const C = table[UI_IDS[i]]
    if (C) return C
  }
  return table[DEFAULT_UI]
}
