import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/lib/auth';
import * as firestoreAdmin from '@/lib/firestore-admin';

// GET /api/payment-events/summary?monthYear=YYYY-MM
// Get payment event summary for admin dashboard
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, error } = await adminAuth();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get('monthYear') || new Date().toISOString().slice(0, 7);

    // Validate monthYear format
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json(
        { error: 'Invalid monthYear format. Expected YYYY-MM' },
        { status: 400 }
      );
    }

    // Get payment event summary
    const summary = await firestoreAdmin.getPaymentEventSummary(monthYear);

    return NextResponse.json({
      success: true,
      monthYear,
      summary,
    });
  } catch (error) {
    console.error('Error getting payment event summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to get payment event summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
