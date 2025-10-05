import { NextRequest, NextResponse } from 'next/server';

import { basicAuth } from '@/lib/auth';
import * as firestoreAdmin from '@/lib/firestore-admin';

// GET /api/payment-events?monthYear=YYYY-MM&apartmentId=optional
// Get payment events with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication (both users and admins can view payment events)
    const { user, error } = await basicAuth();
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get('monthYear') || new Date().toISOString().slice(0, 7);
    const apartmentId = searchParams.get('apartmentId');

    // Validate monthYear format
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json(
        { error: 'Invalid monthYear format. Expected YYYY-MM' },
        { status: 400 }
      );
    }

    // For non-admin users, restrict to their own apartment
    let filterApartmentId = apartmentId;
    if (user.role !== 'admin') {
      filterApartmentId = user.apartment;
    }

    // Get payment events
    const paymentEvents = await firestoreAdmin.getPaymentEvents(
      monthYear,
      filterApartmentId || undefined
    );

    return NextResponse.json({
      success: true,
      monthYear,
      apartmentId: filterApartmentId,
      paymentEvents,
      count: paymentEvents.length,
    });
  } catch (error) {
    console.error('Error getting payment events:', error);
    return NextResponse.json(
      {
        error: 'Failed to get payment events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
