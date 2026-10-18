// TwinLand service worker
// • صفحه‌ها همیشه اول از شبکه می‌آیند؛ فقط اگر اینترنت نبود صفحه آفلاین نشان داده می‌شود.
//   صفحه آفلاین خودش اتصال را می‌سنجد و با برگشتن اینترنت، صفحه را دوباره باز می‌کند (tl-sw-3).
// • فایل‌های ساخته‌شده Next در /_next/static/ نام یکتا دارند و از حافظه داده می‌شوند.
// • درخواست به Supabase و API هرگز دست نمی‌خورد، جز داده نقشه برداری:
//   تکه‌های نقشه، فونت نوشته‌ها و کتابخانه نقشه از /api/mapkit/ یک بار گرفته و روی دستگاه نگه داشته می‌شوند
//   تا نقشه با اینترنت ضعیف هم فوری باز شود و با کشیدنش خالی نماند. سقف تعداد دارد و قدیمی‌ترها پاک می‌شوند.
// • اعلان روی گوشی: متن را از تابع push-send می‌گیرد و با لمس، همان صفحه مربوط را باز می‌کند.
const VERSION = 'tl-sw-3'
const STATIC = VERSION + '-static'
// حافظه نقشه نام جدا دارد تا با هر نسخه تازه این فایل پاک نشود
const MAPCACHE = 'tl-map-1'
const MAP_MAX = 2500
const MAP_PATHS = ['/api/mapkit/tiles/', '/api/mapkit/fonts/', '/api/mapkit/lib/']
let trimming = false
function trimMap() {
  if (trimming) return
  trimming = true
  caches.open(MAPCACHE).then((c) => c.keys().then((keys) => {
    const extra = keys.length - MAP_MAX
    return extra > 0 ? Promise.all(keys.slice(0, extra + 200).map((k) => c.delete(k))) : null
  })).catch(() => {}).then(() => { trimming = false })
}
const SHELL = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/badge-72.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION) && k !== MAPCACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (MAP_PATHS.some((p) => url.pathname.startsWith(p))) {
    // اول از حافظه دستگاه؛ اگر نبود از شبکه و نگه داشتن پاسخ سالم
    event.respondWith(
      caches.open(MAPCACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok && res.status === 200) { c.put(req, res.clone()).then(() => { if (Math.random() < 0.02) trimMap() }).catch(() => {}) }
        return res
      })))
    )
    return
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ingest')) return

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')))
    return
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)) }
        return res
      }))
    )
  }
})

self.addEventListener('push', (event) => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch (e) { d = { title: 'TwinLand', body: event.data ? event.data.text() : '' } }
  const title = d.title || 'TwinLand'
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: d.icon || '/icons/icon-192.png',
    badge: d.badge || '/icons/badge-72.png',
    tag: d.tag || undefined,
    dir: 'rtl',
    lang: 'fa',
    data: { link: d.link || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || '/'
  const target = new URL(link, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.navigate(target).catch(() => {}); return c.focus() }
      }
      return self.clients.openWindow(target)
    })
  )
})
