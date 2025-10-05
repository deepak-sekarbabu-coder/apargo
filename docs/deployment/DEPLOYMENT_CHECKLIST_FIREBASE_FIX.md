# 🚀 Netlify Deployment Checklist - Firebase Fix

## ✅ Pre-Deployment Checklist

### 1. Firebase Service Account Setup

- [ ] Downloaded Firebase service account JSON from Firebase Console
- [ ] Extracted `project_id`, `private_key`, and `client_email` from JSON
- [ ] Generated/obtained Firebase Web Push VAPID key

### 2. Netlify Environment Variables (CRITICAL)

Go to Netlify Dashboard → Your Site → Site settings → Environment variables

#### Required Firebase Variables:

- [ ] `FIREBASE_PROJECT_ID` = `unicorndev-b532a`
- [ ] `FIREBASE_PRIVATE_KEY` = Full private key with `\n` escaped
- [ ] `FIREBASE_CLIENT_EMAIL` = Service account email
- [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY` = Web push certificate key

#### Build Configuration:

- [ ] `NODE_VERSION` = `18`
- [ ] `NPM_FLAGS` = `--legacy-peer-deps`

#### Optional Security Variables:

- [ ] `FIREBASE_PRIVATE_KEY_ID` = Private key ID from service account
- [ ] `FIREBASE_CLIENT_ID` = Client ID from service account

### 3. Code Updates (Already Done)

- [x] Updated `src/lib/firebase-admin.ts` for graceful build-time handling
- [x] Enhanced `netlify.toml` with proper environment configuration
- [x] Added Firebase diagnostics to `/api/netlify-test` endpoint

## 🛠️ Step-by-Step Fix Process

### Step 1: Get Firebase Credentials

```bash
# 1. Go to Firebase Console: https://console.firebase.google.com/
# 2. Select project: unicorndev-b532a
# 3. Go to: Project Settings → Service accounts
# 4. Click: \"Generate new private key\"
# 5. Download the JSON file
```

### Step 2: Set Netlify Environment Variables

```bash
# In Netlify Dashboard → Site settings → Environment variables:

FIREBASE_PROJECT_ID=unicorndev-b532a
FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_HERE\n-----END PRIVATE KEY-----\"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@unicorndev-b532a.iam.gserviceaccount.com
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

### Step 3: Deploy and Verify

```bash
# 1. Trigger new deployment in Netlify
# 2. Monitor build logs for Firebase success messages
# 3. Test endpoint: https://your-site.netlify.app/api/netlify-test
```

## 🔍 Verification Steps

### 1. Build Log Success Indicators

Look for these in your Netlify build logs:

- [ ] No \"Firebase Admin SDK initialization failed\" errors
- [ ] \"Firebase Admin SDK initialized successfully\" message
- [ ] Successful static page generation without errors
- [ ] Build completes with \"Site is live ✨\"

### 2. Runtime Testing

After deployment, test these endpoints:

- [ ] `GET /api/netlify-test` - Should show Firebase status
- [ ] `GET /api/auth/session` - Should not throw Firebase errors
- [ ] `GET /api/expenses` - Should work with Firebase
- [ ] `GET /api/maintenance/tasks` - Should work with Firebase

### 3. Firebase Status Check

Visit `/api/netlify-test` and verify:

- [ ] `firebase.adminAvailable` = `true`
- [ ] `firebase.initializationError` = `null`
- [ ] All `firebase.credentialsConfigured` = `true`

## 🚨 Troubleshooting Common Issues

### Issue: Private Key Format Error

**Symptoms**: Build fails with \"invalid private key\" or similar
**Solution**: Ensure private key is properly escaped:

```
❌ Wrong: -----BEGIN PRIVATE KEY-----
MIIEvQI...
✅ Correct: \"-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\"
```

### Issue: Environment Variables Not Set

**Symptoms**: Build logs show \"credentials are not set in the environment\"
**Solution**:

1. Double-check variable names (case-sensitive)
2. Ensure values are saved in Netlify (click \"Save\" after each)
3. Trigger new deployment (don't just re-run existing build)

### Issue: Firebase Project Mismatch

**Symptoms**: Authentication or Firestore errors at runtime
**Solution**: Verify `FIREBASE_PROJECT_ID` exactly matches your Firebase project ID

### Issue: VAPID Key Missing

**Symptoms**: Push notifications don't work
**Solution**:

1. In Firebase Console: Project Settings → Cloud Messaging
2. Under \"Web Push certificates\", generate new key pair
3. Copy the key to `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## 📋 Post-Deployment Verification

### Immediate Checks (< 5 minutes)

- [ ] Site loads without errors
- [ ] Login functionality works
- [ ] Dashboard displays data
- [ ] API endpoints respond correctly

### Extended Testing (< 30 minutes)

- [ ] User authentication flows
- [ ] Data creation/modification
- [ ] File uploads (if applicable)
- [ ] Push notification registration
- [ ] All major features functional

## 🔐 Security Notes

### Best Practices Implemented:

- [x] Private keys stored only in Netlify environment (not in code)
- [x] Secrets scanning configuration excludes sensitive variables
- [x] Build-time vs runtime environment detection
- [x] Graceful degradation when credentials unavailable

### Additional Security Recommendations:

- [ ] Regularly rotate Firebase service account keys
- [ ] Monitor Firebase usage and access logs
- [ ] Use principle of least privilege for service account permissions
- [ ] Set up alerts for unauthorized access attempts

## 📞 Support Resources

If you're still experiencing issues:

1. **Check Firebase Console**: Verify project status and quotas
2. **Review Netlify Logs**: Look for specific error messages
3. **Test Locally**: Run `npm run build` with same environment variables
4. **Firebase Support**: Check Firebase status page for outages
5. **Netlify Support**: Contact if deployment infrastructure issues

## 📚 Reference Documentation

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Next.js Build Process](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Project Firebase Fix Guide](./NETLIFY_FIREBASE_FIX.md)

---

**Last Updated**: August 23, 2025
**Status**: Ready for deployment ✅
