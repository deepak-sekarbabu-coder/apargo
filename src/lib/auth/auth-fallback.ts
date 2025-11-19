// Fallback authentication for when session cookies fail
import { User as FirebaseUser } from 'firebase/auth';

import { auth } from './firebase';
import { getUserByEmail } from './firestore/users';
import type { User } from './types';

export async function getCurrentUserFallback(): Promise<User | null> {
  return new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      unsubscribe(); // Clean up listener

      if (firebaseUser && firebaseUser.email) {
        try {
          const appUser = await getUserByEmail(firebaseUser.email);
          resolve(appUser);
        } catch (error) {
          console.error('Fallback auth error:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

export function isAuthenticatedFallback(): Promise<boolean> {
  return new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      unsubscribe();
      resolve(!!firebaseUser);
    });
  });
}
