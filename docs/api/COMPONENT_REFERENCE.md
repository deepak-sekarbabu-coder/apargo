# Component Reference

This document provides an overview of the React components in the Apargo application, organized by feature and functionality. All components are built with TypeScript and styled with Tailwind CSS, following consistent design patterns with ShadCN UI.

## Component Organization

Components are organized into the following directories within `src/components/`:

-   **`ui/`**: 53 base UI components (ShadCN/Radix primitives)
-   **`admin/`**: 24 components, hooks, and utilities for the admin panel.
-   **`analytics/`**: 1 analytics dashboard component
-   **`community/`**: 6 components for community features
-   **`dashboard/`**: 4 main dashboard components
-   **`dialogs/`**: 11 modal dialog components
-   **`expense-analytics/`**: 1 expense analysis component
-   **`expenses/`**: 3 expense management components
-   **`fault-reporting/`**: 5 components for fault reporting and management
-   **`icons/`**: 2 icon utility components
-   **`layout/`**: 3 layout and navigation components
-   **`ledger/`**: 2 payment ledger components
-   **`maintenance/`**: 14 maintenance management components
-   **`payment-events/`**: 2 payment events components
-   **Root level**: 14 core application components

---

### Core UI Components (`src/components/ui/`)

Base UI components built on ShadCN UI and Radix primitives, including forms, layout, feedback, data display, and navigation elements.

### Feature Components

#### Admin Panel (`src/components/admin/`)

This directory contains the components that make up the admin dashboard, as well as related hooks and utilities. Key components include:

-   `admin-view.tsx`: Main admin dashboard.
-   `admin-categories-tab.tsx`: Manages expense categories.
-   `admin-payment-events-tab.tsx`: Manages payment events.
-   `add-announcement-dialog.tsx`: Creates community announcements.

#### Analytics (`src/components/analytics/`)

-   `analytics-view.tsx`: Comprehensive analytics dashboard.

#### Community (`src/components/community/`)

-   `community-view.tsx`: Main community interface.
-   `community-polls.tsx`: Displays community polls.
-   `poll-card-skeleton.tsx`: Loading skeleton for poll cards.
-   `poll-results.tsx`: Visualizes poll results.
-   `poll-vote-dialog.tsx`: Voting interface for polls.
-   `poll-notification.tsx`: Notification component for polls.

#### Dashboard (`src/components/dashboard/`)

-   `dashboard-view.tsx`: Main dashboard with overview and navigation.
-   `feature-grid.tsx`: Grid layout for dashboard features.
-   `maintenance-payment-status.tsx`: Widget for maintenance payment status.
-   `payment-status-widget.tsx`: General payment status display.

#### Dialogs (`src/components/dialogs/`)

A collection of 11 dialog components for various actions like adding expenses, users, and categories.

#### Expense Management (`src/components/expenses/` and `src/components/expense-analytics/`)

-   `expenses-view.tsx`: Main expense management interface.
-   `expense-analytics-view.tsx`: Detailed expense analysis.

#### Fault Reporting (`src/components/fault-reporting/`)

-   `fault-reporting-form.tsx`: Form for reporting new faults.
-   `fault-dashboard.tsx`: Fault management dashboard for admins.

#### Layout (`src/components/layout/`)

-   `navigation-menu.tsx`: Main application navigation.
-   `page-header.tsx`: Consistent page header.

#### Ledger (`src/components/ledger/`)

-   `ledger-view.tsx`: Financial ledger interface.
-   `payments-table.tsx`: Detailed payment history.

#### Maintenance (`src/components/maintenance/`)

-   `maintenance-dashboard.tsx`: Main maintenance management interface.
-   `vendor-list.tsx`: Directory of vendors.

#### Payment Events (`src/components/payment-events/`)

-   `payment-events-view.tsx`: Dashboard for payment events.
-   `payment-event-history.tsx`: Historical tracking of payment events.

---

For detailed component specifications and props, refer to the individual component files and their TypeScript interfaces.