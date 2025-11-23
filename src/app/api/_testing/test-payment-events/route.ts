import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test endpoint for development and debugging
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'payment-events-test',
      version: '1.0.0',
      message: 'Payment events test endpoint is working',
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Test endpoint that can validate payment event payloads
    const { test, payload } = body;

    if (test === 'validate') {
      // Simple validation test
      const isValid = payload && typeof payload === 'object' && payload.id;

      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'payment-events-test',
        test: 'validate',
        valid: isValid,
        payload: payload,
      });
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'payment-events-test',
      received: body,
    });
  } catch (error) {
    console.error('Test POST endpoint error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid JSON or internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
