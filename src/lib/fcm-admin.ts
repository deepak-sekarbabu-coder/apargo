import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

import { getFirebaseAdminApp } from './firebase-admin';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  clickAction?: string;
  data?: Record<string, string>;
}

export interface SendNotificationResult {
  success: boolean;
  totalTokens: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  failedTokens: string[];
  errors: string[];
}

/**
 * Send push notifications to multiple users by their apartment IDs
 */
export async function sendPushNotificationToApartments(
  apartmentIds: string[],
  notification: FCMNotificationPayload
): Promise<SendNotificationResult> {
  const result: SendNotificationResult = {
    success: false,
    totalTokens: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    failedTokens: [],
    errors: [],
  };

  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);
    const messaging = getMessaging(adminApp);

    // Get all users with FCM tokens in the specified apartments
    const usersSnapshot = await adminDb.collection('users').get();
    const fcmTokens: string[] = [];
    const tokenToUserMap = new Map<string, { id: string; name: string; apartment: string }>();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.apartment && apartmentIds.includes(userData.apartment) && userData.fcmToken) {
        fcmTokens.push(userData.fcmToken);
        tokenToUserMap.set(userData.fcmToken, {
          id: doc.id,
          name: userData.name,
          apartment: userData.apartment,
        });
      }
    });

    result.totalTokens = fcmTokens.length;

    if (fcmTokens.length === 0) {
      result.errors.push('No FCM tokens found for specified apartments');
      console.warn('No FCM tokens found for apartments:', apartmentIds);
      return result;
    }

    // Prepare the FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        clickAction: notification.clickAction || '/',
        type: 'announcement',
        icon: notification.icon || '/icon-192x192.png',
      },
      tokens: fcmTokens,
    };

    // Send the multicast message
    const response = await messaging.sendEachForMulticast(message);

    result.successfulDeliveries = response.successCount;
    result.failedDeliveries = response.failureCount;

    // Process failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const failedToken = fcmTokens[idx];
          result.failedTokens.push(failedToken);

          const user = tokenToUserMap.get(failedToken);
          const errorCode = resp.error?.code || 'unknown';
          const errorMessage = resp.error?.message || 'Unknown error';

          console.error(
            `FCM delivery failed for user ${user?.name} (${user?.apartment}): ${errorCode} - ${errorMessage}`
          );
          result.errors.push(`Failed for ${user?.name}: ${errorCode}`);

          // Handle invalid tokens by removing them from user records
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            // Remove invalid token from user's record
            adminDb
              .collection('users')
              .doc(user?.id || '')
              .update({
                fcmToken: null,
              })
              .catch(err => {
                console.error('Error removing invalid FCM token:', err);
              });
          }
        }
      });
    }

    result.success = result.successfulDeliveries > 0;

    return result;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Send push notification to a specific user by user ID
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: FCMNotificationPayload
): Promise<SendNotificationResult> {
  const result: SendNotificationResult = {
    success: false,
    totalTokens: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    failedTokens: [],
    errors: [],
  };

  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);
    const messaging = getMessaging(adminApp);

    // Get user's FCM token
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      result.errors.push('User not found');
      return result;
    }

    const userData = userDoc.data();
    if (!userData?.fcmToken) {
      result.errors.push('User has no FCM token');
      return result;
    }

    result.totalTokens = 1;

    // Prepare the FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        clickAction: notification.clickAction || '/',
        type: 'announcement',
        icon: notification.icon || '/icon-192x192.png',
      },
      token: userData.fcmToken,
    };

    // Send the message
    await messaging.send(message);

    result.successfulDeliveries = 1;
    result.success = true;

    return result;
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    result.failedDeliveries = 1;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');

    // Handle invalid token errors
    if (
      error instanceof Error &&
      (error.message.includes('registration-token-not-registered') ||
        error.message.includes('invalid-registration-token'))
    ) {
      // Remove invalid token from user's record
      const adminApp = getFirebaseAdminApp();
      const adminDb = getFirestore(adminApp);
      adminDb
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: null,
        })
        .catch(err => {
          console.error('Error removing invalid FCM token:', err);
        });
    }

    return result;
  }
}

/**
 * Test FCM configuration by sending a test notification
 */
export async function testFCMConfiguration(): Promise<{
  configured: boolean;
  errors: string[];
  userTokenCount: number;
}> {
  const result = {
    configured: false,
    errors: [] as string[],
    userTokenCount: 0,
  };

  try {
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);
    const messaging = getMessaging(adminApp);

    // Check if messaging is available
    if (!messaging) {
      result.errors.push('Firebase Admin Messaging not available');
      return result;
    }

    // Count users with FCM tokens
    const usersSnapshot = await adminDb.collection('users').get();
    let tokenCount = 0;

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokenCount++;
      }
    });

    result.userTokenCount = tokenCount;
    result.configured = true;

    if (tokenCount === 0) {
      result.errors.push('No users have FCM tokens registered');
    }

    return result;
  } catch (error) {
    console.error('Error testing FCM configuration:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}
