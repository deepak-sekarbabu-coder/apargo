'use client';

import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import * as React from 'react';

import type { Category, View } from '@/lib/core/types';
import {
  calculateApartmentBalancesOptimized,
  calculateMonthlyExpenses,
  calculateUnpaidBillsCount,
} from '@/lib/expense-management/balance-calculation';
import { requestNotificationPermission } from '@/lib/notifications/push-notifications';

import { MainContent } from '@/components/app/main-content';
import { SelectApartmentDialog } from '@/components/dialogs/select-apartment-dialog';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';

import { useApargoAppData } from '@/hooks/use-apargo-app-data';
import { useDataHandlers } from '@/hooks/use-data-handlers';
import { useExpenseHandlers } from '@/hooks/use-expense-handlers';
import {
  useBalanceSheets,
  useCategories,
  useExpenses,
  usePayments,
  useApartments as useRQApartments,
  useUsers,
} from '@/hooks/use-queries';

interface ApargoAppProps {
  initialCategories: Category[];
}

export function ApargoApp({ initialCategories }: ApargoAppProps) {
  const { logout } = useAuth();
  // Track client mount to avoid rendering client-only dynamic values during SSR and causing hydration warnings
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const [view, setView] = React.useState<View>('dashboard');
  const [initialTab, setInitialTab] = React.useState<'directory' | 'polls' | undefined>();

  // Listen for feature grid navigation events
  React.useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ view?: string; initialTab?: 'directory' | 'polls' }>;
      if (custom.detail?.view) {
        setView(custom.detail.view as View);
        setInitialTab(custom.detail.initialTab);
      }
    };
    window.addEventListener('unicorn:navigate', handler);
    return () => window.removeEventListener('unicorn:navigate', handler);
  }, []);
  const {
    user,
    users,
    setUsers,
    setCategories,
    setExpenses,
    setPayments,
    showApartmentDialog,
    setShowApartmentDialog,
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
    textareaRef,
  } = useApargoAppData();

  // React Query client for cache management
  useQueryClient();

  const role = user?.role || 'user';

  // Read core data through react-query hooks so we get caching/deduping and
  // immediate access to cached values populated by the subscription layer in
  // `useApargoAppData`.
  const usersQuery = useUsers(user?.apartment, role === 'admin');
  const categoriesQuery = useCategories();
  const expensesQuery = useExpenses(user?.apartment);
  const apartmentsQuery = useRQApartments();

  // Use data from queries; fall back to initial props where appropriate
  const categories = React.useMemo(
    () => categoriesQuery.data ?? initialCategories,
    [categoriesQuery.data, initialCategories]
  );
  const expenses = React.useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const apartments = React.useMemo(() => apartmentsQuery.data ?? [], [apartmentsQuery.data]);
  // Fetch all payments and filter client-side by apartment where needed.
  const paymentsQuery = usePayments();
  const balanceSheetsQuery = useBalanceSheets(user?.apartment);

  const payments = React.useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);
  const balanceSheets = balanceSheetsQuery.data ?? [];

  // Derived loading flag used by the UI while any core list is loading
  const isLoadingData =
    usersQuery.isLoading ||
    categoriesQuery.isLoading ||
    expensesQuery.isLoading ||
    apartmentsQuery.isLoading ||
    paymentsQuery.isLoading ||
    balanceSheetsQuery.isLoading;

  // Initialize handlers
  const {
    handleUpdateUser,
    handleUpdateCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleAddUser,
    handleUpdateUserFromAdmin,
    handleDeleteUser,
    handleRejectUser,
    handleAddPoll,
    handleApprovePayment,
    handleRejectPayment,
    handleAddPayment,
  } = useDataHandlers({
    user,
    role,
    setUsers,
    setCategories,
    setPayments,
  });

  const { handleAddExpense, handleDeleteExpense, handleExpenseUpdate } = useExpenseHandlers({
    user,
    apartments,
    categories,
    setExpenses,
    apartmentsLoading: apartmentsQuery.isLoading,
  });

  const getUserById = React.useCallback((id: string) => users.find(u => u.id === id), [users]);

  // Show payments relevant to the current user's apartment for non-admin users.
  const visiblePayments = React.useMemo(() => {
    if (role === 'admin') return payments;
    return payments.filter(p => {
      const payer = getUserById(p.payerId);
      const payee = getUserById(p.payeeId);
      return payer?.apartment === user?.apartment || payee?.apartment === user?.apartment;
    });
  }, [payments, getUserById, user, role]);

  // Calculate apartment balances using optimized function
  const apartmentBalances = React.useMemo(
    () => calculateApartmentBalancesOptimized(expenses, apartments),
    [expenses, apartments]
  );

  // Summary counts used across the dashboard
  const apartmentsCount = apartments.length;
  const unpaidBillsCount = React.useMemo(() => calculateUnpaidBillsCount(expenses), [expenses]);

  // Calculate monthly expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = React.useMemo(
    () => calculateMonthlyExpenses(expenses, currentMonth, currentYear),
    [expenses, currentMonth, currentYear]
  );

  React.useEffect(() => {
    if (user && (!user.apartment || !user.propertyRole)) {
      setShowApartmentDialog(true);
    }
  }, [user, setShowApartmentDialog]);

  // Maintain focus during re-renders
  React.useEffect(() => {
    if (textareaRef.current && document.activeElement !== textareaRef.current) {
      // Only refocus if the textarea was previously focused
      const shouldRefocus = textareaRef.current.dataset.wasFocused === 'true';
      if (shouldRefocus) {
        textareaRef.current.focus();
      }
    }
  });

  React.useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);

  React.useEffect(() => {
    if (role !== 'admin' && view === 'admin') {
      setView('dashboard');
    }
  }, [role, view]);

  // Restrict access for unapproved users
  if (user && user.isApproved === false) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Approval Pending</CardTitle>
            <CardDescription>Wait until you are approved by Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={logout}>
              Logout
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SidebarProvider>
        <SidebarLayout
          user={user}
          view={view}
          setView={setView}
          role={role}
          categories={categories}
          handleAddExpense={handleAddExpense}
          handleAddPayment={handleAddPayment}
          handleUpdateUser={handleUpdateUser}
          logout={logout}
          monthlyExpenses={monthlyExpenses}
          isLoadingApartments={apartmentsQuery.isLoading}
          isMounted={isMounted}
          users={users}
        >
          <MainContent
            view={view}
            role={role}
            isLoadingData={isLoadingData}
            user={user}
            users={users}
            categories={categories}
            expenses={expenses}
            apartments={apartments}
            payments={payments}
            visiblePayments={visiblePayments}
            balanceSheets={balanceSheets}
            apartmentBalances={apartmentBalances}
            apartmentsCount={apartmentsCount}
            unpaidBillsCount={unpaidBillsCount}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterPaidBy={filterPaidBy}
            setFilterPaidBy={setFilterPaidBy}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            analyticsMonth={analyticsMonth}
            setAnalyticsMonth={setAnalyticsMonth}
            activeExpenseTab={activeExpenseTab}
            setActiveExpenseTab={setActiveExpenseTab}
            setView={setView}
            onExpenseUpdate={handleExpenseUpdate}
            onExpenseDelete={handleDeleteExpense}
            onExpenseAdd={handleAddExpense}
            onPaymentAdd={handleAddPayment}
            onAddPoll={handleAddPoll}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            onAddUser={handleAddUser}
            onUpdateUserFromAdmin={handleUpdateUserFromAdmin}
            onDeleteUser={handleDeleteUser}
            onRejectUser={handleRejectUser}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            getUserById={getUserById}
            initialTab={initialTab}
          />
        </SidebarLayout>
      </SidebarProvider>
      {user && (
        <SelectApartmentDialog
          open={showApartmentDialog}
          onOpenChange={setShowApartmentDialog}
          user={user}
          onSave={data => {
            const updatedUser = {
              ...user,
              apartment: data.apartment,
              propertyRole: data.propertyRole,
            };
            handleUpdateUser(updatedUser);
            setShowApartmentDialog(false);
          }}
        />
      )}
    </>
  );
}
