// Main entry point for the Unified Error Handling System
// Exports all error handling components and utilities

// Core types and interfaces
export * from './types';

// Error factory and creation utilities
export * from './factory';

// Centralized logging and monitoring
export * from './logger';

// Graceful degradation and recovery
export * from './degradation';

// Re-export commonly used types and functions for convenience
export type {
  ApargoError,
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  UserMessageType,
  ErrorContext,
  ErrorHandlingOptions,
  OperationResult,
  ValidationResult,
  ErrorMetrics,
  ServiceConfig,
  RecoveryStrategy,
} from './types';

export {
  createError,
  createValidationError,
  createAuthError,
  createDatabaseError,
  createNetworkError,
  createBusinessError,
  createStorageError,
  createSystemError,
  wrapError,
  createValidationResult,
  createOperationResult,
  withRetry,
} from './factory';

export {
  getErrorLogger,
  setErrorLogger,
  logger,
  logError,
  logValidationError,
  logNetworkError,
  logDatabaseError,
  logAuthError,
  startTimer,
  withPerformanceLogging,
  reportErrorToExternalService,
  getErrorMonitoringHealth,
} from './logger';

export {
  registerRecoveryStrategy,
  attemptRecovery,
  FallbackProvider,
  CircuitBreaker,
  getCircuitBreaker,
  retryWithBackoff,
  withTimeout,
  executeBulk,
  getDegradationHealth,
} from './degradation';

// Default configuration
export { DEFAULT_SERVICE_CONFIG } from './types';