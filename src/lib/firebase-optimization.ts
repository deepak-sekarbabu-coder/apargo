/**
 * Firebase Optimization Utilities
 * Performance optimizations for Firestore queries and operations
 */
import {
  type DocumentData,
  type QueryConstraint,
  collection,
  disableNetwork,
  enableNetwork,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

// Adjust import path as needed

// Connection management
export class FirebaseConnectionManager {
  private static isOffline = false;

  static async enableOfflineSupport() {
    try {
      await disableNetwork(db);
      this.isOffline = true;
      console.log('Firebase offline support enabled');
    } catch (error) {
      console.error('Failed to enable offline support:', error);
    }
  }

  static async enableOnlineSupport() {
    try {
      await enableNetwork(db);
      this.isOffline = false;
      console.log('Firebase online support enabled');
    } catch (error) {
      console.error('Failed to enable online support:', error);
    }
  }

  static isOfflineMode() {
    return this.isOffline;
  }
}

// Optimized query builder with caching and pagination
export class OptimizedFirestoreQuery {
  private constraints: QueryConstraint[] = [];
  private collectionName: string;
  private cacheKey: string = '';
  private cacheTime: number = 5 * 60 * 1000; // 5 minutes default

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.cacheKey = collectionName;
  }

  // Add where constraint
  addWhere(field: string, operator: FirebaseFirestore.WhereFilterOp, value: unknown) {
    this.constraints.push(where(field, operator, value));
    this.cacheKey += `_${field}_${operator}_${value}`;
    return this;
  }

  // Add order by constraint
  addOrderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.constraints.push(orderBy(field, direction));
    this.cacheKey += `_orderBy_${field}_${direction}`;
    return this;
  }

  // Add limit constraint
  addLimit(limitCount: number) {
    this.constraints.push(limit(limitCount));
    this.cacheKey += `_limit_${limitCount}`;
    return this;
  }

  // Add pagination
  addStartAfter(lastDoc: FirebaseFirestore.DocumentSnapshot) {
    this.constraints.push(startAfter(lastDoc));
    this.cacheKey += `_startAfter_${lastDoc.id}`;
    return this;
  }

  // Set cache time
  setCacheTime(milliseconds: number) {
    this.cacheTime = milliseconds;
    return this;
  }

  // Execute query with caching
  async execute(): Promise<DocumentData[]> {
    const cacheKey = this.cacheKey;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached && !this.isCacheExpired(cached.timestamp, this.cacheTime)) {
      console.log(`Cache hit for: ${cacheKey}`);
      return cached.data;
    }

    // Execute Firestore query
    try {
      const q = query(collection(db, this.collectionName), ...this.constraints);
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Cache results
      this.setCache(cacheKey, results);
      console.log(`Query executed and cached: ${cacheKey}`);

      return results;
    } catch (error) {
      console.error('Firestore query error:', error);

      // Return cached data if available, even if expired
      if (cached) {
        console.log('Returning stale cache due to error');
        return cached.data;
      }

      throw error;
    }
  }

  private getFromCache(key: string) {
    try {
      const cached = localStorage.getItem(`firebase_cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCache(key: string, data: DocumentData[]) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`firebase_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  private isCacheExpired(timestamp: number, cacheTime: number) {
    return Date.now() - timestamp > cacheTime;
  }
}

// Batch operations for better performance
export class BatchOperations {
  private static readonly BATCH_SIZE = 500; // Firestore limit

  static async batchGet(docRefs: unknown[]): Promise<DocumentData[]> {
    const batches = this.createBatches(docRefs, this.BATCH_SIZE);
    const results: DocumentData[] = [];

    for (const batch of batches) {
      const promises = batch.map(async (docRef: unknown) => {
        try {
          const docSnap = await getDoc(docRef as Parameters<typeof getDoc>[0]);
          return docSnap.exists() ? { id: docSnap.id, ...(docSnap.data() as DocumentData) } : null;
        } catch (error) {
          console.error('Error fetching document:', error);
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(
        ...batchResults.filter((result): result is DocumentData & { id: string } => result !== null)
      );
    }

    return results;
  }

  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

// Optimized queries for common collections
export const optimizedQueries = {
  // Get user apartments with caching
  getUserApartments: async (userId: string) => {
    return new OptimizedFirestoreQuery('apartments')
      .addWhere('userId', '==', userId)
      .addOrderBy('createdAt', 'desc')
      .setCacheTime(10 * 60 * 1000) // 10 minutes
      .execute();
  },

  // Get current faults with pagination
  getCurrentFaults: async (pageSize: number = 20, lastDoc?: FirebaseFirestore.DocumentSnapshot) => {
    const query = new OptimizedFirestoreQuery('faults')
      .addWhere('status', '==', 'open')
      .addOrderBy('createdAt', 'desc')
      .addLimit(pageSize)
      .setCacheTime(2 * 60 * 1000); // 2 minutes

    if (lastDoc) {
      query.addStartAfter(lastDoc);
    }

    return query.execute();
  },

  // Get property details with related data
  getPropertyWithDetails: async (propertyId: string) => {
    const property = await new OptimizedFirestoreQuery('properties')
      .addWhere('id', '==', propertyId)
      .setCacheTime(30 * 60 * 1000) // 30 minutes
      .execute();

    if (property.length === 0) return null;

    // Get related apartments
    const apartments = await new OptimizedFirestoreQuery('apartments')
      .addWhere('propertyId', '==', propertyId)
      .addOrderBy('apartmentNumber', 'asc')
      .setCacheTime(15 * 60 * 1000) // 15 minutes
      .execute();

    return {
      ...property[0],
      apartments,
    };
  },

  // Get user payment history
  getUserPayments: async (userId: string, limit: number = 50) => {
    return new OptimizedFirestoreQuery('payments')
      .addWhere('userId', '==', userId)
      .addOrderBy('createdAt', 'desc')
      .addLimit(limit)
      .setCacheTime(5 * 60 * 1000) // 5 minutes
      .execute();
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const [totalProperties, totalApartments, openFaults, recentPayments] = await Promise.all([
      new OptimizedFirestoreQuery('properties')
        .setCacheTime(60 * 60 * 1000) // 1 hour
        .execute(),
      new OptimizedFirestoreQuery('apartments')
        .setCacheTime(30 * 60 * 1000) // 30 minutes
        .execute(),
      new OptimizedFirestoreQuery('faults')
        .addWhere('status', '==', 'open')
        .setCacheTime(5 * 60 * 1000) // 5 minutes
        .execute(),
      new OptimizedFirestoreQuery('payments')
        .addOrderBy('createdAt', 'desc')
        .addLimit(10)
        .setCacheTime(10 * 60 * 1000) // 10 minutes
        .execute(),
    ]);

    return {
      totalProperties: totalProperties.length,
      totalApartments: totalApartments.length,
      openFaults: openFaults.length,
      recentPayments: recentPayments.length,
    };
  },
};

// Cache management utilities
export const cacheManager = {
  // Clear all Firebase caches
  clearAllCaches: () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('firebase_cache_'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} Firebase caches`);
  },

  // Clear specific cache
  clearCache: (cacheKey: string) => {
    localStorage.removeItem(`firebase_cache_${cacheKey}`);
    console.log(`Cleared cache: ${cacheKey}`);
  },

  // Get cache size
  getCacheSize: () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('firebase_cache_'));
    let totalSize = 0;

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      count: keys.length,
      sizeBytes: totalSize,
      sizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  },
};

// Performance monitoring
export const performanceMonitor = {
  // Monitor query performance
  monitorQuery: async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Firebase query "${queryName}" took ${duration}ms`);

        if (duration > 1000) {
          console.warn(`Slow Firebase query detected: ${queryName} - ${duration}ms`);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Firebase query "${queryName}" failed after ${duration}ms:`, error);
      throw error;
    }
  },
};
