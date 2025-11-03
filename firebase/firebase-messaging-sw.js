// This file must be in the public directory

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: undefined,
  authDomain: undefined,
  projectId: undefined,
  storageBucket: undefined,
  messagingSenderId: undefined,
  appId: undefined,
  measurementId: 'G-PWXJQV9LCY',
};

// Validate that all required configuration values are present
// In development, we allow missing values to support local testing
// In production, we require all values to be present
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (!isDevelopment) {
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.storageBucket ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
  ) {
    console.error(
      'Firebase configuration is missing required values. Please ensure all environment variables are set during build time.'
    );
    throw new Error('Missing Firebase configuration values in service worker');
  }
}

// Only initialize Firebase if we have a valid configuration
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(payload => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icon-192x192.png', // Make sure you have an icon file here
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
