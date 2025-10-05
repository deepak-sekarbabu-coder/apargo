'use client';

import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';

import { Notification } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { getPriorityColor, getPriorityIconColor } from './announcement-utils';
import { DeleteAnnouncementDialog } from './delete-announcement-dialog';

interface AnnouncementCardProps {
  announcement: Notification;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function AnnouncementCard({ announcement, onDelete, isDeleting }: AnnouncementCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Megaphone
              className={`h-4 w-4 ${getPriorityIconColor(announcement.priority)} flex-shrink-0 mt-1`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-lg break-words">{announcement.title}</CardTitle>
                <Badge className={getPriorityColor(announcement.priority)}>
                  {announcement.priority || 'medium'}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Created {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                {announcement.expiresAt && (
                  <span className="ml-2 block sm:inline">
                    • Expires {format(new Date(announcement.expiresAt), 'MMM d, yyyy')}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="sm:ml-2 flex-shrink-0">
            <DeleteAnnouncementDialog
              announcement={announcement}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{announcement.message}</p>
        {Array.isArray(announcement.toApartmentId) && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Sent to {announcement.toApartmentId.length} apartment
              {announcement.toApartmentId.length !== 1 ? 's' : ''}
              {announcement.toApartmentId.length <= 10 && (
                <>: {announcement.toApartmentId.join(', ')}</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
