// React Error Boundary Component with Unified Error Handling
// Provides graceful degradation and standardized error display for React components
import React, { Component, ErrorInfo, ReactNode } from 'react';

import type { ApargoError, ErrorBoundaryState, ErrorContext, UserMessageType } from '@/lib/errors';
import { createError, logger, wrapError } from '@/lib/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: ApargoError, retry: () => void) => ReactNode);
  onError?: (error: ApargoError, errorInfo: ErrorInfo) => void;
  context?: Partial<ErrorContext>;
  feature?: string;
  operation?: string;
}

/**
 * React Error Boundary with unified error handling
 */
export class ApargoErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Convert the error to an ApargoError
    const apargoError = wrapError(error);

    return {
      hasError: true,
      error: apargoError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using our unified error system
    const context: ErrorContext = {
      operation: this.props.operation || 'react_component',
      feature: this.props.feature,
      timestamp: new Date().toISOString(),
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ApargoErrorBoundary',
      },
      ...this.props.context,
    };

    const apargoError = wrapError(error, undefined, context);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log the error
    logger.error(apargoError, context);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(apargoError, errorInfo);
    }
  }

  // Helper method for recovery actions
  private getRecoveryActionHandler(recoveryAction: any) {
    switch (recoveryAction.type) {
      case 'retry':
        return this.handleRetry.bind(this);
      case 'refresh':
        return this.handleReload.bind(this);
      case 'wait':
        return () => {
          setTimeout(() => (this as any).handleRetry(), 3000);
        };
      default:
        return this.handleRetry.bind(this);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleRetry);
        }
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorDisplay
          error={this.state.error}
          retry={this.handleRetry}
          reload={this.handleReload}
          retryCount={this.state.retryCount}
          recoveryActionHandler={this.getRecoveryActionHandler.bind(this)}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error display component
 */
interface DefaultErrorDisplayProps {
  error: ApargoError;
  retry: () => void;
  reload: () => void;
  retryCount: number;
  recoveryActionHandler: (action: any) => () => void;
}

function DefaultErrorDisplay({ error, retry, reload, retryCount, recoveryActionHandler }: DefaultErrorDisplayProps) {
  const getSeverityColor = (userMessageType: UserMessageType): string => {
    switch (userMessageType) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = (userMessageType: UserMessageType): string => {
    switch (userMessageType) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getSeverityColor(error.userMessageType)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getIcon(error.userMessageType)}</span>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">{error.userMessage}</h3>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs">
              <p>
                <strong>Error Code:</strong> {error.code}
              </p>
              <p>
                <strong>Category:</strong> {error.category}
              </p>
              <p>
                <strong>Severity:</strong> {error.severity}
              </p>
              {error.technicalMessage && (
                <p>
                  <strong>Technical Details:</strong> {error.technicalMessage}
                </p>
              )}
            </div>
          )}

          {error.recoveryAction && (
            <div className="mt-3">
              <button
                onClick={() => {
                  const handler = recoveryActionHandler(error.recoveryAction);
                  handler();
                }}
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {error.recoveryAction.label}
              </button>

              {error.recoveryAction.hint && (
                <p className="mt-1 text-xs opacity-75">{error.recoveryAction.hint}</p>
              )}
            </div>
          )}

          <div className="mt-3 flex space-x-2">
            <button
              onClick={retry}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again (
              {retryCount > 0 ? `${retryCount} attempts` : 'First try'})
            </button>

            <button
              onClick={reload}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ApargoErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ApargoErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual error reporting within functional components
 */
export function useErrorHandler() {
  return {
    reportError: (error: Error | ApargoError, context?: Partial<ErrorContext>) => {
      const apargoError = wrapError(error, undefined, context);
      logger.error(apargoError, context);

      // In a real implementation, you might also:
      // - Show user notification
      // - Send to monitoring service
      // - Trigger recovery mechanisms
    },

    reportValidationError: (field: string, message: string, context?: Partial<ErrorContext>) => {
      const error = createError('VALIDATION_CONSTRAINT', `${field}: ${message}`, {
        category: 'validation',
        severity: 'medium',
        userMessageType: 'warning',
        metadata: { field, validationMessage: message },
        context,
      });

      logger.error(error, context);
    },

    reportNetworkError: (
      url: string,
      statusCode?: number,
      error?: Error,
      context?: Partial<ErrorContext>
    ) => {
      const apargoError = wrapError(error || new Error(`Network error: ${statusCode}`), undefined, {
        ...context,
        metadata: { url, statusCode },
      });

      logger.error(apargoError, context);
    },
  };
}

/**
 * Component for displaying inline errors
 */
interface InlineErrorProps {
  error: ApargoError | Error | string;
  className?: string;
  showDetails?: boolean;
}

export function InlineError({ error, className = '', showDetails = false }: InlineErrorProps) {
  const apargoError =
    typeof error === 'string'
      ? createError('VALIDATION_CONSTRAINT', error, {
          category: 'validation',
          severity: 'medium',
          userMessageType: 'error',
        })
      : 'code' in error
        ? error
        : wrapError(error);

  return (
    <div
      className={`p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded ${className}`}
    >
      <div className="flex items-center space-x-2">
        <span>❌</span>
        <span>{apargoError.userMessage}</span>
      </div>

      {showDetails && process.env.NODE_ENV === 'development' && (
        <div className="mt-1 text-xs text-red-500">
          <p>Code: {apargoError.code}</p>
          <p>Category: {apargoError.category}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Utility to wrap async operations with error boundary protection
 */
export function withErrorProtection<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  errorHandler?: (error: ApargoError) => void
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const apargoError = wrapError(error as Error);
      logger.error(apargoError);

      if (errorHandler) {
        errorHandler(apargoError);
      }

      return undefined;
    }
  };
}
