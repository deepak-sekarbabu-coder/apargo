import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { BarChart3, CreditCard } from 'lucide-react';

import * as React from 'react';

import type { BalanceSheet, Payment, User } from '@/lib/core/types';
import { addPayment, deletePayment, updatePayment } from '@/lib/firestore/payments';
import { uploadImage } from '@/lib/storage/storage';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { usePaymentFilters } from '@/hooks/use-payment-filters';

import { PaymentsTable } from './ledger-payments/payments-table';
import { MonthlyBalanceSheet } from './monthly-balance-sheet/monthly-balance-sheet';

interface LedgerViewProps {
  payments: Payment[];
  balanceSheets: BalanceSheet[];
  users: User[];
}

export function LedgerView({ payments, users }: LedgerViewProps) {
  const { user: authUser } = useAuth();

  // State for delete confirmation
  const [, setDeleteId] = React.useState<string | null>(null);
  const [, setIsDeleting] = React.useState(false);

  // Month filter state
  const [filterMonth, setFilterMonth] = React.useState<string>('all');

  // Payment type filter state
  const [filterType, setFilterType] = React.useState<string>('all'); // 'all', 'regular', 'payment-events'

  // Use payment filters hook
  const { filteredPayments, paymentMonths } = usePaymentFilters(payments, filterMonth);

  // Enhanced filtering for payment events (memoized)
  const filteredPaymentsWithType = React.useMemo(() => {
    let filtered = filteredPayments;

    if (filterType === 'payment-events') {
      // Filter for payment events (maintenance fees)
      filtered = filtered.filter(
        payment =>
          payment.reason?.includes('Monthly maintenance fee') ||
          payment.reason?.includes('maintenance') ||
          (!payment.expenseId && payment.category === 'income')
      );
    } else if (filterType === 'regular') {
      // Filter for regular payments (exclude payment events)
      filtered = filtered.filter(
        payment =>
          !payment.reason?.includes('Monthly maintenance fee') &&
          !payment.reason?.includes('maintenance') &&
          !(payment.category === 'income' && !payment.expenseId)
      );
    }

    return filtered;
  }, [filteredPayments, filterType]);

  // Clear filter function
  const handleClearFilter = React.useCallback(() => {
    setFilterMonth('all');
    setFilterType('all');
  }, []);

  // Delete payment handler
  const handleDeletePayment = React.useCallback(async (paymentId: string) => {
    setIsDeleting(true);
    try {
      await deletePayment(paymentId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Use auth context for current user, but fallback to users array for other operations
  const currentUser = React.useMemo(
    () =>
      authUser ||
      users.find(
        u => u.id === (typeof window !== 'undefined' ? window.localStorage.getItem('userId') : '')
      ) ||
      users[0],
    [authUser, users]
  );

  // Payment creation handler
  const handleAddPayment = React.useCallback(
    async (data: {
      payeeId: string;
      amount: number;
      receiptFile?: File;
      expenseId?: string;
      monthYear: string;
      category?: 'income' | 'expense';
    }) => {
      let receiptURL = '';
      // If a receipt file was provided, upload it to Firebase Storage
      if (data.receiptFile) {
        try {
          const path = `receipts/${Date.now()}_${data.receiptFile.name}`;
          receiptURL = await uploadImage(data.receiptFile, path);
        } catch (err) {
          console.error('Receipt upload failed:', err);
          // Re-throw so caller can surface error if needed
          throw err;
        }
      }
      const paymentData: {
        payerId: string;
        payeeId: string;
        amount: number;
        status: 'pending' | 'approved' | 'rejected';
        monthYear: string;
        receiptURL: string;
        expenseId?: string;
        apartmentId?: string;
        category?: 'income' | 'expense';
      } = {
        payerId: currentUser.id,
        payeeId: data.payeeId,
        amount: data.amount,
        status: 'pending',
        monthYear: data.monthYear,
        receiptURL,
        apartmentId: currentUser.apartment,
        category: data.category || 'income',
      };

      // Only add expenseId if it is a non-empty string
      if (data.expenseId && typeof data.expenseId === 'string' && data.expenseId.trim() !== '') {
        paymentData.expenseId = data.expenseId;
      }

      await addPayment(paymentData);
    },
    [currentUser]
  );

  // Admin approval handlers
  const handleApprovePayment = React.useCallback(
    async (paymentId: string) => {
      // Only allow admin to approve and set their name
      if (currentUser.role === 'admin') {
        // Use displayName if available, fallback to email, never 'New User'
        let approverName = currentUser.name;
        if (approverName === 'New User') {
          approverName = currentUser.email || currentUser.id;
        }
        await updatePayment(paymentId, {
          status: 'approved',
          approvedBy: currentUser.id,
          approvedByName: approverName,
        });
      }
    },
    [currentUser]
  );

  const handleRejectPayment = React.useCallback(
    async (paymentId: string) => {
      // Only allow admin to reject and set their name
      if (currentUser.role === 'admin') {
        await updatePayment(paymentId, { status: 'rejected', approvedBy: currentUser.id });
      }
    },
    [currentUser]
  );

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Ledger Navigation Tabs */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="payments" className="admin-mobile-tab">
            <CreditCard className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Ledger Payments</span>
          </TabsTrigger>
          <TabsTrigger value="balance-sheets" className="admin-mobile-tab">
            <BarChart3 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Monthly Balance Sheet</span>
          </TabsTrigger>
        </TabsList>

        {/* Ledger Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Ledger Payments</CardTitle>
                  <CardDescription>All payment transactions and statuses.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Month and Type Filters */}
              <div className="space-y-4 mb-6">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Month Filter */}
                  <div className="space-y-2">
                    <label
                      htmlFor="payment-month"
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Filter by Month:
                    </label>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-full" id="payment-month">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {paymentMonths.map(month => (
                          <SelectItem key={month} value={month}>
                            {format(new Date(month + '-01'), 'MMMM yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Type Filter */}
                  <div className="space-y-2">
                    <label htmlFor="payment-type" className="text-sm font-medium whitespace-nowrap">
                      Payment Type:
                    </label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full" id="payment-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="regular">Regular Payments</SelectItem>
                        <SelectItem value="payment-events">Payment Events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters Button */}
                  {(filterMonth !== 'all' || filterType !== 'all') && (
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="text-sm font-medium text-transparent">Clear</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilter}
                        className="w-full touch-manipulation"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}

                  {/* Responsive spacer */}
                  {filterMonth === 'all' && filterType === 'all' && (
                    <div className="hidden lg:block"></div>
                  )}
                </div>

                {/* Payment Summary Cards */}
                {filterType === 'payment-events' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-900">Payment Events</p>
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredPaymentsWithType.length}
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        {filterMonth !== 'all' &&
                          `for ${format(new Date(filterMonth + '-01'), 'MMMM yyyy')}`}
                      </p>
                      <p className="text-sm font-medium text-blue-800 mt-2">
                        Total: ₹{filteredPaymentsWithType.reduce((sum, p) => sum + p.amount, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {filterType === 'regular' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-900">Regular Payments</p>
                        <div className="text-2xl font-bold text-green-600">
                          {filteredPaymentsWithType.length}
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        {filterMonth !== 'all' &&
                          `for ${format(new Date(filterMonth + '-01'), 'MMMM yyyy')}`}
                      </p>
                      <p className="text-sm font-medium text-green-800 mt-2">
                        Total: ₹{filteredPaymentsWithType.reduce((sum, p) => sum + p.amount, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* All payments summary */}
                {filterType === 'all' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Total Payments</p>
                        <div className="text-2xl font-bold text-gray-600">
                          {filteredPaymentsWithType.length}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-2">
                        Amount: ₹{filteredPaymentsWithType.reduce((sum, p) => sum + p.amount, 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <PaymentsTable
                payments={filteredPaymentsWithType}
                users={users}
                currentUser={currentUser}
                onAddPayment={handleAddPayment}
                onApprovePayment={handleApprovePayment}
                onRejectPayment={handleRejectPayment}
                onDeletePayment={handleDeletePayment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Balance Sheets Tab */}
        <TabsContent value="balance-sheets" className="space-y-4">
          <MonthlyBalanceSheet payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


