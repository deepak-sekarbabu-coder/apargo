/**
 * Tests for compression utilities
 */
import { analyzeCompression, shouldCompress } from '../src/lib/compression';

describe('Compression Utilities', () => {
  describe('shouldCompress', () => {
    it('should return false for small objects', () => {
      const smallData = { id: '1', name: 'Test' };
      expect(shouldCompress(smallData)).toBe(false);
    });

    it('should return true for large objects', () => {
      const largeData = {
        id: '1',
        description: 'x'.repeat(2000),
        nested: {
          field1: 'x'.repeat(500),
          field2: 'x'.repeat(500),
        },
      };
      expect(shouldCompress(largeData)).toBe(true);
    });

    it('should handle arrays', () => {
      const largeArray = Array(200).fill({ data: 'x'.repeat(100) });
      expect(shouldCompress(largeArray)).toBe(true);
    });

    it('should return false for non-JSON-serializable objects', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      expect(shouldCompress(circular)).toBe(false);
    });
  });

  describe('analyzeCompression', () => {
    it('should analyze compression for large data', async () => {
      const largeData = {
        items: Array(100).fill({
          id: 'test-id',
          name: 'Test Item',
          description: 'Lorem ipsum dolor sit amet',
          metadata: { created: '2024-01-01', modified: '2024-01-02' },
        }),
      };

      const stats = await analyzeCompression(largeData);

      expect(stats.originalSize).toBeGreaterThan(1000);
      expect(stats.compressedSize).toBeLessThan(stats.originalSize);
      expect(stats.ratio).toBeLessThan(100);
      expect(stats.ratio).toBeGreaterThan(0);
      expect(stats.savings).toContain('%');
    });

    it('should show compression benefits', async () => {
      const repetitiveData = {
        records: Array(50).fill({
          value: 'aaaaaaaaaa',
          type: 'type_a',
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
        }),
      };

      const stats = await analyzeCompression(repetitiveData);

      // Highly repetitive data should compress well
      expect(stats.ratio).toBeLessThan(30);
    });

    it('should handle small data', async () => {
      const smallData = { id: '1', name: 'Test' };
      const stats = await analyzeCompression(smallData);

      expect(stats.originalSize).toBeGreaterThan(0);
      expect(stats.compressedSize).toBeGreaterThan(0);
      expect(stats.savings).toBeDefined();
    });
  });

  describe('compression edge cases', () => {
    it('should handle empty objects', async () => {
      const stats = await analyzeCompression({});
      expect(stats.originalSize).toBeGreaterThan(0);
    });

    it('should handle deeply nested structures', async () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'x'.repeat(500),
                },
              },
            },
          },
        },
      };

      const stats = await analyzeCompression(deepData);
      expect(stats).toHaveProperty('originalSize');
      expect(stats).toHaveProperty('compressedSize');
    });

    it('should handle arrays with mixed types', async () => {
      const mixedArray = [
        'string',
        123,
        true,
        { nested: 'object' },
        ['nested', 'array'],
        'x'.repeat(500),
      ];

      const stats = await analyzeCompression(mixedArray);
      expect(stats.originalSize).toBeGreaterThan(0);
    });
  });
});
