'use client'
// نگه‌دارنده نشست ورود برای همه صفحه‌ها — lib/auth/session.js
import { useEffect } from 'react'
import { startSessionKeeper } from '@/lib/auth/session'

export function SessionKeeper() {
  useEffect(() => startSessionKeeper(), [])
  return null
}
