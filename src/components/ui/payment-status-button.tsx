'use client';

import { Check, Loader2, X } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface PaymentStatusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPaid: boolean;
  isLoading?: boolean;
  labelPaid?: string;
  labelUnpaid?: string;
}

export function PaymentStatusButton({
  isPaid,
  isLoading,
  labelPaid = 'Paid',
  labelUnpaid = 'Unpaid',
  className,
  disabled,
  ...props
}: PaymentStatusButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        'group relative inline-flex h-8 min-w-[7rem] items-center justify-center overflow-hidden rounded-full border px-4 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isPaid
          ? 'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
          : 'border-transparent bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <div className="relative h-3.5 w-3.5">
              <Check
                className={cn(
                  'absolute inset-0 h-full w-full transition-all duration-300',
                  isPaid ? 'scale-100 opacity-100' : 'scale-0 opacity-0 rotate-90'
                )}
              />
              <X
                className={cn(
                  'absolute inset-0 h-full w-full transition-all duration-300',
                  !isPaid ? 'scale-100 opacity-100' : 'scale-0 opacity-0 -rotate-90'
                )}
              />
            </div>
            <div className="relative inline-grid items-center justify-items-center whitespace-nowrap">
              <span
                className={cn(
                  'col-start-1 row-start-1 transition-all duration-300',
                  isPaid ? 'opacity-100' : 'opacity-0'
                )}
              >
                {labelPaid}
              </span>
              <span
                className={cn(
                  'col-start-1 row-start-1 transition-all duration-300',
                  !isPaid ? 'opacity-100' : 'opacity-0'
                )}
              >
                {labelUnpaid}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:animate-shimmer pointer-events-none" />
    </button>
  );
}
