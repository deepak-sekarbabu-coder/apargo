// Utility functions for authentication error handling

export interface AuthError {
  code?: string;
  message: string;
}

export function isAuthUserNotFoundError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return !!(
    err?.code === 'auth/user-not-found' ||
    err?.message?.includes('user-not-found') ||
    err?.message?.includes('There is no user record corresponding to the provided identifier')
  );
}

export function isInvalidSessionError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return !!(
    err?.code === 'auth/invalid-session-cookie' ||
    err?.code === 'auth/session-cookie-expired' ||
    err?.message?.includes('invalid-session-cookie')
  );
}

export function isInvalidTokenError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return !!(
    err?.code === 'auth/id-token-expired' ||
    err?.code === 'auth/invalid-id-token' ||
    err?.message?.includes('invalid-id-token') ||
    err?.message?.includes('id-token-expired')
  );
}

export function shouldClearSession(error: unknown): boolean {
  return (
    isAuthUserNotFoundError(error) || isInvalidSessionError(error) || isInvalidTokenError(error)
  );
}

export function getAuthErrorMessage(error: unknown): string {
  const err = error as { message?: string };

  if (isAuthUserNotFoundError(error)) {
    return 'Your account was not found. Please sign up or contact support.';
  }

  if (isInvalidSessionError(error) || isInvalidTokenError(error)) {
    return 'Your session has expired. Please sign in again.';
  }

  return err?.message || 'An authentication error occurred. Please try again.';
}
