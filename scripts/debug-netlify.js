#!/usr/bin/env node

console.log('=== Netlify Build Debug Information ===');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Working Directory:', process.cwd());

console.log('\n=== Environment Variables ===');
const relevantEnvVars = [
  'NODE_ENV',
  'NETLIFY',
  'NETLIFY_DEV',
  'FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
  'BUILD_ID',
  'DEPLOY_ID',
  'CONTEXT',
];

relevantEnvVars.forEach(varName => {
  console.log(`${varName}:`, process.env[varName] || 'NOT SET');
});

console.log('\n=== File System Check ===');
const fs = require('fs');
const path = require('path');

const checkPaths = [
  '.next',
  '.netlify',
  'src/app/api',
  'package.json',
  'next.config.ts',
  'netlify.toml',
];

checkPaths.forEach(checkPath => {
  try {
    const exists = fs.existsSync(checkPath);
    console.log(`${checkPath}:`, exists ? 'EXISTS' : 'MISSING');

    if (exists && checkPath === 'src/app/api') {
      const apiRoutes = fs.readdirSync(checkPath);
      console.log('  API Routes:', apiRoutes.join(', '));
    }
  } catch (error) {
    console.log(`${checkPath}: ERROR -`, error.message);
  }
});

console.log('\n=== Next.js Build Output Check ===');
try {
  if (fs.existsSync('.next/server/app/api')) {
    const serverApiRoutes = fs.readdirSync('.next/server/app/api');
    console.log('Server API Routes:', serverApiRoutes.join(', '));
  } else {
    console.log('Server API Routes: NOT FOUND');
  }
} catch (error) {
  console.log('Server API Routes: ERROR -', error.message);
}
