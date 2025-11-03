import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { shouldClearSession } from '@/lib/auth-utils';
import log from '@/lib/logger';

// Force dynamic rendering to avoid static generation issues with Firebase Admin
export const dynamic = 'force-dynamic';

// Server-side function to get authenticated user
async function getAuthenticatedUser() {
  // Skip Firebase operations during build time
  const isBuildTime =
    process.env.NODE_ENV === 'production' && !process.env.NETLIFY && !process.env.VERCEL;
  const isStaticGeneration = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime || isStaticGeneration) {
    // During build, don't attempt Firebase operations
    return null;
  }

  const cookieStore = await cookies(); // Await the cookies() function
  const sessionCookie = cookieStore.get('session')?.value;
  const userRoleCookie = cookieStore.get('user-role')?.value; // Used for dev fallback

  if (!sessionCookie) {
    return null;
  }

  try {
    // Dynamic imports to avoid top-level Firebase Admin imports
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirebaseAdminApp } = await import('@/lib/firebase-admin');
    const { getUserByEmail } = await import('@/lib/firestore/users');

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
