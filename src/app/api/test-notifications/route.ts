import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';
import { getUserByEmail } from '@/lib/firestore/users';

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function POST() {
  try {
    // Get session cookie from request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and get user
    let decodedToken;
    try {
      decodedToken = await verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserByEmail(decodedToken.email!);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get admin Firestore instance
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all users and their apartments
    const usersSnapshot = await adminDb.collection('users').get();
    const apartments = new Set<string>();
    const userDetails: Array<{
      id: string;
      name: string;
      apartment: string;
      role: string;
      isApproved: boolean;
    }> = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      userDetails.push({
        id: doc.id,
        name: userData.name,
        apartment: userData.apartment,
        role: userData.role,
        isApproved: userData.isApproved,
      });

      if (userData.apartment) {
        apartments.add(userData.apartment);
      }
    });

    const apartmentsList = Array.from(apartments);

    // Create a single test announcement notification with all apartments
    const notificationData: {
      type: string;
      title: string;
      message: string;
      toApartmentId: string[];
      createdBy: string;
      priority: string;
      isRead: { [key: string]: boolean };
      createdAt: string;
      isActive: boolean;
    } = {
      type: 'announcement',
      title: 'Test Announcement (Array Structure)',
      message: 'This is a test announcement using the new array structure for toApartmentId.',
      toApartmentId: apartmentsList, // Array of all apartment IDs
      createdBy: user.id,
      priority: 'medium',
      isRead: {}, // Object to track read status per apartment
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Initialize isRead object with all apartments set to false
    apartmentsList.forEach(apartmentId => {
      notificationData.isRead[apartmentId] = false;
    });

    const result = await adminDb.collection('notifications').add(notificationData);
    const testNotifications = [{ notificationId: result.id, apartmentsIncluded: apartmentsList }];

    const results = await Promise.all(testNotifications);

    return NextResponse.json({
      success: true,
      message: 'Test notifications created successfully',
      userDetails,
      apartments: Array.from(apartments),
      notificationsCreated: results,
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
