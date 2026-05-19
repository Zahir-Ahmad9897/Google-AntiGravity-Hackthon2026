const CACHE_NAME = 'ciro-dashboard-v2';

const CACHE_URLS = [
  '/',
  '/dashboard/index.html',
  '/manifest.json',
  '/dashboard/manifest.json',
  '/dashboard/icons/icon-192.png',
  '/dashboard/icons/icon-512.png',
  '/api/scenarios',
  '/api/iterative/scenarios'
];

const CACHE_FIRST_PATHS = new Set([
  '/',
  '/dashboard/index.html',
  '/manifest.json',
  '/dashboard/manifest.json',
  '/dashboard/icons/icon-192.png',
  '/dashboard/icons/icon-512.png',
  '/api/scenarios',
  '/api/iterative/scenarios'
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !CACHE_FIRST_PATHS.has(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});
