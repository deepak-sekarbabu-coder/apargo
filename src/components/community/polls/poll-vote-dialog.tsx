import * as React from 'react';

import { Poll } from '@/lib/core/types';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PollVoteDialogProps {
  children?: React.ReactNode;
  poll: Poll;
  apartmentId: string;
  onVote: (optionId: string) => Promise<void>;
  hasVoted: boolean;
  votedOptionId?: string;
  disabled?: boolean;
  user?: import('@/lib/types').User | null;
  onDeletePoll?: (pollId: string) => Promise<void>;
}

export function PollVoteDialog({
  children,
  poll,
  onVote,
  hasVoted,
  votedOptionId,
  disabled,
  user,
  onDeletePoll,
}: PollVoteDialogProps) {
  const [selected, setSelected] = React.useState<string>(votedOptionId || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleVote = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await onVote(selected);
    } catch (e) {
      setError((e as Error).message || 'Vote failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" disabled={hasVoted || disabled}>
            {hasVoted ? 'Voted' : 'Vote'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{poll.question}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup
            value={selected}
            onValueChange={setSelected}
            disabled={hasVoted || disabled}
            className="space-y-3"
          >
            {poll.options.map(opt => (
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
            <p className="text-sm text-destructive mt-3 p-2 bg-destructive/10 rounded">{error}</p>
          )}
        </div>
        <div className="space-y-4 pt-4">
          {/* Primary voting actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              onClick={handleVote}
              disabled={!selected || hasVoted || submitting || disabled}
              className="w-full sm:flex-1 h-11 text-base font-medium"
              size="lg"
            >
              Submit Vote
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto h-11 text-base" size="lg">
                Cancel
              </Button>
            </DialogClose>
          </div>

          {/* Admin destructive action - separated and less prominent */}
          {onDeletePoll && user && (user.id === poll.createdBy || user.role === 'incharge') && (
            <div className="pt-2 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                    disabled={submitting}
                  >
                    Delete Poll
                  </Button>
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
                        if (onDeletePoll) {
                          await onDeletePoll(poll.id);
                        }
                      }}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Poll
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
