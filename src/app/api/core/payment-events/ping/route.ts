import { NextResponse } from 'next/server';

// GET /api/payment-events/ping
// Simple ping endpoint to test API routing
export async function GET() {
  return NextResponse.json({
    message: 'Payment events API is responding',
    timestamp: new Date().toISOString(),
    status: 'ok',
  });
}
