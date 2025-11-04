// Core Error Creation Utilities
// Provides standardized error creation with consistent context and formatting
import type {
  ApargoError,
  ErrorCategory,
  ErrorCode,
  ErrorContext,
  ErrorHandlingOptions,
  ErrorSeverity,
  OperationResult,
  UserMessageType,
  ValidationResult,
} from './types';

/**
 * Base error creation factory
 * Creates standardized ApargoError instances with consistent structure
 */
export function createError(
  code: ErrorCode,
  message: string,
  options: Partial<ApargoError> & {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    technicalMessage?: string;
    userMessage?: string;
    userMessageType?: UserMessageType;
    context?: ErrorContext;
    originalError?: Error;
    metadata?: Record<string, unknown>;
  } = {}
): ApargoError {
  const {
    category = inferCategoryFromCode(code),
    severity = inferSeverityFromCode(code),
    technicalMessage,
    userMessage = message,
    userMessageType = severityToMessageType(severity),
    context = {},
    originalError,
    metadata = {},
    ...rest
  } = options;

  const error = new Error(message) as ApargoError;

  // Core error properties
  Object.assign(error, {
    code,
    category,
    severity,
    name: 'ApargoError',
    message,
    technicalMessage,
    userMessage,
    userMessageType,

    // User feedback and recovery
    recoveryAction: getRecoveryAction(code, severity),

    // Context and metadata
    timestamp: new Date().toISOString(),
    requestId: context.requestId || generateRequestId(),
    userId: context.userId,
    component: context.feature || context.operation,
    operation: context.operation,
    metadata: {
      ...metadata,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      environment: process.env.NODE_ENV,
      ...context.metadata,
    },

    // Error chain
    originalError,
    stackTrace: error.stack,
    ...rest,
  });

  return error;
}

/**
 * Create a validation error
 */
export function createValidationError(
  code: ErrorCode,
  message: string,
  field?: string,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'validation',
    severity: 'medium',
    userMessageType: 'warning',
    metadata: { field, ...context.metadata },
    context: { ...context, feature: context.feature || 'validation' },
  });
}

/**
 * Create an authentication error
 */
export function createAuthError(
  code: ErrorCode,
  message: string,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'authentication',
    severity: 'high',
    userMessageType: 'error',
    context: { ...context, feature: context.feature || 'authentication' },
  });
}

/**
 * Create a database error
 */
export function createDatabaseError(
  code: ErrorCode,
  message: string,
  originalError?: Error,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'database',
    severity: 'high',
    userMessageType: 'error',
    originalError,
    context: { ...context, feature: context.feature || 'database' },
  });
}

/**
 * Create a network error
 */
export function createNetworkError(
  code: ErrorCode,
  message: string,
  statusCode?: number,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'network',
    severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
    userMessageType: statusCode && statusCode >= 500 ? 'error' : 'warning',
    metadata: { statusCode, ...context.metadata },
    context: { ...context, feature: context.feature || 'network' },
  });
}

/**
 * Create a business logic error
 */
export function createBusinessError(
  code: ErrorCode,
  message: string,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'business_logic',
    severity: 'medium',
    userMessageType: 'warning',
    context: { ...context, feature: context.feature || 'business_logic' },
  });
}

/**
 * Create a storage error
 */
export function createStorageError(
  code: ErrorCode,
  message: string,
  fileName?: string,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'storage',
    severity: 'medium',
    userMessageType: 'warning',
    metadata: { fileName, ...context.metadata },
    context: { ...context, feature: context.feature || 'storage' },
  });
}

/**
 * Create a system error
 */
export function createSystemError(
  code: ErrorCode,
  message: string,
  originalError?: Error,
  context: Partial<ErrorContext> = {}
): ApargoError {
  return createError(code, message, {
    category: 'system',
    severity: 'critical',
    userMessageType: 'error',
    originalError,
    context: { ...context, feature: context.feature || 'system' },
  });
}

/**
 * Wrap an existing error into an ApargoError
 */
export function wrapError(
  originalError: Error,
  context: Partial<ErrorContext> = {}
): ApargoError {
  // Check if it's already an ApargoError
  if ('code' in originalError && 'category' in originalError) {
    return originalError as ApargoError;
  }

  // Map common error patterns to appropriate error codes
  const mappedCode = mapCommonErrorToCode(originalError);

  return createError(mappedCode, originalError.message, {
    category: 'unknown',
    severity: 'medium',
    technicalMessage: `${originalError.name}: ${originalError.message}`,
    originalError,
    context,
  });
}

/**
 * Create a validation result with standardized error format
 */
export function createValidationResult(
  isValid: boolean,
  errors: ApargoError[],
  warnings: ApargoError[] = []
): ValidationResult {
  return {
    isValid,
    errors,
    warnings,
  };
}

/**
 * Create an operation result with standardized success/failure format
 */
export function createOperationResult<T>(
  success: boolean,
  data?: T,
  error?: ApargoError
): OperationResult<T> {
  return {
    success,
    data,
    error,
  };
}

