#!/usr/bin/env node

/**
 * Build optimization script for Netlify
 * Reduces build size and prevents memory issues
 */

const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

function cleanupBuildArtifacts() {
  console.log('🧹 Cleaning up build artifacts...');

  const foldersToClean = [
    '.next/cache',
    '.next/server/pages-manifest.json',
    'node_modules/.cache',
    '.netlify/cache',
  ];

  foldersToClean.forEach(folder => {
    if (fs.existsSync(folder)) {
      try {
        if (fs.lstatSync(folder).isDirectory()) {
          deleteFolderRecursive(folder);
        } else {
          fs.unlinkSync(folder);
        }
        console.log(`   ✅ Cleaned: ${folder}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clean: ${folder} - ${error.message}`);
      }
    }
  });
}

function optimizePackageJson() {
  console.log('📦 Optimizing package.json...');

  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Remove dev dependencies from production bundle
    if (pkg.devDependencies) {
      console.log('   ✅ DevDependencies found (will be excluded from production)');
    }

    // Add production optimization
    if (!pkg.scripts['postbuild']) {
      pkg.scripts['postbuild'] = 'node scripts/post-build-cleanup.js';
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
      console.log('   ✅ Added postbuild cleanup script');
    }
  }
}

function createNetlifyOptimizations() {
  console.log('⚡ Creating Netlify optimizations...');

  // Create a minimal Node.js setup for functions
  const optimizationScript = `
// Auto-imported Node.js optimizations
require('./src/lib/node-optimization');
`;

  if (!fs.existsSync('.netlify')) {
    fs.mkdirSync('.netlify', { recursive: true });
  }

  fs.writeFileSync('.netlify/optimization.js', optimizationScript);
  console.log('   ✅ Created optimization script');
}

function main() {
  console.log('🚀 Netlify Build Optimization\n');

  try {
    cleanupBuildArtifacts();
    optimizePackageJson();
    createNetlifyOptimizations();

    console.log('\n✅ Build optimization complete!');
    console.log('\n💡 Tips to reduce storage usage:');
    console.log('   1. Delete old Netlify deployments in dashboard');
    console.log('   2. Use .gitignore for large files');
    console.log('   3. Optimize images and assets');
    console.log('   4. Consider upgrading Netlify plan if needed');
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupBuildArtifacts, optimizePackageJson };
