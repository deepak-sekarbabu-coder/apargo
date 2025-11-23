import {
  generateGoogleImageSrcSet,
  getAvatarSizes,
  optimizeGoogleImage,
} from '../image-optimization';

describe('Image Optimization Utilities', () => {
  describe('optimizeGoogleImage', () => {
    it('should optimize Google user content URLs with default options', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...=s96-c';
      const result = optimizeGoogleImage(url);

      expect(result).toBeDefined();
      expect(result).toContain('=s64-c');
      expect(result).not.toContain('=s96-c');
    });

    it('should optimize Google URLs with custom size', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const result = optimizeGoogleImage(url, { size: 128, crop: true });

      expect(result).toContain('=s128-c');
    });

    it('should handle URLs without existing parameters', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const result = optimizeGoogleImage(url, { size: 64, crop: true });

      expect(result).toBe(`${url}=s64-c`);
    });

    it('should handle URLs with existing parameters', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...=s96-c';
      const result = optimizeGoogleImage(url, { size: 64, crop: true });

      expect(result).toContain('=s64-c');
      expect(result).not.toContain('=s96-c');
    });

    it('should return undefined for undefined input', () => {
      const result = optimizeGoogleImage(undefined);
      expect(result).toBeUndefined();
    });

    it('should return original URL for non-Google URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = optimizeGoogleImage(url);

      expect(result).toBe(url);
    });

    it('should handle crop option', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';

      const cropped = optimizeGoogleImage(url, { size: 64, crop: true });
      expect(cropped).toContain('=s64-c');

      const notCropped = optimizeGoogleImage(url, { size: 64, crop: false });
      expect(notCropped).toContain('=s64');
      expect(notCropped).not.toContain('-c');
    });
  });

  describe('generateGoogleImageSrcSet', () => {
    it('should generate srcSet with default sizes', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const result = generateGoogleImageSrcSet(url);

      expect(result).toBeDefined();
      expect(result).toContain('=s32-c 32w');
      expect(result).toContain('=s64-c 64w');
      expect(result).toContain('=s96-c 96w');
      expect(result).toContain('=s128-c 128w');
    });

    it('should generate srcSet with custom sizes', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const result = generateGoogleImageSrcSet(url, [48, 96]);

      expect(result).toBeDefined();
      expect(result).toContain('=s48-c 48w');
      expect(result).toContain('=s96-c 96w');
      expect(result).not.toContain('=s32-c');
    });

    it('should return undefined for undefined input', () => {
      const result = generateGoogleImageSrcSet(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-Google URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = generateGoogleImageSrcSet(url);

      expect(result).toBeUndefined();
    });

    it('should format srcSet correctly', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const result = generateGoogleImageSrcSet(url, [32, 64]);

      // Should be comma-separated with spaces
      expect(result).toMatch(/32w, .+64w/);
    });
  });

  describe('getAvatarSizes', () => {
    it('should return responsive sizes string', () => {
      const result = getAvatarSizes();

      expect(result).toBeDefined();
      expect(result).toContain('max-width');
      expect(result).toContain('640px');
      expect(result).toContain('1024px');
    });

    it('should define sizes for mobile, tablet, and desktop', () => {
      const result = getAvatarSizes();

      // Mobile
      expect(result).toContain('40px');
      // Tablet
      expect(result).toContain('48px');
      // Desktop
      expect(result).toContain('64px');
    });
  });

  describe('Performance Optimization', () => {
    it('should reduce image size from 96x96 to 64x64', () => {
      const original = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...=s96-c';
      const optimized = optimizeGoogleImage(original, { size: 64 });

      expect(optimized).toContain('=s64-c');
      // Assuming typical compression, 64x64 should be ~44% smaller than 96x96
      // This is a logical assertion based on the pixel reduction
    });

    it('should provide responsive images for different screen densities', () => {
      const url = 'https://lh3.googleusercontent.com/a/ACg8ocKHh...';
      const srcSet = generateGoogleImageSrcSet(url);

      // Should include sizes for 1x, 2x screen densities
      expect(srcSet).toContain('32w'); // Small screens
      expect(srcSet).toContain('64w'); // Standard display
      expect(srcSet).toContain('128w'); // High-DPI displays
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      const malformed = 'not a url';
      const result = optimizeGoogleImage(malformed);

      // Should not throw, should return original
      expect(result).toBe(malformed);
    });

    it('should handle empty strings', () => {
      const result = optimizeGoogleImage('');
      expect(result).toBe('');
    });
  });
});
