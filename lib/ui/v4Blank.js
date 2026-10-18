'use client'
// زمینه خالی هم‌رنگ حالت روشن یا تیره v4.0، تا بار شدن صفحه سفید یا سیاه نپرد
export function V4Blank() {
  let dark = true
  try { dark = localStorage.getItem('tl_thememode') !== 'light' } catch (e) {}
  return <div style={{ position: 'fixed', inset: 0, background: dark ? '#050506' : '#F3F3F4' }} />
}
