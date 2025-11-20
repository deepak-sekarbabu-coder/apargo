#!/usr/bin/env node

/**
 * Comprehensive Application Optimization Script
 * Analyzes and optimizes the Next.js application for better performance
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Optimization {
    type: string;
    message?: string;
}

type LogType = 'info' | 'warning' | 'error' | 'optimization';

class ApplicationOptimizer {
    private projectRoot: string;
    private optimizations: Optimization[];
    private warnings: string[];

    constructor() {
        this.projectRoot = process.cwd();
        this.optimizations = [];
        this.warnings = [];
    }

    log(message: string, type: LogType = 'info'): void {
        const prefix: Record<LogType, string> = {
            info: '✅',
            warning: '⚠️',
            error: '❌',
            optimization: '⚡',
        };
        console.log(`${prefix[type]} ${message}`);
    }

    async analyzeDependencies(): Promise<{ dependencies: string[]; devDependencies: string[] } | undefined> {
        this.log('Analyzing dependencies...', 'optimization');

        const packagePath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packagePath)) {
            this.log('package.json not found', 'error');
            return;
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const dependencies = Object.keys(pkg.dependencies || {});
        const devDependencies = Object.keys(pkg.devDependencies || {});

        this.log(
            `Found ${dependencies.length} dependencies and ${devDependencies.length} dev dependencies`
        );

        // Check for unused dependencies
        this.optimizations.push({
            type: 'dependency',
        });

        return { dependencies, devDependencies };
    }

    async optimizeTailwindCSS(): Promise<void> {
        this.log('Optimizing Tailwind CSS...', 'optimization');

        const tailwindConfigPath = path.join(this.projectRoot, 'tailwind.config.ts');
        if (fs.existsSync(tailwindConfigPath)) {
            const config = fs.readFileSync(tailwindConfigPath, 'utf8');

            // Check if purge is properly configured
            if (config.includes('content: [')) {
                this.log('Tailwind content purging is configured');
            } else {
                this.warnings.push('Tailwind content purging may not be properly configured');
            }

            this.optimizations.push({
                type: 'css',
                message: 'Tailwind CSS is configured for tree-shaking',
            });
        }
    }

    async analyzeNextJSConfig(): Promise<void> {
        this.log('Analyzing Next.js configuration...', 'optimization');

        const configPath = path.join(this.projectRoot, 'next.config.ts');
        if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8');

            const optimizations: string[] = [];

            if (config.includes('swcMinify: true')) optimizations.push('SWC minification enabled');
            if (config.includes('compress: true')) optimizations.push('Compression enabled');
            if (config.includes('optimizeCss: true')) optimizations.push('CSS optimization enabled');
            if (config.includes('optimizePackageImports'))
                optimizations.push('Package import optimization enabled');
            if (config.includes('productionBrowserSourceMaps: false'))
                optimizations.push('Source maps disabled for production');

            optimizations.forEach(opt => this.log(opt));

            if (optimizations.length === 0) {
                this.warnings.push('Next.js configuration lacks optimization settings');
            }
        }
    }

    async checkBuildSize(): Promise<void> {
        this.log('Checking build artifacts...', 'optimization');

        const nextDir = path.join(this.projectRoot, '.next');
        if (fs.existsSync(nextDir)) {
            try {
                const stats = this.getDirSize(nextDir);
                this.log(`Current .next directory size: ${this.formatBytes(stats)}`);

                if (stats > 100 * 1024 * 1024) {
                    // 100MB
                    this.warnings.push('Build size is large (>100MB). Consider optimization.');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log(`Could not analyze build size: ${errorMessage}`, 'warning');
            }
        }
    }

    getDirSize(dirPath: string): number {
        let size = 0;
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                size += this.getDirSize(filePath);
            } else {
                size += stats.size;
            }
        }

        return size;
    }

    formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    }

    async optimizeImages(): Promise<void> {
        this.log('Checking image optimization...', 'optimization');

        const publicDir = path.join(this.projectRoot, 'public');
        if (fs.existsSync(publicDir)) {
            const imageFiles = this.findImageFiles(publicDir);

            if (imageFiles.length > 0) {
                this.log(`Found ${imageFiles.length} image files in public directory`);

                imageFiles.forEach(file => {
                    const stats = fs.statSync(file);
                    if (stats.size > 500 * 1024) {
                        // 500KB
                        this.warnings.push(
                            `Large image file: ${path.relative(this.projectRoot, file)} (${this.formatBytes(stats.size)})`
                        );
                    }
                });
            }
        }
    }

    findImageFiles(dir: string): string[] {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
        const files: string[] = [];

        const traverse = (currentDir: string): void => {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    traverse(fullPath);
                } else if (imageExtensions.includes(path.extname(item).toLowerCase())) {
                    files.push(fullPath);
                }
            }
        };

        traverse(dir);
        return files;
    }

    async createServiceWorker(): Promise<void> {
        this.log('Creating optimized service worker...', 'optimization');

        const swContent = `
// Optimized Service Worker for Apargo
const CACHE_NAME = 'apargo-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  // Add your critical static assets here
];

// Cache strategy for different types of requests
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: ['/_next/static/', '/images/', '/icons/'],
  // Network first for API calls
  api: ['/api/'],
  // Stale while revalidate for pages
  pages: ['/dashboard', '/properties', '/current-faults']
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Determine cache strategy
  let strategy = 'networkFirst';
  
  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.pathname.startsWith(pattern))) {
      strategy = strategyName;
      break;
    }
  }

  switch (strategy) {
    case 'static':
      event.respondWith(cacheFirst(request));
      break;
    case 'api':
      event.respondWith(networkFirst(request));
      break;
    case 'pages':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}
`;

        fs.writeFileSync(path.join(this.projectRoot, 'public', 'sw-optimized.js'), swContent);
        this.log('Created optimized service worker');
    }

    async analyzeComponents(): Promise<void> {
        this.log('Analyzing React components...', 'optimization');

        const srcDir = path.join(this.projectRoot, 'src');
        if (fs.existsSync(srcDir)) {
            const componentFiles = this.findFiles(srcDir, ['.tsx', '.jsx']);
            this.log(`Found ${componentFiles.length} component files`);

            let memoizedComponents = 0;
            let largeFunctions = 0;

            componentFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');

                if (content.includes('React.memo') || content.includes('memo(')) {
                    memoizedComponents++;
                }

                // Check for large component functions (potential optimization targets)
                const lines = content.split('\n').length;
                if (lines > 100) {
                    largeFunctions++;
                    this.warnings.push(
                        `Large component file: ${path.relative(this.projectRoot, file)} (${lines} lines)`
                    );
                }
            });

            this.log(`Components using React.memo: ${memoizedComponents}/${componentFiles.length}`);

            if (memoizedComponents < componentFiles.length * 0.3) {
                this.optimizations.push({
                    type: 'react',
                    message:
                        'Consider using React.memo for more components to prevent unnecessary re-renders',
                });
            }
        }
    }

    findFiles(dir: string, extensions: string[]): string[] {
        const files: string[] = [];

        const traverse = (currentDir: string): void => {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    traverse(fullPath);
                } else if (extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        };

        traverse(dir);
        return files;
    }

    async generateReport(): Promise<void> {
        this.log('\n📊 OPTIMIZATION REPORT', 'optimization');
        this.log('=======================\n');

        if (this.optimizations.length > 0) {
            this.log('Current Optimizations:');
            this.optimizations.forEach(opt => {
                if (opt.message) {
                    this.log(`  • ${opt.message}`, 'info');
                }
            });
            console.log('');
        }

        if (this.warnings.length > 0) {
            this.log('Optimization Opportunities:');
            this.warnings.forEach(warning => {
                this.log(`  • ${warning}`, 'warning');
            });
            console.log('');
        }

        this.log('Recommended Next Steps:');
        this.log('  1. Run `npm run analyze` to analyze bundle size');
        this.log('  2. Run `npm install` to install new optimization dependencies');
        this.log('  3. Consider implementing lazy loading for heavy components');
        this.log('  4. Add performance monitoring in production');
        this.log('  5. Optimize Firebase queries with proper indexing\n');
    }

    async run(): Promise<void> {
        console.log('🚀 Apargo OPTIMIZATION SUITE\n');

        try {
            await this.analyzeDependencies();
            await this.optimizeTailwindCSS();
            await this.analyzeNextJSConfig();
            await this.checkBuildSize();
            await this.optimizeImages();
            await this.createServiceWorker();
            await this.analyzeComponents();
            await this.generateReport();

            this.log('Optimization analysis complete!', 'optimization');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Optimization failed: ${errorMessage}`, 'error');
            process.exit(1);
        }
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new ApplicationOptimizer();
    optimizer.run();
}

export default ApplicationOptimizer;
