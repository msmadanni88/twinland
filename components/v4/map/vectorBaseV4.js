// زیرنقشه برداری نسخه v4.0 — برگرفته از vectorBase نسخه v2.0 با این تفاوت‌ها:
//  • پوسته مینیمال با حالت روشن و تیره سایت عوض می‌شود (setMode)
//  • همه نوشته‌های نقشه با یک کلید پنهان یا دیده می‌شوند (setLabels)؛ پیش‌فرض بدون نوشته
//  • «آماده» وقتی اعلام می‌شود که همه تکه‌های دید اول رسیده و کشیده شده‌اند (رویداد idle)،
//    تا صفحه بارگذاری کوتاه، نقشه را کامل تحویل بدهد. سقف انتظار کوتاه است و بعدش نقشه به هر حال دیده می‌شود.
//  • پیشرفت بارگذاری به onProgress داده می‌شود
//  • بوم MapLibre بزرگ‌تر از صفحه کشیده می‌شود تا با کشیدن نقشه لبه خالی یا سیاه دیده نشود
//  • بعد از آماده شدن، تکه‌های تهران در پس‌زمینه گرفته می‌شوند تا جابه‌جایی بعدی فوری باشد
// اگر WebGL یا داده نرسد، مثل قبل نقشه عکسی می‌آید، این بار بی‌رنگ.
import { PLAIN_ATTRIBUTION, SKIN_ATTRIBUTION, skinImage } from '@/components/v2/map/skins'
import { MINI, buildStyleV4, cafeFeatures, isVectorSkinV4 } from '@/components/v4/map/skinsV4'

const LIB = '/api/mapkit/lib/'
const STYLE_WAIT_S = 20
const TILE_WAIT_S = 40
const READY_CAP_MS = 9000      // بیشتر از این صفحه بارگذاری نمی‌ماند؛ بقیه تکه‌ها جلوی چشم می‌رسند
const PREFETCH_KEY = 'tl_map_prefetch_v4'
const PREFETCH_EVERY_MS = 3 * 86400e3
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
    if (!document.querySelector('link[href="' + LIB + 'maplibre-gl.css"]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LIB + 'maplibre-gl.css'
      document.head.appendChild(css)
    }
    libsPromise = (window.maplibregl ? Promise.resolve() : loadScript(LIB + 'maplibre-gl.js'))
      .then(() => (window.L && window.L.maplibreGL ? null : loadScript(LIB + 'leaflet-maplibre-gl.js')))
      .then(() => {
        if (!window.maplibregl || !window.L || !window.L.maplibreGL) throw new Error('maplibre missing')
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

// ── گرفتن تکه‌های تهران در پس‌زمینه ─────────────────────────────
const TEHRAN = { w: 51.18, e: 51.62, s: 35.55, n: 35.82 }
const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * Math.pow(2, z))
const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)) }
export function tehranTiles(z, around = null) {
  let x0 = lon2x(TEHRAN.w, z), x1 = lon2x(TEHRAN.e, z), y0 = lat2y(TEHRAN.n, z), y1 = lat2y(TEHRAN.s, z)
  if (around) {
    const cx = lon2x(around.lng, z), cy = lat2y(around.lat, z), r = around.r || 3
    x0 = Math.max(x0, cx - r); x1 = Math.min(x1, cx + r); y0 = Math.max(y0, cy - r); y1 = Math.min(y1, cy + r)
  }
  const out = []
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([z, x, y])
  return out
}
function connectionOk() {
  try {
    const c = navigator.connection
    if (!c) return 'good'
    if (c.saveData) return 'none'
    if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return 'none'
    if (c.effectiveType === '3g') return 'light'
    return 'good'
  } catch (e) { return 'good' }
}
function prefetchTehran(origin, center, mobile) {
  try {
    const last = Number(localStorage.getItem(PREFETCH_KEY) || 0)
    if (Date.now() - last < PREFETCH_EVERY_MS) return
  } catch (e) {}
  const net = connectionOk()
  if (net === 'none') return
  let list = [...tehranTiles(11), ...tehranTiles(12)]
  if (net === 'good') list = list.concat(mobile ? tehranTiles(13, center ? { ...center, r: 3 } : null) : tehranTiles(13))
  let i = 0, active = 0, failed = 0
  const next = () => {
    if (document.hidden) { setTimeout(next, 3000); return }
    while (active < 3 && i < list.length) {
      const [z, x, y] = list[i++]
      active++
      fetch(origin + '/api/mapkit/tiles/' + z + '/' + x + '/' + y + '.pbf', { priority: 'low' })
        .then(r => { if (!r.ok) failed++; return r.arrayBuffer() }).catch(() => { failed++ })
        .finally(() => {
          active--
          if (i < list.length && failed < 8) setTimeout(next, 60)
          else if (!active && failed < 8) { try { localStorage.setItem(PREFETCH_KEY, String(Date.now())) } catch (e) {} }
        })
    }
  }
  setTimeout(next, 1500)
}

