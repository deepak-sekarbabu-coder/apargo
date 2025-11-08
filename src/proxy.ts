import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // Block debug and test routes in production
  if (process.env.NODE_ENV === "production") {
    const pathname = request.nextUrl.pathname

    // List of routes to block in production
    const blockedRoutes = [
      "/api/debug",
      "/api/test",
      "/api/test-fcm",
      "/api/test-notification",
      "/api/test-notifications",
      "/api/debug-data",
      "/api/notification-debug",
      "/api/netlify-test",
      "/api/payment-events/test",
      "/api/payment-events/ping",
      "/api/admin/storage/stats",
      "/api/fix-notifications",
      "/api/payments",
      "/api/quick-fix-user",
    ]

    // Check if the request path starts with any blocked route
    const isBlocked = blockedRoutes.some((route) =>
      pathname.startsWith(route)
    )

    if (isBlocked) {
      return NextResponse.json(
        { error: "Not Found" },
        { status: 404 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/debug/:path*",
    "/api/test",
    "/api/test/:path*",
    "/api/test-fcm",
    "/api/test-fcm/:path*",
    "/api/test-notification",
    "/api/test-notification/:path*",
    "/api/test-notifications",
    "/api/test-notifications/:path*",
    "/api/debug-data",
    "/api/debug-data/:path*",
    "/api/notification-debug",
    "/api/notification-debug/:path*",
    "/api/netlify-test",
    "/api/netlify-test/:path*",
    "/api/payment-events/test",
    "/api/payment-events/test/:path*",
    "/api/payment-events/ping",
    "/api/payment-events/ping/:path*",
    "/api/admin/storage/stats",
    "/api/admin/storage/stats/:path*",
    "/api/fix-notifications",
    "/api/fix-notifications/:path*",
    "/api/payments/:path*",
    "/api/quick-fix-user",
    "/api/quick-fix-user/:path*",
  ],
}

