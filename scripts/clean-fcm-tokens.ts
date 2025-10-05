import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

import { getFirebaseAdminApp } from '../src/lib/firebase-admin.ts';

async function cleanInvalidTokens() {
  console.log('Cleaning invalid FCM tokens...');

  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);
  const messaging = getMessaging(adminApp);

  const usersSnapshot = await db.collection('users').where('fcmToken', '!=', null).get();

  let cleaned = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const token = userData.fcmToken;

    try {
      await messaging.send(
        {
          token,
          notification: {
            title: 'Dry Run Validation',
            body: 'This is a dry run to validate the token',
          },
        },
        true
      );
    } catch (error: any) {
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        await doc.ref.update({ fcmToken: null });
        cleaned++;
        console.log(`Removed invalid token for user ${doc.id} (${userData.name || 'unknown'})`);
      } else {
        console.log(`Error validating token for user ${doc.id}: ${error.message}`);
      }
    }
  }

  console.log(`Cleaned ${cleaned} invalid tokens.`);
}

cleanInvalidTokens().catch(console.error);
