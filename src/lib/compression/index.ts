/**
 * Data compression utilities for Firestore payloads
 * Uses native compression APIs (gzip via pako library)
 * Reduces bandwidth for large document transfers
 */
import { getLogger } from '../core/logger';

const logger = getLogger('Compression');

// Compression state manager
type CompressionMetadata = {
  compressed: true;
  algorithm: 'gzip';
  originalSize: number;
  compressedSize: number;
};

/**
 * Checks if an object is likely to benefit from compression (>1KB)
 */
export const shouldCompress = (data: unknown): boolean => {
  try {
    const jsonStr = JSON.stringify(data);
    return jsonStr.length > 1024; // Compress if >1KB
  } catch {
    return false;
  }
};

/**
 * Compresses data using gzip and returns base64-encoded string with metadata
 * Falls back to uncompressed data if compression fails
 */
export const compressData = async (
  data: unknown
): Promise<{
  data: string | unknown;
  _compression?: CompressionMetadata;
}> => {
  try {
    if (!shouldCompress(data)) {
      return { data };
    }

    // Dynamic import for compression library (pako)
    const { gzip } = await import('pako');
    const jsonStr = JSON.stringify(data);
    const uint8Array = new TextEncoder().encode(jsonStr);
    const compressed = gzip(uint8Array);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));

    const metadata: CompressionMetadata = {
      compressed: true,
      algorithm: 'gzip',
      originalSize: jsonStr.length,
      compressedSize: base64.length,
    };

    return {
      data: base64,
      _compression: metadata,
    };
  } catch (error) {
    logger.warn('Compression failed, storing uncompressed:', error);
    return { data };
  }
};

/**
 * Decompresses data that was compressed with compressData
 */
export const decompressData = async (
  compressedData: string,
  metadata?: CompressionMetadata
): Promise<unknown> => {
  if (!metadata?.compressed || metadata.algorithm !== 'gzip') {
    return compressedData;
  }

  try {
    const { ungzip } = await import('pako');
    const binaryString = atob(compressedData);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    const decompressed = ungzip(uint8Array);
    const jsonStr = new TextDecoder().decode(decompressed);
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error('Decompression failed:', error);
    return compressedData;
  }
};

/**
 * Filters out compression metadata before persisting to Firestore
 * Firestore doesn't need to store this metadata
 */
export const stripCompressionMetadata = (obj: Record<string, unknown>): Record<string, unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _compression, ...rest } = obj;
  return rest;
};

/**
 * Analyzes compression ratio for a data object
 * Returns compression statistics
 */
export const analyzeCompression = async (
  data: unknown
): Promise<{ originalSize: number; compressedSize: number; ratio: number; savings: string }> => {
  const jsonStr = JSON.stringify(data);
  const originalSize = jsonStr.length;

  try {
    const { gzip } = await import('pako');
    const uint8Array = new TextEncoder().encode(jsonStr);
    const compressed = gzip(uint8Array);
    const compressedSize = compressed.length;
    const ratio = (compressedSize / originalSize) * 100;
    const savings = `${(100 - ratio).toFixed(2)}%`;

    return {
      originalSize,
      compressedSize,
      ratio: parseFloat(ratio.toFixed(2)),
      savings,
    };
  } catch {
    return {
      originalSize,
      compressedSize: originalSize,
      ratio: 100,
      savings: '0%',
    };
  }
};
