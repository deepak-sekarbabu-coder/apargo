'use client';

import { ArrowRight, Bell, CreditCard, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import * as React from 'react';

import type { Expense, Payment, User } from '@/lib/core/types';
import { Category } from '@/lib/core/types';

import { FeatureGrid } from '@/components/dashboard/feature-grid';
import { MaintenancePaymentStatus } from '@/components/dashboard/maintenance-payment-status';
import { OutstandingBalance } from '@/components/dashboard/outstanding-balance';
import { AddExpenseDialog } from '@/components/dialogs/add-expense-dialog';
import { AddPaymentDialog } from '@/components/dialogs/add-payment-dialog';
import type { ExpensesListProps } from '@/components/expense-management/all-expenses/expenses-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useAccountSummary } from '@/hooks/use-account-summary';
import { useApartmentBalances } from '@/hooks/use-apartment-balances';

// Base dashboard props that are always required
interface BaseDashboardProps {
  user: User | null;
  expenses: Expense[];
  users: User[];
  categories: Category[];
  currentUserApartment: string | undefined;
  currentUserRole: string;
}

// Expense management props (optional - some dashboards might not allow expense management)
interface ExpenseManagementProps {
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  ExpensesList: React.ComponentType<ExpensesListProps>;
  onNavigateToExpenses?: () => void;
  isLoadingApartments?: boolean;
}

// Payment management props (optional - some dashboards might not show payments)
interface PaymentManagementProps {
  payments?: Payment[];
  onAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
    reason?: string;
  }) => Promise<void>;
}

// Balance display props (optional - some dashboards might not show balances)
interface BalanceDisplayProps {
  apartmentBalances: Record<
    string,
    {
      name: string;
      balance: number;
      owes: Record<string, number>;
      isOwed: Record<string, number>;
    }
  >;
}

// Summary statistics props (optional - some dashboards might not show stats)
interface SummaryStatsProps {
  apartmentsCount?: number;
  unpaidBillsCount?: number;
}

// Composable dashboard props interface
// Allows for partial implementations while maintaining type safety
export interface DashboardViewProps extends BaseDashboardProps {
  // Optional feature sets that can be mixed and matched
  expenseManagement?: ExpenseManagementProps;
  paymentManagement?: PaymentManagementProps;
  balanceDisplay?: BalanceDisplayProps;
  summaryStats?: SummaryStatsProps;
}

