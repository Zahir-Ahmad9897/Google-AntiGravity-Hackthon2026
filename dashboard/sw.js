const CACHE_NAME = 'ciro-dashboard-v4';

const STATIC_CACHE_URLS = [
  '/',
  '/dashboard/index.html',
  '/manifest.json',
  '/dashboard/manifest.json',
  '/dashboard/icons/icon-192.png',
  '/dashboard/icons/icon-512.png'
];

const API_CACHE_URLS = [
  '/api/scenarios',
  '/api/iterative/scenarios'
];

const STATIC_CACHE_FIRST_PATHS = new Set([
  '/',
  '/dashboard/index.html',
  '/manifest.json',
  '/dashboard/manifest.json',
  '/dashboard/icons/icon-192.png',
  '/dashboard/icons/icon-512.png'
]);

const API_NETWORK_FIRST_PATHS = new Set([
  '/api/scenarios',
  '/api/iterative/scenarios'
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...STATIC_CACHE_URLS, ...API_CACHE_URLS]))
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
  if (url.origin !== self.location.origin) {
    return;
  }

  if (STATIC_CACHE_FIRST_PATHS.has(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (API_NETWORK_FIRST_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  await putInCache(request, networkResponse.clone());
  return networkResponse;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'CIRO cached scenario data is not available yet.'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

async function putInCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}
