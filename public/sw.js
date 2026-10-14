// TwinLand service worker
// • صفحه‌ها همیشه اول از شبکه می‌آیند؛ فقط اگر اینترنت نبود صفحه آفلاین نشان داده می‌شود.
// • فایل‌های ساخته‌شده Next در /_next/static/ نام یکتا دارند و از حافظه داده می‌شوند.
// • درخواست به Supabase، نقشه و API هرگز دست نمی‌خورد.
// • اعلان روی گوشی: متن را از تابع push-send می‌گیرد و با لمس، همان صفحه مربوط را باز می‌کند.
const VERSION = 'tl-sw-1'
const STATIC = VERSION + '-static'
const SHELL = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/badge-72.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
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
