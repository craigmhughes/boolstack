// App-shell service worker. Registered by app/components/StoragePersistence.tsx.
const CACHE = 'boolstack-shell-v3';
const PRECACHE = ['/', '/manifest.json'];

// Precache the shell. Each URL is added on its own so one failure doesn't drop the rest.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// Remove old boolstack caches, then take control of open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('boolstack-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === 'blob:' || url.protocol === 'chrome-extension:') return;
  if (url.pathname === '/_next/webpack-hmr' || url.href.includes('__nextjs')) return;

  // Page navigations: network first, keep a fresh copy, offline fall back to that route's cached copy, then the shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static build assets and PGlite binaries: cache first, then network (and cache the result).
  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.wasm') || url.pathname.endsWith('.data')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
    return;
  }

  // Everything else: network, no special handling.
});
