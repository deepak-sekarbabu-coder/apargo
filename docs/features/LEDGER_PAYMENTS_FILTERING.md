# Ledger Payments Filtering

> **Category**: Feature
> **Last Updated**: 2025-10-03
> **Related Documents**: [COMPONENT_REFERENCE.md](../api/COMPONENT_REFERENCE.md)

## Overview

This document describes the implementation of filtering capabilities for the ledger payments table. This feature allows users to filter payments by their status (`pending`, `approved`, `rejected`, `paid`), apartment, and owner, providing a more granular view of the payment history.

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
- [Usage](#usage)

## Implementation

The filtering functionality is implemented using a combination of text inputs and a `DropdownMenuRadioGroup` from ShadCN/UI, which are integrated into the `PaymentsTable` component.

### Key Components

- **`PaymentsTable` (`src/components/ledger/payments-table.tsx`)**: The component responsible for rendering the payments table. It now includes the filter controls.
- **`Input` (`@/components/ui/input`)**: The UI component used for text-based filtering for apartment and owner.
- **`DropdownMenuRadioGroup` (`@/components/ui/dropdown-menu`)**: The UI component used for the single-selection status filter.

### Code Snippets

The following code was added to `src/components/ledger/payments-table.tsx` to create the filter controls:

**Apartment Filter:**

```tsx
<Input
  placeholder="Filter by apartment..."
  value={(table.getColumn('apartment')?.getFilterValue() as string) ?? ''}
  onChange={event => table.getColumn('apartment')?.setFilterValue(event.target.value)}
  className="max-w-sm"
/>
```

**Owner Filter:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full sm:w-auto sm:ml-2">
      Owner
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuRadioGroup
      value={(table.getColumn('owner')?.getFilterValue() as string) ?? ''}
      onValueChange={value =>
        table.getColumn('owner')?.setFilterValue(value === 'all' ? null : value)
      }
    >
      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
      {Array.from(new Set(payments.map(p => getUserName(p.payerId)))).map(owner => (
        <DropdownMenuRadioItem key={owner} value={owner}>
          {owner}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

**Status Filter:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full sm:w-auto sm:ml-2">
      Status
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuRadioGroup
      value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
      onValueChange={value =>
        table.getColumn('status')?.setFilterValue(value === 'all' ? null : value)
      }
    >
      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="approved">Approved</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

## Usage

To use the filters:

1.  Navigate to the Ledger page.
2.  To filter by apartment, type in the apartment input field.
3.  To filter by owner, click the "Owner" button and select an owner from the dropdown menu.
4.  To filter by status, click the "Status" button and select a status from the dropdown menu.
5.  To clear the owner or status filter, select the "All" option.
