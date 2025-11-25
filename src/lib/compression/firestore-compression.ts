/**
 * Firestore compression middleware
 * Automatically compresses large documents during write operations
 * and decompresses during reads
 */
import { compressData, decompressData } from './index';

type CompressionMetadata = {
  compressed: true;
  algorithm: 'gzip';
  originalSize: number;
  compressedSize: number;
};

/**
 * Wraps a document for storage with optional compression
 * Large objects (>1KB) are automatically compressed
 */
export const compressDocumentForStorage = async (
  doc: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const compressed = await compressData(doc);
  return compressed;
};

/**
 * Decompresses a document read from Firestore
 */
export const decompressDocumentFromStorage = async (
  doc: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const metadata = doc._compression as
    | { compressed: true; algorithm: string; originalSize: number; compressedSize: number }
    | undefined;

  if (!metadata?.compressed) {
    return doc;
  }

  const { data, ...rest } = doc;
  if (typeof data === 'string') {
    const decompressed = await decompressData(data, metadata as CompressionMetadata);
    if (typeof decompressed === 'object' && decompressed !== null) {
      return { ...rest, ...decompressed };
    }
    return { ...rest, data: decompressed };
  }

  return doc;
};

/**
 * Creates a compression-aware query result processor
 * Handles decompression of large documents in batch queries
 */
export const createCompressionAwareProcessor = () => {
  return {
    /**
     * Process individual document from Firestore snapshot
     */
    processDocument: async (doc: Record<string, unknown>): Promise<Record<string, unknown>> => {
      return decompressDocumentFromStorage(doc);
    },

    /**
     * Process batch of documents (e.g., from query results)
     */
    processBatch: async (docs: Record<string, unknown>[]): Promise<Record<string, unknown>[]> => {
      return Promise.all(docs.map(doc => decompressDocumentFromStorage(doc)));
    },
  };
};

/**
 * Compression statistics tracker
 * Monitors bandwidth savings across operations
 */
export class CompressionStats {
  private totalOriginal = 0;
  private totalCompressed = 0;
  private operationCount = 0;

  recordCompression(originalSize: number, compressedSize: number) {
    this.totalOriginal += originalSize;
    this.totalCompressed += compressedSize;
    this.operationCount++;
  }

  getStats() {
    const savings = this.totalOriginal - this.totalCompressed;
    const ratio = this.totalOriginal > 0 ? (this.totalCompressed / this.totalOriginal) * 100 : 0;

    return {
      totalOriginal: this.totalOriginal,
      totalCompressed: this.totalCompressed,
      savings,
      savingsPercent: (100 - ratio).toFixed(2),
      operationCount: this.operationCount,
      avgCompressionRatio: ratio.toFixed(2),
    };
  }

  reset() {
    this.totalOriginal = 0;
    this.totalCompressed = 0;
    this.operationCount = 0;
  }
}

export const compressionStats = new CompressionStats();
