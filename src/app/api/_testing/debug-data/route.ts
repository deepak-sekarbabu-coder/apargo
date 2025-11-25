import { getFirestore } from 'firebase-admin/firestore';

import { NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';

const logger = getLogger('API:DebugData');

interface UserData {
  id: string;
  name: string;
  email: string;
  apartment: string;
  role: string;
  propertyRole: string;
}

interface NotificationData {
  id: string;
  title: string;
  type: string;
  toApartmentId: string | string[];
  toApartmentIdType: string;
  isRead: boolean | Record<string, boolean>;
  isReadType: string;
  createdAt: string;
  isActive: boolean;
  createdBy: string;
}

export async function GET() {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all users to see their apartment assignments
    const usersSnapshot = await adminDb.collection('users').get();
    const users: UserData[] = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        apartment: userData.apartment,
        role: userData.role,
        propertyRole: userData.propertyRole,
      });
    });

    // Get all notifications
    const notificationsSnapshot = await adminDb.collection('notifications').get();
    const notifications: NotificationData[] = [];

    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        toApartmentId: data.toApartmentId,
        toApartmentIdType: Array.isArray(data.toApartmentId) ? 'array' : typeof data.toApartmentId,
        isRead: data.isRead,
        isReadType: typeof data.isRead,
        createdAt: data.createdAt,
        isActive: data.isActive,
        createdBy: data.createdBy,
      });
    });

    return NextResponse.json({
      success: true,
      users,
      notifications,
      userCount: users.length,
      notificationCount: notifications.length,
    });
  } catch (error) {
    logger.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
