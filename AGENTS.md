# AGENTS.md – Apargo Codebase Guide

## Build, Lint & Test Commands

| Command                   | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `pnpm install`            | Install dependencies                                                 |
| `pnpm run dev`            | Start dev server (Turbopack) on <http://localhost:3000>              |
| `pnpm run build`          | Production build (includes `replace-sw-env.js` + post-build cleanup) |
| `pnpm run start`          | Serve production build locally                                       |
| `pnpm test`               | Run all Jest tests                                                   |
| `pnpm test -- --watch`    | Run tests in watch mode                                              |
| `pnpm test -- --coverage` | Generate coverage report (>80% enforced in CI)                       |
| `pnpm run lint`           | ESLint check all files                                               |
| `pnpm run lint:fix`       | ESLint fix all auto-fixable issues                                   |
| `pnpm run typecheck`      | Run TypeScript type-checking                                         |
| `pnpm run format`         | Format all files with Prettier                                       |

**Running a single test:** `pnpm test -- <test-file-name-pattern>` (e.g., `pnpm test -- auth` runs all test files containing "auth")

## Architecture & Structure

**Stack:** React 18 + Next.js 16 App Router + TypeScript 5 + Firebase 11 (Client + Admin SDK) + Tailwind CSS + Radix UI

**Key Folders:**

- `src/app/` – App Router pages and API routes (`/api/**`)
- `src/components/` – Re-usable UI components (organized by feature: `admin/`, `analytics/`, `auth/`, `dashboard/`, etc.)
- `src/lib/` – Core logic and utilities (`auth/`, `firebase/`, `firestore/`, `core/`)
- `src/hooks/` & `src/context/` – Custom hooks and React contexts
- `src/actions/` – Server actions
- `public/` – Static assets and service workers (`sw-optimized.js`, `firebase-messaging-sw.js`)
- `scripts/` – Node.js maintenance scripts (data seeding, deployment checks, Firebase admin operations)
- `tests/` – Jest unit test suites

**Database:** Firestore (Firebase) with security rules in `firestore.rules`

**Service Workers:** Production-optimized (`sw-optimized.js`) with fallback (`sw.js`). Configured at build-time via `scripts/replace-sw-env.js`.

**Internal APIs:** Server-only routes in `src/app/api/` for authentication, expenses, faults, notifications, and more.

## Code Style & Conventions

**TypeScript:** Strict mode enabled. No `any` types in `src/**` files. Use explicit types on all function parameters and return values.

**Imports:** Organized by `prettier-plugin-sort-imports`: React/Next → `@/lib/*` → `@/components/*` → relative imports. Auto-formatted on save.

**Naming:**

- Components: PascalCase (e.g., `AdminDashboard.tsx`)
- Utilities/hooks: camelCase (e.g., `useAuth.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

**Formatting:** Prettier config in `.prettierrc` (100-char line width, 2-space indents, trailing commas, single quotes, LF line endings).

**Error Handling:** Wrap API calls in try-catch. Log errors to console (via `loglevel`) but never expose internal details to users. Return structured `{ error, status }` responses.

**Firebase Auth:** Email/password and Google OAuth. Session cookie (5-day expiry) set via `/api/auth/session`. Custom claims (`apartmentId`, `role`) embedded in ID tokens for Firestore rule checks.

**Testing:** Jest with jsdom. Firebase modules mocked in `jest.setup.ts`. Minimum 80% line coverage enforced in CI.

**Environment:** All `NEXT_PUBLIC_*` vars public; private vars never committed. Service-account (`apartgo.json`) base64-encoded in CI secrets. Emulator support via `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST`.
