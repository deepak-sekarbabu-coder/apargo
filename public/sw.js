// Optimized Service Worker for Apargo
const CACHE_NAME = 'apargo-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  // Add your critical static assets here
];

// Cache strategy for different types of requests
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: ['/_next/static/', '/images/', '/icons/'],
  // Network first for API calls
  api: ['/api/'],
  // Stale while revalidate for pages
  pages: ['/dashboard', '/properties', '/current-faults'],
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Determine cache strategy
  let strategy = 'networkFirst';

  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.pathname.startsWith(pattern))) {
      strategy = strategyName;
      break;
    }
  }

  switch (strategy) {
    case 'static':
      event.respondWith(cacheFirst(request));
      break;
    case 'api':
      event.respondWith(networkFirst(request));
      break;
    case 'pages':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}
