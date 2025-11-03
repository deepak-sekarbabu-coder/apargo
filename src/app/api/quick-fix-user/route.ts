import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getApartmentIds } from '@/lib/apartment-constants';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getUserByEmail } from '@/lib/firestore/users';

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function POST() {
  try {
    // Get session cookie from request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and get user
    let decodedToken;
    try {
      decodedToken = await verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserByEmail(decodedToken.email!);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Check if user has apartment assignment
    if (!user.apartment) {
      // Find an available apartment
      const usersSnapshot = await adminDb.collection('users').get();
      const apartmentsInUse = new Set<string>();

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.apartment) {
          apartmentsInUse.add(userData.apartment);
        }
      });

      const expectedApartments = getApartmentIds();
      const availableApartments = expectedApartments.filter(apt => !apartmentsInUse.has(apt));

      if (availableApartments.length > 0) {
        const assignedApartment = availableApartments[0];

        // Update user with apartment assignment
        await adminDb
          .collection('users')
          .doc(user.id)
          .update({
            apartment: assignedApartment,
            propertyRole: user.propertyRole || 'tenant',
          });

        return NextResponse.json({
          success: true,
          action: 'assigned_apartment',
          apartment: assignedApartment,
          message: `Assigned apartment ${assignedApartment} to user ${user.name}`,
          previousApartment: null,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'No available apartments to assign',
          apartmentsInUse: Array.from(apartmentsInUse),
        });
      }
    }

    // User already has apartment
    return NextResponse.json({
      success: true,
      action: 'already_assigned',
      apartment: user.apartment,
      message: `User ${user.name} already has apartment ${user.apartment}`,
    });
  } catch (error) {
    console.error('Error in quick-fix endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
