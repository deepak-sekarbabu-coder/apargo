'use client';

import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';

import { Poll } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { DeletePollDialog } from './delete-poll-dialog';
import { calculatePollResults, isExpired } from './poll-utils';

interface PollCardProps {
  poll: Poll;
  userId?: string;
  userRole?: string;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function PollCard({ poll, userId, userRole, onDelete, isDeleting }: PollCardProps) {
  const { totalVotes, optionCounts } = calculatePollResults(poll);
  const expired = isExpired(poll);
  const canDelete = userId && (userId === poll.createdBy || userRole === 'incharge');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-lg break-words">{poll.question}</CardTitle>
                {expired && <Badge variant="destructive">Expired</Badge>}
              </div>
              <CardDescription className="text-sm">
                Created {format(new Date(poll.createdAt), "MMM d, yyyy 'at' h:mm a")}
                {poll.expiresAt && (
                  <span className="ml-2 block sm:inline">
                    • Expires {format(new Date(poll.expiresAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {canDelete && (
            <div className="sm:ml-2 flex-shrink-0">
              <DeletePollDialog poll={poll} onDelete={onDelete} isDeleting={isDeleting} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground gap-2">
            <span>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} received
            </span>
            {poll.options.length > 0 && (
              <span>
                {poll.options.length} option{poll.options.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Poll Results */}
          <div className="space-y-3">
            {optionCounts.map(option => (
              <div key={option.id} className="space-y-2">
                <div className="flex flex-wrap justify-between items-center text-sm gap-2">
                  <span className="font-medium break-words flex-1 min-w-0">{option.text}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {option.count} vote{option.count !== 1 ? 's' : ''} (
                    {Math.round(option.percentage)}%)
                  </span>
                </div>
                <Progress value={option.percentage} className="h-2.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