/**
 * Retry wrapper for async operations with standardized error handling
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: Partial<ErrorContext>
): Promise<T> {
  let lastError: ApargoError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = wrapError(error as Error, context);

      if (attempt === maxRetries + 1) {
        throw lastError;
      }

      // Don't retry on certain types of errors
      if (isNonRetryableError(lastError.code) || attempt > maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Helper functions

function inferCategoryFromCode(code: ErrorCode): ErrorCategory {
  if (code.startsWith('VALIDATION_')) return 'validation';
  if (code.startsWith('AUTH_') && code.startsWith('AUTHZ_')) return 'authentication';
  if (code.startsWith('AUTHZ_')) return 'authorization';
  if (code.startsWith('DB_')) return 'database';
  if (code.startsWith('NETWORK_')) return 'network';
  if (code.startsWith('STORAGE_')) return 'storage';
  if (code.startsWith('EXT_SERVICE_')) return 'external_service';
  if (code.startsWith('SYSTEM_')) return 'system';
  if (code.startsWith('BUSINESS_')) return 'business_logic';
  if (code.startsWith('UI_')) return 'user_interface';
  return 'unknown';
}

function inferSeverityFromCode(code: ErrorCode): ErrorSeverity {
  switch (code) {
    case 'SYSTEM_OUT_OF_MEMORY':
    case 'SYSTEM_DISK_FULL':
    case 'NETWORK_SERVER_ERROR':
    case 'DB_CONNECTION_FAILED':
      return 'critical';

    case 'AUTH_INVALID_TOKEN':
    case 'AUTH_EXPIRED':
    case 'AUTHZ_INSUFFICIENT_PERMISSIONS':
    case 'DB_OPERATION_FAILED':
    case 'NETWORK_TIMEOUT':
    case 'STORAGE_UPLOAD_FAILED':
      return 'high';

    case 'VALIDATION_CONSTRAINT':
    case 'VALIDATION_INVALID_FORMAT':
    case 'NETWORK_CLIENT_ERROR':
    case 'BUSINESS_INSUFFICIENT_FUNDS':
    case 'UI_COMPONENT_ERROR':
      return 'medium';

    default:
      return 'low';
  }
}

function severityToMessageType(severity: ErrorSeverity): UserMessageType {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
  }
}

function getRecoveryAction(code: ErrorCode, severity: ErrorSeverity) {
  // Define recovery actions based on error type and severity
  if (code.startsWith('NETWORK_') && severity !== 'critical') {
    return {
      type: 'retry' as const,
      label: 'Retry',
      hint: 'Check your internet connection and try again',
    };
  }

  if (code.startsWith('VALIDATION_')) {
    return {
      type: 'check_input' as const,
      label: 'Check Input',
      hint: 'Please review and correct the highlighted fields',
    };
  }

  if (code.startsWith('AUTH_') || code.startsWith('AUTHZ_')) {
    return {
      type: 'refresh' as const,
      label: 'Sign In Again',
      hint: 'Please refresh the page and sign in again',
    };
  }

  if (severity === 'critical' || severity === 'high') {
    return {
      type: 'contact_support' as const,
      label: 'Contact Support',
      hint: 'Our team has been notified and will help resolve this issue',
    };
  }

  return {
    type: 'none' as const,
    label: 'OK',
  };
}

function mapCommonErrorToCode(error: Error): ErrorCode {
  const message = error.message.toLowerCase();

  // Firebase/Firestore errors
  if (message.includes('permission denied')) return 'AUTHZ_INSUFFICIENT_PERMISSIONS';
  if (message.includes('not found')) return 'DB_NOT_FOUND';
  if (message.includes('quota exceeded')) return 'STORAGE_QUOTA_EXCEEDED';
  if (message.includes('network error')) return 'NETWORK_TIMEOUT';

  // Network errors
  if (message.includes('fetch')) return 'NETWORK_CLIENT_ERROR';
  if (message.includes('timeout')) return 'NETWORK_TIMEOUT';
  if (message.includes('offline')) return 'NETWORK_OFFLINE';

  // File/Storage errors
  if (message.includes('file too large')) return 'STORAGE_SIZE_EXCEEDED';
  if (message.includes('format')) return 'STORAGE_INVALID_FORMAT';

  return 'GENERIC_UNKNOWN_ERROR';
}

function isNonRetryableError(code: ErrorCode): boolean {
  const nonRetryableCodes: ErrorCode[] = [
    'VALIDATION_REQUIRED_FIELD',
    'VALIDATION_INVALID_FORMAT',
    'AUTH_DISABLED',
    'AUTHZ_INSUFFICIENT_PERMISSIONS',
    'STORAGE_QUOTA_EXCEEDED',
    'SYSTEM_OUT_OF_MEMORY',
    'SYSTEM_DISK_FULL',
  ];

  return nonRetryableCodes.includes(code);
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Re-export types for convenience
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
};
