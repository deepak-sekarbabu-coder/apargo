import { Skeleton } from '@/components/ui/skeleton';

export function PollsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div>
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
