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

  // Create response
  const response = NextResponse.next();

  // Set other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, manifests, etc.)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
