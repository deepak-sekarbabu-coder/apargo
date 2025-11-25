import { getFirestore } from 'firebase-admin/firestore';

import { NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getApartmentIds } from '@/lib/core/apartment-constants';
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';

const logger = getLogger('API');

interface NotificationData {
  type: string;
  title: string;
  message: string;
  toApartmentId: string[];
  createdBy: string;
  priority: string;
  isRead: Record<string, boolean>;
  createdAt: string;
  expiresAt: null;
  isActive: boolean;
}

export async function POST() {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Create a test notification that targets ALL possible apartments
    const allApartments = getApartmentIds();

    const notificationData: NotificationData = {
      type: 'announcement',
      title: 'TEST: Notification Fix Verification',
      message:
        'This is a test notification to verify the fix is working. If you can see this, the notification system is working correctly!',
      toApartmentId: allApartments, // Target ALL apartments
      createdBy: 'system-test',
      priority: 'high',
      isRead: {} as Record<string, boolean>, // Object to track read status per apartment
      createdAt: new Date().toISOString(),
      expiresAt: null,
      isActive: true,
    };

    // Initialize isRead object with all apartments set to false
    allApartments.forEach(apartmentId => {
      (notificationData.isRead as Record<string, boolean>)[apartmentId] = false;
    });

    const result = await adminDb.collection('notifications').add(notificationData);

    return NextResponse.json({
      success: true,
      notificationId: result.id,
      message: 'Test notification created successfully',
      targetApartments: allApartments,
      apartmentCount: allApartments.length,
    });
  } catch (error) {
    logger.error('Error creating test notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
