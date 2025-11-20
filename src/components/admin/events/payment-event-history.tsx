'use client';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar, Download, Filter, History } from 'lucide-react';

import { useState } from 'react';

import type { Payment, User } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentStatusButton } from '@/components/ui/payment-status-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Extend jsPDF type to include autoTable
interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY?: number;
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number;
    fontSize?: number;
    fontStyle?: string;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  margin?: { top?: number };
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

interface PaymentEventHistoryProps {
  currentUser: {
    id: string;
    apartment: string;
    role?: string;
  };
  users: User[];
  historyData?: PaymentEventData[];
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export interface PaymentEventData {
  monthYear: string;
  paymentEvents: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
}

export function PaymentEventHistory({
  currentUser,
  users,
  historyData = [],
  loading = false,
  error = null,
  onLoadMore,
  loadingMore = false,
}: PaymentEventHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const getFilteredData = () => {
    let filtered = historyData;

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(data => data.monthYear === selectedMonth);
    }

    return filtered;
  };

  const exportToPDF = () => {
    const filteredData = getFilteredData();
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Payment Events History', 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 32);

    // Prepare table data
    const headers = [['Month', 'Payment ID', 'Apartment', 'Payer', 'Amount', 'Status', 'Reason']];
    const data: string[][] = [];

    filteredData.forEach(monthData => {
      monthData.paymentEvents.forEach(payment => {
        const payer = users.find(u => u.id === payment.payerId);
        data.push([
          monthData.monthYear,
          payment.id,
          payment.apartmentId || 'N/A',
          payer?.name || payment.payerId,
          `Rs. ${payment.amount}`,
          payment.status,
          payment.reason || 'N/A',
        ]);
      });
    });

    // Generate table
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 40 },
    });

    // Save the PDF
    doc.save(`payment-events-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const clearFilters = () => {
    setSelectedMonth('all');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment Event History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment Event History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          {/* Retry functionality removed - parent component controls data fetching */}
        </CardContent>
      </Card>
    );
  }

  const filteredData = getFilteredData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Payment Event History
        </CardTitle>
        <CardDescription>
          Historical view of maintenance fee payment events
          {currentUser.role !== 'admin' && ` for ${currentUser.apartment}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="month-filter" className="text-sm font-medium whitespace-nowrap">
              Filter by Month:
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]" id="month-filter">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {historyData.map(data => (
                  <SelectItem key={data.monthYear} value={data.monthYear}>
                    {format(new Date(data.monthYear + '-01'), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMonth !== 'all' && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <Button variant="outline" onClick={exportToPDF} disabled={filteredData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Summary Cards */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Total Months</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredData.length}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">With payment events</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Total Paid</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{filteredData.reduce((sum, data) => sum + data.paidAmount, 0)}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Across all months</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-100">Total Pending</h4>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ₹{filteredData.reduce((sum, data) => sum + data.pendingAmount, 0)}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Outstanding amount</p>
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {filteredData.length > 0 ? (
          <div className="space-y-4">
            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-4">
              {filteredData.map(monthData => (
                <Card key={monthData.monthYear} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {format(new Date(monthData.monthYear + '-01'), 'MMMM yyyy')}
                      </h4>
                      <PaymentStatusButton
                        isPaid={monthData.pendingAmount === 0}
                        readOnly
                        labelPaid="Complete"
                        labelUnpaid="Pending"
                      />
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
                      <div>
                        <span className="text-muted-foreground">Events:</span>
                        <p className="font-medium">{monthData.paymentEvents.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <p className="font-medium text-red-600">₹{monthData.pendingAmount}</p>
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
                  {filteredData.map(monthData => (
                    <TableRow key={monthData.monthYear}>
                      <TableCell className="font-medium">
                        {format(new Date(monthData.monthYear + '-01'), 'MMMM yyyy')}
                      </TableCell>
                      <TableCell>{monthData.paymentEvents.length}</TableCell>
                      <TableCell>₹{monthData.totalAmount}</TableCell>
                      <TableCell className="text-green-600">₹{monthData.paidAmount}</TableCell>
                      <TableCell className="text-red-600">₹{monthData.pendingAmount}</TableCell>
                      <TableCell>
                        <PaymentStatusButton
                          isPaid={monthData.pendingAmount === 0}
                          readOnly
                          labelPaid="Complete"
                          labelUnpaid="Pending"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Load More Button */}
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loadingMore || !onLoadMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Loading more months...
                  </>
                ) : (
                  <>
                    Load More Months
                    <Calendar className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Currently showing {historyData.length} month{historyData.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No payment event history found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Payment events will appear here once they are generated.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
