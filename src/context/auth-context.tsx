'use client';

import {
  User as FirebaseUser,
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { shouldClearSession } from '@/lib/auth-utils';
import { auth } from '@/lib/firebase';
import { addUser, getUserByEmail } from '@/lib/firestore';
import { User } from '@/lib/types';

import log from '../lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setSessionCookie(firebaseUser: FirebaseUser) {
  const idToken = await firebaseUser.getIdToken();

  // Use an absolute URL with the current origin to ensure it works in both
  // development and production environments, preventing CORS issues
  const response = await fetch(`${window.location.origin}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    let message = 'Failed to set session cookie.';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        message = data.message || message;
        log.error('Error setting session cookie (json):', data);
      } else {
        const text = await response.text();
        message = text || message;
        log.error('Error setting session cookie (text):', text);
      }
    } catch (e) {
      log.error('Error parsing session cookie error response:', e);
    }
    throw new Error(message);
  }
}

async function clearSessionCookie() {
  try {
    // Use an absolute URL with the current origin to ensure it works in both
    // development and production environments, preventing CORS issues
    await fetch(`${window.location.origin}/api/auth/session`, { method: 'DELETE' });
  } catch (error) {
    log.error('Error clearing session cookie:', error);
  }
}

// Helper function to handle authentication errors and cleanup
async function handleAuthError(error: unknown, firebaseUser: FirebaseUser | null) {
  log.error('Authentication error:', error);

  // Use the utility function to determine if we should clear the session
  if (shouldClearSession(error)) {
    await clearSessionCookie();
    if (firebaseUser) {
      await signOut(auth);
    }
    return true; // Indicates cleanup was performed
  }

  return false; // No cleanup needed
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          // Only log errors below, remove debug logs
          if (firebaseUser && firebaseUser.email) {
            try {
              let appUser: User | null = null;
              let shouldCreateUser = false;

              try {
                appUser = await getUserByEmail(firebaseUser.email);
                // If we successfully queried and user doesn't exist, we should create one
                if (!appUser) {
                  shouldCreateUser = true;
                }
              } catch (queryErr) {
                // Handle different types of errors appropriately
                const msg = (queryErr as Error)?.message || '';
                if (
                  msg.includes('INTERNAL ASSERTION') ||
                  msg.includes('transient') ||
                  msg.includes('temporary')
                ) {
                  // For transient errors, don't create user immediately - let it retry on next auth event
                  log.warn(
                    'Transient Firestore error during user lookup, skipping user creation to prevent duplicates:',
                    msg
                  );
                  setUser(null);
                  setLoading(false);
                  return; // Exit early without creating user
                } else {
                  // For other errors, log and assume user doesn't exist (safer than creating duplicates)
                  log.error(
                    'Error querying user by email, will create new user if needed:',
                    queryErr
                  );
                  shouldCreateUser = true;
                }
              }

              // Only create user if we're certain they don't exist
              if (shouldCreateUser) {
                log.info('Creating new user for email:', firebaseUser.email);
                const newUser: Omit<User, 'id'> = {
                  name: firebaseUser.displayName || 'New User',
                  email: firebaseUser.email,
                  avatar: firebaseUser.photoURL || undefined,
                  role: 'user',
                  propertyRole: undefined,
                  apartment: '',
                };
                appUser = await addUser(newUser);
                log.info('Successfully created new user with ID:', appUser.id);
              }

              setUser(appUser);
              try {
                await setSessionCookie(firebaseUser);
              } catch (sessionError) {
                // Only log error if critical
                const errorMessage = (sessionError as Error).message;
                if (errorMessage.includes('auth/') || errorMessage.includes('permission')) {
                  throw sessionError;
                }
              }
              router.replace('/dashboard');
            } catch (error) {
              log.error('Authentication error:', error);
              await handleAuthError(error, firebaseUser);
              setUser(null);
            }
          } else {
            setUser(null);
            await clearSessionCookie();
          }
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        log.error('Error setting auth persistence:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) {
          unsub();
        }
      });
    };
  }, [router]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      log.error('Firebase login error:', error);
      throw new Error('Invalid email or password.');
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/popup-closed-by-user') {
        return;
      }
      log.error('Google sign-in error:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle clearing user and cookie
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      // The session cookie doesn't need role, so no need to update it here.
    }
  };

  const value = { user, loading, login, loginWithGoogle, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
