// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// Use environment variables to ensure consistency between client and server
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore initialization with optimized settings for real-time listeners
let db: Firestore;

// Check if we're in a Node.js environment (like during tests)
const isNodeEnvironment = typeof window === 'undefined' || typeof process !== 'undefined';

if (!isNodeEnvironment) {
  try {
    // Try to initialize Firestore with custom settings for browser environment
    db = initializeFirestore(app, {
      // Force long polling to avoid QUIC protocol issues
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
      // Reduce cache size to prevent memory issues
      cacheSizeBytes: 10000000, // 10MB cache
      // Disable local cache persistence to avoid conflicts
      localCache: undefined,
    });
  } catch (error) {
    // If initialization fails (e.g., in Jest environment or due to multiple initializations)
    // fall back to regular getFirestore
    if (error instanceof Error && error.message.includes('already been called')) {
      // Expected if Firestore was already initialized elsewhere
      db = getFirestore(app);
    } else {
      // Handle other initialization errors
      console.warn('initializeFirestore failed, falling back to getFirestore:', error);
      db = getFirestore(app);
    }
  }
} else {
  // In Node.js environment (like Jest tests), use getFirestore directly
  // This avoids issues with initializeFirestore in Node.js environment
  db = getFirestore(app);
}

// Initialize auth only in browser environment to avoid SSR issues
const auth = isNodeEnvironment ? getAuth(app) : getAuth(app);
const messaging = !isNodeEnvironment ? getMessaging(app) : null;

export { db, auth, messaging, app };
