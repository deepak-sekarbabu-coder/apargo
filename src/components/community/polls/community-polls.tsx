import { useAuth } from '@/context/auth-context';

import * as React from 'react';

import { deletePoll, listenToPolls, voteOnPoll } from '@/lib/firestore/polls';
import { Apartment, Poll } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimplePagination } from '@/components/ui/pagination';

import { PollCardSkeleton } from './poll-card-skeleton';
import { PollResults } from './poll-results';
import { PollVoteDialog } from './poll-vote-dialog';

interface CommunityPollsProps {
  apartments: Apartment[];
}

export function CommunityPolls({ apartments }: CommunityPollsProps) {
  const { user } = useAuth();
  const [polls, setPolls] = React.useState<Poll[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = React.useState(false);
  const apartmentId = user?.apartment;

  // Constants for pagination
  const POLLS_PER_PAGE = 5;

  // Calculate pagination
  const totalPages = Math.ceil(polls.length / POLLS_PER_PAGE);
  const startIndex = (currentPage - 1) * POLLS_PER_PAGE;
  const endIndex = startIndex + POLLS_PER_PAGE;
  const paginatedPolls = polls.slice(startIndex, endIndex);

  // Handle page change with loading state
  const handlePageChange = async (page: number) => {
    setIsPaginationLoading(true);
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    setCurrentPage(page);
    setIsPaginationLoading(false);
  };

  React.useEffect(() => {
    setLoading(true);
    const unsub = listenToPolls(polls => {
      // Sort polls in descending order by createdAt date
      const sortedPolls = polls
        .filter(p => p.isActive)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPolls(sortedPolls);
      setLoading(false);
    }, true);
    return () => unsub();
  }, []);

  // Reset to first page when polls change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <PollCardSkeleton />
        <PollCardSkeleton />
        <PollCardSkeleton />
      </div>
    );
  }

  if (!apartmentId) {
    return <div className="text-destructive">You must be assigned to an apartment to vote.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Polls Display */}
      <div className="grid gap-6">
        {polls.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No active polls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">There are currently no polls to vote on.</div>
            </CardContent>
          </Card>
        ) : isPaginationLoading ? (
          // Show skeletons during pagination loading
          Array.from({ length: Math.min(POLLS_PER_PAGE, polls.length) }).map((_, index) => (
            <PollCardSkeleton key={index} />
          ))
        ) : (
          paginatedPolls.map(poll => {
            const hasVoted = !!poll.votes[apartmentId];
            const votedOptionId = poll.votes[apartmentId];
            return (
              <Card key={poll.id} className="w-full max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle>{poll.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasVoted ? (
                    <PollVoteDialog
                      poll={poll}
                      apartmentId={apartmentId}
                      hasVoted={hasVoted}
                      votedOptionId={votedOptionId}
                      user={user}
                      onVote={async optionId => {
                        await voteOnPoll(poll.id, apartmentId, optionId);
                      }}
                      onDeletePoll={
                        user && (user.id === poll.createdBy || user.role === 'incharge')
                          ? async pollId => {
                              await deletePoll(pollId, { id: user.id, role: user.role });
                              setPolls(prev => prev.filter(p => p.id !== pollId));
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <PollResults
                      poll={poll}
                      apartmentCount={apartments.length}
                      user={user}
                      onDeletePoll={
                        user && (user.id === poll.createdBy || user.role === 'incharge')
                          ? async pollId => {
                              await deletePoll(pollId, { id: user.id, role: user.role });
                              setPolls(prev => prev.filter(p => p.id !== pollId));
                            }
                          : undefined
                      }
                    />
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {polls.length > POLLS_PER_PAGE && (
        <div className="flex justify-center mt-6">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isPaginationLoading}
            aria-label="Polls pagination"
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  );
}
