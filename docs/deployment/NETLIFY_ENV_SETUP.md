# Netlify Environment Variables Setup

## ⚠️ Dependencies Requirement

### Required Package Dependencies

Ensure the following packages are installed for successful Netlify deployments:

```bash
# Core HTTP client library
npm install axios

# Other critical dependencies should be listed in package.json
```

**Note**: Axios was added to resolve Netlify build errors where the package was required but missing during the build process. Even if not directly used in the current codebase, it may be required by build tools or dependencies.

## 🚨 URGENT: Firebase Admin SDK Configuration Required

If you're seeing Firebase initialization errors during deployment, this is **critical** for your build to succeed.

## Required Environment Variables

Set these in your Netlify site settings under "Site settings" → "Build & deploy" → "Environment variables":

### Firebase Admin SDK (Required for Build Success)

```bash
# Core Firebase credentials - ALL THREE REQUIRED
FIREBASE_PROJECT_ID=unicorndev-b532a
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@unicorndev-b532a.iam.gserviceaccount.com

# Optional Firebase credentials (recommended for enhanced security)
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_ID=your_client_id
```

### Firebase Client Configuration

```bash
# Required for push notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# Optional public Firebase config (usually hardcoded in firebase.ts)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unicorndev-b532a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unicorndev-b532a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1047490636656
NEXT_PUBLIC_FIREBASE_APP_ID=1:1047490636656:web:851d9f253f1c7da6057db5
```

### Build Environment (Required)

```bash
# Node.js version
NODE_VERSION=18

# NPM configuration
NPM_FLAGS=--legacy-peer-deps

# Build phase identification
NEXT_PHASE=phase-production-build
```

### Security Configuration

```bash
# Secrets scanning
SECRETS_SCAN_OMIT_PATHS=".env.example,.env.local,node_modules/**,docs/**,.firebaserc,firebase.json"
SECRETS_SCAN_OMIT_KEYS="FIREBASE_PRIVATE_KEY,FIREBASE_SERVICE_ACCOUNT_JSON"
```

## 🔥 Quick Fix for Current Build Failures

If your deployment is currently failing with Firebase errors:

1. **Get Firebase Service Account Credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project `unicorndev-b532a`
   - Go to Project Settings → Service accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Extract Required Values**:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

3. **Set in Netlify**:
   - Go to Netlify Dashboard → Your Site → Site settings → Environment variables
   - Add the three required Firebase variables above
   - Trigger a new deployment

4. **Get VAPID Key**:
   - In Firebase Console: Project Settings → Cloud Messaging
   - Under "Web Push certificates", generate or copy existing key
   - Set as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## How to Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to "Site settings"
4. Click on "Build & deploy" in the left sidebar
5. Scroll down to "Environment variables"
6. Click "Add variable" for each variable above
7. Set the Key and Value, then click "Save"

## Testing Environment Variables

After setting up the variables, you can test them using the debug endpoint:

```
GET https://your-site.netlify.app/api/netlify-test
```

This will show you which environment variables are properly set.

## Firebase Setup

Make sure your Firebase project is properly configured:

1. Firebase Authentication is enabled
2. Firestore database is created
3. Storage bucket is configured
4. Web push certificates are generated (for VAPID key)

## Troubleshooting

If you're still getting 404 errors after setting environment variables:

1. Check the Netlify deploy logs for build errors
2. Test the API endpoints using the netlify-test route
3. Verify that the Firebase configuration is correct
4. Ensure the build process completed successfully
