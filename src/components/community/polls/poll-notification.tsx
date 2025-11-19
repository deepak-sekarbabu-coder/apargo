'use client';

import { useAuth } from '@/context/auth-context';
import { Vote } from 'lucide-react';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { voteOnPoll } from '@/lib/firestore/polls';
import { Poll } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { PollVoteDialog } from './poll-vote-dialog';

interface PollNotificationProps {
  poll: Poll;
  onDismiss?: () => void;
}

export function PollNotification({ poll, onDismiss }: PollNotificationProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleViewPolls = () => {
    router.push('/community');
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user?.apartment) return;
    await voteOnPoll(poll.id, user.apartment, optionId);
    if (onDismiss) {
      onDismiss();
    }
  };

  const hasVoted = !!(user?.apartment && poll.votes && poll.votes[user.apartment]);
  const votedOption = user?.apartment ? poll.votes?.[user.apartment] : undefined;

  return (
    <Card className="mb-2 overflow-hidden border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Vote className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">New Community Poll</p>
              <span className="text-xs text-muted-foreground">
                {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm font-semibold">{poll.question}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <PollVoteDialog
                poll={poll}
                onVote={handleVote}
                hasVoted={hasVoted}
                votedOptionId={votedOption}
                apartmentId={user?.apartment || ''}
              >
                <Button size="sm" variant="default">
                  {hasVoted ? 'View Vote' : 'Vote Now'}
                </Button>
              </PollVoteDialog>
              <Button size="sm" variant="outline" onClick={handleViewPolls}>
                View All Polls
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
