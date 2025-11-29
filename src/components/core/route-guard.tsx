'use client';

import { useAuth } from '@/context/auth-context';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import log from '@/lib/core/logger';

import { PageLoading } from '@/components/ui/loading-states';

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
    return <PageLoading text="Verifying session..." />;
  }

  // Don't render children if not authenticated or role doesn't match
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return children;
}
