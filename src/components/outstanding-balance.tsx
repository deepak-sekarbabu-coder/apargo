'use client';

import { AlertTriangle } from 'lucide-react';

import { calculateTotalOutstanding } from '@/lib/expense-utils';
import type { Expense } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';

interface OutstandingBalanceProps {
  expenses: Expense[];
  currentUserApartment?: string;
}

export function OutstandingBalance({ expenses, currentUserApartment }: OutstandingBalanceProps) {
  if (!currentUserApartment) return null;

  const totalOutstanding = calculateTotalOutstanding(expenses, currentUserApartment);

  if (totalOutstanding <= 0) return null;

  return (
  <Card
  className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
  suppressHydrationWarning
    role="alert"
      aria-live="polite"
      aria-label={`Outstanding balance alert: ${totalOutstanding.toFixed(2)} rupees owed`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-800/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Total Outstanding Amount</p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Amount still owed to your apartment from shared expenses
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              -₹{totalOutstanding.toFixed(2)}
            </div>
            <p className="text-sm text-red-600 dark:text-red-300">Still owed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
