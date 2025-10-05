# Fixing Firebase Admin SDK Initialization Errors on Netlify

## Problem

During Netlify deployment, you're seeing errors like:

```
Firebase Admin SDK initialization failed: Error: Firebase service account credentials are not set in the environment.
```

This happens during the build process when Next.js tries to statically generate pages that use Firebase Admin SDK.

## Root Cause

The Firebase Admin SDK requires service account credentials to initialize, but these are not set in your Netlify environment variables.

## Solution Steps

### Step 1: Get Your Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`unicorndev-b532a`)
3. Go to **Project Settings** (gear icon)
4. Click on **Service accounts** tab
5. Click **Generate new private key**
6. Save the downloaded JSON file securely

### Step 2: Extract Required Values from Service Account JSON

From the downloaded JSON file, you'll need these values:

- `project_id` → Use for `FIREBASE_PROJECT_ID`
- `private_key` → Use for `FIREBASE_PRIVATE_KEY`
- `client_email` → Use for `FIREBASE_CLIENT_EMAIL`
- `private_key_id` → Use for `FIREBASE_PRIVATE_KEY_ID` (optional)
- `client_id` → Use for `FIREBASE_CLIENT_ID` (optional)

### Step 3: Set Environment Variables in Netlify

1. Go to your [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings**
4. Click **Environment variables** in the left sidebar
5. Add these variables:

#### Required Variables:

```
FIREBASE_PROJECT_ID=unicorndev-b532a
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@unicorndev-b532a.iam.gserviceaccount.com
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

#### Optional Variables (for enhanced security):

```
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_ID=your_client_id
```

#### Build Configuration:

```
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

### Step 4: Important Notes for Private Key

⚠️ **Critical**: When setting `FIREBASE_PRIVATE_KEY`:

- Include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Ensure newlines are properly escaped as `\n`
- Example format:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----
  ```

### Step 5: Get VAPID Key for Push Notifications

1. In Firebase Console, go to **Project Settings**
2. Click on **Cloud Messaging** tab
3. Under **Web configuration**, find **Web Push certificates**
4. Generate a new certificate or copy the existing key pair
5. Use the **Key pair** value for `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Step 6: Redeploy Your Site

After setting all environment variables:

1. Go back to your Netlify site dashboard
2. Click **Deploys**
3. Click **Trigger deploy** → **Deploy site**
4. Monitor the build logs to ensure Firebase initialization succeeds

## Verification

### 1. Check Build Logs

After deployment, check the build logs for:

- ✅ No Firebase initialization errors
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ Successful static page generation

### 2. Test API Endpoints

Test your Firebase-dependent endpoints:

```bash
curl https://your-site.netlify.app/api/auth/session
curl https://your-site.netlify.app/api/expenses
curl https://your-site.netlify.app/api/maintenance/tasks
```

### 3. Use Debug Endpoint

Visit your debug endpoint to verify environment variables:

```
https://your-site.netlify.app/api/netlify-test
```

## Troubleshooting

### Build Still Failing?

1. **Check Variable Names**: Ensure exact spelling of environment variable names
2. **Private Key Format**: Verify the private key includes proper line breaks (`\n`)
3. **Project ID**: Confirm it matches your Firebase project ID exactly
4. **Regenerate Keys**: Try generating a new service account key

### Runtime Errors?

1. **Check Netlify Environment Variables**: Verify all variables are set correctly
2. **Test Locally**: Run `npm run build` locally with same environment variables
3. **Check Firebase Rules**: Ensure Firestore/Auth rules allow your operations

### Still Getting Errors?

1. Check the updated Firebase Admin initialization code handles build-time gracefully
2. Verify your Firebase project permissions
3. Ensure the service account has the necessary roles (Firebase Admin SDK Admin Service Agent)

## Security Best Practices

1. **Never commit** service account credentials to your repository
2. **Use individual environment variables** instead of the full JSON when possible
3. **Regularly rotate** service account keys
4. **Monitor** Firebase usage and access logs
5. **Use least privilege** - only grant necessary permissions to service accounts

## Alternative: Using Service Account JSON

If you prefer to use the complete JSON:

1. Copy the entire contents of your service account JSON file
2. Set it as `FIREBASE_SERVICE_ACCOUNT_JSON` in Netlify
3. Ensure proper escaping of quotes and newlines

Example:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"unicorndev-b532a",...}
```

## Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
