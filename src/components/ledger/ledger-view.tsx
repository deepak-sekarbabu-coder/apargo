import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart3, CreditCard, Download } from 'lucide-react';

import * as React from 'react';

import { aggregateBalanceSheets } from '@/lib/balance-utils';
import * as firestore from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import type { BalanceSheet, Payment, User } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { usePaymentFilters } from '@/hooks/use-payment-filters';

import { PaymentsTable } from './payments-table';

// Extend jsPDF type to include autoTable
interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY?: number;
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number;
    fontSize?: number;
    fontStyle?: string;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  margin?: { top?: number };
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

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

  // PDF export for balance sheets
  const handleExportBalanceSheetsPDF = React.useCallback(() => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Monthly Balance Sheets', 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 32);

    // Calculate income and expenses from approved payments only (consistent with UI display)
    const incomeMap = new Map<string, number>();
    const expensesMap = new Map<string, number>();

    payments
      // Include both explicitly approved and paid payments in balance calculations
      .filter(p => p.status === 'approved' || p.status === 'paid')
      .forEach(p => {
        const category = p.category || (p.expenseId ? 'expense' : 'income');
        const amt = p.amount || 0;

        if (category === 'expense') {
          const current = expensesMap.get(p.monthYear) || 0;
          expensesMap.set(p.monthYear, current + amt);
        } else {
          const current = incomeMap.get(p.monthYear) || 0;
          incomeMap.set(p.monthYear, current + amt);
        }
      });

    // Get all months that have either income or expenses
    const months = new Set<string>([...incomeMap.keys(), ...expensesMap.keys()]);

    // Prepare table data
    const headers = [['Month', 'Opening', 'Income', 'Expenses', 'Closing']];
    const data: string[][] = Array.from(months)
      .sort()
      .map(monthYear => {
        const opening = 0;
        const income = incomeMap.get(monthYear) || 0;
        const expenses = expensesMap.get(monthYear) || 0;
        const closing = opening + income - expenses;
        return [monthYear, `Rs. ${opening}`, `Rs. ${income}`, `Rs. ${expenses}`, `Rs. ${closing}`];
      });

    // Generate table
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 40 },
    });

    // Save the PDF
    doc.save(`balance-sheets-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, [payments]);

  // aggregated view of balance sheets by month (used for UI)
  const aggregatedSheets = React.useMemo(() => aggregateBalanceSheets(payments), [payments]);

  // Delete payment handler
  const handleDeletePayment = React.useCallback(async (paymentId: string) => {
    setIsDeleting(true);
    try {
      await firestore.deletePayment(paymentId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Use auth context for current user, but fallback to users array for other operations
  const currentUser = React.useMemo(() => 
    authUser ||
    users.find(
      u => u.id === (typeof window !== 'undefined' ? window.localStorage.getItem('userId') : '')
    ) ||
    users[0],
    [authUser, users]
  );

  // Payment creation handler
  const handleAddPayment = React.useCallback(async (data: {
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

    await firestore.addPayment(paymentData);
  }, [currentUser]);

  // Admin approval handlers
  const handleApprovePayment = React.useCallback(async (paymentId: string) => {
    // Only allow admin to approve and set their name
    if (currentUser.role === 'admin') {
      // Use displayName if available, fallback to email, never 'New User'
      let approverName = currentUser.name;
      if (approverName === 'New User') {
        approverName = currentUser.email || currentUser.id;
      }
      await firestore.updatePayment(paymentId, {
        status: 'approved',
        approvedBy: currentUser.id,
        approvedByName: approverName,
      });
    }
  }, [currentUser]);
  
  const handleRejectPayment = React.useCallback(async (paymentId: string) => {
    // Only allow admin to reject and set their name
    if (currentUser.role === 'admin') {
      await firestore.updatePayment(paymentId, { status: 'rejected', approvedBy: currentUser.id });
    }
  }, [currentUser]);

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <label htmlFor="payment-month" className="text-sm font-medium whitespace-nowrap">
                    Filter by Month:
                  </label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-full sm:w-[180px]" id="payment-month">
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

                  <label htmlFor="payment-type" className="text-sm font-medium whitespace-nowrap">
                    Payment Type:
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px]" id="payment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="regular">Regular Payments</SelectItem>
                      <SelectItem value="payment-events">Payment Events</SelectItem>
                    </SelectContent>
                  </Select>

                  {(filterMonth !== 'all' || filterType !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilter}
                      className="w-full sm:w-auto"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Payment Event Summary for current filter */}
                {filterType === 'payment-events' && (
                  <div className="bg-blue-50 p-3 rounded-lg border">
                    <p className="text-sm font-medium text-blue-900">Payment Events Summary</p>
                    <p className="text-xs text-blue-700">
                      {filteredPaymentsWithType.length} payment events
                      {filterMonth !== 'all' &&
                        ` for ${format(new Date(filterMonth + '-01'), 'MMMM yyyy')}`}
                    </p>
                    <p className="text-xs text-blue-700">
                      Total: ₹{filteredPaymentsWithType.reduce((sum, p) => sum + p.amount, 0)}
                    </p>
                  </div>
                )}
                {filterType === 'regular' && (
                  <div className="bg-green-50 p-3 rounded-lg border">
                    <p className="text-sm font-medium text-green-900">Regular Payments Summary</p>
                    <p className="text-xs text-green-700">
                      {filteredPaymentsWithType.length} regular payments
                      {filterMonth !== 'all' &&
                        ` for ${format(new Date(filterMonth + '-01'), 'MMMM yyyy')}`}
                    </p>
                    <p className="text-xs text-green-700">
                      Total: ₹{filteredPaymentsWithType.reduce((sum, p) => sum + p.amount, 0)}
                    </p>
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
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Monthly Balance Sheets</CardTitle>
                  <CardDescription>Summary of balances per apartment per month.</CardDescription>
                </div>
                <Button
                  onClick={handleExportBalanceSheetsPDF}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile Card Layout for Monthly Balance Sheets (aggregated) */}
              <div className="block lg:hidden space-y-4">
                {aggregatedSheets.map(sheet => (
                  <Card key={sheet.monthYear} className="p-4 rounded-lg shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{sheet.monthYear}</p>
                        </div>
                        <Badge
                          variant={sheet.closing >= 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          ₹{sheet.closing}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Opening:</span>
                          <p className="font-medium">₹{sheet.opening}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Income:</span>
                          <p className="font-medium text-green-600">₹{sheet.income}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Expenses:</span>
                          <p className="font-medium text-red-600">₹{sheet.expenses}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Net:</span>
                          <p
                            className={`font-medium ${sheet.closing >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {sheet.closing >= 0 ? '₹+' : '₹-'}
                            {Math.abs(sheet.closing)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {aggregatedSheets.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No balance sheets available yet.
                  </p>
                )}
              </div>

              {/* Desktop Table Layout for Monthly Balance Sheets (aggregated) */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Opening</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedSheets.map(sheet => (
                      <TableRow key={sheet.monthYear}>
                        <TableCell className="font-medium">{sheet.monthYear}</TableCell>
                        <TableCell>₹{sheet.opening}</TableCell>
                        <TableCell className="text-green-600">₹{sheet.income}</TableCell>
                        <TableCell className="text-red-600">₹{sheet.expenses}</TableCell>
                        <TableCell>
                          <Badge
                            variant={sheet.closing >= 0 ? 'default' : 'destructive'}
                            className="font-medium"
                          >
                            {sheet.closing >= 0 ? '₹+' : '₹-'}
                            {Math.abs(sheet.closing)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {aggregatedSheets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No balance sheets available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LedgerView;