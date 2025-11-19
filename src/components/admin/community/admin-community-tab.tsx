import { PlusCircle } from 'lucide-react';

import type { PollOption } from '@/lib/types';

import { AddPollDialog } from '@/components/dialogs/add-poll-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ActiveAnnouncements } from './active-announcements';
import { ActivePolls } from './active-polls';
import { AddAnnouncementDialog } from './add-announcement-dialog';

interface AdminCommunityTabProps {
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
}

export function AdminCommunityTab({ onAddPoll }: AdminCommunityTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Announcement Management</CardTitle>
              <CardDescription>Send announcements to all users instantly.</CardDescription>
            </div>
            <AddAnnouncementDialog>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Announcement
              </Button>
            </AddAnnouncementDialog>
          </div>
        </CardHeader>
        <CardContent>
          <ActiveAnnouncements />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Poll Management</CardTitle>
              <CardDescription>Create and manage polls for the community.</CardDescription>
            </div>
            <AddPollDialog onAddPoll={onAddPoll} />
          </div>
        </CardHeader>
        <CardContent>
          <ActivePolls />
        </CardContent>
      </Card>
    </div>
  );
}
