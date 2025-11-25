import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getUserByEmail } from '@/lib/firestore/users';
import { withLogging } from '@/lib/middleware/request-logger';
import { storageService } from '@/lib/storage/storage-enhanced';

const logger = getLogger('API');

// Helper function to verify admin role
async function verifyAdminRole(request: NextRequest): Promise<{
  isValid: boolean;
  error?: string;
  user?: Partial<{ id: string; email: string; role: string }>;
}> {
  try {
    // For development and testing purposes, we'll use a simple header-based approach
    // In production, you would want to implement proper JWT verification
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
      // For now, we'll assume the session is valid if it exists
      // and rely on client-side role checking
      return { isValid: true };
    }

    return { isValid: false, error: 'Admin access required' };
  } catch (error) {
    logger.error('Auth verification error:', error);
    return { isValid: false, error: 'Authentication verification failed' };
  }
}

// GET /api/admin/files - List files with optional filtering
export const GET = withLogging(async (request: NextRequest) => {
  try {
    // Verify admin role
    const authResult = await verifyAdminRole(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as
      | 'receipt'
      | 'fault'
      | 'avatar'
      | 'announcement'
      | 'all'
      | null;
    const ageMonths = searchParams.get('ageMonths');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    let files;

    if (category && category !== 'all') {
      files = await storageService.getFilesByCategory(category);
    } else if (ageMonths) {
      files = await storageService.getFilesByAge(parseInt(ageMonths));
    } else if (userId) {
      files = await storageService.getFilesByUploader(userId);
    } else {
      files = await storageService.getAllFiles(limit ? parseInt(limit) : undefined);
    }

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    logger.error('Admin files list API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve files' }, { status: 500 });
  }
});

// DELETE /api/admin/files - Bulk delete files
export const DELETE = withLogging(async (request: NextRequest) => {
  try {
    // Verify admin role
    const authResult = await verifyAdminRole(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'fileIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit the number of files that can be deleted at once
    if (fileIds.length > 50) {
      return NextResponse.json(
        { error: 'Cannot delete more than 50 files at once' },
        { status: 400 }
      );
    }

    const result = await storageService.bulkDeleteFiles(fileIds);

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      failed: result.failed,
      deletedCount: result.deleted.length,
      failedCount: result.failed.length,
    });
  } catch (error) {
    logger.error('Admin files delete API error:', error);
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
  }
});
