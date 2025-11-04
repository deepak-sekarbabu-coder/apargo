// Core Error Types and Interfaces for Unified Error Handling System
import * as React from 'react';

/**
 * Error Classification Hierarchy
 * Based on severity, recovery possibility, and user impact
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'validation' // Input validation errors
  | 'network' // Network connectivity issues
  | 'authentication' // Auth-related errors
  | 'authorization' // Permission/role errors
  | 'database' // Database operation errors
  | 'storage' // File/storage errors
  | 'business_logic' // Business rule violations
  | 'system' // System/infrastructure errors
  | 'external_service' // Third-party service errors
  | 'user_interface' // UI/UX related errors
  | 'performance' // Performance-related issues
  | 'unknown'; // Uncategorized errors

export type ErrorCode =
  // Validation Errors (1000-1999)
  | 'VALIDATION_REQUIRED_FIELD' // Required field missing
  | 'VALIDATION_INVALID_FORMAT' // Invalid data format
  | 'VALIDATION_OUT_OF_RANGE' // Value outside allowed range
  | 'VALIDATION_DUPLICATE' // Duplicate data entry
  | 'VALIDATION_CONSTRAINT' // Business rule violation

  // Authentication Errors (2000-2099)
  | 'AUTH_MISSING_CREDENTIALS' // No auth credentials provided
  | 'AUTH_INVALID_TOKEN' // Invalid session/token
  | 'AUTH_EXPIRED' // Session expired
  | 'AUTH_USER_NOT_FOUND' // User doesn't exist
  | 'AUTH_DISABLED' // User account disabled

  // Authorization Errors (2100-2199)
  | 'AUTHZ_INSUFFICIENT_PERMISSIONS' // Missing required permissions
  | 'AUTHZ_ROLE_INSUFFICIENT' // Role doesn't have required access
  | 'AUTHZ_RESOURCE_ACCESS_DENIED' // Access to specific resource denied

  // Database Errors (3000-3099)
  | 'DB_CONNECTION_FAILED' // Database connection error
  | 'DB_OPERATION_FAILED' // General DB operation failed
  | 'DB_CONSTRAINT_VIOLATION' // Database constraint violation
  | 'DB_TIMEOUT' // Database operation timeout
  | 'DB_NOT_FOUND' // Record not found

  // Network Errors (4000-4099)
  | 'NETWORK_TIMEOUT' // Request timeout
  | 'NETWORK_OFFLINE' // No internet connection
  | 'NETWORK_SERVER_ERROR' // Server-side error
  | 'NETWORK_CLIENT_ERROR' // Client-side error
  | 'NETWORK_SERVICE_UNAVAILABLE' // Service temporarily unavailable

  // Storage Errors (5000-5099)
  | 'STORAGE_UPLOAD_FAILED' // File upload failed
  | 'STORAGE_QUOTA_EXCEEDED' // Storage quota exceeded
  | 'STORAGE_INVALID_FORMAT' // Unsupported file format
  | 'STORAGE_SIZE_EXCEEDED' // File too large

  // External Service Errors (6000-6099)
  | 'EXT_SERVICE_TIMEOUT' // External service timeout
  | 'EXT_SERVICE_ERROR' // External service error
  | 'EXT_SERVICE_UNAVAILABLE' // External service unavailable

  // System Errors (7000-7099)
  | 'SYSTEM_OUT_OF_MEMORY' // Out of memory
  | 'SYSTEM_STACK_OVERFLOW' // Stack overflow
  | 'SYSTEM_DISK_FULL' // Disk space exhausted
  | 'SYSTEM_MAINTENANCE' // System maintenance mode

  // Business Logic Errors (8000-8099)
  | 'BUSINESS_INSUFFICIENT_FUNDS' // Not enough money/credit
  | 'BUSINESS_DATE_CONSTRAINT' // Date business rule violation
  | 'BUSINESS_WORKFLOW_VIOLATION' // Invalid workflow state
  | 'BUSINESS_QUANTITY_CONSTRAINT' // Quantity/business rule violation

  // UI Errors (9000-9099)
  | 'UI_COMPONENT_ERROR' // React component error
  | 'UI_RENDER_ERROR' // Rendering error
  | 'UI_EVENT_HANDLER_ERROR' // Event handler error

  // Generic Errors (0000-0099)
  | 'GENERIC_UNKNOWN_ERROR' // Unknown/unclassified error
  | 'GENERIC_OPERATION_FAILED' // General operation failed
  | 'GENERIC_CONFIGURATION_ERROR'; // Configuration issue

export type UserMessageType =
  | 'error' // Red alert, immediate attention needed
  | 'warning' // Yellow alert, proceed with caution
  | 'info' // Blue info, neutral information
  | 'success' // Green success, operation completed
  | 'hint'; // Gray hint, helpful guidance

/**
 * Core Error Interface
 * Provides structured error information with context and recovery options
 */
