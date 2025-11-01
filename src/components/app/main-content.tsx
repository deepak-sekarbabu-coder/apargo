'use client';

import * as React from 'react';

import dynamic from 'next/dynamic';

import type { ApartmentBalance } from '@/lib/balance-calculation';
import type {
  Apartment,
  BalanceSheet,
  Category,
  Expense,
  Payment,
  PollOption,
  User,
  View,
} from '@/lib/types';

import { CommunityView } from '@/components/community/community-view';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { ExpenseAnalyticsView } from '@/components/expense-analytics/expense-analytics-view';
import { ExpensesList } from '@/components/expenses/expenses-list';
import { FaultView } from '@/components/fault-reporting/fault-view';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useExpenseFilters } from '@/hooks/use-expense-filters';

const LedgerView = dynamic(
  () => import('@/components/ledger/ledger-view').then(mod => mod.default),
  { ssr: false }
);

const AdminView = dynamic(() => import('@/components/admin/admin-view').then(mod => mod.default), {
  ssr: false,
});
const MaintenanceView = dynamic(
  () => import('@/components/maintenance/maintenance-view').then(mod => mod.default),
  { ssr: false }
);

interface MainContentProps {
  view: View;
  role: string;
  isLoadingData: boolean;
  user: User | null;
  users: User[];
  categories: Category[];
  expenses: Expense[];
  apartments: Apartment[];
  payments: Payment[];
  visiblePayments: Payment[];
  balanceSheets: BalanceSheet[];
  apartmentBalances: Record<string, ApartmentBalance>;
  apartmentsCount: number;
  unpaidBillsCount: number;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterPaidBy: string;
  setFilterPaidBy: (paidBy: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  analyticsMonth: string;
  setAnalyticsMonth: (month: string) => void;
  activeExpenseTab: string;
  setActiveExpenseTab: (tab: string) => void;
  setView: (view: View) => void;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete: (expenseId: string) => Promise<void>;
  onExpenseAdd: (expenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  onPaymentAdd: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
    reason?: string;
  }) => Promise<void>;
  onAddPoll: (data: {
    question: string;
    options: PollOption[];
    expiresAt?: string;
  }) => Promise<void>;
  onApprovePayment: (paymentId: string, payments: Payment[]) => Promise<void>;
  onRejectPayment: (paymentId: string, payments: Payment[]) => Promise<void>;
  onAddUser: (userData: Omit<User, 'id'>) => Promise<void>;
  onUpdateUserFromAdmin: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRejectUser: (userId: string) => Promise<void>;
  onAddCategory: (categoryData: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  initialTab?: 'directory' | 'polls';
}

export function MainContent({
  view,
  role,
  isLoadingData,
  user,
  users,
  categories,
  expenses,
  apartments,
  payments,
  visiblePayments,
  balanceSheets,
  apartmentBalances,
  apartmentsCount,
  unpaidBillsCount,
  filterCategory,
  setFilterCategory,
  filterPaidBy,
  setFilterPaidBy,
  filterMonth,
  setFilterMonth,
  analyticsMonth,
  setAnalyticsMonth,
  activeExpenseTab,
  setActiveExpenseTab,
  setView,
  onExpenseUpdate,
  onExpenseDelete,
  onExpenseAdd,
  onPaymentAdd,
  onAddPoll,
  onApprovePayment,
  onRejectPayment,
  onAddUser,
  onUpdateUserFromAdmin,
  onDeleteUser,
  onRejectUser,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  getUserById,
  initialTab,
}: MainContentProps) {
  const { filteredExpenses, expenseMonths } = useExpenseFilters(
    expenses,
    filterCategory,
    filterPaidBy,
    filterMonth,
    users
  );

  const handleClearFilters = () => {
    setFilterCategory('all');
    setFilterPaidBy('all');
    setFilterMonth('all');
  };

  const currentUserApartment = user?.apartment;

  const ExpensesListComponent = (
    props: Partial<import('../expenses/expenses-list').ExpensesListProps>
  ) => (
    <ExpensesList
      {...props}
      expenses={props.expenses ?? []}
      users={users}
      categories={categories}
      currentUserApartment={user?.apartment}
      currentUserRole={role}
      onExpenseUpdate={onExpenseUpdate}
      onExpenseDelete={onExpenseDelete}
    />
  );

  if (isLoadingData) {
    return (
      <div className="grid gap-6">
        <div className="flex flex-row overflow-x-auto gap-4 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-row overflow-x-auto gap-4 lg:grid lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  switch (view) {
    case 'admin':
      if (role !== 'admin') {
        return (
          <DashboardView
            user={user}
            expenses={expenses}
            users={users}
            categories={categories}
            currentUserApartment={user?.apartment}
            currentUserRole={role}
            payments={payments}
            apartmentBalances={apartmentBalances}
            onExpenseUpdate={onExpenseUpdate}
            onExpenseDelete={onExpenseDelete}
            onAddExpense={onExpenseAdd}
            onAddPayment={onPaymentAdd}
            ExpensesList={ExpensesListComponent}
            apartmentsCount={apartmentsCount}
            unpaidBillsCount={unpaidBillsCount}
            onNavigateToExpenses={() => {
              setActiveExpenseTab('expenses');
              setView('expense-analytics');
            }}
          />
        );
      }
      return (
        <AdminView
          users={users}
          categories={categories}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUserFromAdmin}
          onDeleteUser={onDeleteUser}
          onRejectUser={onRejectUser}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          getUserById={getUserById}
          onAddPoll={onAddPoll}
          payments={visiblePayments}
          onApprovePayment={(paymentId: string) => onApprovePayment(paymentId, payments)}
          onRejectPayment={(paymentId: string) => onRejectPayment(paymentId, payments)}
        />
      );
    case 'expense-analytics':
      return (
        <ExpenseAnalyticsView
          expenses={expenses}
          categories={categories}
          apartments={apartments}
          users={users}
          currentUserApartment={currentUserApartment}
          currentUserRole={role}
          onExpenseUpdate={onExpenseUpdate}
          onExpenseDelete={onExpenseDelete}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterPaidBy={filterPaidBy}
          setFilterPaidBy={setFilterPaidBy}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filteredExpenses={filteredExpenses}
          expenseMonths={expenseMonths}
          onClearFilters={handleClearFilters}
          ExpensesList={ExpensesListComponent}
          analyticsMonth={analyticsMonth}
          setAnalyticsMonth={setAnalyticsMonth}
          activeExpenseTab={activeExpenseTab}
          setActiveExpenseTab={setActiveExpenseTab}
        />
      );
    case 'community':
      return (
        <CommunityView
          users={users}
          apartments={apartments}
          onAddPoll={onAddPoll}
          initialTab={initialTab}
        />
      );
    case 'faults':
      return <FaultView />;
    case 'ledger':
      return <LedgerView payments={visiblePayments} balanceSheets={balanceSheets} users={users} />;
    case 'maintenance':
      return <MaintenanceView />;

    default:
      return (
        <DashboardView
          user={user}
          expenses={expenses}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          currentUserRole={role}
          payments={payments}
          apartmentBalances={apartmentBalances}
          onExpenseUpdate={onExpenseUpdate}
          onExpenseDelete={onExpenseDelete}
          onAddExpense={onExpenseAdd}
          onAddPayment={onPaymentAdd}
          ExpensesList={ExpensesListComponent}
          apartmentsCount={apartmentsCount}
          unpaidBillsCount={unpaidBillsCount}
          onNavigateToExpenses={() => {
            setActiveExpenseTab('expenses');
            setView('expense-analytics');
          }}
        />
      );
  }
}
