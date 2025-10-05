// API endpoint to test fault creation
import { NextResponse } from 'next/server';

import { addFault } from '@/lib/firestore';

export async function POST() {
  return createTestFault();
}

export async function GET() {
  return createTestFault();
}

async function createTestFault() {
  try {
    const testFault = {
      images: ['https://example.com/test-image.jpg'],
      location: 'Test API Kitchen, Apartment 101',
      description: 'Test fault created via API endpoint',
      reportedBy: 'test-api-user-123',
      status: 'open' as const,
      severity: 'warning' as const,
      priority: 2,
    };

    const result = await addFault(testFault);

    return NextResponse.json({
      success: true,
      message: 'Test fault created successfully',
      fault: result,
    });
  } catch (error) {
    console.error('❌ Test API: Error creating test fault:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
