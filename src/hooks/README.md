# Apargo – Hooks Directory

This directory contains all custom React hooks for the Apargo app. Hooks encapsulate reusable logic for data fetching, state management, and UI behavior, promoting code reuse and maintainability.

## Structure Overview

- **use-analytics-data.ts**: Fetches and processes analytics and reporting data.
- **use-apartments.ts**: Provides apartment data and utilities for apartment selection and filtering.
- **use-expense-filters.ts**: Manages expense filter state for list and analytics views.
- **use-file-upload.ts**: Handles file uploads, including receipts and documents, with progress tracking.
- **use-maintenance-api.ts**: Interfaces with maintenance-related Firestore APIs.
- **use-mobile.tsx**: Detects mobile devices and manages mobile-specific UI logic.
- **use-payment-filters.ts**: Manages payment filter state for ledger and payment views.
- **use-queries.ts**: Centralizes TanStack Query logic for caching and deduplication.
- **use-toast.ts**: Provides toast notification utilities for user feedback.
- **use-apargo-app-data.ts**: Subscribes to real-time Firestore data for the app (apartments, expenses, users, etc.).
- **use-user-filter.ts**: Manages user filtering logic for admin and user management views.

## Conventions

- All hooks are prefixed with `use-` and written in TypeScript.
- Hooks encapsulate a single responsibility and are composable.
- Prefer hooks for logic that is reused across multiple components.
- Use TanStack Query for data fetching and caching where possible.

## Example Usage

```tsx
import { useAnalyticsData } from '../hooks/use-analytics-data';

const { monthlyStats } = useAnalyticsData();
```

## Best Practices

- Keep hooks focused and composable.
- Document hook parameters and return values in code comments.
- Avoid side effects in hooks unless necessary (e.g., data fetching).

## See Also

- [React Hooks Documentation](https://react.dev/reference/react/hooks)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

Follow composable, single-responsibility, and well-documented hook patterns for scalable app logic.
