'use client';

import * as React from 'react';

import type { Category, Expense, User, View } from '@/lib/core/types';

import { NavigationMenu } from '@/components/layout/navigation-menu';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';

interface SidebarLayoutProps {
  user: User | null;
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  role: string;
  categories: Category[];
  handleAddExpense: (newExpenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  handleAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
    reason?: string;
  }) => Promise<void>;
  handleUpdateUser: (updatedUser: User) => Promise<void>;
  logout: () => void;
  monthlyExpenses: number;
  isLoadingApartments: boolean;
  children: React.ReactNode;
  isMounted: boolean;
  users: User[];
}

export function SidebarLayout({
  user,
  view,
  setView,
  role,
  categories,
  handleAddExpense,
  handleAddPayment,
  handleUpdateUser,
  logout,
  monthlyExpenses,
  isLoadingApartments,
  children,
  isMounted,
  users,
}: SidebarLayoutProps) {
  return (
    <>
      <Sidebar>
        <NavigationMenu user={user} view={view} setView={setView} role={role} />
        <SidebarFooter>
          <Card className="m-2">
            <CardHeader className="p-3">
              <CardTitle>Total This Month</CardTitle>
              <CardDescription>Sum of all shared expenses in your apartment.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {isMounted ? `₹${monthlyExpenses.toFixed(2)}` : '—'}
              </div>
            </CardContent>
          </Card>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <PageHeader
            view={view}
            user={user}
            categories={categories}
            users={users}
            onAddExpense={handleAddExpense}
            onAddPayment={handleAddPayment}
            onUpdateUser={handleUpdateUser}
            onLogout={logout}
            onNavigateHome={() => setView('dashboard')}
            isLoadingApartments={isLoadingApartments}
          />
          <main id="main-content" className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-x-hidden scrollable-container">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
