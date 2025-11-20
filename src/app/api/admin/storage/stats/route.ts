import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getUserByEmail } from '@/lib/firestore/users';
import { withLogging } from '@/lib/middleware/request-logger';
import { storageService } from '@/lib/storage/storage-enhanced';

// Helper function to verify admin role
async function verifyAdminRole(request: NextRequest): Promise<{
  isValid: boolean;
  error?: string;
  user?: Partial<{ id: string; email: string; role: string }>;
}> {
  try {
    // For development and testing purposes, we'll use a simple header-based approach
    const userEmail = request.headers.get('x-user-email');
    const authHeader = request.headers.get('authorization');

    if (!userEmail && !authHeader) {
      return { isValid: false, error: 'Authentication required' };
    }

    if (userEmail) {
      const user = await getUserByEmail(userEmail);
      if (user && user.role === 'admin') {
        return { isValid: true, user };
      }
    }

    // Check session cookie as fallback
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (sessionCookie) {
      // In a real implementation, you would decode and verify the JWT here
      return { isValid: true };
    }

    return { isValid: false, error: 'Admin access required' };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isValid: false, error: 'Authentication verification failed' };
  }
}

// GET /api/admin/storage/stats - Get storage statistics
export const GET = withLogging(async (request: NextRequest) => {
  try {
    // Verify admin role
    const authResult = await verifyAdminRole(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const stats = await storageService.getStorageStats();

    // Calculate additional metrics
    const freeStorageLimit = 5 * 1024 * 1024 * 1024; // 5GB Firebase free tier limit
    const usagePercentage = (stats.totalSize / freeStorageLimit) * 100;
    const oldFilePercentage =
      stats.totalFiles > 0 ? (stats.oldFileCount / stats.totalFiles) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        freeStorageLimit,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        oldFilePercentage: Math.round(oldFilePercentage * 100) / 100,
        remainingStorage: freeStorageLimit - stats.totalSize,
      },
    });
  } catch (error) {
    console.error('Storage stats API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve storage statistics' }, { status: 500 });
  }
});
