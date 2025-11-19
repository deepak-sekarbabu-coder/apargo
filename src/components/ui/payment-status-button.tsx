'use client';

import { Check, X, Loader2 } from 'lucide-react';
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
                'group relative inline-flex h-8 items-center justify-center overflow-hidden rounded-full px-4 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isPaid
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                className
            )}
            {...props}
        >
            <div className="relative flex items-center gap-1.5">
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
                        <span className="relative grid items-center justify-items-center overflow-hidden">
                            <span
                                className={cn(
                                    'col-start-1 row-start-1 transition-all duration-300',
                                    isPaid ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                                )}
                            >
                                {labelPaid}
                            </span>
                            <span
                                className={cn(
                                    'col-start-1 row-start-1 transition-all duration-300',
                                    !isPaid ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                                )}
                            >
                                {labelUnpaid}
                            </span>
                        </span>
                    </>
                )}
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:animate-shimmer" />
        </button>
    );
}
