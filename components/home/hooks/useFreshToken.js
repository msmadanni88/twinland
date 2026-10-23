'use client'
// توکن ورود همیشه تازه — حالا فقط درگاهی به مدیر مشترک نشست در lib/auth/session.js است
// تا تمدید در کل سایت یک جا و یک بار انجام شود؛ توکن تمدید سوپابیس یک‌بارمصرف است.
import { getToken } from '@/lib/auth/session'

export function useFreshToken({ session }) {
  async function freshToken(){
    const t = await getToken()
    return t || (session && session.access_token) || null
  }
  return { freshToken }
}
