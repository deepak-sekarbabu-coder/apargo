# Netlify Deployment Checklist

## Pre-Deployment Steps

### 1. Local Testing

- [ ] Run `npm run dev` and verify the app loads
- [ ] Test API endpoints: `curl http://localhost:3000/api/health`
- [ ] Test maintenance endpoints: `curl http://localhost:3000/api/maintenance/tasks`
- [ ] Test the netlify-test endpoint: `curl http://localhost:3000/api/netlify-test`

### 2. Build Testing

- [ ] Run `npm run build` successfully without errors
- [ ] Run `npm run debug-netlify` to check the build output
- [ ] Verify API routes exist in `.next/server/app/api/`

### 3. Configuration Files

- [ ] `netlify.toml` is properly configured
- [ ] `next.config.ts` is updated with correct settings
- [ ] Environment variables are documented

## Deployment Steps

### 1. Netlify Site Setup

- [ ] Site is connected to your Git repository
- [ ] Build command is set to: `npm run netlify-build`
- [ ] Publish directory is set to: `.next`

### 2. Environment Variables (Critical!)

- [ ] `FIREBASE_PROJECT_ID` is set
- [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set
- [ ] All other Firebase environment variables are configured
- [ ] `NODE_VERSION=18` is set
- [ ] `NPM_FLAGS=--legacy-peer-deps` is set

### 3. Plugin Configuration

- [ ] `@netlify/plugin-nextjs` is installed and configured
- [ ] Latest version of the plugin is being used

## Post-Deployment Testing

### 1. Basic Functionality

- [ ] Site loads without errors
- [ ] Test health endpoint: `https://your-site.netlify.app/api/health`
- [ ] Test netlify-test endpoint: `https://your-site.netlify.app/api/netlify-test`

### 2. API Endpoints

- [ ] Authentication endpoints work
- [ ] Maintenance API endpoints work
- [ ] Expense API endpoints work
- [ ] Payment events API endpoints work: `https://your-site.netlify.app/api/payment-events/health`
- [ ] Payment events API with authentication: `https://your-site.netlify.app/api/payment-events`
- [ ] All other API routes return proper responses (not 404 HTML)

### 3. Error Checking

- [ ] Check browser console for JavaScript errors
- [ ] Verify no 404 errors in Network tab
- [ ] Check Netlify function logs for errors

## Common Issues & Solutions

### API Routes Return 404 HTML

- **Cause**: Netlify functions not generated or misconfigured
- **Solution**: Check build logs, verify netlify.toml configuration
- **Test**: Use netlify-test endpoint to verify function routing

### Environment Variable Issues

- **Cause**: Missing or incorrectly named environment variables
- **Solution**: Double-check variable names and values in Netlify UI
- **Test**: Check netlify-test endpoint response for env variable values

### Build Failures

- **Cause**: Dependency issues, TypeScript errors, or configuration problems
- **Solution**: Check Netlify build logs, fix any TypeScript/ESLint errors
- **Test**: Run `npm run build` locally first

### Firebase Connection Issues

- **Cause**: Incorrect Firebase configuration or missing credentials
- **Solution**: Verify Firebase project settings and environment variables
- **Test**: Check if Firebase-dependent endpoints work

## Emergency Rollback

If deployment fails:

1. Check Netlify deploy logs for specific errors
2. Revert to last known working commit
3. Re-deploy from working commit
4. Debug issues in a separate branch

## Performance Monitoring

After successful deployment:

- [ ] Check site performance with Lighthouse
- [ ] Monitor API response times
- [ ] Set up uptime monitoring for critical endpoints
