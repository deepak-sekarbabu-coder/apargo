#!/usr/bin/env node
/**
 * Pre-build script to exclude debug and test routes from production builds
 * Moves debug/test routes to a temporary location before build, restores after
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'src', 'app', 'api');
const TEMP_DIR = path.join(ROOT_DIR, '.temp-excluded-routes');

// Routes to exclude from production builds
const EXCLUDED_ROUTES = [
  'debug',
  'test',
  'test-fcm',
  'test-notification',
  'test-notifications',
  'debug-data',
  'notification-debug',
  'netlify-test',
  'fix-notifications',
  'quick-fix-user',
];

// Special nested routes
const EXCLUDED_NESTED_ROUTES = [
  path.join('payment-events', 'test'),
  path.join('payment-events', 'ping'),
  path.join('admin', 'storage', 'stats'),
  path.join('payments', '[id]'),
];

function moveRoutesToTemp() {
  // Only exclude in production builds
  // Check both NODE_ENV and if we're in a build context
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.CI === 'true' ||
    process.env.NETLIFY === 'true';

  if (!isProduction) {
    console.log('🔧 Skipping route exclusion (development mode)');
    return;
  }

  console.log('🚫 Excluding debug/test routes from production build...');

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Move excluded routes
  EXCLUDED_ROUTES.forEach(route => {
    const sourcePath = path.join(APP_DIR, route);
    const destPath = path.join(TEMP_DIR, route);

    if (fs.existsSync(sourcePath)) {
      try {
        // Copy directory recursively
        copyDirectory(sourcePath, destPath);
        // Remove from app directory
        fs.rmSync(sourcePath, { recursive: true, force: true });
        console.log(`   ✅ Excluded: /api/${route}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not exclude /api/${route}:`, error.message);
      }
    }
  });

  // Handle nested routes
  EXCLUDED_NESTED_ROUTES.forEach(nestedRoute => {
    const nestedSourcePath = path.join(APP_DIR, nestedRoute);
    const nestedDestPath = path.join(TEMP_DIR, nestedRoute);

    if (fs.existsSync(nestedSourcePath)) {
      try {
        const nestedDestParent = path.dirname(nestedDestPath);
        if (!fs.existsSync(nestedDestParent)) {
          fs.mkdirSync(nestedDestParent, { recursive: true });
        }
        copyDirectory(nestedSourcePath, nestedDestPath);
        fs.rmSync(nestedSourcePath, { recursive: true, force: true });
        console.log(`   ✅ Excluded: /api/${nestedRoute}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not exclude /api/${nestedRoute}:`, error.message);
      }
    }
  });

  console.log('   ✅ Route exclusion complete');
}

function restoreRoutes() {
  // Only restore if we excluded them
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.CI === 'true' ||
    process.env.NETLIFY === 'true';

  if (!isProduction) {
    return;
  }

  if (!fs.existsSync(TEMP_DIR)) {
    return;
  }

  console.log('♻️  Restoring excluded routes...');

  // Restore excluded routes
  EXCLUDED_ROUTES.forEach(route => {
    const sourcePath = path.join(TEMP_DIR, route);
    const destPath = path.join(APP_DIR, route);

    if (fs.existsSync(sourcePath)) {
      try {
        copyDirectory(sourcePath, destPath);
        console.log(`   ✅ Restored: /api/${route}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not restore /api/${route}:`, error.message);
      }
    }
  });

  // Restore nested routes
  EXCLUDED_NESTED_ROUTES.forEach(nestedRoute => {
    const nestedSourcePath = path.join(TEMP_DIR, nestedRoute);
    const nestedDestPath = path.join(APP_DIR, nestedRoute);

    if (fs.existsSync(nestedSourcePath)) {
      try {
        const nestedDestParent = path.dirname(nestedDestPath);
        if (!fs.existsSync(nestedDestParent)) {
          fs.mkdirSync(nestedDestParent, { recursive: true });
        }
        copyDirectory(nestedSourcePath, nestedDestPath);
        console.log(`   ✅ Restored: /api/${nestedRoute}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not restore /api/${nestedRoute}:`, error.message);
      }
    }
  });

  // Clean up temp directory
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log('   ✅ Cleanup complete');
  } catch (error) {
    console.warn('   ⚠️  Could not clean up temp directory:', error.message);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'exclude') {
  moveRoutesToTemp();
} else if (command === 'restore') {
  restoreRoutes();
} else {
  console.error('Usage: node pre-build-exclude-routes.js [exclude|restore]');
  process.exit(1);
}

export { moveRoutesToTemp, restoreRoutes };
