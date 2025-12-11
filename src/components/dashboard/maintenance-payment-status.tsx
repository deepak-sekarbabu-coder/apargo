'use client';

import { AlertCircle, CheckCircle2, Clock, UploadCloud, X } from 'lucide-react';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import type { Payment, User } from '@/lib/core/types';
import { addPayment, updatePayment } from '@/lib/firestore/payments';
import { uploadImage } from '@/lib/storage/storage';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaymentStatusButton } from '@/components/ui/payment-status-button';

const logger = getLogger('Component');

interface MaintenancePaymentStatusProps {
  user: User | null;
  payments: Payment[]; // full payments list already loaded in parent
  defaultMonthlyAmount?: number; // fallback if amount not present
  onAfterChange?: () => void; // allow parent invalidation/refetch
}

// Heuristic to detect maintenance payment events
function isMaintenancePayment(p: Payment) {
  return (
    !!p.reason?.toLowerCase().includes('monthly maintenance fee') ||
    !!p.reason?.toLowerCase().includes('maintenance fee') ||
    (!!p.reason?.toLowerCase().includes('maintenance') && p.category === 'income' && !p.expenseId)
  );
}

export function MaintenancePaymentStatus({
  user,
  payments,
  defaultMonthlyAmount = 0,
  onAfterChange,
}: MaintenancePaymentStatusProps) {
  const monthYear = React.useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

  // Get all maintenance payments for this user's apartment
  const allMaintenancePayments = React.useMemo(
    () => payments.filter(p => p.apartmentId === user?.apartment && isMaintenancePayment(p)),
    [payments, user?.apartment]
  );

  // Group by month and calculate unpaid months
  const paymentsByMonth = React.useMemo(() => {
    const grouped: Record<string, Payment[]> = {};
    allMaintenancePayments.forEach(p => {
      if (!grouped[p.monthYear]) {
        grouped[p.monthYear] = [];
      }
      grouped[p.monthYear].push(p);
    });
    return grouped;
  }, [allMaintenancePayments]);

  // Find unpaid months (including current month)
  const unpaidMonths = React.useMemo(() => {
    const unpaid: Array<{
      monthYear: string;
      payments: Payment[];
      totalOwed: number;
      totalPaid: number;
    }> = [];

    // Check current month
    const currentPayments = paymentsByMonth[monthYear] || [];
    const currentOwed =
      currentPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || defaultMonthlyAmount;
    const currentPaid = currentPayments
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (currentPaid < currentOwed) {
      unpaid.push({
        monthYear,
        payments: currentPayments,
        totalOwed: currentOwed,
        totalPaid: currentPaid,
      });
    }

    // Check only months that have maintenance charges generated (from paymentsByMonth)
    Object.entries(paymentsByMonth).forEach(([monthKey, monthPayments]) => {
      if (monthKey === monthYear) return; // Already checked current month above

      const owed = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paid = monthPayments
        .filter(p => p.status === 'paid' || p.status === 'approved')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      if (paid < owed) {
        unpaid.push({
          monthYear: monthKey,
          payments: monthPayments,
          totalOwed: owed,
          totalPaid: paid,
        });
      }
    });

    return unpaid.sort((a, b) => b.monthYear.localeCompare(a.monthYear)); // Most recent first
  }, [paymentsByMonth, monthYear, defaultMonthlyAmount]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(monthYear);

  const handleUpload = async (targetMonth: string) => {
    if (!user?.id || !user.apartment) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a receipt file first.');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const path = `receipts/${Date.now()}_${file.name}`;
      const receiptURL = await uploadImage(file, path);

      // Find existing pending payment for this month
      const monthPayments = paymentsByMonth[targetMonth] || [];
      const existingPendingForMonth = monthPayments.find(p => p.status === 'pending');
      const monthOwed =
        monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || defaultMonthlyAmount;

      if (existingPendingForMonth) {
        await updatePayment(existingPendingForMonth.id, {
          receiptURL,
          status: 'paid',
          payerId: user.id,
        });
      } else {
        await addPayment({
          payerId: user.id,
          // Admin (system) user can be left blank; use same user as payee for now
          payeeId: user.id,
          apartmentId: user.apartment,
          amount: monthOwed || 0,
          status: 'paid',
          monthYear: targetMonth,
          receiptURL,
          category: 'income',
          reason: 'Monthly maintenance fee - Maintenance',
        });
      }
      onAfterChange?.();
      // Safely clear the file input if it still exists. The ref can become null
      // if the component re-renders/unmounts during the async upload.
      const inputEl = fileInputRef.current;
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch (clearErr) {
          // Non-fatal; log for diagnostics
          logger.warn('Unable to clear maintenance receipt input', clearErr);
        }
      }
    } catch (e: unknown) {
      logger.error('Maintenance receipt upload failed', e);
      const message = ((): string => {
        if (e instanceof Error) return e.message || 'Upload failed';
        if (typeof e === 'object' && e && 'message' in e) {
          const possibleMessage = (e as { message?: unknown }).message;
          if (typeof possibleMessage === 'string') return possibleMessage;
        }
        return 'Upload failed';
      })();
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Format month for display
  const formatMonth = (monthYearStr: string) => {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // If there are no unpaid months, show success message
  if (unpaidMonths.length === 0) {
    return (
      <Card className="border-[hsl(var(--maintenance-paid-border))] bg-[hsl(var(--maintenance-paid-bg))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--maintenance-paid-text))]" />
            Monthly Maintenance
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">All payments up to date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <PaymentStatusButton isPaid={true} readOnly labelPaid="Paid" />
            <span className="text-sm text-muted-foreground">
              Thank you, all your maintenance fees are recorded.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[hsl(var(--maintenance-unpaid-border))] bg-[hsl(var(--maintenance-unpaid-bg))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-[hsl(var(--maintenance-unpaid-text))] flex-shrink-0" />
          <span className="break-words">Monthly Maintenance</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          {unpaidMonths.length} unpaid {unpaidMonths.length === 1 ? 'month' : 'months'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {unpaidMonths.map(
          ({ monthYear: month, payments: monthPayments, totalOwed: owed, totalPaid: paid }) => {
            const isCurrentMonth = month === monthYear;
            const existingPendingForMonth = monthPayments.find(p => p.status === 'pending');
            const isMonthSelected = selectedMonth === month;

            return (
              <div
                key={month}
                className={`p-2 sm:p-3 rounded-lg border ${isCurrentMonth ? 'border-[hsl(var(--maintenance-unpaid-border))] bg-[hsl(var(--maintenance-unpaid-bg))]/70' : 'border-border bg-card'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                      <span className="break-words">{formatMonth(month)}</span>
                      {isCurrentMonth && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 break-words">
                      Amount Due: <span className="font-medium">₹{owed.toFixed(2)}</span>
                      {paid > 0 && <span className="ml-1 sm:ml-2">(Paid: ₹{paid.toFixed(2)})</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {existingPendingForMonth ? (
                      <Badge variant="secondary" className="text-xs">
                        Pending Approval
                      </Badge>
                    ) : (
                      <PaymentStatusButton isPaid={false} readOnly labelUnpaid="Not Paid" />
                    )}
                  </div>
                </div>

                {isMonthSelected && (
                  <div className="space-y-2 sm:space-y-3 mt-3 pt-3 border-t">
                    <label htmlFor="receipt-upload" className="block text-sm font-medium">
                      Upload Receipt
                    </label>
                    <Input
                      id="receipt-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                    {error && (
                      <div className="flex items-start gap-2 text-red-600 text-xs break-words">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />{' '}
                        <span>{error}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        disabled={isUploading}
                        onClick={() => handleUpload(month)}
                        className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <UploadCloud className="h-3 sm:h-4 w-3 sm:w-4" />
                        <span className="min-w-0 truncate">
                          {isUploading
                            ? 'Uploading...'
                            : existingPendingForMonth
                              ? 'Re-upload & Mark Paid'
                              : 'Upload Receipt & Mark Paid'}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMonth('')}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>
                )}

                {!isMonthSelected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMonth(month);
                      setError(null);
                    }}
                    className="w-full mt-2 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    {existingPendingForMonth ? 'Re-upload Receipt' : 'Upload Receipt'}
                  </Button>
                )}
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}
