import * as React from 'react';

import { Poll } from '@/lib/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

interface PollResultsProps {
  poll: Poll;
  apartmentCount: number;
  user?: import('@/lib/types').User | null;
  onDeletePoll?: (pollId: string) => Promise<void>;
}

export function PollResults({ poll, apartmentCount, user, onDeletePoll }: PollResultsProps) {
  const totalVotes = Object.keys(poll.votes || {}).length;
  return (
    <div className="space-y-4">
      {/* Poll question is now shown only in parent card header */}
      {poll.options.map(opt => {
        const count = Object.values(poll.votes || {}).filter(v => v === opt.id).length;
        const percent = apartmentCount ? (count / apartmentCount) * 100 : 0;
        return (
          <div key={opt.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <span>{opt.text}</span>
              <span className="text-muted-foreground text-xs">
                {count} vote{count !== 1 ? 's' : ''}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        );
      })}
      <div className="text-xs text-muted-foreground mt-2">
        {totalVotes} of {apartmentCount} apartments voted
      </div>
      {onDeletePoll && user && (user.id === poll.createdBy || user.role === 'incharge') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Delete Poll
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{' '}
                <strong>this poll</strong> and all its votes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await onDeletePoll(poll.id);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Poll
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
