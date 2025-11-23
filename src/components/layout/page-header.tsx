'use client';

import { Home, LogOut, PlusCircle, Settings } from 'lucide-react';

import * as React from 'react';

import type { Category, Expense, User } from '@/lib/core/types';
import type { View } from '@/lib/core/types';

import { AddExpenseDialog } from '@/components/dialogs/add-expense-dialog';
import { AddPaymentDialog } from '@/components/dialogs/add-payment-dialog';
import { UserProfileDialog } from '@/components/dialogs/user-profile-dialog';
import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface PageHeaderProps {
  view: View;
  user: User | null;
  categories: Category[];
  users: User[];
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  onAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
    reason?: string;
  }) => Promise<void>;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
  isLoadingApartments?: boolean;
}

export function PageHeader(props: PageHeaderProps) {
  const {
    // view intentionally unused, preserved in props for API compatibility
    user,
    categories,
    users,
    onAddExpense,
    onAddPayment,
    onUpdateUser,
    onLogout,
    onNavigateHome,
    isLoadingApartments = false,
  } = props;
  // Dynamic page title logic (always greet user on every main view)
  const firstName = user?.name?.split(/\s+/)[0] || user?.email?.split('@')[0] || 'User';
  const title: string = `Welcome ${firstName}`;
  // Optionally could append contextual label, but requirement is to show consistent greeting across menus.

  return (
    <header className="flex h-12 xs:h-13 sm:h-14 items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 border-b bg-card px-2 xs:px-3 sm:px-4 md:px-6">
      <SidebarTrigger className="hidden" />
      {/* Mobile: Show home icon, Desktop: Show title */}
      <div className="flex-1 min-w-0">
        {/* Home icon for mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          className="md:hidden p-1 h-7 w-7 xs:h-8 xs:w-8"
          aria-label="Go to Dashboard"
        >
          <Home className="h-4 w-4 xs:h-5 xs:w-5" />
        </Button>
        {/* Title for desktop */}
        <h1 className="hidden md:block text-sm xs:text-base sm:text-lg md:text-xl font-semibold truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
        {user && <NotificationsPanel />}
        {user && (
          <AddExpenseDialog
            categories={categories}
            onAddExpense={onAddExpense}
            currentUser={user}
            isLoadingApartments={isLoadingApartments}
          >
            <Button
              className="bg-accent hover:bg-accent/90 h-8 w-8 xs:h-9 xs:w-9 sm:h-8 sm:w-auto sm:px-2 md:px-3 rounded-full sm:rounded-md touch-manipulation text-xs sm:text-sm"
              disabled={isLoadingApartments}
              aria-label="Add Expense"
            >
              <PlusCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:mr-1" />
              <span className="hidden sm:inline ml-0.5 md:ml-1 text-xs md:text-sm font-medium">
                Add
              </span>
            </Button>
          </AddExpenseDialog>
        )}
        {user && (
          <AddPaymentDialog users={users} onAddPayment={onAddPayment}>
            <Button
              className="bg-primary hover:bg-primary/90 h-8 w-8 xs:h-9 xs:w-9 sm:h-8 sm:w-auto sm:px-2 md:px-3 rounded-full sm:rounded-md touch-manipulation text-xs sm:text-sm"
              disabled={isLoadingApartments}
              aria-label="Add Payment"
            >
              <PlusCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:mr-1" />
              <span className="hidden sm:inline ml-0.5 md:ml-1 text-xs md:text-sm font-medium">
                Pay
              </span>
            </Button>
          </AddPaymentDialog>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <p className="truncate">{user.name}</p>
                <p className="font-normal text-muted-foreground truncate">
                  {user.phone || user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <UserProfileDialog user={user} onUpdateUser={onUpdateUser}>
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </UserProfileDialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
