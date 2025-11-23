'use client';

import { useAuth } from '@/context/auth-context';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import log from '@/lib/core/logger';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps): React.ReactNode {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!user) {
      log.debug('User not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      log.debug(`User role ${user.role} does not match required role ${requiredRole}`);
      router.replace('/login');
      return;
    }
  }, [user, loading, requiredRole, mounted, router]);

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or role doesn't match
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return children;
}
