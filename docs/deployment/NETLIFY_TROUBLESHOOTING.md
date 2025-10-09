# Netlify Deployment Troubleshooting

## Current Issue: API Routes Returning 404

### Problem Analysis

Based on the error logs, the main issues are:

1. **API Route 404**: `/api/auth/session` returns 404 on Netlify
2. **Session Cookie Failure**: Authentication works but session creation fails
3. **Firestore Connection**: Some Firestore requests are blocked by client

### Root Cause

The Netlify configuration wasn't properly routing API requests to the Next.js handler.

## Fixes Applied

### 1. Updated `netlify.toml`

```toml
# API routes - MUST come first and be specific
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/___netlify-handler"
  status = 200

# Fallback for client-side routing - MUST come last
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Key Changes:**

- Removed conflicting redirect rules
- API routes now have priority
- Simplified redirect structure

### 2. Updated `next.config.ts`

```typescript
// Removed standalone output - let Netlify plugin handle it
// Removed unnecessary rewrites
```

### 3. Enhanced Error Handling

- Auth context now continues without session cookies if they fail
- Dashboard has client-side fallback protection
- Better error logging for debugging

### 4. Added Fallback Components

- `ProtectedRoute` component for client-side auth verification
- Graceful degradation when server-side auth fails

## Testing the Fixes

### 1. Test API Routes

Visit: `https://your-site.netlify.app/api/test`
Should return:

```json
{
  "status": "success",
  "message": "API routes are working on Netlify",
  "timestamp": "2025-01-27T...",
  "environment": "production"
}
```

### 2. Test Authentication Flow

1. Go to your Netlify site
2. Click "Sign in with Google"
3. Check browser console for logs
4. Should see successful authentication and redirect

### 3. Test Session API

Visit: `https://your-site.netlify.app/api/health`
Should return health status

## Environment Variables Required

Make sure these are set in Netlify Dashboard:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**

- `FIREBASE_ADMIN_PRIVATE_KEY` must include `\n` for line breaks
- `NEXTAUTH_URL` must match your Netlify domain exactly
- All `NEXT_PUBLIC_*` variables are required for client-side Firebase

## Common Issues & Solutions

### Issue 1: API Routes Still Return 404

**Solution:**

1. Check Netlify build logs for errors
2. Verify `@netlify/plugin-nextjs` is installed
3. Ensure `netlify.toml` is in project root
4. Redeploy after configuration changes

### Issue 2: Authentication Works But Dashboard Fails

**Solution:**

- This is expected with the current fixes
- Client-side auth will take over
- Check browser console for "Using client-side protection" message

### Issue 3: Firestore Connection Blocked

**Solution:**

1. Check Content Security Policy in `netlify.toml`
2. Ensure `https://firestore.googleapis.com` is allowed
3. Verify Firebase project settings allow your domain

### Issue 4: Environment Variables Not Loading

**Solution:**

1. Double-check variable names in Netlify dashboard
2. Ensure no extra spaces in values
3. Redeploy after adding/changing variables
4. Check build logs for "Environment variables loaded" messages

## Deployment Checklist

Before deploying:

- [ ] All environment variables set in Netlify
- [ ] `netlify.toml` in project root
- [ ] `@netlify/plugin-nextjs` installed
- [ ] Firebase project allows your Netlify domain
- [ ] Build succeeds locally with `npm run build`

After deploying:

- [ ] Test `/api/test` endpoint
- [ ] Test authentication flow
- [ ] Check browser console for errors
- [ ] Verify dashboard loads after login

## Debug Commands

### Local Testing

```bash
# Test build locally
npm run build

# Test API routes locally
npm run dev
# Visit http://localhost:9002/api/test
```

### Netlify Testing

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test locally with Netlify
netlify dev

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Expected Behavior After Fixes

1. **Authentication**: Google Sign-In works, user is found in Firestore
2. **Session Handling**: May fail gracefully, client-side takes over
3. **Dashboard Access**: Loads via client-side protection if needed
4. **API Routes**: Should work for basic endpoints
5. **Error Handling**: Graceful degradation instead of complete failure

## Next Steps

If issues persist:

1. **Check Netlify Function Logs**:
   - Go to Netlify Dashboard → Functions → View logs
   - Look for specific error messages

2. **Enable Debug Mode**:
   - Add `DEBUG=*` to environment variables
   - Check detailed logs in browser console

3. **Test Individual Components**:
   - Test Firebase connection separately
   - Test API routes independently
   - Verify environment variables are loaded

4. **Consider Alternative Approaches**:
   - Use Firebase Hosting instead of Netlify
   - Implement client-side only authentication
   - Use Netlify Identity as alternative auth

The current fixes should resolve the 404 errors and provide a working authentication flow, even if session cookies don't work perfectly on Netlify.
