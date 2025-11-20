// Graceful Degradation and Error Recovery System
// Provides fallback strategies, error boundaries, and automatic recovery mechanisms
import { createError, wrapError } from './factory';
import { logger } from './logger';
import type { ApargoError, ErrorContext, RecoveryStrategy } from './types';

// Global recovery strategies registry
const recoveryStrategies: RecoveryStrategy[] = [];

/**
 * Register a recovery strategy for specific error patterns
 */
export function registerRecoveryStrategy(strategy: RecoveryStrategy): void {
  recoveryStrategies.push(strategy);
  // Sort by priority (highest first)
  recoveryStrategies.sort((a, b) => b.priority - a.priority);
}

/**
 * Attempt to recover from an error using registered strategies
 */
export async function attemptRecovery(
  error: ApargoError,
  context: ErrorContext
): Promise<{ recovered: boolean; fallbackError?: ApargoError }> {
  for (const strategy of recoveryStrategies) {
    if (strategy.canHandle(error)) {
      try {
        const result = await strategy.recover(error, context);
        if (result) {
          logger.error(result, context);
          return { recovered: false, fallbackError: result };
        }
        return { recovered: true };
      } catch (recoveryError) {
        logger.error(recoveryError as ApargoError, context);
      }
    }
  }

  // No strategy could recover from the error
  return { recovered: false };
}

/**
 * Fallback data providers for different error scenarios
 */
export class FallbackProvider {
  private static fallbacks: Map<string, () => unknown> = new Map();

  static register(name: string, provider: () => unknown): void {
    this.fallbacks.set(name, provider);
  }

  static get<T>(name: string, defaultValue?: T): T | undefined {
    const provider = this.fallbacks.get(name);
    if (provider) {
      try {
        return provider() as T;
      } catch (error) {
        logger.error(wrapError(error as Error), { feature: 'fallback_provider', operation: name });
      }
    }
    return defaultValue;
  }

  static async getAsync<T>(name: string, defaultValue?: T): Promise<T | undefined> {
    return this.get(name, defaultValue);
  }
}

/**
 * Default fallback providers for common data types
 */
class DefaultFallbacks {
  static init(): void {
    // User data fallback
    FallbackProvider.register('current_user', () => ({
      id: 'anonymous',
      name: 'Guest User',
      role: 'user',
      apartment: 'unknown',
      isApproved: false,
    }));

    // Categories fallback
    FallbackProvider.register('categories', () => [
      {
        id: 'default',
        name: 'General',
        icon: 'folder',
        noSplit: false,
      },
    ]);

    // Apartments fallback
    FallbackProvider.register('apartments', () => []);

    // Expenses fallback
    FallbackProvider.register('expenses', () => []);

    // Payments fallback
    FallbackProvider.register('payments', () => []);

    // Empty user list fallback
    FallbackProvider.register('users', () => []);

    // Empty balance sheets fallback
    FallbackProvider.register('balance_sheets', () => []);

    // Settings fallback
    FallbackProvider.register('settings', () => ({
      theme: 'light',
      notifications: true,
      language: 'en',
    }));
  }
}

// Initialize default fallbacks
DefaultFallbacks.init();

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private options: {
      failureThreshold: number;
      recoveryTimeout: number; // milliseconds
      timeout: number; // request timeout
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.options.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw createError('EXT_SERVICE_UNAVAILABLE', 'Service is temporarily unavailable', {
          category: 'external_service',
          severity: 'high',
          metadata: {
            circuitBreakerState: this.state,
            failureCount: this.failureCount,
            timeSinceLastFailure: Date.now() - (this.lastFailureTime || 0),
          },
        });
      }
    }

    try {
      const result = await this.withTimeout(operation());
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          createError('EXT_SERVICE_TIMEOUT', 'Operation timed out', {
            category: 'external_service',
            severity: 'medium',
          })
        );
      }, this.options.timeout);

      promise
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): { state: string; failureCount: number; lastFailureTime?: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Store for circuit breakers
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  options?: Partial<CircuitBreaker['options']>
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(
      name,
      new CircuitBreaker({
        failureThreshold: options?.failureThreshold || 5,
        recoveryTimeout: options?.recoveryTimeout || 60000, // 1 minute
        timeout: options?.timeout || 30000, // 30 seconds
      })
    );
  }
  return circuitBreakers.get(name)!;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  context?: Partial<ErrorContext>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw wrapError(lastError, context);
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;

      logger.error(wrapError(lastError, context), {
        ...context,
        feature: context?.feature || 'retry_operation',
        operation: 'retry_with_backoff',
        metadata: {
          attempt,
          maxAttempts,
          delay: totalDelay,
          lastErrorMessage: lastError.message,
        },
      });

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string,
  context?: Partial<ErrorContext>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      const error = createError('EXT_SERVICE_TIMEOUT', errorMessage, {
        category: 'external_service',
        severity: 'medium',
        context,
      });
      logger.error(error, context);
      reject(error);
    }, timeoutMs);

    operation()
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Bulk operation with partial failure handling
 */