// opts: { getMode, getLabels, onProgress, mobile (مقدار یا تابع), prefetch }
export function makeVectorBaseV4(opts = {}) {
  let live = null   // کنترل‌کننده فعلی، برای setMode و setLabels از بیرون
  const base = {
    attach({ L, map, skinId, cafes, live: liveCounts, onReady, onFail }) {
      const state = { skinId, cafes: cafes || [], live: liveCounts || {}, mode: opts.getMode ? opts.getMode() : 'dark', labels: opts.getLabels ? !!opts.getLabels() : false }
      let layer = null, gl = null, raster = null, ready = false, dead = false, gotTile = false, starting = false
      let seen = 0, watch = null, told = false, capTimer = null, prefetched = false
      let asked = 0, got = 0
      const origin = window.location.origin
      const box = () => map.getContainer().classList
      const data = () => cafeFeatures(state.cafes, state.live)
      const attr = (text, on) => { try { if (map.attributionControl) map.attributionControl[on ? 'addAttribution' : 'removeAttribution'](text) } catch (e) {} }
      const progress = (p) => { if (!told && opts.onProgress) { try { opts.onProgress(Math.max(0, Math.min(1, p))) } catch (e) {} } }
      const tell = () => {
        if (told) return
        progress(1)
        told = true
        clearTimeout(capTimer)
        onReady()
      }
      const style = () => buildStyleV4(state.skinId, state.mode, origin, data(), state.labels)

      const fail = () => {
        if (dead) return
        dead = true
        clearInterval(watch); clearTimeout(capTimer)
        try { box().remove('tl-vector'); box().remove('tl-plain') } catch (e) {}
        try { if (layer) map.removeLayer(layer) } catch (e) {}
        try { if (raster) map.removeLayer(raster) } catch (e) {}
        attr(SKIN_ATTRIBUTION, false); attr(PLAIN_ATTRIBUTION, false)
        if (told) showPlain()
        else onFail()
      }

      function showPlain() {
        try {
          if (layer) { try { map.removeLayer(layer) } catch (e) {} layer = null; gl = null }
          attr(SKIN_ATTRIBUTION, false)
          if (!raster) raster = L.tileLayer('/api/tiles/{z}/{x}/{y}.png?v=2', { maxZoom: 19, keepBuffer: 4 })
          if (!map.hasLayer(raster)) raster.addTo(map)
          attr(PLAIN_ATTRIBUTION, true)
          box().remove('tl-vector'); box().add('tl-plain')
        } catch (e) {}
        tell()
      }

      function mountGL() {
        ready = false
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        layer = L.maplibreGL({
          style: style(), attributionControl: false, interactive: false,
          padding: 0.35, updateInterval: 16,
          fadeDuration: 0, maxTileCacheSize: 800, refreshExpiredTiles: false, pixelRatio: dpr,
        })
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
        gl.on('dataloading', (e) => { if (e && e.tile && e.sourceId === 'omt') { asked++; progress(0.35 + 0.6 * got / Math.max(asked, 1)) } })
        gl.on('data', (e) => {
          if (e && e.dataType === 'source' && e.sourceId === 'omt' && e.tile) {
            gotTile = true; got++
            progress(0.35 + 0.6 * got / Math.max(asked, 1))
          }
        })
        const styled = () => {
          if (dead || mine !== gl) return
          ready = true
          try { if (raster && map.hasLayer(raster)) map.removeLayer(raster) } catch (e) {}
          attr(PLAIN_ATTRIBUTION, false)
          try { box().remove('tl-plain'); box().add('tl-vector') } catch (e) {}
          attr(SKIN_ATTRIBUTION, true)
          progress(0.4)
          // اگر تکه‌ها دیر برسند، صفحه بارگذاری بیشتر از این نمی‌ماند
          clearTimeout(capTimer)
          capTimer = setTimeout(tell, READY_CAP_MS)
        }
        const settled = () => {
          if (dead || mine !== gl) return
          tell()
          if (!prefetched && opts.prefetch !== false) {
            prefetched = true
            let c = null
            try { const m = map.getCenter(); c = { lat: m.lat, lng: m.lng } } catch (e) {}
            prefetchTehran(origin, c, typeof opts.mobile === 'function' ? !!opts.mobile() : !!opts.mobile)
          }
        }
        gl.once('style.load', styled)
        gl.once('load', styled)
        gl.once('idle', settled)
      }

      function showVector() {
        if (dead) { showPlain(); return }
        if (gl) {
          try { gl.setStyle(style(), { diff: false }) } catch (e) {}
          return
        }
        if (starting) return
        if (!webglOk()) { fail(); return }
        starting = true
        progress(0.06)
        if (!watch) watch = setInterval(() => {
          if (dead || gotTile) { clearInterval(watch); return }
          if (document.hidden || !isVectorSkinV4(state.skinId)) return
          seen += 1
          if (!ready && seen >= STYLE_WAIT_S) fail()
          else if (ready && seen >= TILE_WAIT_S) fail()
        }, 1000)
        loadLibs().then(() => {
          starting = false
          progress(0.3)
          if (dead) return
          if (isVectorSkinV4(state.skinId) && !gl) mountGL()
        }).catch(() => { starting = false; fail() })
      }

      const ctl = {
        update(next) {
          const skinChanged = !!next.skinId && next.skinId !== state.skinId
          if (next.skinId) state.skinId = next.skinId
          if (next.cafes) state.cafes = next.cafes
          if (next.live) state.live = next.live
          if (skinChanged) { if (isVectorSkinV4(state.skinId)) showVector(); else showPlain(); return }
          if (!gl || dead) return
          try { const src = gl.getSource('cafes'); if (src && src.setData) src.setData(data()) } catch (e) {}
        },
        setMode(mode) {
          if (mode === state.mode) return
          state.mode = mode
          if (gl && !dead && state.skinId === MINI) { try { gl.setStyle(style(), { diff: false }) } catch (e) {} }
        },
        setLabels(on) {
          state.labels = !!on
          if (!gl || dead) return
          try {
            const layers = (gl.getStyle() && gl.getStyle().layers) || []
            for (const l of layers) if (l.type === 'symbol') gl.setLayoutProperty(l.id, 'visibility', state.labels ? 'visible' : 'none')
          } catch (e) {}
        },
        isVector: () => !dead && isVectorSkinV4(state.skinId),
      }
      live = ctl
      if (isVectorSkinV4(state.skinId)) showVector(); else showPlain()
      return ctl
    },
    setMode(mode) { if (live) live.setMode(mode) },
    setLabels(on) { if (live) live.setLabels(on) },
  }
  return base
}
