'use client';

import { Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';

interface DeletePollDialogProps {
  poll: Poll;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeletePollDialog({ poll, onDelete, isDeleting }: DeletePollDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center"
          disabled={isDeleting}
          aria-label="Delete poll"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Poll</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{poll.question}&rdquo;? This action cannot be
            undone and will permanently delete all votes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(poll.id)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
