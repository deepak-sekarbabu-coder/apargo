# AGENTS.md

## Commands
- **Build**: `npm run build` (includes SW env injection and cleanup)
- **Dev**: `npm run dev` (Turbopack enabled)
- **Lint**: `npm run lint` / `npm run lint:fix`
- **Test all**: `npm test` (Jest with jsdom)
- **Test single**: `npx jest <path/to/test>` (e.g., `npx jest tests/setup-tests.ts`)
- **Typecheck**: `npm run typecheck`

## Architecture
- **Frontend**: Next.js 15.5.4 App Router, React 18, TypeScript, Tailwind CSS, ShadCN UI (Radix), Lucide icons
- **Backend**: Firebase Admin SDK (server), Client SDK (browser) for Auth, Firestore, Storage, FCM
- **Database**: Firestore (NoSQL), with security rules in `firestore.rules`
- **API**: Next.js API routes (`src/app/api/*`) for server actions
- **State**: React Context (`src/context`), TanStack Query for data fetching
- **Structure**: `src/app` (routes/pages), `src/components` (reusable UI), `src/lib` (logic/utilities/types), `src/hooks` (custom), `public` (assets/SW), `scripts` (TS maintenance), `tests` (Jest)
- **Deployment**: Netlify, with standalone Docker option

## Code Style
- **TypeScript**: Strict mode, explicit types, no `any`, interfaces/types in `src/lib/types.ts`
- **Imports**: Absolute with `@/*` (maps to `src/*`), sorted by `@trivago/prettier-plugin-sort-imports`
- **Formatting**: Prettier (`npm run format`), no semicolons, double quotes
- **Linting**: ESLint `next/core-web-vitals`, `next/typescript`; unused vars error, hooks deps warn
- **Naming**: camelCase (vars/functions), PascalCase (components/interfaces), UPPER_SNAKE (constants)
- **Error Handling**: try/catch blocks, throw descriptive errors, log with `loglevel`
- **Components**: Functional with hooks, ShadCN patterns, props destructured
