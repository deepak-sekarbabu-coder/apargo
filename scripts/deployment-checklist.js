#!/usr/bin/env node

/**
 * Pre-deployment checklist and validation script
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function checkNetlifyConfig() {
  console.log('🔍 Checking Netlify configuration...');

  const netlifyToml = readFile('netlify.toml');
  if (!netlifyToml) {
    console.log('❌ netlify.toml not found');
    return false;
  }

  const hasPlugin = netlifyToml.includes('@netlify/plugin-nextjs');
  const hasStandaloneRedirect = netlifyToml.includes('/.netlify/functions/___netlify-handler');

  console.log(`   Plugin configured: ${hasPlugin ? '✅' : '❌'}`);
  console.log(
    `   Manual API redirects: ${hasStandaloneRedirect ? '❌ (should be removed)' : '✅'}`
  );

  return hasPlugin && !hasStandaloneRedirect;
}

function checkNextConfig() {
  console.log('\n🔍 Checking Next.js configuration...');

  const nextConfig = readFile('next.config.ts') || readFile('next.config.js');
  if (!nextConfig) {
    console.log('❌ next.config.ts/js not found');
    return false;
  }

  const hasStandalone = nextConfig.includes("output: 'standalone'");
  const hasServerExternals = nextConfig.includes('serverExternalPackages');

  console.log(`   Standalone output: ${hasStandalone ? '✅' : '❌'}`);
  console.log(`   Server externals: ${hasServerExternals ? '✅' : '❌'}`);

  return hasStandalone;
}

function checkApiRoutes() {
  console.log('\n🔍 Checking API routes...');

  const apiDir = 'src/app/api';
  if (!checkFile(apiDir)) {
    console.log('❌ API directory not found');
    return false;
  }

  const routes = [
    'src/app/api/health/route.ts',
    'src/app/api/auth/session/route.ts',
    'src/app/api/test/route.ts',
  ];

  let foundRoutes = 0;
  routes.forEach(route => {
    const exists = checkFile(route);
    const routeName = route.replace('src/app/api/', '').replace('/route.ts', '');
    console.log(`   /${routeName}: ${exists ? '✅' : '❌'}`);
    if (exists) foundRoutes++;
  });

  return foundRoutes > 0;
}

function checkPackageJson() {
  console.log('\n🔍 Checking package.json...');

  const packageJson = readFile('package.json');
  if (!packageJson) {
    console.log('❌ package.json not found');
    return false;
  }

  try {
    const pkg = JSON.parse(packageJson);
    const hasNetlifyPlugin =
      pkg.devDependencies?.['@netlify/plugin-nextjs'] ||
      pkg.dependencies?.['@netlify/plugin-nextjs'];
    const hasNextJs = pkg.dependencies?.['next'];
    const hasNetlifyBuild = pkg.scripts?.['netlify-build'];

    console.log(`   @netlify/plugin-nextjs: ${hasNetlifyPlugin ? '✅' : '❌'}`);
    console.log(`   Next.js: ${hasNextJs ? '✅' : '❌'}`);
    console.log(`   netlify-build script: ${hasNetlifyBuild ? '✅' : '❌'}`);

    return hasNetlifyPlugin && hasNextJs && hasNetlifyBuild;
  } catch (error) {
    console.log('❌ Invalid JSON in package.json');
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('\n🔍 Environment variables...');
  console.log('   Make sure these are set in Netlify dashboard:');
  console.log('   - FIREBASE_PROJECT_ID');
  console.log('   - FIREBASE_PRIVATE_KEY');
  console.log('   - FIREBASE_CLIENT_EMAIL');
  console.log('   - NEXT_PUBLIC_FIREBASE_VAPID_KEY');
  console.log('   ⚠️  Cannot verify from local environment');
}

function main() {
  console.log('🚀 Netlify Deployment Checklist\n');

  const checks = [checkPackageJson(), checkNetlifyConfig(), checkNextConfig(), checkApiRoutes()];

  checkEnvironmentVariables();

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  console.log(`\n📊 Summary: ${passed}/${total} checks passed`);

  if (passed === total) {
    console.log('✅ All checks passed! Ready for deployment.');
    console.log('\nTo deploy:');
    console.log('1. Commit and push changes');
    console.log('2. Check Netlify build logs');
    console.log('3. Test API endpoints after deployment');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
  }

  console.log('\n🔗 Useful commands:');
  console.log('   npm run netlify-build    # Test build locally');
  console.log('   node scripts/test-netlify-api.js  # Test deployed APIs');
}

if (require.main === module) {
  main();
}
