import { NextResponse } from 'next/server';

import { basicAuth } from '@/lib/auth/auth';
import { getLogger } from '@/lib/core/logger';
import { isFirebaseAdminAvailable } from '@/lib/firebase/firebase-admin';
import * as firestoreAdmin from '@/lib/firestore/firestore-admin';

const logger = getLogger('API');

// GET /api/payment-events/health
// Health check for payment events functionality
// Unused request param intentionally omitted to satisfy lint
export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    checks: {
      firebaseAdmin: false,
      authentication: false,
      firestoreConnection: false,
      paymentEventsQuery: false,
    },
    errors: [] as string[],
    debug: {
      environment: process.env.NODE_ENV,
      netlify: !!process.env.NETLIFY,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    },
  };

  try {
    // Check Firebase Admin
    healthCheck.checks.firebaseAdmin = isFirebaseAdminAvailable();
    if (!healthCheck.checks.firebaseAdmin) {
      healthCheck.errors.push('Firebase Admin not available');
    }

    // Check authentication
    try {
      const { user, error } = await basicAuth();
      if (user && !error) {
        healthCheck.checks.authentication = true;
      } else {
        healthCheck.errors.push(`Authentication failed: ${error || 'Unknown error'}`);
      }
    } catch (authError) {
      healthCheck.errors.push(
        `Authentication error: ${authError instanceof Error ? authError.message : 'Unknown error'}`
      );
    }

    // Check Firestore connection
    if (healthCheck.checks.firebaseAdmin) {
      try {
        // First test basic connectivity
        const connectivityTest = await firestoreAdmin.testFirestoreConnection();
        if (connectivityTest.success) {
          healthCheck.checks.firestoreConnection = true;

          // Then test payment events query with timeout
          const testPromise = firestoreAdmin.getPaymentEvents('2025-08');
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Payment events query timeout')), 5000)
          );

          await Promise.race([testPromise, timeoutPromise]);
          healthCheck.checks.paymentEventsQuery = true;
        } else {
          healthCheck.errors.push(`Firestore connectivity test failed: ${connectivityTest.error}`);
        }
      } catch (firestoreError) {
        logger.error('Firestore test failed:', firestoreError);
        healthCheck.errors.push(
          `Firestore error: ${firestoreError instanceof Error ? firestoreError.message : 'Unknown error'}`
        );
      }
    }

    // Determine overall status
    const allChecksPass = Object.values(healthCheck.checks).every(check => check);
    healthCheck.status = allChecksPass ? 'healthy' : 'unhealthy';

    return NextResponse.json(healthCheck, {
      status: allChecksPass ? 200 : 503,
    });
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.errors.push(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json(healthCheck, { status: 500 });
  }
}