export async function executeBulk<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    failFast?: boolean;
    maxFailures?: number;
    context?: Partial<ErrorContext>;
  } = {}
): Promise<{
  results: R[];
  failures: Array<{ item: T; error: ApargoError }>;
  successCount: number;
  failureCount: number;
}> {
  const { concurrency = 5, failFast = false, maxFailures = Infinity, context = {} } = options;

  const results: R[] = [];
  const failures: Array<{ item: T; error: ApargoError }> = [];

  // Process items in chunks to control concurrency
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);

    const chunkPromises = chunk.map(async item => {
      try {
        const result = await operation(item);
        return { success: true, result, item };
      } catch (error) {
        const apargoError = wrapError(error as Error, context);
        logger.error(apargoError, {
          ...context,
          feature: context.feature || 'bulk_operation',
          metadata: { itemIndex: items.indexOf(item) },
        });
        return { success: false, error: apargoError, item };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const result of chunkResults) {
      if (result.success) {
        results.push(result.result!);
      } else {
        failures.push({ item: result.item, error: result.error! });

        if (failFast || failures.length >= maxFailures) {
          break;
        }
      }
    }

    // If we're in fail fast mode or have too many failures, stop processing
    if (failFast && failures.length > 0) {
      break;
    }
    if (failures.length >= maxFailures) {
      break;
    }
  }

  return {
    results,
    failures,
    successCount: results.length,
    failureCount: failures.length,
  };
}

/**
 * Health check for degradation system
 */
export function getDegradationHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  circuitBreakers: Record<string, { state: string; failures: number; lastFailure?: string }>;
  registeredStrategies: number;
  registeredFallbacks: number;
  timestamp: string;
} {
  const circuitBreakerStates = Array.from(circuitBreakers.entries()).reduce(
    (acc, [name, cb]) => {
      const state = cb.getState();
      acc[name] = {
        state: state.state,
        failures: state.failureCount,
        lastFailure: state.lastFailureTime?.toString(),
      };
      return acc;
    },
    {} as Record<string, { state: string; failures: number; lastFailure?: string }>
  );

  const unhealthyBreakers = Object.values(circuitBreakerStates).filter(
    state => state.state === 'open'
  ).length;
  const totalBreakers = Object.keys(circuitBreakerStates).length;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (totalBreakers > 0) {
    const unhealthyRatio = unhealthyBreakers / totalBreakers;
    if (unhealthyRatio > 0.5) {
      status = 'unhealthy';
    } else if (unhealthyRatio > 0.2) {
      status = 'degraded';
    }
  }

  return {
    status,
    circuitBreakers: circuitBreakerStates,
    registeredStrategies: recoveryStrategies.length,
    registeredFallbacks: FallbackProvider['fallbacks'].size,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Pre-defined recovery strategies for common scenarios
 */
const defaultRecoveryStrategies: RecoveryStrategy[] = [
  // Network connectivity recovery
  {
    canHandle: error => error.category === 'network' && error.code === 'NETWORK_OFFLINE',
    recover: async () => {
      // Wait for network recovery
      return new Promise(resolve => {
        const checkConnection = () => {
          if (navigator.onLine) {
            resolve(null); // Successfully recovered
          } else {
            setTimeout(checkConnection, 5000); // Check again in 5 seconds
          }
        };
        checkConnection();
      });
    },
    priority: 100,
  },

  // Database connection recovery
  {
    canHandle: error => error.category === 'database' && error.code === 'DB_CONNECTION_FAILED',
    recover: async (_error, context) => {
      // For database connection failures, we can try to use cached data
      const cachedData = FallbackProvider.get('cached_' + (context.feature || 'data'));
      if (cachedData) {
        return createError('DB_OPERATION_FAILED', 'Using cached data due to connection issues', {
          category: 'database',
          severity: 'medium',
          userMessageType: 'warning',
          metadata: {
            usingCachedData: true,
            cachedDataType: context.feature,
          },
          context,
        });
      }
      return null;
    },
    priority: 90,
  },

  // Authentication recovery
  {
    canHandle: error => error.category === 'authentication' && error.code === 'AUTH_EXPIRED',
    recover: async (error, context) => {
      // Try to refresh the authentication token
      try {
        // This would typically call a refresh token endpoint
        // For now, we'll create a redirect to login scenario
        return createError('AUTH_EXPIRED', 'Your session has expired. Please sign in again.', {
          category: 'authentication',
          severity: 'high',
          userMessageType: 'warning',
          recoveryAction: {
            type: 'refresh',
            label: 'Sign In Again',
            hint: 'Redirecting to login page',
          },
          context,
        });
      } catch (refreshError) {
        return wrapError(refreshError as Error, context);
      }
    },
    priority: 80,
  },

  // Storage quota exceeded recovery
  {
    canHandle: error => error.category === 'storage' && error.code === 'STORAGE_QUOTA_EXCEEDED',
    recover: async (error, context) => {
      return createError(
        'STORAGE_QUOTA_EXCEEDED',
        'Storage limit reached. Please delete some files or contact support.',
        {
          category: 'storage',
          severity: 'medium',
          userMessageType: 'warning',
          recoveryAction: {
            type: 'contact_support',
            label: 'Contact Support',
            hint: 'We can help you manage your storage quota',
          },
          context,
        }
      );
    },
    priority: 70,
  },
];

// Register default recovery strategies
defaultRecoveryStrategies.forEach(registerRecoveryStrategy);

/**
 * Export types for external use
 */
export type {
  ApargoError,
  ErrorCategory,
  ErrorCode,
  ErrorContext,
  RecoveryStrategy,
} from './types';
