import log from 'loglevel';

// Set log level based on environment
if (process.env.NODE_ENV === 'production') {
  log.setLevel('error'); // Only log errors in production
} else {
  log.setLevel('warn'); // Log warnings and errors in development
}

export default log;
