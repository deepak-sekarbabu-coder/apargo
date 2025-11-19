'use client';

import { Megaphone, Plus } from 'lucide-react';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { AnnouncementForm } from './announcement-form';
import { FormMessages } from './form-messages';
import { useAnnouncementForm } from './use-announcement-form';

interface AddAnnouncementDialogProps {
  children?: React.ReactNode;
  onAnnouncementCreated?: () => void;
}

export function AddAnnouncementDialog({
  children,
  onAnnouncementCreated,
}: AddAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    title,
    setTitle,
    message,
    setMessage,
    priority,
    setPriority,
    expiryDate,
    setExpiryDate,
    loading,
    error,
    success,
    handleSubmit,
    resetForm,
  } = useAnnouncementForm(() => {
    onAnnouncementCreated?.();
    // Close dialog after success
    setTimeout(() => {
      setOpen(false);
    }, 2000);
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Megaphone className="h-5 w-5" />
            Create Announcement
          </DialogTitle>
          <DialogDescription className="text-base">
            Send an announcement to all users. It will appear as a notification.
          </DialogDescription>
        </DialogHeader>

        <FormMessages error={error} success={success} />

        <AnnouncementForm
          title={title}
          setTitle={setTitle}
          message={message}
          setMessage={setMessage}
          priority={priority}
          setPriority={setPriority}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
