# Expense Division Feature

## Overview

This feature automatically divides expenses across multiple apartments and tracks which apartments have paid their share back to the expense owner. The system includes automatic balance sheet calculations that update monthly for each apartment, tracking opening/closing balances, income, and expenses in real-time as expenses and payments are added, updated, or removed.

## Key Features

### 1. Automatic Division

- When a new expense is added, it's automatically divided equally among all active apartments
- The paying apartment's share is excluded from what they owe
- Paying apartment owes $0, other apartments owe their share based on total = total outstanding

### 2. Outstanding Balance Display

- Prominently displays total outstanding amount in red at the top of the dashboard
- Shows as negative value to indicate money owed to the user
- Only appears when there are outstanding amounts

### 3. Payment Tracking

- Expense owners can mark apartments as "paid" when they receive payment
- Adjusted amounts automatically update to exclude paid apartments
- Visual indicators show payment status for each apartment

### 4. Enhanced Balance Sheet System

- **Monthly Balance Calculations**: Automatically calculates opening balance, total income, total expenses, and closing balance for each apartment per month
- **Real-time Updates**: Balance sheets update immediately when expenses or payments are added, updated, or deleted
- **Financial Tracking**: Each apartment has accurate monthly financial records with income from receiving payments and expenses from owing money
- **Automatic Income Recognition**: When an apartment pays expenses, the paying apartment receives income equal to the unpaid shares from other apartments

### 5. Enhanced Expense Display

- Each expense shows both original amount and adjusted outstanding amount
- Payment status overview shows how many apartments have paid
- Individual apartment payment status with easy mark/unmark functionality
- Receipt viewing capability

## Data Structure

### Expense Object

```typescript
{
  id: string;
  description: string;
  amount: number; // Original total amount (e.g., 700)
  date: string; // ISO date string
  paidByApartment: string; // Apartment that paid the expense
  owedByApartments: string[]; // Apartments that owe money
  perApartmentShare: number; // Amount each apartment owes (e.g., 100)
  categoryId: string;
  receipt?: string;
  paidByApartments?: string[]; // Apartments that have paid back
  paid?: boolean;
}
```

### Balance Sheet Object (New)

```typescript
{
  apartmentId: string; // Apartment identifier
  monthYear: string; // Format: YYYY-MM (e.g., "2025-09")
  openingBalance: number; // Opening balance for the month
  totalIncome: number; // Total income for the month (from received payments)
  totalExpenses: number; // Total expenses for the month (from owed shares)
  closingBalance: number; // Calculated as: openingBalance + totalIncome - totalExpenses
}
```

## User Experience

### For Expense Owners

1. Add expense - automatically divided among all apartments with balance sheet updates
2. See total outstanding amount prominently displayed
3. Mark apartments as paid when they settle their share
4. Watch outstanding amount decrease as payments are received
5. View monthly balance sheet showing their financial position for each month

### For Other Apartment Members

1. See their share of each expense clearly displayed
2. View payment status (paid/pending) for their apartment
3. Understand how much they still owe
4. Access monthly balance sheets showing their financial history

## Technical Implementation

### Key Files

- `src/lib/expense-utils.ts` - Calculation logic
- `src/components/outstanding-balance.tsx` - Red alert display
- `src/components/expense-item.tsx` - Enhanced expense display
- `src/lib/types.ts` - Updated Expense and BalanceSheet types
- `src/lib/firestore.ts` - Automatic balance sheet updates and transaction-like operations
- `src/lib/payments.ts` - Payment status computation and balance calculations

### Key Functions

- `calculateExpenseAmounts()` - Calculates adjusted amounts
- `calculateTotalOutstanding()` - Sums all outstanding amounts
- `computeExpenseDeltas()` - Calculates income/expense changes for balance sheet updates
- `applyDeltasToBalanceSheets()` - Applies changes to monthly balance sheets
- `markApartmentAsPaid()` / `markApartmentAsUnpaid()` - Payment tracking
- `computeApprovedExpensePaymentDeltas()` - Payment-related balance updates

## Balance Sheet Update Mechanism

### When Expenses are Added:

1. Calculate expense shares for each apartment
2. Determine unpaid shares that affect the balance sheet
3. Increase expenses for owed apartments
4. Increase income for the paying apartment by the amount of unpaid shares
5. Update balance sheet for the month of the expense

### When Expenses are Updated:

1. Calculate old balance impact and new balance impact
2. Remove old impact from balance sheets
3. Apply new impact to balance sheets
4. Update the appropriate month's balance sheet

### When Expenses are Deleted:

1. Calculate reverse impact (negative of original impact)
2. Apply reverse impact to balance sheets
3. Update the appropriate month's balance sheet

### When Payments are Added/Updated/Deleted:

1. Similar balance sheet updates based on payment status changes
2. Income and expense adjustments based on payment amounts and status

## Example Scenario with Balance Sheets

1. **Initial State**: Apartment pays a bill in September 2025
   - Expense: Amount divided among all apartments = per apartment share
   - Other apartments owe their share = total outstanding
   - Balance sheet impact for September 2025:
     - Paying apartment: Income (from unpaid shares), Expenses +$0, Net: positive amount
     - Each owed apartment: Income +$0, Expenses (their share), Net: negative amount

2. **After some apartments pay their shares in September**:
   - Outstanding: reduced amount based on paid apartments
   - Paying apartment receives payments from other apartments
   - Updated balance sheet impact:
     - Paying apartment: Additional income from payments
     - Paid apartments: Reduce their expenses by their share amount

3. **All apartments paid**:
   - Outstanding: $0
   - Paying apartment received all payments, final balance shows total
   - No red alert shown in dashboard

## Benefits

- Clear visibility of outstanding amounts
- Easy payment tracking for expense owners
- Automatic calculation prevents errors
- Improved user experience with visual indicators
- Scalable to multi-apartment complexes of any size
- Real-time financial tracking with monthly balance sheets
- Accurate income/expense tracking per apartment per month
- Data integrity maintained through transaction-like operations
