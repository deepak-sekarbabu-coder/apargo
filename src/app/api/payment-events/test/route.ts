import { NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Minimal Firestore doc type for test output
interface PaymentTestDocMeta {
  id: string;
}

interface TestResultData {
  queryCount: number;
  sampleDocIds: string[];
}

// GET /api/payment-events/test
// Test endpoint to diagnose payment events issues without authentication
export async function GET() {
  const testResult = {
    timestamp: new Date().toISOString(),
    status: 'testing',
    tests: {
      adminFirestore: false,
      basicQuery: false,
    },
    errors: [] as string[],
    data: null as TestResultData | null,
  };

  try {
    // Test 1: Get Firebase Admin app
    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      testResult.errors.push('Firebase Admin app not available');
      testResult.status = 'failed';
      return NextResponse.json(testResult, { status: 500 });
    }

    // Test 2: Get Firestore from Admin SDK
    const { getFirestore } = await import('firebase-admin/firestore');
    const adminDb = getFirestore(adminApp);
    testResult.tests.adminFirestore = true;

    // Test 3: Simple query with timeout
    const queryPromise = adminDb.collection('payments').limit(5).get();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Admin query timeout after 8 seconds')), 8000)
    );

    const snapshot = (await Promise.race([queryPromise, timeoutPromise])) as {
      size?: number;
      docs?: PaymentTestDocMeta[];
    };

    testResult.tests.basicQuery = true;
    testResult.data = {
      queryCount: snapshot.size || snapshot.docs?.length || 0,
      sampleDocIds: snapshot.docs
        ? snapshot.docs.slice(0, 3).map((doc: PaymentTestDocMeta) => doc.id)
        : [],
    };

    testResult.status = 'success';
    return NextResponse.json(testResult, { status: 200 });
  } catch (error) {
    console.error('❌ Test failed:', error);
    testResult.status = 'error';
    testResult.errors.push(
      `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json(testResult, { status: 500 });
  }
}
