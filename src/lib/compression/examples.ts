/**
 * Example implementations of compression in Firestore operations
 * These examples show how to integrate compression into data operations
 */
import { getLogger } from '../core/logger';
import type { Expense } from '../core/types';
import {
  compressDocumentForStorage,
  compressionStats,
  decompressDocumentFromStorage,
} from './firestore-compression';
import { compressData, shouldCompress } from './index';

const logger = getLogger('Compression');

/**
 * Example 1: Compress large expense data before storage
 *
 * Usage:
 * const largeExpense = await fetchLargeExpenseDocument();
 * const compressed = await compressExpenseForStorage(largeExpense);
 * await expenseDoc.set(compressed);
 */
export const compressExpenseForStorage = async (
  expense: Expense
): Promise<Record<string, unknown>> => {
  if (!shouldCompress(expense)) {
    return expense;
  }

  const compressed = await compressDocumentForStorage(expense as Record<string, unknown>);

  // Track compression stats if data was actually compressed
  if (compressed._compression) {
    const meta = compressed._compression as {
      originalSize: number;
      compressedSize: number;
    };
    compressionStats.recordCompression(meta.originalSize, meta.compressedSize);
  }

  return compressed;
};

/**
 * Example 2: Decompress expense data after retrieval
 *
 * Usage:
 * const doc = await expenseDoc.get();
 * const expense = await decompressExpenseFromStorage(doc.data());
 */
export const decompressExpenseFromStorage = async (
  data: Record<string, unknown>
): Promise<Expense | null> => {
  if (!data) return null;

  const decompressed = await decompressDocumentFromStorage(data);
  return decompressed as Expense;
};

/**
 * Example 3: Batch compress expenses before bulk write
 *
 * Usage:
 * const expenses = await fetchManyExpenses();
 * const compressed = await compressExpensesBatch(expenses);
 * await Promise.all(compressed.map((e, i) => batch.set(docRefs[i], e)));
 */
export const compressExpensesBatch = async (
  expenses: Expense[]
): Promise<Record<string, unknown>[]> => {
  return Promise.all(
    expenses.map(async expense => {
      const compressed = await compressDocumentForStorage(expense as Record<string, unknown>);

      if (compressed._compression) {
        const meta = compressed._compression as {
          originalSize: number;
          compressedSize: number;
        };
        compressionStats.recordCompression(meta.originalSize, meta.compressedSize);
      }

      return compressed;
    })
  );
};

/**
 * Example 4: Batch decompress expenses after bulk read
 *
 * Usage:
 * const docs = await collection.where(...).getDocs();
 * const expenses = await decompressExpensesBatch(docs.map(d => d.data()));
 */
export const decompressExpensesBatch = async (
  dataList: Record<string, unknown>[]
): Promise<(Expense | null)[]> => {
  return Promise.all(dataList.map(data => decompressExpenseFromStorage(data)));
};

/**
 * Example 5: Track and log compression stats
 *
 * Usage:
 * logCompressionStats();
 */
export const logCompressionStats = (): void => {
  const stats = compressionStats.getStats();
  logger.debug('=== Firestore Compression Stats ===');
  logger.debug(`Operations: ${stats.operationCount}`);
  logger.debug(`Original Total: ${stats.totalOriginal} bytes`);
  logger.debug(`Compressed Total: ${stats.totalCompressed} bytes`);
  logger.debug(`Savings: ${stats.savings} bytes (${stats.savingsPercent}%)`);
  logger.debug(`Avg Compression Ratio: ${stats.avgCompressionRatio}%`);
};

/**
 * Example 6: Selective compression - only compress if beneficial
 *
 * Usage:
 * const result = await smartCompress(expenseData);
 * Only compresses if savings are > 20%
 */
export const smartCompress = async (
  data: Record<string, unknown>
): Promise<{
  data: Record<string, unknown>;
  compressed: boolean;
  savings?: string;
}> => {
  if (!shouldCompress(data)) {
    return { data, compressed: false };
  }

  try {
    // Try compression
    const compressed = await compressData(data);

    // Check if it's actually beneficial
    if (compressed._compression) {
      const meta = compressed._compression as {
        originalSize: number;
        compressedSize: number;
      };
      const savingsPercent = (
        ((meta.originalSize - meta.compressedSize) / meta.originalSize) *
        100
      ).toFixed(2);

      // Only use compression if savings > 20%
      if (parseFloat(savingsPercent) > 20) {
        compressionStats.recordCompression(meta.originalSize, meta.compressedSize);
        return {
          data: compressed as Record<string, unknown>,
          compressed: true,
          savings: `${savingsPercent}%`,
        };
      }
    }
  } catch (error) {
    logger.warn('Smart compression failed:', error);
  }

  // Fallback to uncompressed
  return { data, compressed: false };
};

/**
 * Example 7: API response compression helpers
 *
 * Usage in API routes:
 * export const GET = async (req: NextRequest) => {
 *   const data = await fetchData();
 *   const response = await createCompressedJsonResponse(data);
 *   return response;
 * };
 */
export const createCompressedJsonResponse = async (
  data: unknown
): Promise<{
  json: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}> => {
  const compressed = await compressData(data);
  return {
    json: {
      data: compressed.data,
      ...(compressed._compression && { _compression: compressed._compression }),
    },
    metadata: compressed._compression,
  };
};

/**
 * Example 8: Memory-efficient streaming compression
 *
 * For very large datasets, compress in chunks
 * Usage:
 * const stream = createCompressionStream(largeDataset);
 */
export const createCompressionStream = async function* (items: unknown[], chunkSize: number = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const compressed = await compressData(chunk);
    yield compressed;
  }
};
