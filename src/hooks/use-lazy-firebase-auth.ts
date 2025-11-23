import { useEffect, useState } from 'react';

interface LazyAuthState {
  auth: any;
  loading: boolean;
  error: Error | null;
}

export function useLazyFirebaseAuth() {
  const [authState, setAuthState] = useState<LazyAuthState>({
    auth: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Only load Firebase Auth when needed (after initial page load)
    const loadAuth = async () => {
      if (authState.auth || authState.loading) return;

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Dynamically import Firebase Auth to avoid blocking critical rendering
        const { getAuth } = await import('firebase/auth');
        const { app } = await import('@/lib/firebase/firebase');
        
        const auth = getAuth(app);
        setAuthState(prev => ({ ...prev, auth, loading: false }));
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error : new Error('Failed to load Firebase Auth')
        }));
      }
    };

    // Use requestIdleCallback to load auth during browser idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAuth, { timeout: 2000 });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(loadAuth, 100);
    }
  }, [authState.auth, authState.loading]);

  return authState;
}
