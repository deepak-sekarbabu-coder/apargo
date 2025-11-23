import { Check, FileText, X } from 'lucide-react';

import type { Payment, User } from '@/lib/core/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminPaymentsTabProps {
  payments: Payment[];
  getUserById: (id: string) => User | undefined;
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
}

export function AdminPaymentsTab({
  payments,
  getUserById,
  onApprovePayment,
  onRejectPayment,
}: AdminPaymentsTabProps) {
  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <Card className="mx-0 sm:mx-4 md:mx-0">
      <CardHeader className="px-4 py-4 sm:px-6 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Pending Payments</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Review and approve user-initiated payments.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 md:px-6 md:pb-6">
        {/* Mobile Card Layout for Pending Payments - Improved */}
        <div className="block md:hidden space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-base">No pending payments to review.</p>
            </div>
          ) : (
            pendingPayments.map(payment => {
              const payer = getUserById(payment.payerId);
              return (
                <Card key={payment.id} className="shadow-sm border-border/60">
                  <div className="p-4 space-y-4">
                    {/* Header section with apartment and status */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-semibold text-base truncate">
                          {payer
                            ? payer.name || payer.apartment || payment.payerId
                            : payment.payerId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Apartment: {payer ? payer.apartment || 'N/A' : payment.payerId}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs py-1 px-2 ml-2 flex-shrink-0">
                        Pending
                      </Badge>
                    </div>

                    {/* Payment details grid - Simplified */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Type
                          </p>
                          <p className="font-medium">
                            {payment.category
                              ? payment.category === 'income'
                                ? 'Income'
                                : 'Expense'
                              : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Amount
                          </p>
                          <p className="font-bold text-lg">₹{payment.amount}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Reason
                        </p>
                        <p className="text-sm mt-1">{payment.reason || 'No reason provided'}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Receipt
                        </p>
                        {payment.receiptURL ? (
                          <a
                            href={payment.receiptURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm mt-1"
                            aria-label={`View receipt for payment ${payment.id}`}
                          >
                            <FileText className="h-4 w-4" />
                            <span>View Receipt</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm mt-1">
                            No receipt attached
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons - Improved Touch Targets */}
                    <div className="flex gap-3 pt-2 border-t border-border/60">
                      <Button
                        size="sm"
                        className="flex-1 h-11 items-center justify-center bg-green-700 hover:bg-green-800 text-white font-medium"
                        onClick={() => onApprovePayment && onApprovePayment(payment.id)}
                        aria-label={`Approve payment ${payment.id}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-11 items-center justify-center font-medium"
                        onClick={() => onRejectPayment && onRejectPayment(payment.id)}
                        aria-label={`Reject payment ${payment.id}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Desktop Table Layout for Pending Payments */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apartment</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.map(payment => {
                const payer = getUserById(payment.payerId);
                return (
                  <TableRow key={payment.id}>
                    <TableCell>{payer ? payer.apartment || 'N/A' : payment.payerId}</TableCell>
                    <TableCell>
                      {payer ? payer.name || payer.apartment || payment.payerId : payment.payerId}
                    </TableCell>
                    <TableCell>
                      {payment.category
                        ? payment.category === 'income'
                          ? 'Income'
                          : 'Expense'
                        : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{payment.reason || '—'}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>
                      {payment.receiptURL ? (
                        <a
                          href={payment.receiptURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600"
                          aria-label={`View receipt for payment ${payment.id}`}
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onApprovePayment && onApprovePayment(payment.id)}
                        aria-label={`Approve payment ${payment.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRejectPayment && onRejectPayment(payment.id)}
                        className="ml-2"
                        aria-label={`Reject payment ${payment.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pendingPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No pending payments to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
