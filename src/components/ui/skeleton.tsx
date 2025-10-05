import React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

interface MaintenanceTaskSkeletonProps {
  count?: number;
}

function MaintenanceTaskSkeleton({ count = 5 }: MaintenanceTaskSkeletonProps) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="p-3 border rounded flex flex-col gap-2 bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-20 self-start sm:self-auto" />
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export { Skeleton, MaintenanceTaskSkeleton };
