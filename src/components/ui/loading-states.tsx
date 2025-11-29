import React from 'react';

import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  spinner?: boolean;
}

export function LoadingSpinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-spin rounded-full border-b-2 border-primary', className)}
      {...props}
    />
  );
}

export function PageLoading({ text = 'Loading...', className, ...props }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen bg-background',
        className
      )}
      {...props}
    >
      <LoadingSpinner className="h-10 w-10 mb-4" />
      <p className="text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

export function SectionLoading({ text = 'Loading section...', className, ...props }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] w-full p-4',
        className
      )}
      {...props}
    >
      <LoadingSpinner className="h-8 w-8 mb-4" />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
