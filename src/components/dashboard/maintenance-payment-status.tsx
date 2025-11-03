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

  const maintenancePayments = React.useMemo(
    () =>
      payments.filter(
        p =>
          p.monthYear === monthYear && p.apartmentId === user?.apartment && isMaintenancePayment(p)
      ),
    [payments, monthYear, user?.apartment]
  );

  // Calculate total owed based on maintenance payments, with fallback to default
  // Only use default if totalOwed would be 0, and default is > 0
  const totalOwedFromPayments = maintenancePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOwed = totalOwedFromPayments > 0 ? totalOwedFromPayments : defaultMonthlyAmount;
  const totalPaid = maintenancePayments
    .filter(p => p.status === 'paid' || p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const isPaid = totalPaid >= totalOwed && totalOwed > 0;

  const existingPending = maintenancePayments.find(p => p.status === 'pending');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpload = async () => {
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
      if (existingPending) {
        await updatePayment(existingPending.id, {
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
          amount: totalOwed || 0,
          status: 'paid',
          monthYear,
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

  return (
    <Card
      className={isPaid ? 'border-green-200 bg-green-50/40' : 'border-amber-200 bg-amber-50/40'}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          {isPaid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
          Monthly Maintenance
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">Status for {monthYear}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isPaid ? (
            <Badge className="bg-green-600">Paid</Badge>
          ) : existingPending ? (
            <Badge variant="secondary">Pending Approval</Badge>
          ) : (
            <Badge variant="destructive">Not Paid</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {isPaid
              ? 'Thank you, your maintenance fee is recorded.'
              : existingPending
                ? 'Receipt uploaded; awaiting approval.'
                : 'Please upload your receipt to mark payment.'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Amount Due: <span className="font-medium">₹{totalOwed.toFixed(2)}</span>
        </div>
        {!isPaid && (
          <div className="space-y-2">
            <Input ref={fileInputRef} type="file" accept="image/*,application/pdf" />
            {error && (
              <div className="flex items-center text-red-600 text-xs gap-1">
                <AlertCircle className="h-3 w-3" /> {error}
              </div>
            )}
            <Button
              size="sm"
              disabled={isUploading}
              onClick={handleUpload}
              className="flex items-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              {isUploading
                ? 'Uploading...'
                : existingPending
                  ? 'Re-upload & Mark Paid'
                  : 'Upload Receipt & Mark Paid'}
            </Button>
            {maintenancePayments.length > 0 && (
              <div className="text-[10px] text-muted-foreground">
                Existing records: {maintenancePayments.length} (latest status:{' '}
                {maintenancePayments[0].status})
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
