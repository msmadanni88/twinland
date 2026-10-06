'use client'
// حالت نمایشی پنل کسب‌وکار — همان دنیای شبیه‌سازی نقشه، از نگاه یکی از مکان‌ها.
// اگر از نقشه آمده باشی همان دنیا ادامه پیدا می‌کند؛ اگر مستقیم اینجا آمده باشی یک دنیای نمونه ساخته می‌شود.
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { sim } from '@/components/v3/demo/simWorld'
import { buildBiz } from '@/components/v3/demo/simBiz'

export function useBizSim(enabled) {
  const snap = useSyncExternalStore(sim.subscribe, sim.getSnapshot, () => null)
  const keep = useRef({ sig: '', places: null })
  useEffect(() => {
    if (!enabled) { try { if (sessionStorage.getItem('tl_demo') !== '1') sim.clear() } catch (e) {} return }
    sim.start(null)
    return () => { setTimeout(() => sim.pause(), 0) }
  }, [enabled])
  return useMemo(() => {
    const W = sim.world()
    if (!enabled || !snap || !W) return null
    const b = buildBiz(W)
    // فهرست مکان‌های نقشه فقط وقتی عوض می‌شود که سطح شلوغی یک مکان واقعاً تغییر کرده باشد؛ نقشه بی‌دلیل از نو کشیده نمی‌شود
    const sig = snap.startedAt + ':' + b.area.places.map(p => p.level).join('')
    if (keep.current.sig === sig && keep.current.places) b.area.places = keep.current.places
    else keep.current = { sig, places: b.area.places }
    return b
  }, [enabled, snap])
}
