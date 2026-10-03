// زیرنقشه برداری برای پوسته‌ها — نسخه v2.0
// MapLibre GL را زیر همان نقشه Leaflet می‌نشاند؛ پین‌ها، خوشه‌ها و مرزها همان لایه‌های Leaflet می‌مانند.
// اگر مرورگر WebGL نداشته باشد یا کتابخانه و داده نرسد، onFail صدا زده می‌شود و نقشه عکسی OpenStreetMap می‌آید.
import { PLAIN_ATTRIBUTION, SKIN_ATTRIBUTION, buildSkinStyle, cafeFeatures, isVectorSkin, skinImage } from '@/components/v2/map/skins'

const LIB = '/api/mapkit/lib/'
// زمان فقط وقتی شمرده می‌شود که صفحه دیده می‌شود؛ در تب پنهان مرورگر رسم را نگه می‌دارد و نباید خطا حساب شود
const STYLE_WAIT_S = 20   // تا آماده شدن سبک
const TILE_WAIT_S = 30    // تا رسیدن اولین تکه داده نقشه
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
// پوسته‌های برداری با MapLibre رسم می‌شوند و پوسته «ساده» با کاشی عکسی؛ جابه‌جایی بین این دو زنده است.
export function makeVectorBase() {
  return {
    attach({ L, map, skinId, cafes, live, onReady, onFail }) {
      const state = { skinId, cafes: cafes || [], live: live || {} }
      let layer = null, gl = null, raster = null, ready = false, dead = false, gotTile = false, starting = false
      let seen = 0, watch = null, told = false
      const origin = window.location.origin
      const box = () => map.getContainer().classList
      const data = () => cafeFeatures(state.cafes, state.live)
      const attr = (text, on) => { try { if (map.attributionControl) map.attributionControl[on ? 'addAttribution' : 'removeAttribution'](text) } catch (e) {} }
      const tell = () => { if (!told) { told = true; onReady() } }

      const fail = () => {
        if (dead) return
        dead = true
        clearInterval(watch)
        try { box().remove('tl-vector'); box().remove('tl-plain') } catch (e) {}
        try { if (layer) map.removeLayer(layer) } catch (e) {}
        try { if (raster) map.removeLayer(raster) } catch (e) {}
        attr(SKIN_ATTRIBUTION, false); attr(PLAIN_ATTRIBUTION, false)
        if (told) showPlain()   // نقشه قبلاً آماده اعلام شده؛ خودمان کاشی عکسی را می‌آوریم
        else onFail()
      }

      // کاشی عکسی OpenStreetMap از مسیر خود سایت
      function showPlain() {
        try {
          // افزونه با برداشتن لایه، نقشه MapLibre را هم می‌بندد؛ دفعه بعد از نو ساخته می‌شود
          if (layer) { try { map.removeLayer(layer) } catch (e) {} layer = null; gl = null }
          attr(SKIN_ATTRIBUTION, false)
          if (!raster) raster = L.tileLayer('/api/tiles/{z}/{x}/{y}.png?v=2', { maxZoom: 19 })
          if (!map.hasLayer(raster)) raster.addTo(map)
          attr(PLAIN_ATTRIBUTION, true)
          box().remove('tl-vector'); box().add('tl-plain')
        } catch (e) {}
        tell()
      }

      function mountGL() {
        ready = false
        layer = L.maplibreGL({ style: buildSkinStyle(state.skinId, origin, data()), attributionControl: false, interactive: false })
        layer.addTo(map)
        gl = layer.getMaplibreMap()
        const mine = gl
        gl.on('styleimagemissing', (e) => {
          try {
            if (mine.hasImage(e.id)) return
            const img = skinImage(e.id)
            if (img) mine.addImage(e.id, img, { pixelRatio: 2 })
          } catch (err) {}
        })
        gl.on('data', (e) => { if (e && e.dataType === 'source' && e.sourceId === 'omt' && e.tile) gotTile = true })
        const done = () => {
          if (dead || mine !== gl) return
          ready = true
          try { if (raster && map.hasLayer(raster)) map.removeLayer(raster) } catch (e) {}
          attr(PLAIN_ATTRIBUTION, false)
          try { box().remove('tl-plain'); box().add('tl-vector') } catch (e) {}
          attr(SKIN_ATTRIBUTION, true)
          tell()
        }
        // به محض آماده شدن سبک، زمینه دیده می‌شود و تکه‌های نقشه یکی‌یکی می‌رسند
        gl.once('style.load', done)
        gl.once('load', done)
      }

      function showVector() {
        if (dead) { showPlain(); return }
        if (gl) {
          try { gl.setStyle(buildSkinStyle(state.skinId, origin, data()), { diff: false }) } catch (e) {}
          return
        }
        if (starting) return
        if (!webglOk()) { fail(); return }
        starting = true
        // هر ثانیه یک بار؛ ثانیه‌های پنهان بودن صفحه و زمان پوسته ساده شمرده نمی‌شود
        if (!watch) watch = setInterval(() => {
          if (dead || gotTile) { clearInterval(watch); return }
          if (document.hidden || !isVectorSkin(state.skinId)) return
          seen += 1
          if (!ready && seen >= STYLE_WAIT_S) fail()
          else if (ready && seen >= TILE_WAIT_S) fail()
        }, 1000)
        loadLibs().then(() => {
          starting = false
          if (dead) return
          // اگر کاربر در فاصله بار شدن کتابخانه پوسته ساده را برداشته باشد، چیزی ساخته نمی‌شود
          if (isVectorSkin(state.skinId) && !gl) mountGL()
        }).catch(() => { starting = false; fail() })
      }

      const ctl = {
        update(next) {
          const skinChanged = !!next.skinId && next.skinId !== state.skinId
          if (next.skinId) state.skinId = next.skinId
          if (next.cafes) state.cafes = next.cafes
          if (next.live) state.live = next.live
          if (skinChanged) { if (isVectorSkin(state.skinId)) showVector(); else showPlain(); return }
          if (!gl || dead) return
          try { const src = gl.getSource('cafes'); if (src && src.setData) src.setData(data()) } catch (e) {}
        },
        isVector: () => !dead && isVectorSkin(state.skinId),
      }

      if (isVectorSkin(state.skinId)) showVector(); else showPlain()
      return ctl
    },
  }
}
