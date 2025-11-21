import { NextRequest, NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';

const logger = getLogger('HTTP');

/**
 * Higher-order function that wraps an API route handler with request/response logging
 * Supports both simple handlers and handlers with context (like params)
 */
// Overload for handlers without context
export function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;

// Overload for handlers with context (e.g., params)
export function withLogging<TContext>(
  handler: (req: NextRequest, context: TContext) => Promise<NextResponse>
): (req: NextRequest, context: TContext) => Promise<NextResponse>;

// Implementation
export function withLogging<TContext = never>(
  handler: (req: NextRequest, context?: TContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: TContext): Promise<NextResponse> => {
    const startTime = Date.now();
    const { pathname, search } = new URL(req.url);

    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      logger.info(`${req.method} ${pathname}${search} ${response.status} ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${req.method} ${pathname}${search} failed after ${duration}ms`, error);
      throw error;
    }
  };
}
