import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  getAuthErrorMessage,
  isAuthUserNotFoundError,
  isInvalidTokenError,
} from '@/lib/auth/auth-utils';
import { getLogger } from '@/lib/core/logger';
import { firebaseManager } from '@/lib/firebase/firebase-connection-manager';
import { withLogging } from '@/lib/middleware/request-logger';

const logger = getLogger('API');

async function createSession(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json(
        { status: 'error', message: 'idToken is required' },
        { status: 400 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      const adminApp = firebaseManager.getApp();

      // First verify the idToken is valid
      await getAuth(adminApp).verifyIdToken(idToken);

      const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });

      const cookieStore = await cookies();
      cookieStore.set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return NextResponse.json({ status: 'success' });
    } catch (adminError: unknown) {
      logger.error('Firebase Admin SDK Error:', adminError);
      logger.error('Error code:', (adminError as { code?: string })?.code);

      // Handle specific authentication errors
      if (isAuthUserNotFoundError(adminError) || isInvalidTokenError(adminError)) {
        return NextResponse.json(
          {
            status: 'error',
            message: getAuthErrorMessage(adminError),
          },
          { status: 401 }
        );
      }

      // Fallback: Set a simple cookie with the idToken for development
      // This is NOT secure for production but allows development to continue
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using development fallback for session cookie');
        const cookieStore = await cookies();
        cookieStore.set('session', idToken, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        });

        // Also set a simple user-role cookie for the dashboard
        cookieStore.set('user-role', 'user', {
          maxAge: expiresIn,
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
        });

        return NextResponse.json({ status: 'success', message: 'Development session created' });
      }

      throw adminError;
    }
  } catch (error: unknown) {
    logger.error('SESSION_CREATION_ERROR:', error);
    // Ensure a helpful message is returned, including the error code if available
    const err = error as { code?: string; message?: string };
    const errorMessage = err.code
      ? `(${err.code}) ${err.message}`
      : err.message || 'Failed to create session.';
    return NextResponse.json({ status: 'error', message: errorMessage }, { status: 401 });
  }
}

export const POST = withLogging(createSession);

async function deleteSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('user-role'); // Also delete the user-role cookie
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Session cookie deletion failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete session.' },
      { status: 500 }
    );
  }
}

export const DELETE = withLogging(deleteSession);
