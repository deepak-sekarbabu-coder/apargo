# Payment Status Widget Troubleshooting Guide

## Issue Description

The Payment Status section is not loading/displaying in the Netlify deployment, while it may work fine locally.

## Quick Diagnostics

### 1. Check Browser Console

Open browser developer tools and look for:

- JavaScript errors in the Console tab
- Failed network requests in the Network tab
- Any red error messages related to "payment-events" or "PaymentStatusWidget"

### 2. Test API Endpoints

Run the following URLs in your browser (replace `your-site.netlify.app` with your actual domain):

```bash
# Health check endpoint
https://your-site.netlify.app/api/payment-events/health

# Netlify configuration check
https://your-site.netlify.app/api/netlify-test

# Payment events endpoint (should require authentication)
https://your-site.netlify.app/api/payment-events
```

### 3. Run Automated Tests

```bash
# Test locally
npm run test:payment-events http://localhost:3000

# Test deployed site
npm run test:payment-events https://your-site.netlify.app
```

## Common Issues & Solutions

### Issue 1: API Routes Not Found (404 Errors)

**Symptoms:**

- Payment Status section completely missing
- Network tab shows 404 errors for `/api/payment-events`
- Error boundary shows "service not found" message

**Solution:**

1. Check Netlify build logs for API route generation errors
2. Verify `netlify.toml` configuration includes API redirects
3. Ensure Next.js API routes are in correct format (`src/app/api/*/route.ts`)

**Fix:**

```bash
# Rebuild and redeploy
npm run netlify-build
```

### Issue 2: Authentication Failures

**Symptoms:**

- Error shows "Authentication required" or "401 Unauthorized"
- User is logged in but API calls fail
- Session cookies not being sent

**Solution:**

1. Check Firebase Admin configuration in Netlify environment variables
2. Verify session management is working
3. Test authentication with other API endpoints

**Environment Variables Required:**

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Issue 3: Firebase Configuration Issues

**Symptoms:**

- Health check shows Firebase Admin as unavailable
- Firestore connection failures
- "Firebase Admin not initialized" errors

**Solution:**

1. Verify all Firebase environment variables are set in Netlify
2. Check that private key is properly formatted (include newlines)
3. Ensure Firebase project permissions are correct

**Test:**

```bash
curl https://your-site.netlify.app/api/payment-events/health
```

### Issue 4: Component Rendering Errors

**Symptoms:**

- Error boundary shows "Something went wrong"
- Component crashes on render
- Console shows React/TypeScript errors

**Solution:**

1. Check console for specific error messages
2. Verify user data is properly passed to component
3. Check for missing dependencies or import errors

### Issue 5: Network/Timeout Issues

**Symptoms:**

- Error shows "Request timed out"
- Long loading times before failure
- Intermittent failures

**Solution:**

1. Check Netlify function logs for performance issues
2. Verify Firestore connection stability
3. Check for any rate limiting or quota issues

## Debugging Steps

### Step 1: Enable Debug Mode

Add this to your environment variables in Netlify:

```
DEBUG=payment-events:*
```

### Step 2: Check Component Props

Verify the user object has required properties:

```javascript
console.log('User data:', {
  id: user?.id,
  apartment: user?.apartment,
  name: user?.name,
});
```

### Step 3: Test API Manually

```bash
# Test health endpoint
curl -v https://your-site.netlify.app/api/payment-events/health

# Test with authentication (need actual session cookie)
curl -v -H "Cookie: session=your-session-cookie" \
  https://your-site.netlify.app/api/payment-events?monthYear=2025-08
```

### Step 4: Check Netlify Function Logs

1. Go to Netlify dashboard
2. Navigate to Functions tab
3. Check logs for payment-events related functions
4. Look for error messages, timeouts, or crashes

## Emergency Fixes

### Quick Fix 1: Disable Payment Status Widget

If the component is causing crashes, temporarily disable it:

```typescript
// In dashboard-view.tsx, comment out the PaymentStatusWidget
{
  /* 
{user && (
  <PaymentStatusWidget
    currentUser={{
      id: user.id,
      apartment: user.apartment,
      name: user.name,
    }}
  />
)}
*/
}
```

### Quick Fix 2: Add Fallback Message

Replace the component with a simple status message:

```typescript
{user && (
  <Card>
    <CardHeader>
      <CardTitle>Payment Status</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Payment tracking is temporarily unavailable. Please check back later.</p>
    </CardContent>
  </Card>
)}
```

## Prevention

### For Future Deployments

1. Always test payment events endpoints before deploying
2. Run `npm run test:payment-events` on both local and deployed versions
3. Check health endpoint after each deployment
4. Monitor Netlify function logs for the first few hours after deployment

### Monitoring Setup

1. Set up Netlify function monitoring
2. Add error tracking for payment-related failures
3. Create alerts for payment events API failures

## Getting Help

If issues persist:

1. Collect browser console logs
2. Run diagnostic script: `npm run test:payment-events`
3. Share Netlify function logs
4. Include environment configuration (without sensitive values)
5. Note any recent changes to Firebase configuration or user authentication
