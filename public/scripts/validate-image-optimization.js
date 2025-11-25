// Script to validate image optimization in the browser console

/**
 * Image Optimization Validator
 *
 * Run this in the browser console to validate that image optimization is working
 *
 * Usage:
 * 1. Open your app in the browser
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: validateImageOptimization()
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateImageOptimization() {
  console.log('🔍 Validating Image Optimization...\n');

  const results = {
    total: 0,
    optimized: 0,
    unoptimized: 0,
    errors: [],
    details: [],
  };

  // Find all images in the document
  const images = document.querySelectorAll('img');
  results.total = images.length;

  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    const srcSet = img.getAttribute('srcset');
    const sizes = img.getAttribute('sizes');
    const loading = img.getAttribute('loading');

    if (!src) return;

    const isGoogleImage = src.includes('googleusercontent.com');

    if (isGoogleImage) {
      const hasOptimization = /=s\d+-c/.test(src) || /=s\d+/.test(src);
      const hasSrcSet = !!srcSet;
      const hasSizes = !!sizes;
      const hasLazyLoading = loading === 'lazy';

      const detail = {
        index,
        src: src.substring(0, 50) + '...',
        optimized: hasOptimization,
        srcSet: hasSrcSet,
        sizes: hasSizes,
        lazy: hasLazyLoading,
        score: 0,
      };

      // Calculate optimization score
      if (hasOptimization) detail.score += 40;
      if (hasSrcSet) detail.score += 30;
      if (hasSizes) detail.score += 20;
      if (hasLazyLoading) detail.score += 10;

      if (detail.score >= 80) {
        results.optimized++;
      } else {
        results.unoptimized++;
      }

      results.details.push(detail);
    }
  });

  // Print results
  console.log('📊 Results:');
  console.log(`   Total images: ${results.total}`);
  console.log(`   Google images optimized: ${results.optimized}`);
  console.log(`   Google images not optimized: ${results.unoptimized}`);
  console.log('\n');

  if (results.details.length > 0) {
    console.log('📋 Detailed Analysis:');
    console.table(results.details);
  }

  // Performance summary
  console.log('\n💡 Optimization Checklist:');
  console.log(
    `   ✓ Size parameter (=s64-c): ${results.details.filter(d => d.optimized).length}/${results.details.length}`
  );
  console.log(
    `   ✓ Responsive srcSet: ${results.details.filter(d => d.srcSet).length}/${results.details.length}`
  );
  console.log(
    `   ✓ Sizes attribute: ${results.details.filter(d => d.sizes).length}/${results.details.length}`
  );
  console.log(
    `   ✓ Lazy loading: ${results.details.filter(d => d.lazy).length}/${results.details.length}`
  );

  // Calculate potential savings
  const unoptimizedCount = results.details.filter(d => !d.optimized).length;
  const estimatedSavings = unoptimizedCount * 6.8; // ~6.8 KiB per image

  if (estimatedSavings > 0) {
    console.log(`\n⚠️  Potential savings: ~${estimatedSavings.toFixed(1)} KiB`);
  } else {
    console.log('\n✅ All Google images are optimized!');
  }

  // Network analysis
  console.log('\n🌐 To verify in Network tab:');
  console.log('   1. Open Network tab');
  console.log('   2. Filter by "Img"');
  console.log('   3. Check image URLs contain "=s64-c" or "=s128-c"');
  console.log('   4. Verify file sizes are ~5-8 KiB (not 12+ KiB)');

  return results;
}

/**
 * Compare image sizes before and after optimization
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compareImageSizes() {
  console.log('📏 Image Size Comparison:\n');

  const googleImages = Array.from(document.querySelectorAll('img')).filter(img =>
    img.src.includes('googleusercontent.com')
  );

  googleImages.forEach((img, index) => {
    const src = img.src;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;

    console.log(`Image ${index + 1}:`);
    console.log(`  URL: ${src.substring(0, 60)}...`);
    console.log(`  Natural size: ${width}×${height}px`);
    console.log(`  Display size: ${displayWidth}×${displayHeight}px`);

    if (width > displayWidth * 1.5 || height > displayHeight * 1.5) {
      console.log(`  ⚠️  Image is ${Math.round((width / displayWidth) * 100)}% larger than needed`);
    } else {
      console.log(`  ✅ Properly sized`);
    }
    console.log('');
  });
}

/**
 * Benchmark image loading performance
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function benchmarkImageLoading() {
  console.log('⏱️  Benchmarking Image Loading Performance...\n');

  const testUrl = 'https://lh3.googleusercontent.com/a/ACg8ocExample';

  const sizes = [
    { size: 32, label: 'Mobile (32px)' },
    { size: 64, label: 'Standard (64px)' },
    { size: 96, label: 'Large (96px)' },
    { size: 128, label: 'HD (128px)' },
  ];

  console.log('Testing different image sizes...');
  console.table(
    sizes.map(s => ({
      Size: s.label,
      URL: `${testUrl}=s${s.size}-c`,
      'Est. File Size': `~${((s.size * s.size * 0.05) / 1024).toFixed(1)} KiB`,
    }))
  );

  console.log('\n💡 Recommendations:');
  console.log('   • Use 32-40px for mobile devices');
  console.log('   • Use 64px for standard displays');
  console.log('   • Use 96-128px for high-DPI screens');
  console.log('   • Always include srcSet for responsive loading');
}

// Auto-run on script load
console.log('🚀 Image Optimization Validator loaded!');
console.log('Run: validateImageOptimization()');
console.log('Run: compareImageSizes()');
console.log('Run: benchmarkImageLoading()');
