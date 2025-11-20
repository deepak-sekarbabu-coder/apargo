'use client';

import { Calendar, CheckCircle, Clock, CreditCard } from 'lucide-react';

import React, { useMemo } from 'react';

import type { Payment } from '@/lib/core/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface PaymentStatusWidgetProps {
  currentUser: {
    id: string;
    apartment: string;
    name: string;
  };
  paymentEvents?: Payment[];
  loading?: boolean;
  error?: string | null;
}

export function PaymentStatusWidget({
  currentUser,
  paymentEvents = [],
  loading = false,
  error = null,
}: PaymentStatusWidgetProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  // Calculate payment summary from the provided payment events
  const paymentSummary = useMemo(() => {
    if (!paymentEvents || paymentEvents.length === 0) {
      return null;
    }

    const totalOwed = paymentEvents.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = paymentEvents
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = totalOwed - totalPaid;

    return {
      apartmentId: currentUser.apartment,
      apartmentName: currentUser.apartment,
      totalOwed,
      totalPaid,
      pendingAmount,
      isPaid: totalPaid >= totalOwed,
      payments: paymentEvents,
    };
  }, [paymentEvents, currentUser.apartment]);

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/core/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'paid',
          paidBy: currentUser.id,
        }),
      });

      if (response.ok) {
        // In the new architecture, the parent will refetch data through React Query
        // so we don't need to manually refresh here
      } else {
        const errorData = await response.text();
        console.error('Mark as paid API error:', { status: response.status, data: errorData });
        throw new Error(
          `Failed to update payment status (${response.status}): ${errorData || 'Unknown error'}`
        );
      }
    } catch (err) {
      console.error('Mark as paid error:', err);
      // You might want to show a toast notification here
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status
          </CardTitle>
          <CardDescription>Loading payment information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <CreditCard className="h-5 w-5" />
            Payment Status (Service Issue)
          </CardTitle>
          <CardDescription>Service temporarily unavailable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="text-amber-700 font-medium">Payment Events Feature</p>
            <p className="text-sm text-amber-600 mt-1">
              Automatic payment tracking for maintenance fees is being configured. In the meantime,
              you can:
            </p>
            <ul className="list-disc list-inside mt-2 text-amber-600 space-y-1 text-sm">
              <li>Check payment history in the Ledger section</li>
              <li>Add manual payments through Expense Management</li>
              <li>Contact your admin for payment status updates</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500">
            <p className="text-sm text-red-600 font-medium">Service temporarily unavailable:</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentSummary || paymentSummary.payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status
          </CardTitle>
          <CardDescription>Maintenance fees and payment events for {currentMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">No payment events for this month</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalOwed, totalPaid, pendingAmount, isPaid, payments } = paymentSummary;

  return (
    <Card
      className={`${isPaid ? 'border-green-200 bg-green-50/50' : pendingAmount > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Status
        </CardTitle>
        <CardDescription>Maintenance fees for {currentMonth}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Owed</p>
            <p className="text-2xl font-bold">₹{totalOwed}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isPaid ? 'Paid' : 'Pending'}
            </p>
            <p className={`text-2xl font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
              ₹{isPaid ? totalPaid : pendingAmount}
            </p>
          </div>
        </div>

        {/* Overall Status Badge */}
        <div className="flex items-center gap-2">
          {isPaid ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              All Paid
            </Badge>
          ) : (
            <Badge variant="destructive">
              <Clock className="h-3 w-3 mr-1" />
              {payments.filter(p => p.status === 'pending').length} Pending
            </Badge>
          )}
        </div>

        {/* Individual Payment Events */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Payment Events</h4>
          {payments.map(payment => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-white"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{payment.reason || 'Maintenance Fee'}</p>
                <p className="text-sm text-muted-foreground">₹{payment.amount}</p>
              </div>
              <div className="flex items-center gap-2">
                {payment.status === 'paid' || payment.status === 'approved' ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Paid
                  </Badge>
                ) : (
                  <>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button size="sm" onClick={() => handleMarkAsPaid(payment.id)} className="ml-2">
                      Mark Paid
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {!isPaid && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Navigate to ledger view for payment history
                window.location.href = '#ledger';
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Payment History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
