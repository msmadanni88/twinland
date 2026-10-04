'use client'
// ─────────────────────────────────────────────────────────────
//  هر «سطح» سایت (صفحه اصلی، صفحه ورود، ...) برای هر نسخه ظاهر یک جزء دارد.
//  اگر نسخه‌ای برای یک سطح طراحی جدید نداشته باشد، نزدیک‌ترین نسخه قدیمی‌تر نشان داده می‌شود.
//  نسخه‌های تازه با dynamic import بار می‌شوند تا کاربرانِ نسخه دیگر کدشان را دانلود نکنند.
//  قانون: هیچ ورودی نسخه قدیمی از این فهرست پاک نمی‌شود.
// ─────────────────────────────────────────────────────────────
import dynamic from 'next/dynamic'
import AuthGate from '@/components/auth/AuthGate'
import { TwinLand } from '@/components/home/TwinLand'
import { DEFAULT_UI, UI_IDS } from '@/lib/ui/versions'

// نسخه‌های تازه جدا بار می‌شوند؛ تا بار شدن، زمینه تیره ساده نشان داده می‌شود
const Blank = () => <div style={{ position: 'fixed', inset: 0, background: '#0b0714' }} />
const TwinLandV2 = dynamic(() => import('@/components/v2/home/TwinLandV2').then(m => m.TwinLandV2), { ssr: false, loading: Blank })
const TwinLandV3 = dynamic(() => import('@/components/v3/home/TwinLandV3').then(m => m.TwinLandV3), { ssr: false, loading: Blank })

const SURFACES = {
  home: {
    'v1.0': TwinLand,
    'v2.0': TwinLandV2,
    'v3.0': TwinLandV3,
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
