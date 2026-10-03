// زیرنقشه برداری برای پوسته‌ها — نسخه v2.0
// MapLibre GL را زیر همان نقشه Leaflet می‌نشاند؛ پین‌ها، خوشه‌ها و مرزها همان لایه‌های Leaflet می‌مانند.
// اگر مرورگر WebGL نداشته باشد یا کتابخانه و داده نرسد، onFail صدا زده می‌شود و نقشه عکسی OpenStreetMap می‌آید.
import { SKIN_ATTRIBUTION, buildSkinStyle, cafeFeatures, skinImage } from '@/components/v2/map/skins'

const LIB = '/api/mapkit/lib/'
const FAIL_AFTER_MS = 14000
let libsPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src; s.async = true
    s.onload = () => resolve(); s.onerror = () => reject(new Error('script ' + src))
    document.head.appendChild(s)
  })
}

function loadLibs() {
  if (window.maplibregl && window.L && window.L.maplibreGL) return Promise.resolve()
  if (!libsPromise) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LIB + 'maplibre-gl.css'
    document.head.appendChild(css)
    libsPromise = (window.maplibregl ? Promise.resolve() : loadScript(LIB + 'maplibre-gl.js'))
      .then(() => (window.L && window.L.maplibreGL ? null : loadScript(LIB + 'leaflet-maplibre-gl.js')))
      .then(() => {
        if (!window.maplibregl || !window.L || !window.L.maplibreGL) throw new Error('maplibre missing')
        // نوشته فارسی بدون این افزونه بریده و برعکس دیده می‌شود
        try {
          const ml = window.maplibregl
          if (ml.getRTLTextPluginStatus && ml.getRTLTextPluginStatus() === 'unavailable') {
            const p = ml.setRTLTextPlugin(window.location.origin + LIB + 'rtl-text.js', true)
            if (p && p.catch) p.catch(() => {})
          }
        } catch (e) {}
      })
      .catch((e) => { libsPromise = null; throw e })
  }
  return libsPromise
}

function webglOk() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch (e) { return false }
}

// attach را قلاب مشترک نقشه صدا می‌زند؛ خروجی یک کنترل‌کننده با update است.
export function makeVectorBase() {
  return {
    attach({ L, map, skinId, cafes, live, onReady, onFail }) {
      const state = { skinId, cafes: cafes || [], live: live || {} }
      let layer = null, gl = null, ready = false, dead = false, attribution = false
      const origin = window.location.origin
      const data = () => cafeFeatures(state.cafes, state.live)

      const fail = () => {
        if (dead || ready) return
        dead = true
        clearTimeout(timer)
        try { if (layer) map.removeLayer(layer) } catch (e) {}
        try { if (attribution && map.attributionControl) map.attributionControl.removeAttribution(SKIN_ATTRIBUTION) } catch (e) {}
        onFail()
      }
      const timer = setTimeout(fail, FAIL_AFTER_MS)

      const ctl = {
        update(next) {
          if (dead) return
          const skinChanged = next.skinId && next.skinId !== state.skinId
          if (next.skinId) state.skinId = next.skinId
          if (next.cafes) state.cafes = next.cafes
          if (next.live) state.live = next.live
          if (!gl) return
          try {
            if (skinChanged) gl.setStyle(buildSkinStyle(state.skinId, origin, data()))
            else { const src = gl.getSource('cafes'); if (src && src.setData) src.setData(data()) }
          } catch (e) {}
        },
        isVector: () => !dead,
      }

      if (!webglOk()) { setTimeout(fail, 0); return ctl }

      loadLibs().then(() => {
        if (dead) return
        layer = L.maplibreGL({ style: buildSkinStyle(state.skinId, origin, data()), attributionControl: false, interactive: false })
        layer.addTo(map)
        gl = layer.getMaplibreMap()
        gl.on('styleimagemissing', (e) => {
          try {
            if (gl.hasImage(e.id)) return
            const img = skinImage(e.id)
            if (img) gl.addImage(e.id, img, { pixelRatio: 2 })
          } catch (err) {}
        })
        gl.on('error', (e) => {
          // خطای یک کاشی یا یک فونت نباید کل نقشه را برگرداند؛ فقط اگر هنوز چیزی رسم نشده و خود سبک خراب است
          const msg = String((e && e.error && e.error.message) || '')
          if (!ready && /style|layers|sources|glyphs/i.test(msg) && !/tile|pbf|Failed to fetch|AJAXError/i.test(msg)) fail()
        })
        const done = () => {
          if (ready || dead) return
          ready = true
          clearTimeout(timer)
          try { map.getContainer().classList.add('tl-vector') } catch (e) {}
          try { if (map.attributionControl) { map.attributionControl.addAttribution(SKIN_ATTRIBUTION); attribution = true } } catch (e) {}
          onReady()
        }
        gl.once('load', done)
        gl.once('idle', done)
      }).catch(fail)

      return ctl
    },
  }
}
