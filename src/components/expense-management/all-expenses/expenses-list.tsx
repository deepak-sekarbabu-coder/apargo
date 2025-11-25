'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

import * as React from 'react';

import type { Category, Expense, User } from '@/lib/core/types';

import { ExpenseItem } from '@/components/expense-management/all-expenses/expense-item';

import { useDeviceInfo } from '@/hooks/use-mobile';

export interface ExpensesListProps {
  expenses: Expense[];
  limit?: number;
  users: User[];
  categories: Category[];
  currentUserApartment: string | undefined;
  currentUserRole: string;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
}

// Memoized Expense Card Component for mobile
const ExpenseCard = React.memo(
  ({
    expense,
    users,
    categories,
    currentUserApartment,
    onExpenseUpdate,
    currentUserRole,
    onExpenseDelete,
  }: {
    expense: Expense;
    users: User[];
    categories: Category[];
    currentUserApartment: string | undefined;
    onExpenseUpdate: (expense: Expense) => void;
    currentUserRole: string;
    onExpenseDelete?: (expenseId: string) => void;
  }) => (
    <ExpenseItem
      expense={expense}
      users={users}
      categories={categories}
      currentUserApartment={currentUserApartment}
      onExpenseUpdate={onExpenseUpdate}
      currentUserRole={currentUserRole}
      onExpenseDelete={currentUserRole === 'admin' ? onExpenseDelete : undefined}
    />
  )
);

ExpenseCard.displayName = 'ExpenseCard';

const VirtualizedExpenseList = ({
  expenses,
  users,
  categories,
  currentUserApartment,
  onExpenseUpdate,
  currentUserRole,
  onExpenseDelete,
}: {
  expenses: Expense[];
  users: User[];
  categories: Category[];
  currentUserApartment: string | undefined;
  onExpenseUpdate: (expense: Expense) => void;
  currentUserRole: string;
  onExpenseDelete?: (expenseId: string) => void;
}) => {
  const listRef = React.useRef<List>(null);
  const sizeMap = React.useRef<{ [index: number]: number }>({});

  // Reset cache when expenses change
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expenses]);

  const getItemSize = (index: number) => {
    return sizeMap.current[index] || 350; // Default estimate for expense card height
  };

  const setItemSize = (index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const expense = expenses[index];
    const rowRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (rowRef.current) {
        setItemSize(index, rowRef.current.getBoundingClientRect().height + 16); // +16 for gap
      }
    }, [index]);

    return (
      <div style={style}>
        <div ref={rowRef} className="pb-4">
          <ExpenseCard
            expense={expense}
            users={users}
            categories={categories}
            currentUserApartment={currentUserApartment}
            onExpenseUpdate={onExpenseUpdate}
            currentUserRole={currentUserRole}
            onExpenseDelete={onExpenseDelete}
          />
        </div>
      </div>
    );
  };

  if (expenses.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No expenses found.</div>;
  }

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 250px)', minHeight: '300px' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={expenses.length}
            itemSize={getItemSize}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export function ExpensesList({
  expenses,
  limit,
  users,
  categories,
  currentUserApartment,
  currentUserRole,
  onExpenseUpdate,
  onExpenseDelete,
}: ExpensesListProps) {
  const deviceInfo = useDeviceInfo();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Remove duplicate expenses by id
  const uniqueExpenses = Array.from(new Map(expenses.map(exp => [exp.id, exp])).values());

  // First sort all expenses by date (newest first), then apply limit if needed
  const sortedExpenses = uniqueExpenses.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const relevantExpenses = limit ? sortedExpenses.slice(0, limit) : sortedExpenses;

  // Initialize React Table (for consistency, though not strictly needed for this layout)
  const columns: ColumnDef<Expense>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const table = useReactTable({
    data: relevantExpenses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Use virtualized list on mobile/tablet, regular list on desktop
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    return (
      <VirtualizedExpenseList
        expenses={relevantExpenses}
        users={users}
        categories={categories}
        currentUserApartment={currentUserApartment}
        onExpenseUpdate={onExpenseUpdate}
        currentUserRole={currentUserRole}
        onExpenseDelete={onExpenseDelete}
      />
    );
  }

  // Desktop: regular non-virtualized list
  if (relevantExpenses.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No expenses found.</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 sm:pr-4">
      {relevantExpenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          onExpenseUpdate={onExpenseUpdate}
          currentUserRole={currentUserRole}
          onExpenseDelete={onExpenseDelete}
        />
      ))}
    </div>
  );
}
