import { NextResponse } from 'next/server';

import { getLogger } from '@/lib/core/logger';
import { getFaults } from '@/lib/firestore/faults';

const logger = getLogger('API:Faults');

export async function GET() {
  try {
    const faults = await getFaults();

    return NextResponse.json({
      success: true,
      count: faults.length,
      faults: faults,
    });
  } catch (error) {
    logger.error('❌ API: Error fetching faults:', error);
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
