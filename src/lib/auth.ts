import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import * as React from 'react';

import { cookies } from 'next/headers';

import { app } from './firebase';
import { getFirebaseAdminApp } from './firebase-admin';
import { getUserByEmail } from './firestore';
import type { User } from './types';

export const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser && firebaseUser.email) {
        const firestoreUser = await getUserByEmail(firebaseUser.email);
        setUser(firestoreUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// Helper function for basic authentication
export async function basicAuth(): Promise<{ user?: User; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized - Authentication required' };
    }

    const adminApp = getFirebaseAdminApp();
    const decodedToken = await getAdminAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getUserByEmail(decodedToken.email!);

    if (!user) {
      return { error: 'User not found' };
    }

    return { user };
  } catch (error) {
    console.error('Basic auth verification error:', error);
    return { error: 'Invalid session' };
  }
}

// Helper function for admin authentication
export async function adminAuth(): Promise<{ user?: User; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized - Admin access required' };
    }

    const adminApp = getFirebaseAdminApp();
    const decodedToken = await getAdminAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getUserByEmail(decodedToken.email!);

    if (!user) {
      return { error: 'User not found' };
    }

    if (user.role !== 'admin') {
      return { error: 'Admin access required' };
    }

    return { user };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return { error: 'Invalid session or admin access required' };
  }
}
