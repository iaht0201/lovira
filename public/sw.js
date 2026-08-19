const CACHE_NAME = 'lovira-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with fallback cache for app shell
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Only intercept HTTP/HTTPS schemes
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip caching for API routes, third-party scripts, or chrome extensions
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/chrome-extension')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If successful basic response, cache it
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache if offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // Return index.html for navigation requests (SPA routing)
        if (event.request.mode === 'navigate') {
          const fallbackIndex = await caches.match('/index.html');
          if (fallbackIndex) return fallbackIndex;
          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;
        }

        // Return safe fallback Response instead of undefined
        return new Response('Network offline and resource not cached.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
