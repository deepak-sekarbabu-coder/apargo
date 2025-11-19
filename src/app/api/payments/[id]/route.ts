import { NextRequest, NextResponse } from 'next/server';

import { basicAuth } from '@/lib/auth/auth';
import { getPayments, updatePayment } from '@/lib/firestore/payments';
import type { PaymentStatus } from '@/lib/core/types';

// PUT /api/payments/[id]
// Update payment status - used for marking payment events as paid
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const { user, error } = await basicAuth();
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const { id: paymentId } = await params;
    const body = await request.json();
    const { status, receiptURL, reason } = body;

    // Get the existing payment to validate permissions
    const payments = await getPayments();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check permissions
    // For payment events, users can only update their own apartment's payments
    // Admins can update any payment
    const isOwner = payment.apartmentId === user.apartment || payment.payerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own payments' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validStatuses = ['pending', 'paid', 'approved', 'rejected', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const updateData: Partial<{
      status: PaymentStatus;
      paidBy: string;
      paidAt: string;
      approvedBy: string;
      approvedByName: string;
      receiptURL: string;
      reason: string;
    }> = {};

    // Important: Do not allow modification of amount field through this endpoint
    // Amount should only be set during payment creation
    if (status) {
      updateData.status = status;

      // If marking as paid, add additional metadata
      if (status === 'paid') {
        updateData.paidBy = user.id;
        updateData.paidAt = new Date().toISOString();

        // For payment events, automatically approve them when marked as paid
        if (payment.reason?.includes('Monthly maintenance fee') || !payment.expenseId) {
          updateData.status = 'approved';
          updateData.approvedBy = user.id;
          updateData.approvedByName = user.name;
        }
      }
    }

    if (receiptURL) {
      updateData.receiptURL = receiptURL;
    }

    if (reason) {
      updateData.reason = reason;
    }

    // Update the payment
    await updatePayment(paymentId, updateData);

    // Get updated payment to return
    const updatedPayments = await getPayments();
    const updatedPayment = updatedPayments.find(p => p.id === paymentId);

    return NextResponse.json({
      success: true,
      message: `Payment ${status === 'paid' ? 'marked as paid' : 'updated'} successfully`,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to update payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/[id]
// Get specific payment details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const { user, error } = await basicAuth();
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const { id: paymentId } = await params;

    // Get the payment
    const payments = await getPayments();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = payment.apartmentId === user.apartment || payment.payerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own payments' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to get payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
