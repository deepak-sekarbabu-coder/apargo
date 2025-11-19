// Server-side Firestore utilities using Firebase Admin SDK
// This file should only be imported in API routes and server components
import { getFirebaseAdminApp } from '../firebase/firebase-admin';

// Import types (these don't cause bundling issues)
type Payment = {
  id: string;
  payerId: string;
  payeeId: string;
  apartmentId: string;
  category: string;
  amount: number;
  status: string;
  monthYear: string;
  reason?: string;
  expenseId?: string;
  createdAt: string;
};

type Apartment = {
  id: string;
  name: string;
};

// Simple test function to check Firestore connectivity
export const testFirestoreConnection = async (): Promise<{ success: boolean; error?: string }> => {
  // Skip during build time
  const isBuildTime =
    process.env.NODE_ENV === 'production' && !process.env.NETLIFY && !process.env.VERCEL;
  const isStaticGeneration = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime || isStaticGeneration) {
    return { success: false, error: 'Build time - Firebase not available' };
  }

  try {
    // Use Firebase Admin SDK for server-side queries
    const { getFirestore } = await import('firebase-admin/firestore');

    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      return { success: false, error: 'Firebase Admin app not available' };
    }

    const adminDb = getFirestore(adminApp);

    // Try a simple query with limit to test connectivity
    const testQuery = adminDb.collection('payments').limit(1);
    await testQuery.get();

    return { success: true };
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get payment events for a specific month and apartment (optional)
export const getPaymentEvents = async (
  monthYear: string,
  apartmentId?: string
): Promise<Payment[]> => {
  // Skip during build time
  const isBuildTime =
    process.env.NODE_ENV === 'production' && !process.env.NETLIFY && !process.env.VERCEL;
  const isStaticGeneration = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime || isStaticGeneration) {
    return [];
  }

  try {
    // Use Firebase Admin SDK for server-side queries
    const { getFirestore } = await import('firebase-admin/firestore');

    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      throw new Error('Firebase Admin app not available');
    }

    const adminDb = getFirestore(adminApp);
    // Build query using Admin SDK
    let paymentsQuery = adminDb.collection('payments').where('monthYear', '==', monthYear);

    if (apartmentId) {
      paymentsQuery = paymentsQuery.where('apartmentId', '==', apartmentId);
    }

    const paymentSnapshot = await paymentsQuery.get();

    const payments = paymentSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Payment;
    });

    // Filter for payment events on the server side
    const paymentEvents = payments.filter(payment => {
      // Check if it's an income payment (payment event characteristic)
      const isIncomePayment = payment.category === 'income';

      // Check if it's a maintenance fee or has no expenseId
      const isMaintenanceFee =
        payment.reason?.includes('Monthly maintenance fee') ||
        payment.reason?.includes('maintenance') ||
        !payment.expenseId;

      return isIncomePayment && isMaintenanceFee;
    });

    return paymentEvents;
  } catch (error) {
    console.error('❌ getPaymentEvents failed:', error);
    throw error;
  }
};

// Get apartments using Admin SDK
export const getApartmentsAdmin = async (): Promise<Apartment[]> => {
  // Skip during build time
  const isBuildTime =
    process.env.NODE_ENV === 'production' && !process.env.NETLIFY && !process.env.VERCEL;
  const isStaticGeneration = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime || isStaticGeneration) {
    return [];
  }

  try {
    const { getFirestore } = await import('firebase-admin/firestore');

    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      throw new Error('Firebase Admin app not available');
    }

    const adminDb = getFirestore(adminApp);
    const apartmentsQuery = adminDb.collection('apartments');
    const apartmentSnapshot = await apartmentsQuery.get();

    return apartmentSnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Apartment
    );
  } catch (error) {
    console.error('❌ getApartmentsAdmin failed:', error);
    throw error;
  }
};

// Helper to calculate summary totals
function calculateSummaryTotals(paymentEvents: Payment[]) {
  return {
    totalEvents: paymentEvents.length,
    totalAmount: paymentEvents.reduce((sum, payment) => sum + payment.amount, 0),
    paidCount: paymentEvents.filter(
      payment => payment.status === 'paid' || payment.status === 'approved'
    ).length,
    pendingCount: paymentEvents.filter(payment => payment.status === 'pending').length,
    overdueCount: 0, // Could add logic for overdue payments based on due date
  };
}

// Helper to build apartment status
function buildApartmentStatus(apartment: Apartment, paymentEvents: Payment[]) {
  const apartmentPayments = paymentEvents.filter(payment => payment.apartmentId === apartment.id);
  const totalOwed = apartmentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = apartmentPayments
    .filter(payment => payment.status === 'paid' || payment.status === 'approved')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    totalOwed,
    totalPaid,
    pendingAmount: totalOwed - totalPaid,
    isPaid: totalPaid >= totalOwed,
    payments: apartmentPayments,
  };
}

// Get payment event summary for admin dashboard
export const getPaymentEventSummary = async (monthYear: string) => {
  const paymentEvents = await getPaymentEvents(monthYear);
  const apartments = await getApartmentsAdmin();

  const summary = {
    ...calculateSummaryTotals(paymentEvents),
    apartmentStatus: apartments.map(apartment => buildApartmentStatus(apartment, paymentEvents)),
  };

  return summary;
};
