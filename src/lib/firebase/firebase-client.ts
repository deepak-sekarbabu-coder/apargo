import { getApp, getApps, initializeApp } from 'firebase/app';

// Check cookie consent before initializing Firebase
const hasCookieConsent = (): boolean => {
  if (typeof window === 'undefined') return true; // Server-side, allow initialization
  const consent = localStorage.getItem('cookie-consent');
  return consent === 'accepted' || consent === null; // Allow by default until user decides
};

// Your web app's Firebase configuration
// Use environment variables for consistency (same approach as firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // For analytics (if used)
};

// Initialize Firebase only with consent
let app: ReturnType<typeof initializeApp> | null = null;

export const getFirebaseApp = () => {
  if (!app && hasCookieConsent() && !getApps().length) {
    app = initializeApp(firebaseConfig);
  } else if (!app && getApps().length) {
    app = getApp();
  }
  return app;
};

// Export the app (backward compatibility)
export const firebaseApp = getFirebaseApp();
