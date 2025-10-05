# Apargo – App Directory Structure

> This directory uses the Next.js App Router. Route groups (folders in parentheses) are for organization only and do not affect the URL structure.

## Structure Overview

- **(dashboard)**: All dashboard-related routes
  - `dashboard/`: Main dashboard page
  - `fault-reporting/`: Report a new fault
  - `current-faults/`: View current faults
  - `faults/`: Faults listing

- **(auth)**: Authentication routes
  - `login/`: Login page

- **api/**: API routes for backend logic (server actions, data fetching, etc.)
  - Follows Next.js API route conventions
  - Subfolders for admin, expenses, payments, maintenance, notifications, etc.

## Route Grouping

- Folders in parentheses (e.g., `(dashboard)`) are [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) and do not appear in the URL.
- Use route groups to organize related pages and API endpoints.

## Conventions

- **Page Components**: Each route folder contains a `page.tsx` file as the entry point.
- **API Endpoints**: Each API route uses a `route.ts` file.
- **Shared Layout**: `layout.tsx` defines the root layout for all pages.
- **Global Styles**: `globals.css` contains global CSS (including mobile touch optimizations).

## Example

- `/dashboard` → `(dashboard)/dashboard/page.tsx`
- `/api/expenses` → `api/expenses/route.ts`

## See Also

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- For more on route groups: [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
