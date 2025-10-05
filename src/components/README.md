# Apargo – Components Directory

This directory contains all reusable UI and feature components for the Apargo app. Components are organized by feature, domain, and UI utility for clarity and maintainability.

## Structure Overview

- **admin/**: Admin-only components (e.g., announcement management, file manager, admin dashboard)
- **analytics/**: Analytics and reporting views
- **community/**: Community polls, voting, and related UI
- **dashboard/**: Dashboard widgets and feature grid
- **dialogs/**: ShadCN-based dialogs for add/edit flows (expenses, users, polls, vendors, etc.)
- **expense-analytics/**: Expense analytics and insights
- **expenses/**: Expense list, item, and view components
- **fault-reporting/**: Fault reporting forms, dashboards, and management
- **icons/**: Custom and third-party icon components
- **layout/**: Navigation menus, headers, and layout utilities
- **ledger/**: Ledger and payments table views
- **maintenance/**: Maintenance dashboard, vendor management, and budget tracking
- **payment-events/**: Payment event history and views
- **ui/**: Shared UI primitives (ShadCN components, form elements, dialogs, popovers, etc.)

## Conventions

- **Feature Folders**: Each feature or domain (e.g., dashboard, maintenance) has its own folder for related components.
- **UI Primitives**: The `ui/` folder contains shared, reusable UI elements (based on ShadCN UI and custom extensions).
- **Dialogs**: All add/edit flows use dialog components with form validation, following the ShadCN pattern.
- **Naming**: Components are named with kebab-case for folders and PascalCase for files (e.g., `add-expense-dialog.tsx`).
- **TypeScript**: All components are written in TypeScript for type safety.

## Example Usage

- Dashboard feature grid: `dashboard/feature-grid.tsx`
- Add expense dialog: `dialogs/add-expense-dialog.tsx`
- Vendor list: `maintenance/vendor-list.tsx`
- Community poll voting: `community/poll-vote-dialog.tsx`
- Shared button: `ui/button.tsx`

## Best Practices

- Prefer composition over inheritance for UI components
- Use the centralized dialog and form validation patterns
- Keep feature logic within feature folders; use `ui/` for generic elements
- Follow mobile-first and accessibility best practices

## See Also

- [ShadCN UI Documentation](https://ui.shadcn.com/)
- [Apargo App Directory README](../app/README.md)

## Components Directory Structure

- Grouped by feature/domain (e.g., `admin`, `analytics`, `dashboard`, `fault-reporting`, `community`, `ledger`, `expenses`, `dialogs`, `ui`).
- Shared UI components are in `ui/`.
- Feature-specific components are in their respective folders.

Follow domain-driven and feature-based organization for scalability and maintainability.
