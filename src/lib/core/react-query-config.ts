/**
 * Optimized React Query Configuration
 * Performance-focused setup for React Query with caching strategies
 */
import { QueryClient } from '@tanstack/react-query';

// Create optimized query client with performance settings
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error: unknown) => {
          if ((error as { status?: number })?.status === 404) return false;
          return failureCount < 3;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable background refetching
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        // Performance optimizations
        networkMode: 'online',
        // Prevent duplicate requests
        refetchInterval: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        networkMode: 'online',
      },
    },
  });
};

// Optimized query keys factory
export const queryKeys = {
  all: ['apargo'] as const,

  // User queries
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  userProfile: (id: string) => [...queryKeys.user(id), 'profile'] as const,

  // Property queries
  properties: () => [...queryKeys.all, 'properties'] as const,
  property: (id: string) => [...queryKeys.properties(), id] as const,
  propertyDetails: (id: string) => [...queryKeys.property(id), 'details'] as const,

  // Apartment queries
  apartments: () => [...queryKeys.all, 'apartments'] as const,
  apartment: (id: string) => [...queryKeys.apartments(), id] as const,
  apartmentsByProperty: (propertyId: string) =>
    [...queryKeys.apartments(), 'property', propertyId] as const,

  // Fault queries
  faults: () => [...queryKeys.all, 'faults'] as const,
  fault: (id: string) => [...queryKeys.faults(), id] as const,
  faultsByProperty: (propertyId: string) =>
    [...queryKeys.faults(), 'property', propertyId] as const,
  currentFaults: () => [...queryKeys.faults(), 'current'] as const,

  // Payment queries
  payments: () => [...queryKeys.all, 'payments'] as const,
  payment: (id: string) => [...queryKeys.payments(), id] as const,
  paymentsByUser: (userId: string) => [...queryKeys.payments(), 'user', userId] as const,

  // Dashboard queries
  dashboard: () => [...queryKeys.all, 'dashboard'] as const,
  dashboardStats: () => [...queryKeys.dashboard(), 'stats'] as const,
  dashboardCharts: () => [...queryKeys.dashboard(), 'charts'] as const,
} as const;

// Prefetch strategies for better UX
export const prefetchStrategies = {
  // Prefetch user data on login
  prefetchUserData: async (queryClient: QueryClient, userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.userProfile(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.paymentsByUser(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
    ]);
  },

  // Prefetch dashboard data
  prefetchDashboard: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats(),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.currentFaults(),
        staleTime: 1 * 60 * 1000, // 1 minute
      }),
    ]);
  },
};

// Cache invalidation helpers
export const cacheUtils = {
  // Invalidate all user-related queries
  invalidateUserQueries: (queryClient: QueryClient, userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    }
  },

  // Invalidate property-related queries
  invalidatePropertyQueries: (queryClient: QueryClient, propertyId?: string) => {
    if (propertyId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apartmentsByProperty(propertyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faultsByProperty(propertyId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
    }
  },

  // Clear all caches (use sparingly)
  clearAllCaches: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

// Performance monitoring for queries
export const queryPerformance = {
  // Log slow queries in development
  onSuccess: (data: unknown, query: { queryKey: unknown; state: { dataUpdatedAt: number } }) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - query.state.dataUpdatedAt;
      if (duration > 1000) {
        console.warn(`Slow query detected: ${JSON.stringify(query.queryKey)} - ${duration}ms`);
      }
    }
  },

  // Log query errors
  onError: (error: unknown, query: { queryKey: unknown }) => {
    console.error(`Query error: ${JSON.stringify(query.queryKey)}`, error);
  },
};
