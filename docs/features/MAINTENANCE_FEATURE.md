# Maintenance Scheduling & Tracking

## Overview

Provides preventive maintenance scheduling, execution tracking, vendor management and annual budget monitoring for building assets in multi-apartment complexes (elevator, water tank, generator, etc.). The system includes automatic budget tracking that updates monthly balance sheets when maintenance tasks are completed, ensuring accurate financial tracking for each apartment.

## Data Model

- vendors (collection)
  - name, serviceType, contact info, rating, isActive, createdAt, updatedAt
- maintenanceTasks (collection)
  - title, category, scheduledDate, status, vendorId, recurrence, costEstimate, actualCost, attachments, notes, createdBy, createdAt, updatedAt
- maintenanceBudgets (collection)
  - year, totalBudget, allocatedByCategory, spentByCategory, totalSpent, createdAt, updatedAt
- fileMetadata (collection)
  - metadata for task attachments (photos, invoices) with relatedId linking to taskId

## Status Lifecycle

scheduled → in_progress → completed  
scheduled → cancelled  
Any active task past dueDate (or scheduledDate if no dueDate) auto-marked as overdue in read helpers.

## Budget Application & Balance Sheet Integration

When tasks are marked completed and have actualCost, those costs are aggregated into the matching year's maintenanceBudget (spentByCategory & totalSpent). Additionally, when maintenance tasks are completed with costs, the system automatically updates the monthly balance sheets for relevant apartments through transaction-like operations in the Firestore helper.

## Recurrence & Automatic Task Generation

Supported values: monthly, quarterly, semi_annual, annual, none.  
When a recurring task is marked as 'completed' or 'skipped', the system automatically generates a new instance of the task based on the recurrence pattern, maintaining consistent scheduling.

## Attachments

Task photos or invoices uploaded via existing storage service using category `maintenance` producing `fileMetadata` entries linking via relatedId = taskId.

## API / Firestore Helpers

Added to `src/lib/firestore.ts`:

- Vendors: get/add/update/delete/subscribe
- MaintenanceBudget: get/add/update/subscribe
- MaintenanceTasks: get/add/update/delete/subscribe + cost application helper + automatic recurrence generation
- FileMetadata: get/add/update/delete/subscribe for task attachments

## Balance Sheet Integration

The maintenance system integrates with the balance sheet calculation system:

- When maintenance tasks are completed with costs, apartment balance sheets are automatically updated
- Cost tracking applies to the appropriate month and apartment for accurate financial reporting
- Transaction-like operations ensure data consistency between maintenance tasks and balance sheets

## React Integration

`MaintenanceProvider` supplies tasks, vendors, budget, CRUD functions, and automatic recurrence handling.

## UI Components

- `maintenance-dashboard.tsx` summarises upcoming and recent tasks with basic actions
- `vendor-list.tsx` vendor table with ratings and contact information
- `budget-summary.tsx` annual budget breakdown with category allocation
- `maintenance-task-form.tsx` form for creating and editing maintenance tasks with recurrence options
- `maintenance-task-list.tsx` list view with status tracking and filtering

## Testing

Added jest + ts-jest config and sample model test (`tests/maintenance/maintenance-model.test.ts`). Further tests recommended for cost application, budget aggregation, and recurrence generation.

## Next Enhancements

- Idempotent cost application (budgetApplied flag)
- Advanced recurrence patterns
- Calendar view (e.g., using react-day-picker) for scheduling
- Vendor performance analytics
- Notifications for upcoming tasks / overdue tasks
- Enhanced reporting and analytics
