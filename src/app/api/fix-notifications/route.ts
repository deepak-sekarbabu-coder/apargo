import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getApartmentIds } from '@/lib/apartment-constants';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getUserByEmail } from '@/lib/firestore';

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
  isRead: boolean | Record<string, boolean>;
  createdAt: string;
  isActive: boolean;
}

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get current user if authenticated
    let currentUser = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value;

      if (sessionCookie) {
        const decodedToken = await verifySessionCookie(sessionCookie);
        currentUser = await getUserByEmail(decodedToken.email!);
      }
    } catch (error) {
      console.log('No authenticated user or error getting user:', error);
    }

    // Get all users and their apartment assignments
    const usersSnapshot = await adminDb.collection('users').get();
    const users: UserData[] = [];
    const apartmentsInUse = new Set<string>();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const user = {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        apartment: userData.apartment,
        role: userData.role,
        propertyRole: userData.propertyRole,
      };
      users.push(user);
      if (userData.apartment) {
        apartmentsInUse.add(userData.apartment);
      }
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
        isRead: data.isRead,
        createdAt: data.createdAt,
        isActive: data.isActive,
      });
    });

    const expectedApartments = getApartmentIds();

    return NextResponse.json({
      success: true,
      currentUser,
      currentUserApartment: currentUser?.apartment || null,
      currentUserIssue: !currentUser?.apartment ? 'NO_APARTMENT_ASSIGNED' : null,
      debug: {
        totalUsers: users.length,
        usersWithApartments: users.filter(u => u.apartment).length,
        usersWithoutApartments: users.filter(u => !u.apartment),
        apartmentsInUse: Array.from(apartmentsInUse).sort(),
        expectedApartments,
        missingApartments: expectedApartments.filter(apt => !apartmentsInUse.has(apt)),
        recentNotificationCount: notifications.length,
      },
      users,
      notifications,
      recommendations: {
        ...(!currentUser?.apartment && {
          fixCurrentUser: 'Current user needs apartment assignment',
        }),
        ...(users.filter(u => !u.apartment).length > 0 && {
          fixUsersWithoutApartments: `${users.filter(u => !u.apartment).length} users need apartment assignments`,
        }),
        ...(notifications.length > 0 && {
          checkNotificationTargeting: 'Review if notifications target all apartments',
        }),
      },
    });
  } catch (error) {
    console.error('Error in fix-notifications endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId, apartment } = await request.json();

    if (action === 'assignApartment' && userId && apartment) {
      const adminApp = getFirebaseAdminApp();
      const adminDb = getFirestore(adminApp);

      await adminDb.collection('users').doc(userId).update({
        apartment: apartment,
        propertyRole: 'tenant', // Default if not set
      });

      return NextResponse.json({
        success: true,
        message: `Assigned apartment ${apartment} to user ${userId}`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in fix-notifications POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