export interface ApargoError extends Error {
  // Error Classification
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;

  // Error Context
  message: string; // User-friendly message
  technicalMessage?: string; // Technical details for developers
  details?: Record<string, unknown>; // Additional error context

  // User Feedback
  userMessage: string; // Display message for users
  userMessageType: UserMessageType; // Visual style for user feedback

  // Recovery Information
  recoveryAction?: {
    type: 'retry' | 'refresh' | 'contact_support' | 'check_input' | 'wait' | 'none';
    label: string; // Action button text
    hint?: string; // Additional guidance
  };

  // Debug Information
  timestamp: string; // ISO timestamp
  requestId?: string; // Correlation ID for tracking
  userId?: string; // Associated user ID (if applicable)
  component?: string; // Component where error occurred
  operation?: string; // Operation that failed
  metadata?: Record<string, unknown>; // Additional debug metadata

  // Stack Trace and Source
  stackTrace?: string; // Error stack trace
  originalError?: Error; // Original error (if wrapped)
}

/**
 * Error Handling Options
 * Configuration for how errors should be handled
 */
export interface ErrorHandlingOptions {
  // Logging
  shouldLog: boolean; // Should this error be logged
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  // User Feedback
  shouldNotifyUser: boolean; // Should show user notification
  notificationType: UserMessageType;

  // Recovery
  shouldRetry: boolean; // Should attempt automatic retry
  maxRetries?: number; // Maximum retry attempts
  retryDelay?: number; // Delay between retries (ms)

  // Monitoring
  shouldTrack: boolean; // Should track in error monitoring
  trackEvent?: string; // Custom event name for tracking

  // Fallback
  fallbackAction?: string; // Action to take as fallback
}

/**
 * Error Context Interface
 * Contextual information for error handling
 */
export interface ErrorContext {
  userId?: string;
  apartmentId?: string;
  role?: string;
  feature?: string;
  operation?: string;
  requestId?: string;
  userAgent?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Recovery Strategy Interface
 * Defines how to recover from specific error types
 */
export interface RecoveryStrategy {
  canHandle: (error: ApargoError) => boolean;
  recover: (error: ApargoError, context: ErrorContext) => Promise<ApargoError | null>;
  priority: number; // Higher priority strategies checked first
}

/**
 * Error Boundary State
 * For React Error Boundary component
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: ApargoError | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Toast Notification Interface
 * Standardized notification format
 */
export interface ToastNotification {
  id: string;
  type: UserMessageType;
  title: string;
  description: string;
  duration?: number; // Duration in ms (0 for persistent)
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

/**
 * Error Metrics Interface
 * For tracking error statistics and monitoring
 */
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<ErrorCode, number>;
  userImpactScore: number; // 0-1 scale, how many users affected
  businessImpactScore: number; // 0-1 scale, business impact
  lastUpdated: string;
}

/**
 * Validation Result Interface
 * Standard format for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ApargoError[];
  warnings: ApargoError[];
}

/**
 * Operation Result Interface
 * Standard format for async operations
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApargoError;
  warnings?: ApargoError[];
}

/**
 * Service Configuration Interface
 * Configuration for error handling services
 */
export interface ServiceConfig {
  // Logging
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Monitoring
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;

  // Recovery
  enableAutoRetry: boolean;
  maxRetryAttempts: number;
  retryDelayMultiplier: number;

  // UI
  enableUserNotifications: boolean;
  defaultNotificationDuration: number;

  // Development
  enableDetailedErrors: boolean; // Show technical details in development
  enableStackTraces: boolean; // Include stack traces in development
}

/**
 * Default configuration values
 */
export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  enableConsoleLogging: true,
  enableFileLogging: false,
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableErrorTracking: false,
  enablePerformanceMonitoring: true,
  enableAutoRetry: true,
  maxRetryAttempts: 3,
  retryDelayMultiplier: 1000,
  enableUserNotifications: true,
  defaultNotificationDuration: 5000,
  enableDetailedErrors: process.env.NODE_ENV === 'development',
  enableStackTraces: process.env.NODE_ENV === 'development',
};
