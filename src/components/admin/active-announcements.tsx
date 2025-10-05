'use client';

import * as React from 'react';

import { deleteAnnouncement, listenToActiveAnnouncements } from '@/lib/firestore';
import { Notification } from '@/lib/types';

import { AnnouncementCard } from './announcement-card';
import { AnnouncementsEmpty } from './announcements-empty';
import { AnnouncementsLoading } from './announcements-loading';

export function ActiveAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = listenToActiveAnnouncements(announcements => {
      setAnnouncements(announcements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteAnnouncement = async (announcementId: string) => {
    setDeletingId(announcementId);
    try {
      await deleteAnnouncement(announcementId);
    } catch (error) {
      console.error('Error deleting announcement:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <AnnouncementsLoading />;
  }

  if (announcements.length === 0) {
    return <AnnouncementsEmpty />;
  }

  return (
    <div className="space-y-4">
      {announcements.map(announcement => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onDelete={handleDeleteAnnouncement}
          isDeleting={deletingId === announcement.id}
        />
      ))}
    </div>
  );
}
