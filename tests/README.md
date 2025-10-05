# Apargo – Tests Directory

This directory contains all automated tests for the Apargo app, organized by feature and domain for clarity and maintainability. Tests cover UI components, business logic, API endpoints, and integration scenarios.

## Structure Overview

- **Root Level**: General and cross-feature tests
  - `dashboard-feature-grid.test.tsx`: Tests dashboard feature grid UI and logic
  - `edit-user-dialog-responsive.test.tsx`: Responsive behavior of the edit user dialog
  - `fault-pagination.test.js`: Pagination logic for fault reporting
  - `ledger-balance-sheet.test.js`: Ledger and balance sheet calculations
  - `login-page-theme-switch.test.tsx`: Theme switching on login page
  - `mobile-receipt-test.html`: Mobile receipt upload and display
  - `setup-tests.ts`: Global test setup and configuration
  - `test-category-no-split-feature.js`: Category no-split logic
  - `test-enhanced-expense-splitting.js`: Enhanced expense splitting scenarios
  - `test-expense-splitting.js`: Core expense splitting logic
  - `test-fault-assignment-feature.js`: Fault assignment workflows
  - `test-fault-upload.js`: Fault upload and file handling
  - `test-payment-toggle.js`: Payment toggle UI and logic
  - `test-receipt-upload.js`: Receipt upload workflows
  - `test-server.js`: General server-side tests
- \***\*mocks**/\*\*: Test mocks for third-party libraries (e.g., Radix UI dialogs)

### Feature/Domain Subfolders

- **admin/**: Admin management and function verification
  - `test-admin-management.js`, `verify-functions.js`
- **expense/**: Expense calculation and splitting
  - `expense-splitting.test.js`, `test-calculation.js`, `test-expense-calculation.js`, `test-expense-deltas.ts`
- **maintenance/**: Maintenance model, tasks, vendors, and dashboard
  - `maintenance-model.test.ts`, `maintenance-upload-nullref.test.tsx`, `test-duplicate-removal.js`, `test-maintenance-pagination.js`, `test-maintenance-task-functionality.js`, `test-recurring-tasks.js`, `test-recurring-tasks.ts`, `test-redesigned-maintenance-dashboard.js`, `test-refactored-dashboard.js`, `test-skip-functionality.js`, `test-skip-utils.ts`, `test-vendor-management.js`, `vendor-list.test.tsx`
- **notifications/**: Announcements and notification logic
  - `check-firestore-data.js`, `debug-announcements.js`, `debug-notifications-issue.js`, `test-announcement-api.js`, `test-announcement-fix.js`, `test-array-notifications.js`, `test-direct-notifications.js`
- **payments/**: Payment events, categories, and deltas
  - `test-approved-expense-deltas.ts`, `test-payment-category.ts`, `test-payment-events.js`
- **poll/**: Poll permissions, voting, and pagination
  - `delete-permissions.test.ts`, `test-poll-delete-permissions.ts`, `test-poll-pagination.js`, `test-poll-voting.cjs`, `test-poll-voting.js`, `test-poll-voting.ts`
- **server/**: Node/server-side logic
  - `test-node.js`
- **storage/**: Enhanced storage system
  - `test-enhanced-storage-system.js`

## Conventions

- Tests are grouped by feature/domain in subfolders
- Use `.test.js`, `.test.ts`, or `.test.tsx` for test files
- Use descriptive filenames and comments for clarity
- Mocks are placed in `__mocks__/` and used for third-party dependencies
- Prefer integration and end-to-end tests for critical flows

## Example Test Command

```bash
npm run test
```

## Best Practices

- Keep tests isolated and independent
- Use mocks for external dependencies
- Cover edge cases and error scenarios
- Document test purpose and expected outcomes

## See Also

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)

Follow domain-driven, organized, and well-documented test patterns for robust and maintainable test coverage.
