import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check endpoint
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'payment-events-ping',
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Ping endpoint error:', error);
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

    // Echo back the received payload for testing
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'payment-events-ping',
      received: body,
    });
  } catch (error) {
    console.error('Ping POST endpoint error:', error);
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
