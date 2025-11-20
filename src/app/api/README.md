# API Routes (`/api`)

This directory contains all Next.js API routes using the App Router convention. Routes are organized by domain and responsibility.

## Directory Structure

```
src/app/api/
├── _infrastructure/       # Core infrastructure endpoints
│   └── health/           # Health check endpoints
├── _testing/             # Development & testing endpoints (excluded in production)
│   ├── debug/            # Debugging utilities
│   ├── debug-data/       # Debug data generation
│   ├── fix-notifications/# Notification troubleshooting
│   ├── netlify-test/     # Netlify deployment testing
│   ├── notification-debug/ # Notification debugging
│   ├── quick-fix-user/   # Quick user fixes
│   ├── test/             # General testing endpoints
│   ├── test-fcm/         # FCM testing
│   └── test-notification* # Notification testing endpoints
├── admin/                # Admin-only operations
│   ├── files/            # File management
│   ├── maintenance/      # System maintenance
│   └── storage/          # Storage operations
├── auth/                 # Authentication endpoints
│   └── session/          # Session management & token refresh
└── core/                 # Core business logic endpoints
    ├── announcements/    # Announcement operations
    ├── expenses/         # Expense management
    ├── payment-events/   # Payment event handlers
    ├── payments/         # Payment operations
    └── storage/          # Data storage operations
```

## Route Conventions

All routes follow Next.js App Router conventions:

- **`route.ts`** → GET/POST/PUT/DELETE handler
- **`route.ts`** exports named functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
- Parameters via `[param]/route.ts` syntax
- Dynamic segments use `[id]` convention

### Example Route Structure

```
src/app/api/core/expenses/
├── route.ts              # GET /api/core/expenses, POST /api/core/expenses
├── [id]/
│   └── route.ts          # GET /api/core/expenses/[id], PUT, DELETE
└── [id]/details/
    └── route.ts          # GET /api/core/expenses/[id]/details
```

## Authentication & Authorization

All routes (except health checks) require Firebase authentication:

- **Custom Claims:** Routes verify `apartmentId` and `role` claims
- **Admin Routes:** Require `role: 'admin'` custom claim
- **User Routes:** Require valid `apartmentId` claim
- **Server-Only:** Admin operations run only via server routes with `firebase-admin` SDK

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Status Codes

- `200` – Success
- `400` – Bad request (validation error)
- `401` – Unauthorized (missing/invalid auth)
- `403` – Forbidden (insufficient permissions)
- `404` – Not found
- `500` – Server error

## Endpoint Categories

### Infrastructure (`_infrastructure/`)

- **Health Check** (`GET /api/_infrastructure/health`) – Service availability check

### Authentication (`auth/`)

- **Session Management** (`GET /api/auth/session`) – Get current user session
- **Token Refresh** – Auto-refresh Firebase ID tokens

### Core Operations (`core/`)

- **Announcements** – CRUD operations for apartment announcements
- **Expenses** – Expense tracking and reporting
- **Payments** – Payment processing and history
- **Payment Events** – Webhook & event handlers for payment services
- **Storage** – Generic data storage operations

### Admin (`admin/`)

- **Files** – File upload/download management
- **Maintenance** – System maintenance & optimization tasks
- **Storage** – Admin-level storage operations

### Testing (`_testing/`)

⚠️ **Excluded from production builds** via `scripts/pre-build-exclude-routes.js`

- Debug endpoints for development
- FCM (Firebase Cloud Messaging) testing
- Notification troubleshooting
- User quick-fixes
- Netlify deployment testing

## Development Guidelines

### Creating a New Route

1. Create directory following domain structure: `src/app/api/[domain]/[resource]/`
2. Create `route.ts` with appropriate handler:

   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { getAuth } from '@/lib/auth';

   export async function GET(req: NextRequest) {
     try {
       const auth = await getAuth();
       if (!auth?.user?.uid) {
         return NextResponse.json(
           { success: false, error: 'Unauthorized' },
           { status: 401 }
         );
       }
       // Route logic
       return NextResponse.json({ success: true, data: {} });
     } catch (error) {
       return NextResponse.json(
         { success: false, error: 'Server error' },
         { status: 500 }
       );
     }
   }
   ```

3. Add authentication/authorization checks
4. Use Zod for input validation
5. Return consistent response format

### Error Handling

- Always validate input with Zod schemas
- Throw descriptive errors with context
- Log errors for debugging
- Return appropriate HTTP status codes

### Testing Routes

1. Use `_testing/` directory for test endpoints
2. Verify routes are excluded in `scripts/pre-build-exclude-routes.js`
3. Test with mock Firebase auth in development
4. Clean up test endpoints before production

## Build Optimization

Test routes are **automatically excluded** from production builds:

- Script: `scripts/pre-build-exclude-routes.js`
- Runs before build (via `prebuild` npm script)
- Restores routes after build (via `postbuild` npm script)
- Prevents test code from shipping to production

## Performance Notes

- **Caching:** Use `Cache-Control` headers for appropriate TTL
- **Compression:** Enabled automatically via Next.js
- **Error Logging:** Use structured logging for production
- **Rate Limiting:** Implement rate limiting for sensitive endpoints
- **Validation:** Always validate input before processing

## Related Documentation

- [FIRESTORE_MODELS.md](../../FIRESTORE_MODELS.md) – Data model definitions
- [AGENTS.md](../../AGENTS.md) – Development guidelines & stack info
- [Firebase Auth Setup](../../lib/auth/README.md) – Authentication implementation
