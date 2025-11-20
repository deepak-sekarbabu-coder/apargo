import log from 'loglevel';

// Set log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'warn';
log.setLevel(logLevel);

/**
 * Get a named logger instance
 * @param name - Name of the logger (e.g., 'HTTP', 'Database', 'Auth')
 * @returns A logger instance with the same log level as the default logger
 */
export function getLogger(name: string) {
  const logger = log.getLogger(name);
  logger.setLevel(logLevel);
  return logger;
}

export default log;
