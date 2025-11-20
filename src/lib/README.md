# Apargo – Lib Directory

This directory contains all core utilities, service modules, and business logic for the Apargo app. The `lib` folder is organized by feature domain for clarity and maintainability.

## Structure Overview

- **auth/**: Authentication helpers, fallback logic, and user role utilities
- **firebase/**: Firebase initialization, connection management, health monitoring, and optimization
- **firestore/**: Centralized Firestore access, admin utilities, and database operations
- **expense-management/**: Expense calculations, balance sheets, and splitting strategies
- **payments/**: Payment gateway abstraction, UPI/card/bank logic, and payment event handling
- **maintenance/**: Maintenance system logic, vendor management, and recurring task helpers
- **notifications/**: Firebase Cloud Messaging, push notifications, and notification listeners
- **storage/**: File upload/download and storage management (Firebase Storage)
- **community/**: Community features like polls and voting utilities
- **core/**: Shared types, logging, feature flags, and app-wide configuration
- **monitoring/**: Offline support, performance monitoring, and debugging tools
- **utils/**: General-purpose utility functions
- **errors/**: Error handling, degradation strategies, and error boundaries
- **database/**: Database interfaces and implementations

## Conventions

- All database access is centralized in `firestore/`—never bypass this layer.
- Use TypeScript for all new modules and maintain strong typing throughout.
- Organize logic by domain (auth, expense, payment, maintenance, etc.) for clarity.
- Document function signatures and business rules in code comments.

## Example Usage

```ts
import { calculateBalance } from '@/lib/expense-management/balance-calculation';
import { addExpense } from '@/lib/firestore/expenses';
import { sendNotification } from '@/lib/notifications/fcm-admin';

await addExpense(expenseData);
const balance = calculateBalance(expenses);
await sendNotification(userId, message);
```

## Best Practices

- Centralize all business logic and data access in `lib/` for maintainability.
- Avoid duplicating logic in components or hooks—reuse utilities from `lib/`.
- Keep modules focused and well-documented.
- Follow the feature-based organization when adding new utilities.

## See Also

- [Firebase Documentation](https://firebase.google.com/docs)
- [Apargo Components Directory README](../components/README.md)
- [Apargo App Directory README](../app/README.md)

Follow centralized, domain-driven, and strongly-typed patterns for all core logic and utilities.
