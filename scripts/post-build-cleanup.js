#!/usr/bin/env node

/**
 * Post-build cleanup script
 * Runs after Next.js build to optimize for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanupNextBuild() {
  console.log('🧹 Post-build cleanup...');

  const cleanupPaths = [
    '.next/cache/webpack',
    '.next/cache/eslint',
    '.next/static/**/*.map', // Remove source maps in production
  ];

  // Remove source maps if not needed
  if (process.env.NODE_ENV === 'production') {
    try {
      const staticDir = '.next/static';
      if (fs.existsSync(staticDir)) {
        removeSourceMaps(staticDir);
      }
    } catch (error) {
      console.warn('Could not remove source maps:', error.message);
    }
  }

  console.log('   ✅ Cleanup complete');
}

function removeSourceMaps(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      removeSourceMaps(filePath);
    } else if (file.endsWith('.map')) {
      try {
        fs.unlinkSync(filePath);
        console.log(`   🗑️  Removed: ${filePath}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not remove: ${filePath}`);
      }
    }
  });
}

function optimizeServerlessBundle() {
  console.log('⚡ Optimizing serverless bundle...');

  // Create a minimal import file for Node.js optimizations
  const importScript = `// Node.js optimizations for serverless
import('./src/lib/node-optimization.js');
console.log('🚀 Serverless optimizations loaded');
`;

  const serverlessDir = '.next/standalone';
  if (fs.existsSync(serverlessDir)) {
    fs.writeFileSync(path.join(serverlessDir, 'optimize.js'), importScript);
    console.log('   ✅ Serverless optimizations added');
  }
}

function main() {
  try {
    cleanupNextBuild();
    optimizeServerlessBundle();
    console.log('✅ Post-build optimization complete');
  } catch (error) {
    console.error('❌ Post-build cleanup failed:', error);
    // Don't fail the build for cleanup errors
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupNextBuild };
