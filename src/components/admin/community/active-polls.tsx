'use client';

import { useAuth } from '@/context/auth-context';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import { Poll } from '@/lib/core/types';
import { deletePoll, listenToPolls } from '@/lib/firestore/polls';

import { PollCard } from './poll-card';
import { PollsEmpty } from './polls-empty';
import { PollsLoading } from './polls-loading';

const logger = getLogger('Component');

export function ActivePolls() {
  const { user } = useAuth();
  const [polls, setPolls] = React.useState<Poll[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = listenToPolls(polls => {
      // Sort polls in descending order by createdAt date
      const sortedPolls = polls
        .filter(poll => poll.isActive)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPolls(sortedPolls);
      setLoading(false);
    }, true); // Only active polls

    return () => unsubscribe();
  }, []);

  const handleDeletePoll = async (pollId: string) => {
    setDeletingId(pollId);
    try {
      await deletePoll(pollId, user ? { id: user.id, role: user.role } : undefined);
    } catch (error) {
      logger.error('Error deleting poll:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <PollsLoading />;
  }

  if (polls.length === 0) {
    return <PollsEmpty />;
  }

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <PollCard
          key={poll.id}
          poll={poll}
          userId={user?.id}
          userRole={user?.role}
          onDelete={handleDeletePoll}
          isDeleting={deletingId === poll.id}
        />
      ))}
    </div>
  );
}
