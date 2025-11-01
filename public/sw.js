// Enhanced Service Worker with advanced caching strategies
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `apargo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `apargo-dynamic-${CACHE_VERSION}`;
const API_CACHE = `apargo-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `apargo-images-${CACHE_VERSION}`;

// Enhanced cache configuration
const CACHE_CONFIG = {
  static: {
    maxEntries: 50,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    strategy: 'cache-first'
  },
  dynamic: {
    maxEntries: 100,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    strategy: 'stale-while-revalidate'
  },
  api: {
    maxEntries: 50,
    maxAge: 5 * 60 * 1000, // 5 minutes
    strategy: 'network-first'
  },
  images: {
    maxEntries: 200,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    strategy: 'cache-first'
  }
};

// Enhanced static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/site.webmanifest'
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/expenses',
  '/api/payments',
  '/api/categories',
  '/api/users',
  '/api/analytics'
];

// Network timeout for API calls
const NETWORK_TIMEOUT = 3000;

// Background sync tag for offline actions
const SYNC_TAG_EXPENSES = 'sync-expenses';
const SYNC_TAG_PAYMENTS = 'sync-payments';

self.addEventListener('install', event => {
  console.log('🔄 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache critical API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('🚀 Pre-caching API endpoints');
        return Promise.allSettled(
          API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).catch(() => null) // Don't fail if APIs aren't available
          )
        );
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values({STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE}).includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim(),
      // Initialize offline queue
      initializeOfflineQueue()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except for Firebase APIs)
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // Route to appropriate caching strategy
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Enhanced caching strategies
async function handleNavigationRequest(request) {
  try {
    // Network first for navigation
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache, then to offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return cached homepage or create a basic offline response
    const offlineResponse = await caches.match('/') || createOfflineResponse();
    return offlineResponse;
  }
}

async function handleImageRequest(request) {
  // Cache first for images
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder image or empty response
    return new Response('', { status: 404 });
  }
}

async function handleAPIRequest(request) {
  // Network first with cache fallback for APIs
  try {
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for APIs
    return new Response(
      JSON.stringify({ 
        offline: true, 
        message: 'This content is not available offline',
        timestamp: new Date().toISOString()
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleStaticAsset(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

async function handleDynamicRequest(request) {
  // Stale-while-revalidate for dynamic content
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  
  return cachedResponse || await networkResponsePromise || createOfflineResponse();
}

// Utility functions
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('Accept').includes('text/html'));
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(request.url);
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         API_ENDPOINTS.some(endpoint => request.url.includes(endpoint));
}

function isStaticAsset(request) {
  return request.destination === 'style' ||
         request.destination === 'script' ||
         /\.(css|js|woff|woff2|ttf|eot)$/i.test(request.url);
}

async function fetchWithTimeout(request, timeout) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Network timeout')), timeout)
  );
  
  return Promise.race([fetch(request), timeoutPromise]);
}

function createOfflineResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Apargo - Offline</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          text-align: center; 
          padding: 2rem;
          background: #f8f9fa;
          color: #495057;
        }
        .container { 
          max-width: 400px; 
          margin: 0 auto; 
        }
        .icon { 
          font-size: 4rem; 
          margin-bottom: 1rem; 
        }
        h1 { color: #343a40; }
        p { margin-bottom: 1rem; }
        .retry-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .retry-btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>The Apargo app is currently offline. Some features may be limited.</p>
        <p>Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG_EXPENSES) {
    event.waitUntil(syncOfflineExpenses());
  } else if (event.tag === SYNC_TAG_PAYMENTS) {
    event.waitUntil(syncOfflinePayments());
  }
});

async function initializeOfflineQueue() {
  // Initialize offline storage for unsynced actions
  const offlineData = await getOfflineData();
  console.log('📊 Offline data initialized:', offlineData);
}

async function syncOfflineExpenses() {
  const offlineData = await getOfflineData();
  const expenses = offlineData.expenses || [];
  
  for (const expense of expenses) {
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      await removeOfflineExpense(expense.id);
    } catch (error) {
      console.error('Failed to sync expense:', error);
    }
  }
}

async function syncOfflinePayments() {
  const offlineData = await getOfflineData();
  const payments = offlineData.payments || [];
  
  for (const payment of payments) {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
      await removeOfflinePayment(payment.id);
    } catch (error) {
      console.error('Failed to sync payment:', error);
    }
  }
}

// Offline data management
async function getOfflineData() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const offlineKey = 'offline-data';
    const response = await cache.match(offlineKey);
    return response ? await response.json() : { expenses: [], payments: [] };
  } catch (error) {
    return { expenses: [], payments: [] };
  }
}

async function saveOfflineExpense(expense) {
  const offlineData = await getOfflineData();
  offlineData.expenses.push(expense);
  await saveOfflineData(offlineData);
}

async function removeOfflineExpense(expenseId) {
  const offlineData = await getOfflineData();
  offlineData.expenses = offlineData.expenses.filter(e => e.id !== expenseId);
  await saveOfflineData(offlineData);
}

async function saveOfflinePayment(payment) {
  const offlineData = await getOfflineData();
  offlineData.payments.push(payment);
  await saveOfflineData(offlineData);
}

async function removeOfflinePayment(paymentId) {
  const offlineData = await getOfflineData();
  offlineData.payments = offlineData.payments.filter(p => p.id !== paymentId);
  await saveOfflineData(offlineData);
}

async function saveOfflineData(data) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put('offline-data', response);
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SAVE_OFFLINE_EXPENSE':
      saveOfflineExpense(data);
      break;
    case 'SAVE_OFFLINE_PAYMENT':
      saveOfflinePayment(data);
      break;
    case 'GET_OFFLINE_STATUS':
      getOfflineData().then(offlineData => {
        event.ports[0].postMessage({
          type: 'OFFLINE_STATUS',
          data: {
            hasOfflineExpenses: offlineData.expenses.length > 0,
            hasOfflinePayments: offlineData.payments.length > 0,
            totalOfflineItems: offlineData.expenses.length + offlineData.payments.length
          }
        });
      });
      break;
    case 'TRIGGER_SYNC':
      if ('sync' in self.registration) {
        self.registration.sync.register(SYNC_TAG_EXPENSES);
        self.registration.sync.register(SYNC_TAG_PAYMENTS);
      }
      break;
  }
});

// Cache cleanup for storage optimization
async function cleanupCaches() {
  const cacheNames = [DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    // Limit cache size
    if (keys.length > 100) {
      const keysToDelete = keys.slice(0, keys.length - 100);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  }
}

// Periodic cache cleanup
setInterval(cleanupCaches, 60 * 60 * 1000); // Every hour
