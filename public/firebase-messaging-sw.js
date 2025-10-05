// Firebase Messaging Service Worker
// This service worker handles background messages and helps with connection stability

importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Environment variables must be properly set during build time
// NOTE: Service workers cannot access process.env directly, so environment variables
// must be replaced during the build process using a custom script
const firebaseConfig = {
  apiKey: undefined,
  authDomain: undefined,
  projectId: undefined,
  storageBucket: undefined,
  messagingSenderId: undefined,
  appId: undefined,
};

// Validate that all required configuration values are present
// In development, we allow missing values to support local testing
// In production, we require all values to be present
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (!isDevelopment) {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || 
      !firebaseConfig.storageBucket || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
    console.error('Firebase configuration is missing required values. Please ensure all environment variables are set during build time.');
    throw new Error('Missing Firebase configuration values in service worker');
  }
}

// Only initialize Firebase if we have a valid configuration
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: 'apartment-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});

// Add connection stability improvements
self.addEventListener('fetch', (event) => {
  // Only handle Firebase requests
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(event.request, {
        // Force HTTP/1.1 to avoid QUIC issues
        headers: {
          ...event.request.headers,
          'Connection': 'keep-alive',
        },
      }).catch((error) => {
        console.error('Firebase request failed:', error);
        // Return a basic error response
        return new Response(JSON.stringify({ error: 'Network error' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  }
});