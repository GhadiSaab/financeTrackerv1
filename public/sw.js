const CACHE_NAME = 'finance-tracker-v2';
const STATIC_CACHE = 'finance-tracker-static-v2';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v2');
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network first for HTML documents (always get fresh version)
  if (event.request.mode === 'navigate' || event.request.destination === 'document' ||
      url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the new version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache first for static assets (CSS, JS, images, fonts)
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Default: network only for other requests
  event.respondWith(fetch(event.request));
});
