import log from 'loglevel';

// Set log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'warn';
log.setLevel(logLevel);

/**
 * Get a named logger instance for structured logging
 *
 * Use named loggers to organize logs by feature/module:
 * - 'Auth' for authentication-related code
 * - 'Firestore' for database operations
 * - 'Firebase' for Firebase operations
 * - 'Notifications' for notification code
 * - 'Storage' for file storage operations
 * - 'HTTP' or 'API' for API route handlers
 * - 'Component' for React component logging
 * - 'Hook' for React hook logging
 *
 * Log levels (in order of severity):
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages for potentially problematic situations
 * - info: Informational messages about normal operation
 * - debug: Detailed debugging information (console.log maps to this)
 * - trace: Very detailed tracing information
 *
 * @param name - Name of the logger (e.g., 'HTTP', 'Database', 'Auth')
 * @returns A logger instance with the same log level as the default logger
 *
 * @example
 * ```ts
 * const logger = getLogger('Auth');
 * logger.error('Authentication failed', error);
 * logger.warn('Token expired');
 * logger.info('User logged in', { userId });
 * logger.debug('Checking token validity');
 * ```
 */
export function getLogger(name: string) {
  const logger = log.getLogger(name);
  logger.setLevel(logLevel);
  return logger;
}

/**
 * Default logger instance
 * Use this for general-purpose logging when a named logger isn't needed
 */
export default log;
