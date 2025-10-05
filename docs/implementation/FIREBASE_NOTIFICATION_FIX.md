# Firebase Firestore Notification System Fix

## Problem Summary
Your apartment F2 notification system was experiencing `ERR_QUIC_PROTOCOL_ERROR` and subsequent 400 Bad Request errors when setting up Firestore `onSnapshot` listeners. This was causing the real-time notification system to fail.

## Root Causes Identified

1. **QUIC Protocol Issues**: Firebase SDK v11.10.0 defaults to HTTP/3 (QUIC) which can cause connection issues in certain network environments
2. **Multiple Parallel Listeners**: Running two `onSnapshot` listeners simultaneously can cause connection conflicts
3. **Connection Management**: Lack of proper retry logic and connection health monitoring
4. **Configuration Issues**: Hardcoded Firebase config without environment variable fallbacks

## Solutions Implemented

### 1. Firebase Configuration Optimization (`src/lib/firebase.ts`)
- **Forced Long Polling**: Disabled QUIC/HTTP3 by setting `experimentalForceLongPolling: true`
- **Reduced Cache Size**: Lowered from 40MB to 10MB to prevent memory issues
- **Environment Variables**: Added fallback to environment variables for better configuration management

```typescript
db = initializeFirestore(app, {
  // Force long polling to avoid QUIC protocol issues
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  // Reduce cache size to prevent memory issues
  cacheSizeBytes: 10000000, // 10MB cache
  // Disable local cache persistence to avoid conflicts
  localCache: undefined,
});
```

### 2. Robust Notification Listener (`src/lib/notification-listener.ts`)
- **Single Unified Query**: Replaced dual parallel queries with a single query to reduce conflicts
- **Exponential Backoff Retry**: Implemented intelligent retry logic with increasing delays
- **Connection Health Monitoring**: Added proper error handling and connection state management
- **Graceful Fallback**: Falls back to separate queries if unified query fails

### 3. Connection Health Monitor (`src/lib/firebase-health-monitor.ts`)
- **Real-time Health Tracking**: Monitors connection status, error counts, and connection type
- **Diagnostic Capabilities**: Detects QUIC usage, network conditions, and proxy interference
- **Performance Monitoring**: Tracks successful operations and connection stability

### 4. Service Worker Optimization (`public/firebase-messaging-sw.js`)
- **Connection Stability**: Forces HTTP/1.1 for Firebase requests to avoid QUIC issues
- **Background Message Handling**: Proper handling of push notifications
- **Error Recovery**: Graceful handling of network failures

### 5. Debug and Testing Tools
- **Firebase Debug Panel**: Real-time connection monitoring and diagnostic report generation
- **Notification System Test**: Comprehensive testing suite for all notification components
- **Configuration Validator**: Validates Firebase setup and provides troubleshooting guidance

## How to Use the Fix

### 1. Immediate Testing
1. Start your development server: `npm run dev`
2. Look for the debug panels in the bottom-right corner (development only)
3. Click "Test Notification System" to run comprehensive diagnostics
4. Check the "Firebase Debug Panel" for real-time connection health

### 2. Environment Configuration
Create or update your `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Firestore Security Rules
Ensure your rules allow authenticated users to access notifications:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notifications/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting Steps

### If Issues Persist:

1. **Check Network Environment**:
   - Test in incognito mode to rule out browser extensions
   - Try different networks (mobile hotspot vs WiFi)
   - Check if behind corporate firewall

2. **Browser Compatibility**:
   - Test in different browsers (Chrome, Firefox, Safari)
   - Clear browser cache and cookies
   - Disable ad blockers temporarily

3. **Firebase Console**:
   - Verify Firestore is enabled
   - Test security rules in Firebase Console simulator
   - Check Firebase project quotas and limits

4. **Use Debug Tools**:
   - Run the diagnostic test suite
   - Generate and review diagnostic reports
   - Monitor connection health in real-time

## Key Improvements

1. **Reliability**: Exponential backoff retry ensures connections recover from temporary failures
2. **Performance**: Optimized cache settings and single query approach reduce overhead
3. **Monitoring**: Real-time health monitoring helps identify issues quickly
4. **Debugging**: Comprehensive diagnostic tools for troubleshooting
5. **Compatibility**: Forced long polling ensures compatibility across network environments

## Production Deployment

Before deploying to production:

1. **Remove Debug Components**: The debug panels are automatically hidden in production
2. **Set Environment Variables**: Configure all Firebase environment variables in your hosting provider
3. **Test Thoroughly**: Run the diagnostic tests in your production environment
4. **Monitor Performance**: Use the health monitor to track connection stability

## Latest Updates (Based on Error Analysis)

### Additional Fixes Applied:

1. **Permission Issues Fixed**:
   - Updated health monitor to use `notifications` collection instead of `health-check`
   - Added explicit Firestore rules for notifications collection
   - Fixed permission denied errors in health checks

2. **Idle Timeout Handling**:
   - Added automatic listener refresh every 5 minutes to prevent idle timeouts
   - Special handling for "CANCELLED" errors (Code: 1) with immediate restart
   - Improved error detection for "Timed out waiting for new targets" errors

3. **Query Optimization**:
   - Removed invalid unified query that mixed string and array types
   - Simplified to use separate queries with proper error handling
   - Added keep-alive mechanism to maintain connection health

### Error Patterns Addressed:

- `Missing or insufficient permissions` → Fixed by using accessible collections
- `GrpcConnection RPC 'Listen' stream error. Code: 1 CANCELLED` → Added idle timeout handling
- `Timed out waiting for new targets` → Implemented automatic listener refresh

## Expected Results

After implementing this fix, you should see:
- ✅ Stable Firestore connections without QUIC protocol errors
- ✅ Reliable real-time notification updates
- ✅ Proper error handling and automatic recovery
- ✅ No more permission denied errors in health checks
- ✅ Automatic recovery from idle timeouts
- ✅ Clear diagnostic information for troubleshooting
- ✅ Better performance and reduced connection overhead

The notification system should now work reliably for apartment F2 and all other apartments in your system.