'use client'
// یک بار در هر صفحه: ثبت سرویس‌ورکر و گرفتن رویداد نصب. چیزی نمایش نمی‌دهد.
import { useEffect } from 'react'
import { initPwa } from '@/lib/pwa/pwa'

export function PwaBoot() {
  useEffect(() => { initPwa() }, [])
  return null
}
