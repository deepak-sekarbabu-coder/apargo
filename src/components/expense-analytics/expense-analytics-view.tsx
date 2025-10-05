'use client';

import { LineChart, List } from 'lucide-react';

import * as React from 'react';

import type { Apartment, Category, Expense, User } from '@/lib/types';

import { AnalyticsView } from '@/components/analytics/analytics-view';
import { ExpensesView } from '@/components/expenses/expenses-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAnalyticsData } from '@/hooks/use-analytics-data';

import type { ExpensesListProps } from '../expenses/expenses-list';

interface ExpenseAnalyticsViewProps {
  expenses: Expense[];
  categories: Category[];
  apartments: Apartment[];
  users: User[];
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterPaidBy: string;
  setFilterPaidBy: (paidBy: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  filteredExpenses: Expense[];
  expenseMonths: string[];
  onClearFilters: () => void;
  ExpensesList: React.ComponentType<ExpensesListProps>;
  currentUserApartment: string | undefined;
  currentUserRole: string;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
  analyticsMonth: string;
  setAnalyticsMonth: (month: string) => void;
  activeExpenseTab: string;
  setActiveExpenseTab: (tab: string) => void;
}

export function ExpenseAnalyticsView({
  expenses,
  categories,
  apartments,
  users,
  filterCategory,
  setFilterCategory,
  filterPaidBy,
  setFilterPaidBy,
  filterMonth,
  setFilterMonth,
  filteredExpenses,
  expenseMonths,
  onClearFilters,
  ExpensesList,
  currentUserApartment,
  currentUserRole,
  onExpenseUpdate,
  onExpenseDelete,
  analyticsMonth,
  setAnalyticsMonth,
  activeExpenseTab,
  setActiveExpenseTab,
}: ExpenseAnalyticsViewProps) {
  const analyticsData = useAnalyticsData(expenses, categories, analyticsMonth);

  // Use lifted state from parent to persist across re-renders
  // No local state needed - parent manages the tab state
  const handleTabChange = React.useCallback(
    (value: string) => {
      setActiveExpenseTab(value);
    },
    [setActiveExpenseTab]
  );

  return (
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs value={activeExpenseTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="text-sm flex items-center gap-1.5">
            <LineChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-sm flex items-center gap-1.5">
            <List className="h-4 w-4" />
            <span>All Expenses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-6">
          <ExpensesView
            expenses={expenses}
            categories={categories}
            apartments={apartments}
            users={users}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterPaidBy={filterPaidBy}
            setFilterPaidBy={setFilterPaidBy}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filteredExpenses={filteredExpenses}
            expenseMonths={expenseMonths}
            onClearFilters={onClearFilters}
            ExpensesList={ExpensesList}
            currentUserApartment={currentUserApartment}
            currentUserRole={currentUserRole}
            onExpenseUpdate={onExpenseUpdate}
            onExpenseDelete={onExpenseDelete}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <AnalyticsView
            expenses={expenses}
            categories={categories}
            analyticsMonth={analyticsMonth}
            setAnalyticsMonth={setAnalyticsMonth}
            expenseMonths={expenseMonths}
            analyticsData={analyticsData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
