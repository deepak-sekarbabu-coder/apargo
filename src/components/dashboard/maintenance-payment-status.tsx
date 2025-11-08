'use client';

import { AlertCircle, CheckCircle2, Clock, UploadCloud } from 'lucide-react';

import * as React from 'react';

import { addPayment, updatePayment } from '@/lib/firestore/payments';
import { uploadImage } from '@/lib/storage';
import type { Payment, User } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    () =>
      payments.filter(p => p.apartmentId === user?.apartment && isMaintenancePayment(p)),
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
    const unpaid: Array<{ monthYear: string; payments: Payment[]; totalOwed: number; totalPaid: number }> = [];
    
    // Check current month
    const currentPayments = paymentsByMonth[monthYear] || [];
    const currentOwed = currentPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || defaultMonthlyAmount;
    const currentPaid = currentPayments
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    if (currentPaid < currentOwed) {
      unpaid.push({ monthYear, payments: currentPayments, totalOwed: currentOwed, totalPaid: currentPaid });
    }

    // Check previous months (up to 12 months back)
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const checkMonthYear = checkDate.toISOString().slice(0, 7);
      const monthPayments = paymentsByMonth[checkMonthYear] || [];
      
      if (monthPayments.length > 0) {
        const owed = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const paid = monthPayments
          .filter(p => p.status === 'paid' || p.status === 'approved')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        if (paid < owed) {
          unpaid.push({ monthYear: checkMonthYear, payments: monthPayments, totalOwed: owed, totalPaid: paid });
        }
      }
    }
    
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
      const monthOwed = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || defaultMonthlyAmount;
      
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
          console.warn('Unable to clear maintenance receipt input', clearErr);
        }
      }
    } catch (e: unknown) {
      console.error('Maintenance receipt upload failed', e);
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
      <Card className="border-green-200 bg-green-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Monthly Maintenance
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">All payments up to date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600">Paid</Badge>
            <span className="text-sm text-muted-foreground">
              Thank you, all your maintenance fees are recorded.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          <Clock className="h-5 w-5 text-amber-600" />
          Monthly Maintenance
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {unpaidMonths.length} unpaid {unpaidMonths.length === 1 ? 'month' : 'months'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unpaidMonths.map(({ monthYear: month, payments: monthPayments, totalOwed: owed, totalPaid: paid }) => {
          const isCurrentMonth = month === monthYear;
          const existingPendingForMonth = monthPayments.find(p => p.status === 'pending');
          const isMonthSelected = selectedMonth === month;
          
          return (
            <div
              key={month}
              className={`p-3 rounded-lg border ${isCurrentMonth ? 'border-amber-300 bg-amber-100/50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">
                    {formatMonth(month)}
                    {isCurrentMonth && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Amount Due: <span className="font-medium">₹{owed.toFixed(2)}</span>
                    {paid > 0 && <span className="ml-2">(Paid: ₹{paid.toFixed(2)})</span>}
                  </div>
                </div>
                <div>
                  {existingPendingForMonth ? (
                    <Badge variant="secondary" className="text-xs">Pending Approval</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Not Paid</Badge>
                  )}
                </div>
              </div>
              
              {isMonthSelected && (
                <div className="space-y-2 mt-3 pt-3 border-t">
                  <Input ref={fileInputRef} type="file" accept="image/*,application/pdf" />
                  {error && (
                    <div className="flex items-center text-red-600 text-xs gap-1">
                      <AlertCircle className="h-3 w-3" /> {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isUploading}
                      onClick={() => handleUpload(month)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {isUploading
                        ? 'Uploading...'
                        : existingPendingForMonth
                          ? 'Re-upload & Mark Paid'
                          : 'Upload Receipt & Mark Paid'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMonth('')}
                    >
                      Cancel
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
                  className="w-full mt-2"
                >
                  {existingPendingForMonth ? 'Re-upload Receipt' : 'Upload Receipt'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
