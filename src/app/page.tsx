import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { shouldClearSession } from '@/lib/auth-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getUserByEmail } from '@/lib/firestore';
import log from '@/lib/logger';

// Server-side function to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies(); // Await the cookies() function
  const sessionCookie = cookieStore.get('session')?.value;
  const userRoleCookie = cookieStore.get('user-role')?.value; // Used for dev fallback

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminApp = getFirebaseAdminApp();
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getUserByEmail(decodedToken.email || '');
    if (!user) {
      return null;
    }
    return user;
  } catch (error: unknown) {
    log.error('? Server-side session verification failed:', error);
    // Do not attempt to mutate cookies here: Next.js disallows cookie mutations
    // from Server Components (they must be done in a Route Handler or Server Action).
    // Instead, if the session should be cleared, return null so the page will
    // redirect to the login page and the client can clear cookies as needed.
    if (shouldClearSession(error)) {
      log.warn('Session invalid or expired; redirecting to login without mutating cookies.');
      return null;
    }
    // Development fallback: if session verification fails but a user-role cookie exists (from dev mode)
    if (process.env.NODE_ENV === 'development' && userRoleCookie) {
      log.warn('Using development fallback for server-side authentication.');
      return {
        id: 'dev-user',
        name: 'Development User',
        email: 'dev@example.com',
        role: userRoleCookie as 'admin' | 'user',
        apartment: 'dev-apartment',
      };
    }
    return null;
  }
}

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  // This component will not render anything as it always redirects
  return null;
}
