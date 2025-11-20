# AGENTS.md

## Build & Test Commands

| Command                         | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `pnpm install`                  | Install dependencies with pnpm                                     |
| `pnpm run dev`                  | Start dev server with Turbopack (<http://localhost:3000>)          |
| `pnpm run build`                | Production build with post-build cleanup                           |
| `pnpm run start`                | Serve production build locally                                     |
| `pnpm test`                     | Run all Jest tests                                                 |
| `pnpm test -- --watch`          | Run tests in watch mode                                            |
| `pnpm test -- --coverage`       | Run tests with coverage report (enforces >80% line coverage in CI) |
| `pnpm test -- src/**/*.test.ts` | Run specific test file or pattern                                  |
| `pnpm run lint`                 | Run ESLint checks                                                  |
| `pnpm run lint:fix`             | Fix ESLint errors automatically                                    |
| `pnpm run typecheck`            | Check TypeScript types (no emit)                                   |
| `pnpm run format`               | Format code with Prettier                                          |

## Architecture & Codebase Structure

**Stack:** React 18 + Next.js 16 (App Router + Turbopack) | TypeScript 5 | Firebase 11 (Client+Admin SDK) | Tailwind CSS | Radix UI | TanStack React Query | Jest

**Directory Layout:**

- `src/app/` – Next.js App Router pages & server routes (`src/app/api/*` → `/api/**`)
- `src/components/` – Reusable UI components organized by feature (admin, analytics, community, dashboard, maintenance, payment-events, ui)
- `src/lib/` – Core logic & utilities (auth, core constants, firebase initialization, firestore data layer)
- `src/hooks/` – Custom React hooks
- `src/context/` – React context providers
- `public/` – Static assets & service workers (`sw-optimized.js`, `firebase-messaging-sw.js`)
- `scripts/` – Node/TypeScript maintenance scripts (seeding, deployment checks, admin tasks)
- `tests/` – Jest unit test suites
- `firebase/` – Firebase config & legacy messaging worker (v8, kept for reference only)

**Key Dependencies:**

- **Firestore** for data persistence
- **Firebase Auth** for user authentication (custom tokens & custom claims for authorization)
- **Firebase Cloud Messaging** for push notifications
- **React Query** for server state management & data fetching
- **Recharts** for analytics visualizations
- **Zod** for schema validation

**Important Patterns:**

- **Thin client, heavy server:** UI is lightweight; bulk operations run via admin scripts or server routes
- **Custom claims:** Users have `apartmentId` & `role` claims (required for security rules)
- **Service workers:** Use `cacheFirst`, `networkFirst`, `staleWhileRevalidate` strategies; config injected at build time via `scripts/replace-sw-env.js`

## Code Style & Conventions

**TypeScript:**

- Strict mode enabled (`"strict": true` in tsconfig.json)
- No `any` types in source code (`src/**/*.ts{,x}`); allowed in tests/mocks only
- No `require()` in source code; ESM imports only
- Path aliases: `@/*` → `src/*`

**Imports & Formatting:**

- Use sorted imports: `react` → `next` → `@/lib` → `@/components` → `@/hooks` → local imports
- Prettier config: 2-space tabs, 100-char line width, single quotes, trailing commas (ES5), semicolons, sorted imports
- Format: `pnpm run format` (enforced pre-commit if git hooks exist)

**Naming & Naming Conventions:**

- Components: PascalCase (e.g., `UserDashboard`, `ExpenseList`)
- Hooks: `use` prefix (e.g., `useUserFilter`, `useAnalyticsData`)
- Utilities/constants: camelCase (e.g., `getApartmentIds`, `DEFAULT_CACHE_TTL`)
- Files: match export name (`UserDashboard.tsx` for `export const UserDashboard`)

**Error Handling:**

- Throw descriptive errors with context; avoid silent failures
- Validate input with Zod schemas before processing
- Log errors to console in dev; use structured logging in production
- Graceful fallbacks for Firebase operations (handle offline, auth failures)

**Testing:**

- Place tests in `tests/` directory with same structure as `src/`
- Use `*.test.ts` suffix (e.g., `tests/lib/auth/auth.test.ts`)
- Mock Firebase modules via `jest.setup.ts` (all Firebase calls are mocked in tests)
- Aim for ≥80% line coverage in CI