export function DashboardView({
  user,
  expenses,
  users,
  categories,
  currentUserApartment,
  currentUserRole,
  expenseManagement,
  paymentManagement,
  balanceDisplay,
  summaryStats,
}: DashboardViewProps) {
  // Extract nested props with defaults
  const {
    onExpenseUpdate,
    onExpenseDelete,
    onAddExpense,
    ExpensesList,
    onNavigateToExpenses,
    isLoadingApartments = false,
  } = expenseManagement!;

  const { payments = [], onAddPayment } = paymentManagement || {};

  const { apartmentBalances } = balanceDisplay || {};

  const { apartmentsCount = 0, unpaidBillsCount = 0 } = summaryStats || {};

  const currentApartmentBalance = balanceDisplay?.apartmentBalances
    ? balanceDisplay.apartmentBalances[currentUserApartment || '']
    : null;

  // Account summary hook
  const loggedInUserBalance = currentApartmentBalance ? currentApartmentBalance.balance : 0;
  const { balanceDisplay: accountSummary, showReminder } = useAccountSummary(loggedInUserBalance);

  // Extract business logic to hooks
  const { owedItems, owesItems, netBalance, hasBalances } = useApartmentBalances(
    apartmentBalances,
    currentUserApartment
  );

  return (
    <div className="grid gap-3 xs:gap-4 sm:gap-5 md:gap-6" suppressHydrationWarning>
      {/* Quick feature navigation grid */}
      <FeatureGrid
        onSelect={v => {
          // leverage provided callback if any via prop? (None currently) -> We could navigate by triggering custom event
          // For now emit a custom event consumed by parent to switch view
          const event = new CustomEvent('unicorn:navigate', { detail: { view: v } });
          window.dispatchEvent(event);
        }}
        isAdmin={currentUserRole === 'admin'}
      />

      {/* Top summary cards - only show if summary stats are provided */}
      {summaryStats && (
        <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
          <Card className="border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-2 xs:p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Total Apartments</p>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {apartmentsCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-100 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-2 xs:p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Unpaid Bills</p>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {unpaidBillsCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Outstanding Balance Alert */}
      <OutstandingBalance expenses={expenses} currentUserApartment={currentUserApartment} />

      {/* Monthly Maintenance Payment Status */}
      <MaintenancePaymentStatus
        user={user}
        payments={payments}
        defaultMonthlyAmount={
          categories.find(cat => cat.name === 'Maintenance')?.monthlyAmount || 0
        }
      />

      {/* Apartment Balances - only show if balance display is enabled */}
      {balanceDisplay && hasBalances && (
        <Card>
          <CardHeader className="pb-2 xs:pb-2.5 sm:pb-3">
            <CardTitle className="text-base xs:text-lg sm:text-xl">Apartment Balances</CardTitle>
            <CardDescription className="text-xs">
              Summary of amounts owed between apartments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 xs:space-y-2 sm:space-y-3">
            {/* What you are owed */}
            {owedItems.map(({ apartmentId, apartmentName, formattedAmount }) => (
              <div
                key={`owed-${apartmentId}`}
                className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 xs:gap-2 sm:gap-3 p-1.5 xs:p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="p-1.5 xs:p-2 rounded-full bg-green-100 dark:bg-green-800/30">
                    <TrendingUp className="h-4 w-4 xs:h-5 xs:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{apartmentName}</p>
                    <p className="text-xs text-muted-foreground dark:text-green-200">
                      owes your apartment
                    </p>
                  </div>
                </div>
                <span className="text-base xs:text-lg font-semibold text-green-700 dark:text-green-400 flex-shrink-0">
                  {formattedAmount}
                </span>
              </div>
            ))}

            {/* What you owe */}
            {owesItems.map(({ apartmentId, apartmentName, formattedAmount }) => (
              <div
                key={`owes-${apartmentId}`}
                className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 xs:gap-2 sm:gap-3 p-1.5 xs:p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="p-1.5 xs:p-2 rounded-full bg-red-100 dark:bg-red-800/30">
                    <TrendingDown className="h-4 w-4 xs:h-5 xs:w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">You owe {apartmentName}</p>
                    <p className="text-xs text-muted-foreground dark:text-red-200">
                      for shared expenses
                    </p>
                  </div>
                </div>
                <span className="text-base xs:text-lg font-semibold text-red-700 dark:text-red-400 flex-shrink-0">
                  {formattedAmount}
                </span>
              </div>
            ))}

            {/* Net balance */}
            {netBalance.amount > 0 && (
              <div
                className={`mt-2 xs:mt-2.5 sm:mt-3 md:mt-4 p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-lg ${netBalance.isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
              >
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{netBalance.displayText}</p>
                    <p
                      className={`text-xs mt-0.5 xs:mt-1 ${netBalance.isPositive ? 'text-muted-foreground dark:text-green-200' : 'text-muted-foreground dark:text-red-200'}`}
                    >
                      {netBalance.description}
                    </p>
                  </div>
                  <span
                    className={`text-base xs:text-lg sm:text-xl font-bold flex-shrink-0 ${netBalance.isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {netBalance.formattedAmount}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Management Section - only show if expense management is enabled */}
      {expenseManagement && (
        <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-1.5 xs:space-y-0 pb-2 xs:pb-2.5 sm:pb-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm xs:text-base sm:text-lg">Recent Expenses</CardTitle>
                <CardDescription className="text-xs">
                  The last 2 expenses added to your apartment.
                </CardDescription>
              </div>
              {onNavigateToExpenses && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={onNavigateToExpenses}
                   className="text-xs w-full xs:w-auto mt-1.5 xs:mt-0 gap-1.5 hover:bg-accent"
                 >
                   View All
                   <ArrowRight className="h-3.5 w-3.5" />
                 </Button>
               )}
            </CardHeader>
            <CardContent>
              {ExpensesList && (
                <ExpensesList
                  expenses={expenses}
                  limit={2}
                  users={users}
                  categories={categories}
                  currentUserApartment={currentUserApartment}
                  currentUserRole={currentUserRole}
                  onExpenseUpdate={onExpenseUpdate}
                  onExpenseDelete={onExpenseDelete}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 xs:pb-2.5 sm:pb-3">
              <CardTitle className="text-sm xs:text-base sm:text-lg">Account Summary</CardTitle>
              <CardDescription className="text-xs">
                Your personal balance status and account overview.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
              <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 min-w-0">
                <Bell className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />
                <div className="grid gap-0.5 xs:gap-1 min-w-0 flex-1">
                  <p className="text-xs font-medium break-words">
                    Welcome to Apargo, {user?.name}!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Here is a summary of your account.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 min-w-0">
                <Wallet
                  className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-0.5 ${accountSummary.isSettled ? 'text-green-600 dark:text-green-400' : accountSummary.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                />
                <div className="grid gap-0.5 xs:gap-1 min-w-0 flex-1">
                  <p className="text-xs font-medium break-words">
                    Your balance is {accountSummary.formattedAmount}
                  </p>
                  <p className="text-xs text-muted-foreground">{accountSummary.statusText}</p>
                </div>
              </div>
              {showReminder && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 min-w-0">
                    <TrendingUp className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="grid gap-0.5 xs:gap-1 min-w-0 flex-1">
                      <p className="text-xs font-medium">Settle Up Reminder</p>
                      <p className="text-xs text-muted-foreground break-words">
                        Please pay your outstanding balance to keep the records updated.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Floating Action Buttons - only show if management features are enabled */}
      {user && (expenseManagement || paymentManagement) && (
        <div className="fixed bottom-4 right-4 z-50 sm:hidden">
          <div className="flex flex-col gap-3">
            {/* Quick Add Expense Button - only if expense management enabled */}
            {expenseManagement && onAddExpense && (
              <AddExpenseDialog
                categories={categories}
                onAddExpense={onAddExpense}
                currentUser={user}
                isLoadingApartments={isLoadingApartments}
              >
                <Button
                  className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-lg active:shadow-md transition-all duration-200 active:scale-95"
                  disabled={isLoadingApartments}
                  aria-label="Quick Add Expense"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </AddExpenseDialog>
            )}

            {/* Quick Add Payment Button - only if payment management enabled */}
            {paymentManagement && onAddPayment && (
              <AddPaymentDialog users={users} onAddPayment={onAddPayment}>
                <Button
                  className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg active:shadow-md transition-all duration-200 active:scale-95"
                  disabled={isLoadingApartments}
                  aria-label="Quick Add Payment"
                >
                  <CreditCard className="h-6 w-6" />
                </Button>
              </AddPaymentDialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
