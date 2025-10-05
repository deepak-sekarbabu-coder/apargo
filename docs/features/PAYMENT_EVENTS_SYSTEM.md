# Payment Events System

## Overview

The Payment Events System is a core feature within the Apargo application that automates the generation and management of recurring monthly payment events, such as maintenance fees. This system ensures that regular expenses are tracked and allocated correctly across multi-apartment complexes. The system now includes automatic balance sheet updates when payment events are generated, updated, or deleted, ensuring accurate financial tracking for each apartment.

## Location

The Payment Events Management interface is accessible via the Admin Panel:

**Admin → Payment Events → Payment Events Management**

## Functionality

The system provides the following key functionalities:

- **Monthly Payment Event Generation**: Admins can trigger the generation of monthly payment events for configured categories. This process automatically creates payment entries based on predefined rules (e.g., monthly amount, day of month).
- **Automatic Balance Sheet Updates**: When payment events are generated, updated, or deleted, the system automatically updates the monthly balance sheets for affected apartments, tracking income/expense impacts.
- **Overview Dashboard**: A dashboard provides a quick overview of the current month's payment events, the number of auto-generating categories, and the total monthly amount expected per apartment.
- **Category Configuration**: Categories can be configured to act as payment event generators. This involves setting flags like `isPaymentEvent` and `autoGenerate`, along with `monthlyAmount` and `dayOfMonth` in the Category Management section.
- **Real-time Tracking**: Integrates with the overall payment tracking system to monitor the status of generated payment events.
- **Auto-generation**: Configured categories can automatically generate payment events on a monthly basis.

## Technical Details

- **API Endpoint**: Payment event generation is handled by the `/api/payment-events/generate` API endpoint.
- **Component**: The user interface for managing payment events is primarily handled by the `AdminPaymentEventsTab` component, located in `src/components/admin/admin-payment-events-tab.tsx`.
- **Data Model**: Payment event configurations are stored within the `Category` data model (see `src/lib/types.ts`).
- **Balance Sheet Integration**: Payment events integrate with the balance sheet system in `src/lib/firestore.ts`, automatically updating monthly balance sheets when payment events are processed.
- **Toast Notifications**: Provides user feedback on the success or failure of payment event generation using toast notifications.

## Balance Sheet Integration

When payment events are processed, the system automatically updates balance sheets:

- **Payment Event Creation**: Creates appropriate income/expense entries in the relevant monthly balance sheet
- **Payment Event Updates**: Adjusts balance sheet entries when payment status changes
- **Payment Event Deletion**: Reverses balance sheet entries when payment events are removed
- **Monthly Aggregation**: All payment events are aggregated by month and apartment for accurate balance sheet calculations

## Usage

To generate monthly payment events:

1.  Navigate to the Admin Panel.
2.  Select the "Payment Events" tab.
3.  Click the "Generate Events" button.
4.  Monitor the generation process through the loading dialog and toast notifications.

## Related Components

- `src/components/admin/admin-payment-events-tab.tsx`
- `src/components/admin/admin-view.tsx`
- `src/lib/types.ts` (for `Category` type definition)
- `src/lib/firestore.ts` (for balance sheet integration)
- `/api/payment-events/generate` (API route)
- `src/lib/payments.ts` (for payment status computation and balance calculations)
