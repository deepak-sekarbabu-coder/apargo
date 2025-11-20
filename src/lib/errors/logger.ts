// Centralized Error Logging and Monitoring Service
// Handles error logging, monitoring, metrics collection, and analytics
import log from 'loglevel';

import type { ApargoError, ErrorContext, ErrorMetrics } from './types';
import { DEFAULT_SERVICE_CONFIG, type ServiceConfig } from './types';

// Simple in-memory metrics store (replace with persistent storage in production)
class MetricsStore {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<string, number>,
    errorsBySeverity: {} as Record<string, number>,
    errorsByCode: {} as Record<string, number>,
    userImpactScore: 0,
    businessImpactScore: 0,
    lastUpdated: new Date().toISOString(),
  };

  update(error: ApargoError): void {
    this.metrics.totalErrors++;

    // Update category counts
    this.metrics.errorsByCategory[error.category] =
      (this.metrics.errorsByCategory[error.category] || 0) + 1;

    // Update severity counts
    this.metrics.errorsBySeverity[error.severity] =
      (this.metrics.errorsBySeverity[error.severity] || 0) + 1;

    // Update error code counts
    this.metrics.errorsByCode[error.code] = (this.metrics.errorsByCode[error.code] || 0) + 1;

    // Update impact scores based on severity and user impact
    this.updateImpactScores(error);

    this.metrics.lastUpdated = new Date().toISOString();
  }

  private updateImpactScores(error: ApargoError): void {
    // Calculate user impact (how many users affected)
    // For now, we'll use error severity as a proxy
    const severityWeight = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0,
    };

    // Simple user impact calculation
    this.metrics.userImpactScore = Math.min(
      1,
      this.metrics.userImpactScore + severityWeight[error.severity] * 0.1
    );

    // Business impact based on error category
    const businessImpactWeights = {
      database: 0.8,
      authentication: 0.9,
      authorization: 0.7,
      payment: 1.0,
      system: 0.9,
      network: 0.6,
      storage: 0.4,
      validation: 0.2,
      business_logic: 0.5,
      external_service: 0.3,
      user_interface: 0.1,
      performance: 0.4,
      unknown: 0.3,
    };

    const categoryWeight = businessImpactWeights[error.category] || 0.3;
    this.metrics.businessImpactScore = Math.min(
      1,
      this.metrics.businessImpactScore + categoryWeight * 0.1
    );
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      errorsByCode: {} as Record<string, number>,
      userImpactScore: 0,
      businessImpactScore: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

class ErrorLogger {
  private config: ServiceConfig;
  private metricsStore: MetricsStore;
  private errorBuffer: ApargoError[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(error: ApargoError) => void> = new Set();

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
    this.metricsStore = new MetricsStore();
    this.setupLogLevel();
    this.startPeriodicFlush();
  }

  private setupLogLevel(): void {
    const levelMap = {
      debug: log.levels.DEBUG,
      info: log.levels.INFO,
      warn: log.levels.WARN,
      error: log.levels.ERROR,
    };

    const level = levelMap[this.config.logLevel] || log.levels.WARN;
    log.setLevel(level);

    // Configure loglevel to only log in development unless explicitly enabled
    if (!this.config.enableConsoleLogging) {
      log.setLevel(log.levels.SILENT);
    }
  }

  /**
   * Log an error with all configured handlers
   */
  error(error: ApargoError, context: Partial<ErrorContext> = {}): void {
    // Always log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(error);
    }

    // Store in metrics
    this.metricsStore.update(error);

    // Buffer for batch processing
    this.errorBuffer.push(error);

    // Notify listeners
    this.notifyListeners(error);

