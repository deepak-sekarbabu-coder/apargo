# App Directory Structure

> This directory uses the Next.js App Router. Route groups (folders in parentheses) are for organization only and do not affect the URL structure.

## Directory Structure

```
src/app/
├── (auth)/                  # Authentication route group
│   └── login/              # Login page
├── (dashboard)/            # Dashboard route group
│   ├── dashboard/          # Main dashboard
│   ├── fault-reporting/    # Report a fault
│   ├── current-faults/     # View active faults
│   └── faults/             # All faults list
├── api/                    # API routes (see api/README.md)
│   ├── _infrastructure/    # Health checks
│   ├── _testing/          # Dev/test endpoints (excluded in production)
│   ├── admin/             # Admin operations
│   ├── auth/              # Authentication endpoints
│   └── core/              # Core business logic
├── globals.css            # Global styles & Tailwind
├── layout.tsx             # Root layout wrapper
├── not-found.tsx          # 404 error page
├── page.tsx               # Home page (/)
├── site.webmanifest       # PWA manifest
└── README.md              # This file
```

## Route Groups

Route groups use parentheses syntax: `(groupName)/`

- **Do not appear in URL** – `/login` not `/(auth)/login`
- **Organize related routes** – Group by feature or domain
- **Enable shared layouts** – Each group can have its own `layout.tsx`

### Route Group Breakdown

#### `(auth)` – Authentication Group

- `/login` – User login page
- Protected by auth middleware in layout
- Redirects authenticated users to dashboard

#### `(dashboard)` – Dashboard Group

- `/dashboard` – Main dashboard/home view
- `/fault-reporting` – Create/report new faults
- `/current-faults` – View active faults
- `/faults` – Complete faults list with filters
- Protected by auth middleware
- Requires valid Firebase authentication

## File Conventions

- **`page.tsx`** – Page component (entry point for route)
- **`layout.tsx`** – Layout wrapper (applies to route + children)
- **`route.ts`** – API endpoint handler (GET, POST, PUT, DELETE)
- **`error.tsx`** – Error boundary for errors in child routes
- **`not-found.tsx`** – Custom 404 page
- **`middleware.ts`** – Request/response interceptor (if at root)
- **`globals.css`** – Global styles, Tailwind directives, CSS reset

## URL Mapping Examples

| Route File | URL |
|---|---|
| `(auth)/login/page.tsx` | `/login` |
| `(dashboard)/dashboard/page.tsx` | `/dashboard` |
| `(dashboard)/fault-reporting/page.tsx` | `/fault-reporting` |
| `(dashboard)/faults/page.tsx` | `/faults` |
| `api/_infrastructure/health/route.ts` | `/api/_infrastructure/health` |
| `api/core/expenses/route.ts` | `/api/core/expenses` |
| `api/admin/files/route.ts` | `/api/admin/files` |
| `page.tsx` | `/` |

## Architecture Patterns

### Page Components

- Client/Server component with `'use client'` directive for interactivity
- Import UI components from `@/components`
- Fetch data via server actions or API routes
- Handle loading/error states with Suspense & error boundaries

### Layouts

- Define shared UI (headers, navigation, sidebars)
- Pass context providers for child routes
- Persist across navigation for that route group
- Root `layout.tsx` wraps entire app

### API Routes

- Pure server-side code (no `'use client'`)
- Use `firebase-admin` for privileged operations
- Return JSON responses
- See [api/README.md](./api/README.md) for detailed API structure

### Server Actions

- Defined in `src/actions/` (not in app/)
- Handle mutations and side effects
- Imported by page/component for form submissions
- Use `'use server'` directive

## Data Flow

```
User Interaction
    ↓
Client Component ('use client')
    ↓
Server Action or API Route
    ↓
Firebase (Firestore/Auth/Storage/Admin SDK)
    ↓
Response back to Client
```

## Authentication & Authorization

- **Root layout** handles auth redirects
- **Protected routes** require valid `apartmentId` custom claim
- **Admin routes** require `role: 'admin'` claim
- **Login page** `(auth)` → redirect to `/dashboard` when authenticated
- **Logout** clears Firebase session and redirects to `/login`

## Styling

- **Global CSS** – `globals.css` (Tailwind + custom styles)
- **Component styles** – Tailwind classes in JSX
- **CSS Modules** – `Component.module.css` (optional, for scoped styles)
- **Dynamic classes** – Use `clsx` or `classnames` for conditional styles
- **Responsive design** – Mobile-first Tailwind breakpoints

## Performance Optimization

- **Static Generation** – Use `generateStaticParams` for dynamic routes
- **Incremental Static Regeneration (ISR)** – Revalidate at intervals via `revalidatePath`
- **Server Components** – Default for better performance (no `'use client'` needed)
- **Code Splitting** – Automatic per-page JS bundling
- **Image Optimization** – Use `next/image` for responsive images
- **Lazy Loading** – `dynamic()` imports for heavy components

## Security Notes

- **Server-only imports** – Use `'use server'` & `server-only` package
- **Sensitive data** – Never expose API keys/secrets in client code
- **Authentication** – Always verify claims in API routes
- **CORS** – Configure in API route headers if needed
- **Environment variables** – Prefix client vars with `NEXT_PUBLIC_`

## Development Tips

1. **Hot reload** – Auto-refresh on file changes (`pnpm run dev`)
2. **Type safety** – Strict TypeScript in `src/**/*.ts{,x}`
3. **Error handling** – Use error boundaries and error pages
4. **Testing** – Place tests in `tests/` with same structure as `src/`
5. **Linting** – Run `pnpm run lint:fix` before commit

## Related Documentation

- [API Routes Documentation](./api/README.md) – Detailed API structure
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Route Groups Guide](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [AGENTS.md](../AGENTS.md) – Development guidelines & architecture
- [FIRESTORE_MODELS.md](../FIRESTORE_MODELS.md) – Data models
