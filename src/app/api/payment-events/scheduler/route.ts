import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/lib/auth';
import * as firestore from '@/lib/firestore';
import * as firestoreAdmin from '@/lib/firestore-admin';

// POST /api/payment-events/scheduler
// Automated scheduler endpoint for generating monthly payment events
// This endpoint can be called by cron jobs or other scheduling systems
export async function POST(request: NextRequest) {
  try {
    // For automated scheduling, we might want to use a special API key instead of user auth
    // For now, we'll check for admin auth or a special scheduler token
    const schedulerToken = request.headers.get('x-scheduler-token');
    const expectedToken = process.env.SCHEDULER_TOKEN || 'default-scheduler-token';

    let isAuthorized = false;

    if (schedulerToken === expectedToken) {
      isAuthorized = true;
    } else {
      // Fallback to admin auth
      const { user, error } = await adminAuth();
      if (!error && user) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Scheduler token or admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      monthYear,
      force = false, // Force generation even if events already exist
    } = body;

    // Use current month if not specified
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    // Validate monthYear format
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return NextResponse.json(
        { error: 'Invalid monthYear format. Expected YYYY-MM' },
        { status: 400 }
      );
    }

    // Get all categories configured for payment events
    const categories = await firestore.getCategories();
    const paymentEventCategories = categories.filter(
      cat => cat.isPaymentEvent && cat.autoGenerate && cat.monthlyAmount && cat.monthlyAmount > 0
    );

    if (paymentEventCategories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No categories configured for automatic payment event generation',
        monthYear: targetMonth,
        eventsCreated: 0,
        skipped: 'No auto-generation categories found',
      });
    }

    // Check if it's the right day to generate payment events
    const categoriesToProcess = paymentEventCategories.filter(cat => {
      const dayOfMonth = cat.dayOfMonth || 1;
      return force || currentDay === dayOfMonth;
    });

    if (categoriesToProcess.length === 0 && !force) {
      return NextResponse.json({
        success: true,
        message: `No payment events scheduled for generation on day ${currentDay}`,
        monthYear: targetMonth,
        eventsCreated: 0,
        skipped: `Wrong day for generation. Configured days: ${paymentEventCategories.map(cat => cat.dayOfMonth || 1).join(', ')}`,
        nextScheduledDays: paymentEventCategories.map(cat => ({
          category: cat.name,
          dayOfMonth: cat.dayOfMonth || 1,
        })),
      });
    }

    let totalEventsCreated = 0;
    const results: Array<{
      categoryId: string;
      categoryName: string;
      eventsCreated: number;
      error?: string;
    }> = [];

    // Process each category
    for (const category of categoriesToProcess) {
      try {
        // Check if payment events already exist for this category and month
        if (!force) {
          const existingPayments = await firestoreAdmin.getPaymentEvents(targetMonth);
          const categoryExists = existingPayments.some(payment =>
            payment.reason?.includes(category.name)
          );

          if (categoryExists) {
            results.push({
              categoryId: category.id,
              categoryName: category.name,
              eventsCreated: 0,
              error: 'Payment events already exist for this month',
            });
            continue;
          }
        }

        const createdPayments = await firestore.generatePaymentEvents(category.id, targetMonth);
        totalEventsCreated += createdPayments.length;

        results.push({
          categoryId: category.id,
          categoryName: category.name,
          eventsCreated: createdPayments.length,
        });
      } catch (error) {
        console.error(
          `[Scheduler] Failed to generate payment events for category ${category.name}:`,
          error
        );
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          eventsCreated: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Automated generation completed: ${totalEventsCreated} payment events created for ${targetMonth}`,
      monthYear: targetMonth,
      eventsCreated: totalEventsCreated,
      processedCategories: categoriesToProcess.length,
      results,
      scheduledOn: new Date().toISOString(),
      triggerDay: currentDay,
    });
  } catch (error) {
    console.error('[Scheduler] Error in automated payment event generation:', error);
    return NextResponse.json(
      {
        error: 'Automated payment event generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/payment-events/scheduler
// Get scheduler status and next scheduled dates
export async function GET() {
  try {
    // Check admin auth for viewing scheduler status
    const { user, error } = await adminAuth();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Get all categories configured for payment events
    const categories = await firestore.getCategories();
    const paymentEventCategories = categories.filter(
      cat => cat.isPaymentEvent && cat.autoGenerate && cat.monthlyAmount && cat.monthlyAmount > 0
    );

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.toISOString().slice(0, 7);

    // Calculate next scheduled generation dates
    const scheduledCategories = paymentEventCategories.map(category => {
      const dayOfMonth = category.dayOfMonth || 1;
      const nextGeneration = new Date(currentDate);

      if (currentDay > dayOfMonth) {
        // Next month
        nextGeneration.setMonth(nextGeneration.getMonth() + 1);
      }
      nextGeneration.setDate(dayOfMonth);

      return {
        categoryId: category.id,
        categoryName: category.name,
        monthlyAmount: category.monthlyAmount,
        dayOfMonth,
        nextGenerationDate: nextGeneration.toISOString().slice(0, 10), // YYYY-MM-DD
        isScheduledToday: currentDay === dayOfMonth,
      };
    });

    return NextResponse.json({
      success: true,
      currentDate: currentDate.toISOString(),
      currentDay,
      currentMonth,
      totalConfiguredCategories: paymentEventCategories.length,
      scheduledCategories,
      schedulerStatus: paymentEventCategories.length > 0 ? 'active' : 'inactive',
      upcomingGenerations: scheduledCategories
        .filter(cat => !cat.isScheduledToday)
        .sort(
          (a, b) =>
            new Date(a.nextGenerationDate).getTime() - new Date(b.nextGenerationDate).getTime()
        )
        .slice(0, 5), // Next 5 upcoming generations
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
