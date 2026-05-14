const CACHE_NAME = 'Sync-shell-v2'

// Only cache truly static assets — never auth-protected pages
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
]

// Never serve these from cache — always fetch fresh from network
const BYPASS_ROUTES = ['/', '/vault', '/folder', '/folders', '/starred', '/settings', '/auth']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
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

  // Always bypass: cross-origin, API, auth, and all app routes
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/_next') ||
    url.hostname.includes('supabase') ||
    BYPASS_ROUTES.some((r) => url.pathname === r || url.pathname.startsWith(r + '/'))
  ) return

  // For static assets only: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
