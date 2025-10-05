/**
 * Firebase Configuration Validator
 * Validates Firebase configuration and provides setup guidance
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export function validateFirebaseConfig(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    result.warnings.push('Running in server environment - some checks skipped');
    return result;
  }

  // Check Firebase configuration using environment variables with fallback to hardcoded values
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA7g7daznFO-dDWYv8-jT08DDZlJSFT1lE',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'unicorndev-b532a.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unicorndev-b532a',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'unicorndev-b532a.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1047490636656',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1047490636656:web:851d9f253f1c7da6057db5',
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
  
  for (const field of requiredFields) {
    if (!config[field as keyof typeof config]) {
      result.errors.push(`Missing required Firebase config field: ${field}`);
      result.isValid = false;
    }
  }

  // Check for placeholder values
  if (config.apiKey === 'your-api-key-here' || config.apiKey.length < 30) {
    result.errors.push('Firebase API key appears to be invalid or placeholder');
    result.isValid = false;
  }

  if (config.projectId === 'your-project-id' || config.projectId.length < 5) {
    result.errors.push('Firebase project ID appears to be invalid or placeholder');
    result.isValid = false;
  }

  // Check environment variables
  const envVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check if environment variables are set
  let hasEnvVars = false;
  for (const [, value] of Object.entries(envVars)) {
    if (value) {
      hasEnvVars = true;
      break;
    }
  }

  if (!hasEnvVars) {
    result.warnings.push('No Firebase environment variables detected - using hardcoded config');
    result.suggestions.push('Consider using environment variables for Firebase configuration');
  }

  // Check for VAPID key for push notifications
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
    result.warnings.push('VAPID key not configured - push notifications will not work');
    result.suggestions.push('Set NEXT_PUBLIC_FIREBASE_VAPID_KEY for push notification support');
  }

  // Check browser compatibility
  if (!window.indexedDB) {
    result.errors.push('IndexedDB not supported - Firestore offline persistence unavailable');
    result.isValid = false;
  }

  if (!window.WebSocket) {
    result.warnings.push('WebSocket not supported - will fall back to long polling');
  }

  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    result.warnings.push('Service Worker not supported - push notifications unavailable');
  }

  // Check network conditions
  const connection = (navigator as {
    connection?: {
      effectiveType?: string;
    };
    mozConnection?: {
      effectiveType?: string;
    };
    webkitConnection?: {
      effectiveType?: string;
    };
  }).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      result.warnings.push('Slow network detected - consider enabling offline persistence');
      result.suggestions.push('Enable Firestore offline persistence for better performance');
    }
  }

  // Check for ad blockers or extensions that might interfere
  if (window.navigator.plugins.length === 0) {
    result.warnings.push('Possible ad blocker detected - may interfere with Firebase connections');
  }

  // Validate Firestore rules (basic check)
  result.suggestions.push('Ensure Firestore security rules allow authenticated users to read/write notifications');
  result.suggestions.push('Test Firestore rules in Firebase Console simulator');

  return result;
}

export function getFirebaseSetupGuide(): string {
  return `
Firebase Setup Guide for Apartment F2 Notifications
==================================================

1. Firebase Project Configuration:
   - Ensure your Firebase project is properly configured
   - Check that Firestore is enabled
   - Verify authentication is set up

2. Environment Variables:
   Create a .env.local file with:
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

3. Firestore Security Rules:
   Ensure your rules allow authenticated users to access notifications:
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /notifications/{document} {
         allow read, write: if request.auth != null;
       }
     }
   }

4. Network Configuration:
   - If behind a corporate firewall, ensure firestore.googleapis.com is accessible
   - Consider disabling QUIC/HTTP3 if experiencing connection issues
   - Test in incognito mode to rule out browser extensions

5. Troubleshooting Connection Issues:
   - Check browser console for detailed error messages
   - Use Firebase Debug Panel to monitor connection health
   - Test with different browsers and networks
   - Verify Firestore rules in Firebase Console

6. Performance Optimization:
   - Enable Firestore offline persistence for better UX
   - Implement proper error handling and retry logic
   - Use connection pooling and query optimization
  `.trim();
}

// Export validation function for use in components
export type { ValidationResult };