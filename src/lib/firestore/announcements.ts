import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import type { AnnouncementNotification } from '../core/types';
import { db } from '../firebase/firebase';



export const listenToActiveAnnouncements = (
  callback: (announcements: AnnouncementNotification[]) => void
) => {
  const notificationsCol = collection(db, 'notifications');
  const q = query(
    notificationsCol,
    where('type', '==', 'announcement'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const announcements = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() }) as AnnouncementNotification
    );
    callback(announcements);
  });
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  const announcementDoc = doc(db, 'notifications', announcementId);
  await deleteDoc(announcementDoc);
};
