import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { sendPushNotificationToApartments, testFCMConfiguration } from '@/lib/fcm-admin';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getUserByEmail } from '@/lib/firestore';

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const { testType = 'config', apartmentIds } = await request.json();

    if (testType === 'config') {
      // Test FCM configuration
      const configResult = await testFCMConfiguration();

      return NextResponse.json({
        success: true,
        testType: 'configuration',
        result: configResult,
        message: configResult.configured
          ? 'FCM is properly configured'
          : 'FCM configuration issues found',
      });
    }

    if (testType === 'send') {
      // Send test notification
      const targetApartments = apartmentIds || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

      const fcmResult = await sendPushNotificationToApartments(targetApartments, {
        title: 'FCM Test Notification',
        body: 'This is a test push notification to verify FCM delivery is working.',
        icon: '/icon-192x192.png',
        clickAction: '/',
        data: {
          type: 'test',
          testId: `test-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: fcmResult.success,
        testType: 'send',
        result: fcmResult,
        message: fcmResult.success
          ? `Successfully sent to ${fcmResult.successfulDeliveries}/${fcmResult.totalTokens} users`
          : 'Failed to send test notifications',
      });
    }

    return NextResponse.json(
      { error: 'Invalid test type. Use "config" or "send"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in FCM test:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FCM Test API',
    usage: {
      POST: {
        body: {
          testType: '"config" | "send"',
          apartmentIds: 'string[] (optional, defaults to all apartments)',
        },
        description: 'Test FCM configuration or send test notifications',
      },
    },
  });
}
