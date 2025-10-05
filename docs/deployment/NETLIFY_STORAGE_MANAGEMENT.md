# Netlify Storage Management Guide

## Current Issue: "Insufficient Storage"

Your Netlify deployment is failing due to storage limitations. Here's how to fix it:

## Immediate Actions (Do These First)

### 1. Clean Up Old Deployments

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to "Deploys" tab
4. Delete old deployments you don't need
5. Keep only the last 5-10 deployments

### 2. Check Your Storage Usage

1. In Netlify dashboard, go to "Account" → "Usage"
2. Check your current storage usage
3. See what's consuming space

### 3. Optimize Current Build (We've Done This)

✅ Updated `netlify.toml` with size optimizations
✅ Added build cleanup scripts
✅ Disabled source maps in production
✅ Fixed memory leak warnings

## Build Optimizations Applied

### netlify.toml Changes:

- Added `GENERATE_SOURCEMAP = "false"`
- Added `NEXT_TELEMETRY_DISABLED = "1"`
- Added function size optimizations
- Added Node.js memory limits

### Scripts Added:

- `scripts/netlify-optimize.js` - Pre-build optimization
- `scripts/post-build-cleanup.js` - Post-build cleanup
- `src/lib/node-optimization.js` - Runtime optimizations
- `src/lib/firebase-connection-manager.ts` - Prevents memory leaks

## Next Steps

### 1. Test the Optimizations

```bash
npm run netlify-build
```

### 2. Deploy with Optimizations

1. Commit all changes
2. Push to your repository
3. Monitor the Netlify build logs

### 3. If Still Failing - Upgrade Plan

If you're still hitting storage limits:

1. Consider upgrading to Netlify Pro ($19/month)
2. Pro plan includes:
   - 100GB bandwidth
   - 1000 minutes build time
   - Larger function size limits

### 4. Alternative Solutions

If upgrading isn't an option:

1. Move to Vercel (similar service, different limits)
2. Use Firebase Hosting + Cloud Functions
3. Deploy to Railway or Render

## Memory Leak Fixes Applied

### EventEmitter Warnings Fixed:

✅ Increased `defaultMaxListeners` to 15
✅ Added proper Firebase connection management
✅ Added cleanup handlers for Node.js processes
✅ Optimized HTTP connection pools

### Firebase Connection Management:

✅ Created `FirebaseConnectionManager` singleton
✅ Updated `/api/auth/session` to use connection manager

## Monitoring

### After Deployment, Check:

1. Netlify function logs for errors
2. Browser console for any remaining warnings
3. API endpoints are working correctly

### Test Commands:

```bash
# Test API endpoints after deployment
node scripts/test-netlify-api.js

# Check deployment status
node scripts/deployment-checklist.js
```

## Troubleshooting

### If You Still See "Insufficient Storage":

1. Delete more old deployments
2. Check if you have large files in your repository
3. Consider upgrading Netlify plan
4. Contact Netlify support for plan review

### If You Still See Memory Warnings:

1. Check the browser console (not build logs)
2. Look for specific Firebase connection issues
3. Monitor serverless function execution time

## Cost-Effective Solutions

### Free Tier Optimization:

- Keep only essential deployments
- Use .gitignore for large development files
- Optimize images and static assets
- Remove unused dependencies

### Pro Plan Benefits:

- 100x more storage
- Better performance
- Priority support
- Advanced deployment features
