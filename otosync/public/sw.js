const CACHE_NAME = 'Sync-shell-v1'
const SHELL = ['/', '/vault', '/settings']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache: API calls, Supabase, auth, cross-origin
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.hostname.includes('supabase')
  ) return

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
