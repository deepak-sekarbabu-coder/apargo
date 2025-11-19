'use client';

import * as React from 'react';

import type { Category, Expense, User } from '@/lib/types';

import { ExpenseItem } from '@/components/expense-management/all-expenses/expense-item';

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
  // Remove duplicate expenses by id
  const uniqueExpenses = Array.from(new Map(expenses.map(exp => [exp.id, exp])).values());

  // First sort all expenses by date (newest first), then apply limit if needed
  const sortedExpenses = uniqueExpenses.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const relevantExpenses = limit ? sortedExpenses.slice(0, limit) : sortedExpenses;

  if (relevantExpenses.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No expenses found.</div>;
  }

  return (
    <div className="space-y-4">
      {relevantExpenses.map(expense => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          onExpenseUpdate={onExpenseUpdate}
          currentUserRole={currentUserRole}
          onExpenseDelete={currentUserRole === 'admin' ? onExpenseDelete : undefined}
        />
      ))}
    </div>
  );
}
