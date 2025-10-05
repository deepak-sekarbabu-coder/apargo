'use client';

import { Trash2 } from 'lucide-react';

import { Notification } from '@/lib/types';

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

interface DeleteAnnouncementDialogProps {
  announcement: Notification;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteAnnouncementDialog({
  announcement,
  onDelete,
  isDeleting,
}: DeleteAnnouncementDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center"
          disabled={isDeleting}
          aria-label="Delete announcement"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{announcement.title}&rdquo;? This action cannot
            be undone and will remove the announcement from all users&apos; notifications.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(announcement.id)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
