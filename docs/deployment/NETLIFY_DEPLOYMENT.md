# Netlify Deployment Guide

## Overview

This guide explains how to deploy the Apargo Next.js application to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Firebase Project**: Ensure your Firebase project is set up
3. **Environment Variables**: Have your Firebase configuration ready

## Deployment Steps

### 1. Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub/GitLab repository
4. Select your repository

### 2. Configure Build Settings

Netlify should automatically detect the settings, but verify:

- **Build command**: `npm run netlify-build`
- **Publish directory**: `.next`
- **Node version**: `18` (set in netlify.toml)

### 3. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key_with_newlines

NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=https://your-site-name.netlify.app
```

### 4. Deploy

1. Click "Deploy site"
2. Wait for build to complete
3. Test your deployed application

## Configuration Files

### netlify.toml

- Main Netlify configuration
- Handles redirects and headers
- Configures Next.js plugin

### public/\_redirects

- Backup redirect configuration
- Handles client-side routing

IMPORTANT: For Next.js App Router projects deployed to Netlify, avoid using a blanket SPA catch-all redirect like `/* /index.html 200` in `public/_redirects`. That redirect can intercept requests to App Router API routes (for example `/api/payment-events/generate`) and return the site's HTML (index.html) instead of routing to the serverless handler, causing 404s or "Invalid JSON" errors when the client expects JSON. The repository removes the SPA catch-all and keeps only the API handler mapping to prevent this issue.

- API route proxying

### next.config.ts

- Next.js configuration for Netlify
- Standalone output mode
- Proper rewrites and redirects

## Common Issues & Solutions

### 1. 404 Errors on Page Refresh

**Problem**: Direct navigation to routes like `/dashboard` returns 404

**Solution**: The `netlify.toml` and `_redirects` files handle this with:

```
/* /index.html 200
```

### 2. API Routes Not Working

**Problem**: `/api/*` routes return 404

**Solution**: Configured in `netlify.toml`:

```
/api/* /.netlify/functions/___netlify-handler 200
```

### 3. Environment Variables Not Loading

**Problem**: Firebase configuration not found

**Solution**:

- Ensure all `NEXT_PUBLIC_*` variables are set in Netlify
- Check variable names match exactly
- Redeploy after adding variables

### 4. Build Failures

**Problem**: Build fails with TypeScript/ESLint errors

**Solution**: Configured in `next.config.ts`:

```typescript
typescript: {
  ignoreBuildErrors: true,
},
eslint: {
  ignoreDuringBuilds: true,
},
```

### 5. Firebase Admin SDK Issues

**Problem**: Server-side Firebase functions fail

**Solution**:

- Ensure `FIREBASE_ADMIN_PRIVATE_KEY` includes `\n` for newlines
- Set `FIREBASE_ADMIN_PROJECT_ID` and `FIREBASE_ADMIN_CLIENT_EMAIL`
- Check service account permissions

## Testing Deployment

### 1. Basic Functionality

- [ ] Home page loads
- [ ] Login page accessible
- [ ] Authentication works
- [ ] Dashboard loads after login

### 2. Routing

- [ ] Direct URL navigation works
- [ ] Page refresh doesn't cause 404
- [ ] Back/forward buttons work

### 3. API Routes

- [ ] Authentication API works
- [ ] Session management functions
- [ ] Firestore operations succeed

### 4. Firebase Integration

- [ ] User authentication
- [ ] Firestore read/write
- [ ] Session cookies work

## Performance Optimization

### 1. Static Assets

- Configured caching headers in `netlify.toml`
- Next.js automatic optimization
- Image optimization enabled

### 2. Build Optimization

- Standalone output mode
- Tree shaking enabled
- Automatic code splitting

### 3. CDN Benefits

- Global edge network
- Automatic HTTPS
- Fast static asset delivery

## Monitoring

### 1. Netlify Analytics

- Enable in site settings
- Monitor page views and performance
- Track build success/failure

### 2. Error Tracking

- Check Netlify function logs
- Monitor browser console errors
- Set up error reporting service

## Troubleshooting

If deployment still has issues:

1. **Check Build Logs**: Look for specific error messages
2. **Test Locally**: Ensure `npm run build` works locally
3. **Environment Variables**: Verify all required variables are set
4. **Firebase Configuration**: Test Firebase connection
5. **Network Tab**: Check for failed API requests

## Support

- [Netlify Documentation](https://docs.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Firebase Hosting vs Netlify](https://firebase.google.com/docs/hosting)
