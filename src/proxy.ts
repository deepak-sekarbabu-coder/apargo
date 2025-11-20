import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Block debug and test routes in production
  if (process.env.NODE_ENV === 'production') {
    const pathname = request.nextUrl.pathname;

    // List of routes to block in production
    const blockedRoutes = [
      '/api/_testing/debug',
      '/api/_testing/test',
      '/api/_testing/test-fcm',
      '/api/_testing/test-notification',
      '/api/_testing/test-notifications',
      '/api/_testing/debug-data',
      '/api/_testing/notification-debug',
      '/api/_testing/netlify-test',
      '/api/core/payment-events/test',
      '/api/core/payment-events/ping',
      '/api/admin/storage/stats',
      '/api/_testing/fix-notifications',
      '/api/core/payments',
      '/api/_testing/quick-fix-user',
    ];

    // Check if the request path starts with any blocked route
    const isBlocked = blockedRoutes.some(route => pathname.startsWith(route));

    if (isBlocked) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/_testing/debug/:path*',
    '/api/_testing/test',
    '/api/_testing/test/:path*',
    '/api/_testing/test-fcm',
    '/api/_testing/test-fcm/:path*',
    '/api/_testing/test-notification',
    '/api/_testing/test-notification/:path*',
    '/api/_testing/test-notifications',
    '/api/_testing/test-notifications/:path*',
    '/api/_testing/debug-data',
    '/api/_testing/debug-data/:path*',
    '/api/_testing/notification-debug',
    '/api/_testing/notification-debug/:path*',
    '/api/_testing/netlify-test',
    '/api/_testing/netlify-test/:path*',
    '/api/core/payment-events/test',
    '/api/core/payment-events/test/:path*',
    '/api/core/payment-events/ping',
    '/api/core/payment-events/ping/:path*',
    '/api/admin/storage/stats',
    '/api/admin/storage/stats/:path*',
    '/api/_testing/fix-notifications',
    '/api/_testing/fix-notifications/:path*',
    '/api/core/payments/:path*',
    '/api/_testing/quick-fix-user',
    '/api/_testing/quick-fix-user/:path*',
  ],
};
