import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';
import {
  addMaintenanceTask,
  deleteMaintenanceTask,
  getCompletedMaintenanceTasks,
  getMaintenanceTasks,
  getMaintenanceTasksCount,
  getUpcomingMaintenanceTasks,
  updateMaintenanceTask,
} from '@/lib/firestore/maintenance-tasks';
import { getUserByEmail } from '@/lib/firestore/users';
import { withLogging } from '@/lib/middleware/request-logger';

const logger = getLogger('API');

// Helper function to verify authentication and get user
async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized', status: 401 };
    }

    const adminApp = getFirebaseAdminApp();
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getUserByEmail(decodedToken.email!);

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    return { user };
  } catch (error) {
    logger.error('Auth verification error:', error);
    if (
      error instanceof Error &&
      error.message.includes('Firebase Admin SDK has not been initialized')
    ) {
      return { error: 'Server configuration error: Firebase is not configured', status: 500 };
    }
    return { error: 'Invalid session', status: 401 };
  }
}

// GET /api/maintenance/tasks - Get all maintenance tasks
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;
    const type = searchParams.get('type'); // 'upcoming', 'completed', 'count', or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5');

    // Handle different query types for performance
    if (type === 'upcoming') {
      const tasks = await getUpcomingMaintenanceTasks(20);
      return NextResponse.json({ success: true, tasks });
    }

    if (type === 'completed') {
      const result = await getCompletedMaintenanceTasks(page, pageSize);
      return NextResponse.json({
        success: true,
        tasks: result.tasks,
        hasMore: result.hasMore,
        page,
        pageSize,
      });
    }

    if (type === 'count') {
      const counts = await getMaintenanceTasksCount();
      return NextResponse.json({ success: true, counts });
    }

    // Default: get tasks with filters
    const tasks = await getMaintenanceTasks(start, end, undefined, 50);

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    logger.error('Get maintenance tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance tasks' }, { status: 500 });
  }
});

// POST /api/maintenance/tasks - Create new maintenance task
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();

    // Validate required fields
    const { title, category, scheduledDate } = body;
    if (!title || !category || !scheduledDate) {
      return NextResponse.json(
        { error: 'Title, category, and scheduledDate are required' },
        { status: 400 }
      );
    }

    // Create task with user as creator
    const taskData = {
      ...body,
      createdBy: user.id,
    };

    const newTask = await addMaintenanceTask(taskData);

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    logger.error('Create maintenance task error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance task' }, { status: 500 });
  }
});

// PUT /api/maintenance/tasks - Update maintenance task
export const PUT = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await updateMaintenanceTask(id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
    });
  } catch (error) {
    logger.error('Update maintenance task error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance task' }, { status: 500 });
  }
});

// DELETE /api/maintenance/tasks - Delete maintenance task
export const DELETE = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Only admins can delete tasks
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await deleteMaintenanceTask(id);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    logger.error('Delete maintenance task error:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance task' }, { status: 500 });
  }
});