    // In development, also log with full details
    if (process.env.NODE_ENV === 'development') {
      this.logDevelopmentDetails(error, context);
    }
  }

  /**
   * Log debug information
   */
  debug(message: string, context: Partial<ErrorContext> = {}): void {
    if (this.config.enableConsoleLogging && log.getLevel() <= log.levels.DEBUG) {
      log.debug(message, context);
    }
  }

  /**
   * Log error with custom formatting
   */
  private logToConsole(error: ApargoError): void {
    const logMessage = {
      timestamp: error.timestamp,
      level: 'error',
      code: error.code,
      category: error.category,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      requestId: error.requestId,
      userId: error.userId,
      component: error.component,
      operation: error.operation,
      stack: error.stackTrace,
    };

    // Use different log levels based on severity
    switch (error.severity) {
      case 'critical':
        log.error('🚨 CRITICAL ERROR:', logMessage);
        break;
      case 'high':
        log.error('❌ ERROR:', logMessage);
        break;
      case 'medium':
        log.warn('⚠️ WARNING:', logMessage);
        break;
      case 'low':
        log.info('ℹ️ INFO:', logMessage);
        break;
    }
  }

  /**
   * Additional development-specific logging
   */
  private logDevelopmentDetails(error: ApargoError, context: Partial<ErrorContext>): void {
    console.group('🔍 Error Details');
    console.log('Technical Details:', error.technicalMessage);
    console.log('Original Error:', error.originalError);
    console.log('Context:', context);
    console.log('Metadata:', error.metadata);
    console.log('Stack Trace:', error.stackTrace);
    console.groupEnd();
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: ApargoError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(error: ApargoError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Start periodic batch processing
   */
  private startPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush buffered errors for batch processing
   */
  private flushBuffer(): void {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    // In a real implementation, this would send to external services
    // For now, we'll just log that we're flushing
    if (errors.length > 1) {
      log.info(`Flushing ${errors.length} buffered errors`);
    }

    // Here you would typically send to:
    // - External error tracking service (Sentry, Rollbar, etc.)
    // - Analytics service
    // - Database for persistence
    // - Webhook notifications for critical errors
  }

  /**
   * Get current metrics
   */
  getMetrics(): ErrorMetrics {
    return this.metricsStore.getMetrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metricsStore.reset();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupLogLevel();
    this.startPeriodicFlush();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.errorBuffer = [];
    this.listeners.clear();
  }
}

// Global error logger instance
let globalLogger: ErrorLogger | null = null;

/**
 * Get or create the global error logger
 */
export function getErrorLogger(config?: Partial<ServiceConfig>): ErrorLogger {
  if (!globalLogger) {
    globalLogger = new ErrorLogger(config);
  }
  return globalLogger;
}

/**
 * Set the global error logger (useful for testing)
 */
export function setErrorLogger(logger: ErrorLogger): void {
  if (globalLogger) {
    globalLogger.destroy();
  }
  globalLogger = logger;
}

/**
 * Standard logging functions
 */
export const logger = getErrorLogger();

export function logError(error: ApargoError, context?: Partial<ErrorContext>): void {
  logger.error(error, context);
}

export function logValidationError(
  field: string,
  message: string,
  context?: Partial<ErrorContext>
): void {
  // This would be a validation error, but we're keeping it simple
  // In a real implementation, you might create a validation error here
  log.warn(`Validation Error - ${field}: ${message}`, context);
}

export function logNetworkError(url: string, statusCode?: number, error?: Error): void {
  const context = { url, statusCode };
  log.warn(`Network Error - ${url}: ${statusCode}`, { ...context, originalError: error });
}

export function logDatabaseError(operation: string, error?: Error): void {
  log.error(`Database Error - ${operation}`, { operation, originalError: error });
}

export function logAuthError(type: string, context?: Partial<ErrorContext>): void {
  log.warn(`Authentication Error - ${type}`, context);
}

/**
 * Performance monitoring helpers
 */
export function startTimer(label: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    log.debug(`Timer "${label}": ${duration.toFixed(2)}ms`);
  };
}

export async function withPerformanceLogging<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  const endTimer = startTimer(label);
  try {
    const result = await operation();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

/**
 * Error reporting helpers for external services
 */
export function reportErrorToExternalService(
  error: ApargoError,
  service: 'sentry' | 'rollbar' | 'bugsnag'
): void {
  // This would integrate with external error tracking services
  // For now, just log the intent
  log.debug(`Would report error ${error.code} to ${service}`, {
    error: error.message,
    severity: error.severity,
    context: error.metadata,
  });
}

/**
 * Health check for error monitoring system
 */
export function getErrorMonitoringHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: ErrorMetrics;
  bufferSize: number;
  timestamp: string;
} {
  const metrics = logger.getMetrics();
  const healthStatus =
    metrics.businessImpactScore > 0.8
      ? 'unhealthy'
      : metrics.businessImpactScore > 0.5
        ? 'degraded'
        : 'healthy';

  return {
    status: healthStatus,
    metrics,
    bufferSize: logger['errorBuffer']?.length || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export types for external use
 */
export type { ApargoError, ErrorMetrics, ServiceConfig, ErrorContext } from './types';
