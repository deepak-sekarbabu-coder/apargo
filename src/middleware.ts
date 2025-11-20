import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates a cryptographically secure random nonce for CSP
 * Compatible with Edge runtime
 */
function generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

/**
 * Content Security Policy configuration
 */
function getCSPHeader(nonce: string, isDevelopment: boolean): string {
    const directives = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://www.gstatic.com https://accounts.google.com https://www.google.com https://www.recaptcha.net https://www.googletagmanager.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
        `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.google.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com",
        "worker-src 'self' blob:",
        "frame-ancestors 'self'",
        'upgrade-insecure-requests',
    ];

    return directives.join('; ');
}

export function middleware(request: NextRequest) {
    // Generate a unique nonce for this request
    const nonce = generateNonce();
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Create response
    const response = NextResponse.next();

    // Set CSP header
    const cspHeader = getCSPHeader(nonce, isDevelopment);
    response.headers.set('Content-Security-Policy', cspHeader);

    // Set other security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Pass nonce to the page via a custom header
    response.headers.set('x-nonce', nonce);

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
