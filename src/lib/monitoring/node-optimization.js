/**
 * Node.js optimization for serverless functions
 * Prevents EventEmitter memory leaks and optimizes performance
 */
import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';

// Increase max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 15;

// Optimize process settings for serverless
if (typeof process !== 'undefined') {
  // Prevent memory leaks
  process.setMaxListeners(15);

  // Optimize garbage collection for short-lived functions
  if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=1024';
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
}

// Optimize HTTP connections

// Increase socket pool size
http.globalAgent.maxSockets = 50;
https.globalAgent.maxSockets = 50;

// Set keepAlive for better performance
http.globalAgent.keepAlive = true;
https.globalAgent.keepAlive = true;

// Export for manual imports
export function optimizeNodejs() {}
