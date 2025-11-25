import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';
import { getUserByEmail } from '@/lib/firestore/users';
import { addVendor, deleteVendor, getVendors, updateVendor } from '@/lib/firestore/vendors';
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

// GET /api/maintenance/vendors - Get all vendors
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const vendors = await getVendors(activeOnly);

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error) {
    logger.error('Get vendors error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
});

// POST /api/maintenance/vendors - Create new vendor
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    // Only admins can create vendors
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const { name, serviceType } = body;
    if (!name || !serviceType) {
      return NextResponse.json({ error: 'Name and serviceType are required' }, { status: 400 });
    }

    const newVendor = await addVendor(body);

    return NextResponse.json({
      success: true,
      vendor: newVendor,
    });
  } catch (error) {
    logger.error('Create vendor error:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
});

// PUT /api/maintenance/vendors - Update vendor
export const PUT = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    // Only admins can update vendors
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    await updateVendor(id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully',
    });
  } catch (error) {
    logger.error('Update vendor error:', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
});

// DELETE /api/maintenance/vendors - Delete vendor
export const DELETE = withLogging(async (request: NextRequest) => {
  try {
    const authResult = await verifyAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    // Only admins can delete vendors
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    await deleteVendor(id);

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    logger.error('Delete vendor error:', error);
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
});
