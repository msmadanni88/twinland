'use client'
// «دنبال کردن رویداد»: هر بار که نوار رویداد به رویداد بعدی می‌رود، نقشه آرام به کافه‌ی همان رویداد می‌رود
// تا نقشه همیشه زنده باشد و کافه‌ها را نشان بدهد. تصمیم‌ها:
//  • اگر کاربر خودش نقشه را کشید، چرخاند یا زوم کرد، ۱۵ ثانیه دست نمی‌زند. نقشه نباید از دست کاربر کشیده شود.
//  • وقتی برگه‌ای باز است (کافه، منو، پنل موبایل) یا تب پنهان است، حرکتی نیست.
//  • اگر کافه الان وسط بخش دیدنیِ نقشه است، حرکت نمی‌کند؛ فقط وقتی دور یا زیر پنل‌ها باشد.
//  • زوم هیچ‌وقت کم نمی‌شود، فقط تا ۱۴ بالا می‌رود تا کافه‌ها خوانا باشند.
//  • کافه به مرکز بخشِ دیدنی می‌نشیند، نه مرکز کل صفحه؛ پنل راست و داک پایین حساب می‌شوند.
//  • با «کاهش حرکت» در سیستم‌عامل، کلاً خاموش است.
import { useEffect, useRef } from 'react'

const PAUSE_AFTER_TOUCH_MS = 15000
const FIRST_DELAY_MS = 2500
const NEXT_DELAY_MS = 700
const MIN_ZOOM = 14

export function useMapFollow({ enabled, mapInst, target, blocked, getInsets }) {
  const lastTouchRef = useRef(0)
  const firstRef = useRef(true)
  const insetsRef = useRef(getInsets)
  insetsRef.current = getInsets
  const id = target ? target.id : null
  const lat = target ? target.lat : null
  const lng = target ? target.lng : null

  // لمس کاربر روی نقشه را ثبت می‌کند. حرکت‌های برنامه‌ای (flyTo خودمان) اینجا حساب نمی‌شوند چون رویداد DOM نیستند.
  useEffect(() => {
    if (!enabled) return
    let el = null, tries = 0, t = null
    const mark = () => { lastTouchRef.current = Date.now() }
    const attach = () => {
      const m = mapInst.current
      if (!m || !m.getContainer) { if (tries++ < 20) t = setTimeout(attach, 500); return }
      el = m.getContainer()
      ;['mousedown', 'touchstart', 'wheel'].forEach(ev => el.addEventListener(ev, mark, { passive: true }))
    }
    attach()
    return () => {
      clearTimeout(t)
      if (el) ['mousedown', 'touchstart', 'wheel'].forEach(ev => el.removeEventListener(ev, mark))
    }
  }, [enabled, mapInst])

  useEffect(() => {
    if (!enabled || id == null || lat == null || lng == null) return
    let timer = null, dead = false, tries = 0

    const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(go, ms) }

    function go() {
      if (dead) return
      const map = mapInst.current
      if (!map || !map.getSize) { if (tries++ < 20) schedule(800); return }
      if (typeof document !== 'undefined' && document.hidden) return
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (blocked) return
      const since = Date.now() - lastTouchRef.current
      if (since < PAUSE_AFTER_TOUCH_MS) { schedule(PAUSE_AFTER_TOUCH_MS - since + 150); return }

      try {
        const size = map.getSize()
        const ins = (insetsRef.current && insetsRef.current()) || {}
        const x0 = ins.left || 0, x1 = size.x - (ins.right || 0)
        const y0 = ins.top || 0, y1 = size.y - (ins.bottom || 0)
        if (x1 - x0 < 120 || y1 - y0 < 120) return
        const z0 = map.getZoom()
        const pt = map.latLngToContainerPoint([lat, lng])
        const px = Math.min(70, (x1 - x0) * 0.18), py = Math.min(70, (y1 - y0) * 0.18)
        const inside = pt.x > x0 + px && pt.x < x1 - px && pt.y > y0 + py && pt.y < y1 - py
        if (inside && z0 >= 13) return
        const maxZ = typeof map.getMaxZoom === 'function' ? map.getMaxZoom() : 19
        const z = Math.min(maxZ, Math.max(z0, MIN_ZOOM))
        // کافه باید به مرکز بخشِ دیدنی بنشیند؛ پس مرکز نقشه به اندازه‌ی فاصله‌ی این دو مرکز جابه‌جا می‌شود
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
        const p = map.project([lat, lng], z)
        const center = map.unproject(p.add([size.x / 2 - cx, size.y / 2 - cy]), z)
        map.flyTo(center, z, { duration: 1.4, easeLinearity: 0.35 })
      } catch (e) { /* نقشه هنوز آماده نیست؛ دفعه‌ی بعد */ }
    }

    const delay = firstRef.current ? FIRST_DELAY_MS : NEXT_DELAY_MS
    firstRef.current = false
    schedule(delay)
    return () => { dead = true; clearTimeout(timer) }
  }, [enabled, id, lat, lng, blocked, mapInst])
}
