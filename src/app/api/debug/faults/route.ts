import { NextResponse } from 'next/server';

import { getFaults } from '@/lib/firestore';

export async function GET() {
  try {
    const faults = await getFaults();

    return NextResponse.json({
      success: true,
      count: faults.length,
      faults: faults,
    });
  } catch (error) {
    console.error('❌ API: Error fetching faults:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        faults: [],
      },
      { status: 500 }
    );
  }
}
