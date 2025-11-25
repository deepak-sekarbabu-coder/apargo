import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getApartmentIds } from '@/lib/core/apartment-constants';
import type { User } from '@/lib/core/types';
import {
  getFirebaseAdminApp,
  getInitializationError,
  isFirebaseAdminAvailable,
} from '@/lib/firebase/firebase-admin';
import { sendPushNotificationToApartments } from '@/lib/notifications/fcm-admin';

const logger = getLogger('API');

// Add a simple GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Announcements API is working',
    timestamp: new Date().toISOString(),
  });
}

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    logger.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  logger.debug('Announcement API called');

  try {
    // Get session cookie from request
    let sessionCookie: string | undefined;

    try {
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get('session')?.value;
    } catch (cookieError) {
      logger.debug('Error accessing cookies:', cookieError);
      // Fallback: try to get from headers
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const sessionMatch = cookieHeader.match(/session=([^;]+)/);
        sessionCookie = sessionMatch?.[1];
      }
    }

    logger.debug('Session cookie present:', !!sessionCookie);

    if (!sessionCookie) {
      logger.debug('No session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure Firebase Admin is initialized before any admin-only operation
    if (!isFirebaseAdminAvailable()) {
      const initErr = getInitializationError();
      logger.error('Firebase Admin not initialized:', initErr);
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: initErr || 'Firebase Admin not initialized',
        },
        { status: 500 }
      );
    }

    // Verify session and get user
    let decodedToken;
    try {
      decodedToken = await verifySessionCookie(sessionCookie);
      logger.debug('Session verified for user:', decodedToken.email);
    } catch (error) {
      logger.debug('Session verification failed:', error);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get admin Firestore instance
    let adminApp, adminDb;
    try {
      adminApp = getFirebaseAdminApp();
      adminDb = getFirestore(adminApp);
      logger.debug('Firebase Admin initialized');
    } catch (error) {
      logger.debug('Firebase Admin initialization failed:', error);
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', decodedToken.email!).get();

    if (userQuery.empty) {
      logger.debug('User not found in Firestore');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    logger.debug('User found:', !!user, 'Role:', user?.role);

    if (!user || user.role !== 'admin') {
      logger.debug('Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      logger.debug('Request data parsed:', {
        title: requestData.title,
        messageLength: requestData.message?.length,
        priority: requestData.priority,
      });
    } catch (error) {
      logger.debug('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, message, expiresAt, priority = 'medium' } = requestData;

    if (!title || !message) {
      logger.debug('Missing required fields:', { title: !!title, message: !!message });
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Get all apartments to include in the announcement
    // First try to get apartments from users collection
    const usersSnapshot = await adminDb.collection('users').get();
    const apartmentsFromUsers = new Set<string>();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.apartment) {
        apartmentsFromUsers.add(userData.apartment);
      }
    });

    // Also get apartments from the apartments collection as fallback
    const apartmentsSnapshot = await adminDb.collection('apartments').get();
    const apartmentsFromCollection = new Set<string>();

    apartmentsSnapshot.forEach(doc => {
      const apartmentData = doc.data();
      if (apartmentData.id) {
        apartmentsFromCollection.add(apartmentData.id);
      }
    });

    // Use the union of both sets to ensure we cover all apartments
    const allApartments = new Set([...apartmentsFromUsers, ...apartmentsFromCollection]);

    // If no apartments from either source, use all available apartments
    if (allApartments.size === 0) {
      getApartmentIds().forEach(id => allApartments.add(id));
    }

    const apartmentsList = Array.from(allApartments);

    if (apartmentsList.length === 0) {
      return NextResponse.json(
        { error: 'No apartments found to send announcements to' },
        { status: 400 }
      );
    }

    // Create a single announcement notification with all apartments in toApartmentId array
    const notificationData: {
      type: string;
      title: string;
      message: string;
      toApartmentId: string[];
      createdBy: string;
      priority: string;
      isRead: { [key: string]: boolean };
      createdAt: string;
      expiresAt: string | null;
      isActive: boolean;
    } = {
      type: 'announcement',
      title,
      message,
      toApartmentId: apartmentsList, // Array of all apartment IDs
      createdBy: user.id,
      priority,
      isRead: {}, // Object to track read status per apartment
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      isActive: true,
    };

    // Initialize isRead object with all apartments set to false
    apartmentsList.forEach(apartmentId => {
      notificationData.isRead[apartmentId] = false;
    });

    let notificationResult;
    try {
      notificationResult = await adminDb.collection('notifications').add(notificationData);
    } catch (err) {
      logger.error('Failed to write announcement to Firestore:', err);
      return NextResponse.json({ error: 'Failed to persist announcement' }, { status: 500 });
    }

    // Send push notifications to all apartments (non-fatal if FCM fails)
    let fcmResult = {
      totalTokens: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      errors: [] as unknown[],
    };

    try {
      fcmResult = await sendPushNotificationToApartments(apartmentsList, {
        title,
        body: message,
        icon: '/icon-192x192.png',
        clickAction: '/',
        data: {
          notificationId: notificationResult.id,
          type: 'announcement',
          priority,
        },
      });
    } catch (err) {
      logger.error('FCM push failed for announcement:', err);
      // Continue — we already wrote the notification; report FCM failure in response
      fcmResult.errors.push({ message: String(err) });
    }

    return NextResponse.json({
      success: true,
      announcementId: notificationResult.id,
      notificationId: notificationResult.id,
      notificationIds: [notificationResult.id], // For backward compatibility with test files
      apartmentsNotified: apartmentsList,
      totalApartments: apartmentsList.length,
      notificationsCreated: 1, // We create one notification with all apartments
      pushNotificationResult: {
        totalTokens: fcmResult.totalTokens,
        successfulDeliveries: fcmResult.successfulDeliveries,
        failedDeliveries: fcmResult.failedDeliveries,
        fcmErrors: fcmResult.errors,
      },
    });
  } catch (error) {
    logger.error('Error creating announcement:', error);
    logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Ensure we always return JSON, never HTML
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
