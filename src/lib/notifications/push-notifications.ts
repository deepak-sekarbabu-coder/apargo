import { getMessaging, getToken } from 'firebase/messaging';

import { firebaseApp } from '../firebase/firebase-client';
import { updateUser } from '../firestore/users';

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      return registration;
    } catch (err) {
      throw err;
    }
  }
  return null;
};

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined') return;

  const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  // Ensure you have a valid VAPID key before proceeding.
  if (!VAPID_KEY || VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
    console.warn(
      'VAPID key not set. Push notifications will not work. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in your environment variables.'
    );
    return;
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration || !firebaseApp) {
      return;
    }
    const messaging = getMessaging(firebaseApp);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        // Save the token to Firestore
        await updateUser(userId, { fcmToken: currentToken });
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};
