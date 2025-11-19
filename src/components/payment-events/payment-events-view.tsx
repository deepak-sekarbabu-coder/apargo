'use client';

import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, CreditCard, FileText } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import type { Payment, User } from '@/lib/core/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useToast } from '@/hooks/use-toast';

interface PaymentEventsViewProps {
  currentUser: {
    id: string;
    apartment: string;
    name: string;
  };
  users: User[];
}

interface PaymentEventData {
  monthYear: string;
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'paid' | 'partial' | 'pending';
}

export function PaymentEventsView({ currentUser }: PaymentEventsViewProps) {
  const [paymentEvents, setPaymentEvents] = useState<PaymentEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState<string | null>(null);
  const [monthsToLoad, setMonthsToLoad] = useState(6); // Start with current month + previous 5 months (6 total)
  const [loadingMore, setLoadingMore] = useState(false);
  const { toast } = useToast();

  const fetchPaymentEvents = useCallback(
    async (monthsCount: number = monthsToLoad) => {
      try {
        setLoading(true);
        setError(null);

        // Build list of months starting from current month going back (current + previous n-1)
        const months = Array.from({ length: monthsCount }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toISOString().slice(0, 7);
        });

        const allPaymentData: PaymentEventData[] = [];

        for (const monthYear of months) {
          try {
            const response = await fetch(
              `/api/payment-events?monthYear=${monthYear}&apartmentId=${currentUser.apartment}`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.paymentEvents.length > 0) {
                const payments = data.paymentEvents;
                const totalAmount = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
                const paidPayments = payments.filter(
                  (p: Payment) => p.status === 'paid' || p.status === 'approved'
                );
                const paidAmount = paidPayments.reduce(
                  (sum: number, p: Payment) => sum + p.amount,
                  0
                );
                const pendingAmount = totalAmount - paidAmount;

                let status: 'paid' | 'partial' | 'pending' = 'pending';
                if (pendingAmount === 0) {
                  status = 'paid';
                } else if (paidAmount > 0) {
                  status = 'partial';
                }

                allPaymentData.push({
                  monthYear,
                  payments,
                  totalAmount,
                  paidAmount,
                  pendingAmount,
                  status,
                });
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch payment events for ${monthYear}:`, err);
          }
        }

        allPaymentData.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
        setPaymentEvents(allPaymentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payment events');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentUser.apartment, monthsToLoad]
  );

  useEffect(() => {
    fetchPaymentEvents();
  }, [fetchPaymentEvents]);

  const loadMoreMonths = async () => {
    setLoadingMore(true);
    const newMonthsToLoad = monthsToLoad + 6; // Load 6 more months
    setMonthsToLoad(newMonthsToLoad);
    await fetchPaymentEvents(newMonthsToLoad);
  };

  const markPaymentAsPaid = async (paymentId: string, receiptFile?: File) => {
    try {
      setUploadingPayment(paymentId);

      let receiptURL = '';
      if (receiptFile) {
        // In a real implementation, you would upload the file to storage
        // For now, we'll simulate this
        receiptURL = `receipt_${paymentId}_${Date.now()}`;
      }

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paid',
          receiptURL,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Payment Updated',
          description: 'Payment has been marked as paid successfully.',
        });
        // Refresh the data
        await fetchPaymentEvents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setUploadingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Events
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={() => fetchPaymentEvents()} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMonthData = paymentEvents.find(
    data => data.monthYear === new Date().toISOString().slice(0, 7)
  );

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="current" className="admin-mobile-tab">
            <Clock className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Current Month</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="admin-mobile-tab">
            <Calendar className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Payment History</span>
          </TabsTrigger>
        </TabsList>

        {/* Current Month Tab */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Month Payment Events</CardTitle>
              <CardDescription>
                Maintenance fees and payment events for {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentMonthData ? (
                <div className="space-y-4">
                  {/* Status Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Total Amount</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{currentMonthData.totalAmount}
                      </p>
                      <p className="text-sm text-blue-700">Monthly charges</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Paid Amount</h4>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{currentMonthData.paidAmount}
                      </p>
                      <p className="text-sm text-green-700">Completed payments</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900">Pending Amount</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        ₹{currentMonthData.pendingAmount}
                      </p>
                      <p className="text-sm text-orange-700">Outstanding balance</p>
                    </div>
                  </div>

                  {/* Payment Events List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Payment Events</h4>
                    {currentMonthData.payments.map(payment => (
                      <PaymentEventCard
                        key={payment.id}
                        payment={payment}
                        onMarkAsPaid={markPaymentAsPaid}
                        uploading={uploadingPayment === payment.id}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment events for this month.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment events will appear here when generated by the admin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Complete history of your payment events for apartment {currentUser.apartment}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentEvents.length > 0 ? (
                <div className="space-y-4">
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden space-y-4">
                    {paymentEvents.map(monthData => (
                      <Card key={monthData.monthYear} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {format(new Date(monthData.monthYear + '-01'), 'MMMM yyyy')}
                            </h4>
                            <Badge
                              variant={
                                monthData.status === 'paid'
                                  ? 'default'
                                  : monthData.status === 'partial'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {monthData.status === 'paid'
                                ? 'Paid'
                                : monthData.status === 'partial'
                                  ? 'Partial'
                                  : 'Pending'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <p className="font-medium">₹{monthData.totalAmount}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Paid:</span>
                              <p className="font-medium text-green-600">₹{monthData.paidAmount}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Events</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Paid Amount</TableHead>
                          <TableHead>Pending Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentEvents.map(monthData => (
                          <TableRow key={monthData.monthYear}>
                            <TableCell className="font-medium">
                              {format(new Date(monthData.monthYear + '-01'), 'MMMM yyyy')}
                            </TableCell>
                            <TableCell>{monthData.payments.length}</TableCell>
                            <TableCell>₹{monthData.totalAmount}</TableCell>
                            <TableCell className="text-green-600">
                              ₹{monthData.paidAmount}
                            </TableCell>
                            <TableCell className="text-orange-600">
                              ₹{monthData.pendingAmount}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  monthData.status === 'paid'
                                    ? 'default'
                                    : monthData.status === 'partial'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {monthData.status === 'paid'
                                  ? 'Paid'
                                  : monthData.status === 'partial'
                                    ? 'Partial'
                                    : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Load More Button */}
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      onClick={loadMoreMonths}
                      disabled={loadingMore}
                      className="w-full md:w-auto"
                    >
                      {loadingMore ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" /> Loading more months...
                        </>
                      ) : (
                        <>
                          Load More Months <Calendar className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Currently showing {monthsToLoad} months
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment history found.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your payment history will appear here once payment events are generated.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Payment Event Card Component
function PaymentEventCard({
  payment,
  onMarkAsPaid,
  uploading,
}: {
  payment: Payment;
  onMarkAsPaid: (paymentId: string, receiptFile?: File) => void;
  uploading: boolean;
}) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isPaid = payment.status === 'paid' || payment.status === 'approved';

  const handleMarkAsPaid = () => {
    onMarkAsPaid(payment.id, receiptFile || undefined);
    setDialogOpen(false);
    setReceiptFile(null);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
      <div className="flex-1">
        <h4 className="font-medium">{payment.reason || 'Maintenance Fee'}</h4>
        <p className="text-sm text-muted-foreground">₹{payment.amount}</p>
        <p className="text-xs text-muted-foreground">
          Created: {payment.createdAt ? format(new Date(payment.createdAt), 'MMM dd, yyyy') : 'N/A'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isPaid ? (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Paid
            </Badge>
            {payment.receiptURL && (
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={uploading}>
                  {uploading ? <Spinner className="h-4 w-4" /> : 'Mark Paid'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Payment as Paid</DialogTitle>
                  <DialogDescription>
                    Confirm that you have paid ₹{payment.amount} for{' '}
                    {payment.reason || 'maintenance fee'}. You can optionally upload a receipt for
                    your records.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receipt">Receipt (Optional)</Label>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a receipt or proof of payment
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkAsPaid}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
