import { getFirestore } from 'firebase-admin/firestore';

import { NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';

interface UserData {
  id: string;
  name: string;
  email: string;
  apartment: string;
  role: string;
  propertyRole: string;
}

interface ApartmentData {
  id: string;
  apartmentId: string;
  name: string;
}

interface NotificationData {
  id: string;
  title: string;
  type: string;
  toApartmentId: string | string[];
  toApartmentIdType: string;
  apartmentCount: number;
  isRead: boolean | Record<string, boolean>;
  createdAt: string;
  isActive: boolean;
}

export async function GET() {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all users with their apartment assignments
    const usersSnapshot = await adminDb.collection('users').get();
    const users: UserData[] = [];
    const apartmentIds = new Set<string>();

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
      if (userData.apartment) {
        apartmentIds.add(userData.apartment);
      }
    });

    // Get all apartments (should be 7)
    const apartmentsSnapshot = await adminDb.collection('apartments').get();
    const apartments: ApartmentData[] = [];
    apartmentsSnapshot.forEach(doc => {
      const data = doc.data();
      apartments.push({
        id: doc.id,
        apartmentId: data.id,
        name: data.name,
      });
    });

    // Get recent notifications
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const notifications: NotificationData[] = [];
    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        toApartmentId: data.toApartmentId,
        toApartmentIdType: Array.isArray(data.toApartmentId) ? 'array' : typeof data.toApartmentId,
        apartmentCount: Array.isArray(data.toApartmentId) ? data.toApartmentId.length : 1,
        isRead: data.isRead,
        createdAt: data.createdAt,
        isActive: data.isActive,
      });
    });

    return NextResponse.json({
      success: true,
      debug: {
        totalUsers: users.length,
        usersWithApartments: users.filter(u => u.apartment).length,
        uniqueApartmentIds: Array.from(apartmentIds),
        apartmentIdCount: apartmentIds.size,
        totalApartments: apartments.length,
        recentNotifications: notifications.length,
      },
      users,
      apartments,
      notifications,
      apartmentIds: Array.from(apartmentIds),
    });
  } catch (error) {
    console.error('Error in notification debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
