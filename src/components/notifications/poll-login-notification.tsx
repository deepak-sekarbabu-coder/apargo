'use client';

import { useAuth } from '@/context/auth-context';

import { useEffect, useState } from 'react';

import { listenToUnvotedPolls } from '@/lib/community/poll-utils';
import { getLogger } from '@/lib/core/logger';
import { Poll } from '@/lib/core/types';
import { voteOnPoll } from '@/lib/firestore/polls';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const logger = getLogger('Component');

export function PollLoginNotification() {
  const { user } = useAuth();
  const [unvotedPolls, setUnvotedPolls] = useState<Poll[]>([]);
  const [currentPollIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [notifiedPollIds, setNotifiedPollIds] = useState<Set<string>>(new Set());

  // Helper function to mark polls as notified
  const markPollsAsNotified = (pollIds: string[]) => {
    setNotifiedPollIds(prev => {
      const newSet = new Set(prev);
      pollIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  // Clear notified poll IDs when user logs out
  useEffect(() => {
    if (!user) {
      setNotifiedPollIds(new Set());
      setShowNotification(false);
      setUnvotedPolls([]);
    } else {
      const key = `notifiedPollIds_${user.id}`;
      const stored = localStorage.getItem(key);
      setNotifiedPollIds(stored ? new Set(JSON.parse(stored)) : new Set());
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const key = `notifiedPollIds_${user.id}`;
      localStorage.setItem(key, JSON.stringify(Array.from(notifiedPollIds)));
    }
  }, [notifiedPollIds, user]);
  // Check for unvoted polls when user logs in
  useEffect(() => {
    if (user && user.apartment) {
      const unsubscribe = listenToUnvotedPolls(user, polls => {
        const newPolls = polls.filter(poll => !notifiedPollIds.has(poll.id));
        setUnvotedPolls(newPolls);
        setShowNotification(newPolls.length > 0);
      });
      return () => unsubscribe();
    } else {
      setUnvotedPolls([]);
      setShowNotification(false);
      return () => {};
    }
  }, [user, notifiedPollIds]);

  const handleVoteNow = () => {
    setShowVoteDialog(true);
    setShowNotification(false);
  };

  const handleViewAllPolls = () => {
    // Track that user has been notified about these polls
    const currentPollIds = unvotedPolls.map(poll => poll.id);
    markPollsAsNotified(currentPollIds);

    window.dispatchEvent(
      new CustomEvent('unicorn:navigate', { detail: { view: 'community', initialTab: 'polls' } })
    );
    setShowNotification(false);
  };

  const handleDismiss = () => {
    // Track that user has been notified about these polls
    const currentPollIds = unvotedPolls.map(poll => poll.id);
    markPollsAsNotified(currentPollIds);
    setShowNotification(false);
  };

  // If no unvoted polls or user not logged in, don't render anything
  if (!user || unvotedPolls.length === 0) {
    return null;
  }

  const currentPoll = unvotedPolls[currentPollIndex];

  const handleSubmitVote = async () => {
    if (!selected || !user || !currentPoll) return;

    setSubmitting(true);
    setError('');

    try {
      // Call the voteOnPoll function from firestore
      await voteOnPoll(currentPoll.id, user.apartment || '', selected);

      setShowVoteDialog(false);

      // Track that user has been notified about this poll
      markPollsAsNotified([currentPoll.id]);

      // Listener will handle updating the state and showing next notification if any
    } catch (error) {
      logger.error('Error voting on poll:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Community Poll</DialogTitle>
            <DialogDescription>
              Your input is valuable! Please participate in the community poll.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-medium">{currentPoll?.question}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {unvotedPolls.length > 1
                ? `You have ${unvotedPolls.length} unvoted polls`
                : 'Please take a moment to vote'}
            </p>
          </div>
          <DialogFooter className="flex flex-row gap-2 sm:justify-start">
            <Button onClick={handleVoteNow}>Vote Now</Button>
            <Button variant="outline" onClick={handleViewAllPolls}>
              View All Polls
            </Button>
            <Button variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        {currentPoll && user && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentPoll.question}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup
                value={selected}
                onValueChange={setSelected}
                disabled={submitting}
                className="space-y-3"
              >
                {currentPoll.options.map(opt => (
                  <div
                    key={opt.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={opt.id} id={opt.id} className="text-lg" />
                    <Label htmlFor={opt.id} className="cursor-pointer text-base flex-1 py-1">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {error && (
                <p className="text-sm text-destructive mt-3 p-2 bg-destructive/10 rounded">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSubmitVote} disabled={!selected || submitting}>
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
              <Button variant="outline" onClick={() => setShowVoteDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
