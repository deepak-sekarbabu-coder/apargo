// Base API Handler with Unified Error Handling
// Provides standardized error handling for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';

import type { ApargoError, ErrorCode, ErrorContext, OperationResult } from '@/lib/errors';
import { createAuthError, createError, createOperationResult, createSystemError, logger, wrapError } from '@/lib/errors';

// Type for API handler functions
type ApiHandler<T = any> = (
  request: NextRequest,
  context: ErrorContext
) => Promise<OperationResult<T>>;

// Base error response format
interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    details?: Record<string, any>;
    requestId?: string;
    timestamp: string;
  };
  meta?: {
    retryable: boolean;
    recoveryAction?: {
      type: 'retry' | 'refresh' | 'contact_support' | 'check_input' | 'wait' | 'none';
      label: string;
      hint?: string;
    };
  };
}

// Base success response format
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Create a standardized API error response
 */
function createErrorResponse(error: ApargoError): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      details: process.env.NODE_ENV === 'development' ? error.metadata : undefined,
      requestId: error.requestId,
      timestamp: error.timestamp,
    },
    meta: {
      retryable: ['retry'].includes(error.recoveryAction?.type || 'none'),
      recoveryAction: error.recoveryAction,
    },
  };

  return NextResponse.json(response, { status: getHttpStatusFromError(error) });
}

/**
 * Create a standardized API success response
 */
function createSuccessResponse<T>(
  data: T,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
  };

  return NextResponse.json(response);
}

/**
 * Map error codes to HTTP status codes
 */
function getHttpStatusFromError(error: ApargoError): number {
  switch (error.code) {
    case 'AUTH_MISSING_CREDENTIALS':
    case 'AUTH_INVALID_TOKEN':
    case 'AUTH_EXPIRED':
      return 401;

    case 'AUTHZ_INSUFFICIENT_PERMISSIONS':
    case 'AUTHZ_ROLE_INSUFFICIENT':
    case 'AUTHZ_RESOURCE_ACCESS_DENIED':
      return 403;

    case 'VALIDATION_REQUIRED_FIELD':
    case 'VALIDATION_INVALID_FORMAT':
    case 'VALIDATION_OUT_OF_RANGE':
    case 'VALIDATION_DUPLICATE':
    case 'VALIDATION_CONSTRAINT':
      return 400;

    case 'DB_NOT_FOUND':
      return 404;

    case 'DB_CONNECTION_FAILED':
    case 'DB_OPERATION_FAILED':
    case 'SYSTEM_OUT_OF_MEMORY':
    case 'SYSTEM_DISK_FULL':
      return 500;

    case 'NETWORK_TIMEOUT':
    case 'NETWORK_OFFLINE':
    case 'NETWORK_SERVICE_UNAVAILABLE':
      return 503;

    case 'STORAGE_QUOTA_EXCEEDED':
    case 'STORAGE_SIZE_EXCEEDED':
      return 413;

    default:
      return 500;
  }
}

/**
 * Generate a request ID for correlation
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Base API handler wrapper with unified error handling
 */
export function createApiHandler<T>(
  handler: ApiHandler<T>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    operationName?: string;
    feature?: string;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const context: ErrorContext = {
      requestId,
      operation: options.operationName || 'api_operation',
      feature: options.feature,
      timestamp: new Date().toISOString(),
    };

    try {
      // Log the incoming request
      logger.debug(`API Request: ${request.method} ${request.url}`, {
        ...context,
        metadata: {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
        },
      });

      // Execute the handler
      const result = await handler(request, context);

      if (!result.success) {
        // Log the error
        logger.error(result.error!, context);

        // Return error response
        return createErrorResponse(result.error!);
      }

      // Log successful operation
      logger.debug(`API Success: ${request.method} ${request.url}`, {
        ...context,
        metadata: { requestId },
      });

      // Return success response
      return createSuccessResponse(result.data, requestId);
    } catch (error) {
      // Handle unexpected errors
      const apargoError = wrapError(error as Error, 'GENERIC_UNKNOWN_ERROR', context);

      // Log the error
      logger.error(apargoError, {
        ...context,
        metadata: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
        },
      });

      // Return error response
      return createErrorResponse(apargoError);
    }
  };
}

/**
 * Authentication verification with standardized error handling
 */
export async function verifyAuth(
  request: NextRequest,
  context: ErrorContext
): Promise<{ user?: any; error?: ApargoError }> {
  try {
    // Check for session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return {
        error: createError('AUTH_MISSING_CREDENTIALS', 'Authentication required', {
          category: 'authentication',
          severity: 'high',
          userMessage: 'Please sign in to access this resource',
          context,
        }),
      };
    }

    // Verify session cookie (would integrate with Firebase Admin here)
    // For now, we'll simulate the verification
    // In a real implementation, this would:
    // 1. Verify the session cookie with Firebase Admin
    // 2. Get the user from Firestore
    // 3. Check permissions if required

    return { user: { id: 'user123', role: 'user' } }; // Mock user for now
  } catch (error) {
    if (error instanceof Error && error.message.includes('Firebase')) {
      return {
        error: createSystemError(
          'SYSTEM_MAINTENANCE',
          'Authentication service unavailable',
          error as Error,
          context
        ),
      };
    }

    return {
      error: createAuthError('AUTH_INVALID_TOKEN', 'Invalid authentication session', context),
    };
  }
}

/**
 * Admin role verification
 */
export function requireAdmin(
  user: any,
  context: ErrorContext
): { valid: boolean; error?: ApargoError } {
  if (!user) {
    return {
      valid: false,
      error: createError('AUTH_MISSING_CREDENTIALS', 'Authentication required', {
        category: 'authentication',
        severity: 'high',
        context,
      }),
    };
  }

  if (user.role !== 'admin') {
    return {
      valid: false,
      error: createError('AUTHZ_ROLE_INSUFFICIENT', 'Admin access required', {
        category: 'authorization',
        severity: 'high',
        userMessage: 'You need administrator privileges to access this resource',
        context,
      }),
    };
  }

  return { valid: true };
}

/**
 * Input validation helper
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[],
  context: ErrorContext
): { valid: boolean; error?: ApargoError } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: createValidationError(
        'VALIDATION_REQUIRED_FIELD',
        `Missing required fields: ${missingFields.join(', ')}`,
        { fields: missingFields },
        context
      ),
    };
  }

  return { valid: true };
}

/**
 * Create validation error with context
 */
function createValidationError(
  code: ErrorCode,
  message: string,
  metadata?: Record<string, any>,
  context?: ErrorContext
): ApargoError {
  return createError(code, message, {
    category: 'validation',
    severity: 'medium',
    userMessageType: 'warning',
    userMessage: 'Please check your input and try again',
    metadata,
    context,
  });
}

/**
 * Health check endpoint handler
 */
export function createHealthCheckHandler() {
  return createApiHandler(
    async (request, context) => {
      return createOperationResult(true, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
      errorHandling: true,
      logging: true,
      monitoring: true,
      },
      });
    },
    {
      operationName: 'health_check',
      feature: 'system',
    }
  );
}
