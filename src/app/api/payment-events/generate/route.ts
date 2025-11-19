import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  getFirebaseAdminApp,
  getInitializationError,
  isFirebaseAdminAvailable,
} from '@/lib/firebase/firebase-admin';
import type { User } from '@/lib/core/types';

// POST /api/payment-events/generate
// Generate payment events for all configured categories for the current month or specified month
export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase Admin initialized
    if (!isFirebaseAdminAvailable()) {
      const initErr = getInitializationError();
      console.error('Firebase Admin not initialized:', initErr);
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: initErr || 'Firebase Admin not initialized',
        },
        { status: 500 }
      );
    }

    // Authenticate admin: accept session cookie or Authorization Bearer idToken
    let sessionCookie: string | undefined;
    let idToken: string | undefined;

    try {
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get('session')?.value;
    } catch {
      // Fallback to header parsing
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/session=([^;]+)/);
        sessionCookie = match?.[1];
      }
    }

    // Authorization header fallback (Bearer idToken)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!sessionCookie && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      idToken = authHeader.split(' ')[1];
    }

    if (!sessionCookie && !idToken) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const adminApp = getFirebaseAdminApp();
    let decodedToken: DecodedIdToken;
    try {
      const adminAuth = getAuth(adminApp);
      if (sessionCookie) {
        decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      } else {
        decodedToken = await adminAuth.verifyIdToken(idToken!);
      }
    } catch (err) {
      console.error('Authentication token verification failed:', err);
      return NextResponse.json({ error: 'Invalid session or token' }, { status: 401 });
    }

    const adminDb = getAdminFirestore(adminApp);
    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', decodedToken.email!).get();

    if (userQuery.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { monthYear } = body;

    // Use current month if not specified
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Validate monthYear format
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return NextResponse.json(
        { error: 'Invalid monthYear format. Expected YYYY-MM' },
        { status: 400 }
      );
    }

    // Minimal admin-side types for runtime documents
    type AdminCategory = {
      id: string;
      name?: string;
      isPaymentEvent?: boolean;
      autoGenerate?: boolean;
      monthlyAmount?: number;
    };

    type AdminApartment = { id: string; [k: string]: unknown };
    type AdminUser = { id: string; apartment?: string; [k: string]: unknown };

    // Get all categories, apartments and users via Admin SDK
    const [categoriesSnap, apartmentsSnap, usersSnap] = await Promise.all([
      adminDb.collection('categories').get(),
      adminDb.collection('apartments').get(),
      adminDb.collection('users').get(),
    ]);

    const categories = categoriesSnap.docs.map(
      d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as AdminCategory
    );
    const apartments = apartmentsSnap.docs.map(
      d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as AdminApartment
    );
    const allUsers = usersSnap.docs.map(
      d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as AdminUser
    );

    const paymentEventCategories = categories.filter(
      c =>
        c &&
        c.isPaymentEvent &&
        c.autoGenerate &&
        typeof c.monthlyAmount === 'number' &&
        c.monthlyAmount > 0
    );

    // Add logging to help debug issues with monthlyAmount values
    console.log(`Found ${categories.length} total categories`);
    console.log(`Found ${paymentEventCategories.length} payment event categories`);
    paymentEventCategories.forEach(cat => {
      console.log(`Category ID: ${cat.id}, Name: ${cat.name}, Amount: ${cat.monthlyAmount}`);
    });

    // Check if payment events already exist for any apartment/category for targetMonth
    let hasExistingEvents = false;
    for (const apartment of apartments) {
      const apartmentMembers = allUsers.filter(user => user.apartment === apartment.id);
      if (apartmentMembers.length === 0) continue;

      const existingPaymentsSnap = await adminDb
        .collection('payments')
        .where('apartmentId', '==', apartment.id)
        .where('monthYear', '==', targetMonth)
        .get();

      const existingPayments = existingPaymentsSnap.docs.map(
        d => d.data() as Record<string, unknown>
      );

      for (const category of paymentEventCategories) {
        const paymentEventExists = existingPayments.some((payment: unknown) => {
          const p = payment as Record<string, unknown>;
          const reason = p.reason as string | undefined;
          return (
            (reason && reason.includes('Monthly maintenance fee')) ||
            (reason && typeof category.name === 'string' && reason.includes(category.name!))
          );
        });

        if (paymentEventExists) {
          hasExistingEvents = true;
          break;
        }
      }

      if (hasExistingEvents) break;
    }

    if (hasExistingEvents) {
      return NextResponse.json({
        success: true,
        message: `Payment events already exist for ${targetMonth}. No new events were generated.`,
        monthYear: targetMonth,
        eventsCreated: 0,
        hasExistingEvents: true,
        payments: [],
      });
    }

    // Now create payment events (server-side) for each configured category and apartment
    const createdPayments: Record<string, unknown>[] = [];

    for (const category of paymentEventCategories as AdminCategory[]) {
      for (const apartment of apartments as AdminApartment[]) {
        const apartmentMembers = allUsers.filter(
          (user: AdminUser) => user.apartment === apartment.id
        );
        if (apartmentMembers.length === 0) continue;

        const firstMember = apartmentMembers[0] as AdminUser;

        // Re-check existing payments for this apartment+month to avoid duplicates
        const existingPaymentsSnap = await adminDb
          .collection('payments')
          .where('apartmentId', '==', apartment.id)
          .where('monthYear', '==', targetMonth)
          .get();

        const paymentEventExists = existingPaymentsSnap.docs.some(d => {
          const p = d.data() as Record<string, unknown>;
          const reason = p.reason as string | undefined;
          return (
            (reason && reason.includes('Monthly maintenance fee')) ||
            (reason && typeof category.name === 'string' && reason.includes(category.name))
          );
        });

        if (paymentEventExists) continue;

        // Validate amount before creating the payment event
        const monthlyAmount =
          typeof category.monthlyAmount === 'number' ? category.monthlyAmount : 0;

        if (monthlyAmount <= 0) {
          console.warn(
            `Skipping payment event for category ${category.name} with invalid amount: ${monthlyAmount}`
          );
          continue;
        }

        const paymentEventData = {
          payerId: firstMember.id,
          payeeId: firstMember.id,
          apartmentId: apartment.id,
          category: 'income',
          amount: monthlyAmount,
          status: 'pending',
          monthYear: targetMonth,
          reason: `Monthly maintenance fee - ${category.name}`,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>;

        try {
          const docRef = await adminDb.collection('payments').add(paymentEventData);
          createdPayments.push({ id: docRef.id, ...paymentEventData });
        } catch (err) {
          console.error(`Failed to create payment event for apartment ${apartment.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdPayments.length} payment events for ${targetMonth}`,
      monthYear: targetMonth,
      eventsCreated: createdPayments.length,
      hasExistingEvents: false,
      payments: createdPayments,
    });
  } catch (error) {
    console.error('Error generating payment events:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate payment events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
