# Apargo – Lib Directory

This directory contains all core utilities, service modules, and business logic for the Apargo app. The `lib` folder centralizes Firestore/database access, authentication, expense logic, payment utilities, and shared helpers.

## Structure Overview

- **auth-fallback.ts, auth-utils.ts, auth.ts**: Authentication helpers, fallback logic, and user role utilities.
- **balance-utils.ts**: Balance sheet and monthly delta calculations for apartments.
- **expense-utils.ts**: Utility functions for expense calculations (e.g., calculating outstanding amounts). The core splitting logic is handled in `src/hooks/use-expense-handlers.ts`.
- **fcm-admin.ts, push-notifications.ts**: Firebase Cloud Messaging and push notification utilities.
- **feature-flags.ts**: Feature flag management for experimental or gated features.
- **firebase-admin.ts, firebase-client.ts, firebase-connection-manager.ts, firebase.ts**: Firebase initialization, connection management, and admin/client separation.
- **firestore-admin.ts, firestore.ts**: Centralized Firestore access and admin utilities. All database operations must go through these modules.
- **logger.ts**: Logging utilities for debugging and diagnostics.
- **maintenance-utils.ts**: Maintenance system logic, vendor management, and recurring task helpers.
- **node-optimization.js**: Node.js-specific optimizations for server-side performance.
- **payment-utils.ts, payments.ts**: Payment gateway abstraction, UPI/card/bank logic, and payment event handling.
- **storage-enhanced.ts, storage.ts**: File upload/download and storage management (Firebase Storage).
- **types.ts**: Shared TypeScript types and interfaces for app-wide consistency.
- **utils.ts**: General-purpose utility functions.

## Conventions

- All database access is centralized in `firestore.ts` and `firestore-admin.ts`—never bypass this layer.
- Use TypeScript for all new modules and maintain strong typing throughout.
- Organize logic by domain (auth, expense, payment, maintenance, etc.) for clarity.
- Document function signatures and business rules in code comments.

## Example Usage

```ts
import { addExpense } from '../lib/firestore';

await addExpense(expenseData);
```

## Best Practices

- Centralize all business logic and data access in `lib/` for maintainability.
- Avoid duplicating logic in components or hooks—reuse utilities from `lib/`.
- Keep modules focused and well-documented.

## See Also

- [Firebase Documentation](https://firebase.google.com/docs)
- [Apargo App Directory README](../app/README.md)

Follow centralized, domain-driven, and strongly-typed patterns for all core logic and utilities.
