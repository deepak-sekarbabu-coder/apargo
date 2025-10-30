import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowUpDown, Check, Download, Eye, PlusCircle, Trash2, X } from 'lucide-react';

import * as React from 'react';

import { Payment, User } from '@/lib/types';

import AddPaymentDialog from '@/components/dialogs/add-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface PaymentsTableProps {
  payments: Payment[];
  users: User[];
  currentUser: User;
  onAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
  }) => Promise<void>;
  onApprovePayment: (paymentId: string) => Promise<void>;
  onRejectPayment: (paymentId: string) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
}

// Memoized Payment Card Component
const PaymentCard = React.memo(({ 
  payment, 
  users, 
  currentUser, 
  onApprovePayment, 
  onRejectPayment, 
  columnVisibility,
  isDeleting,
  setDeleteId
}: {
  payment: Payment;
  users: User[];
  currentUser: User;
  onApprovePayment: (paymentId: string) => Promise<void>;
  onRejectPayment: (paymentId: string) => Promise<void>;
  columnVisibility: VisibilityState;
  isDeleting: boolean;
  setDeleteId: (id: string | null) => void;
}) => {
  const payer = users.find(u => u.id === payment.payerId);
  const category = payment.category || (payment.expenseId ? 'expense' : 'income');
  const amountFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(payment.amount);

  // Column visibility flags
  const showApartment = columnVisibility.apartment !== false;
  const showOwner = columnVisibility.owner !== false;
  const showCategory = columnVisibility.category !== false;
  const showAmount = columnVisibility.amount !== false;
  const showStatus = columnVisibility.status !== false;
  const showReason = columnVisibility.reason !== false;
  const showApprovedBy = columnVisibility.approvedBy !== false;
  const showReceipt = columnVisibility.receiptURL !== false;
  const showMonth = columnVisibility.monthYear !== false;
  const showActions = currentUser.role === 'admin' && columnVisibility.actions !== false;

  // Approved By display (reuse logic from column)
  let approvedByDisplay = '';
  if (payment.approvedByName) {
    approvedByDisplay = payment.approvedByName;
  } else if (payment.approvedBy === currentUser.id && currentUser.role === 'admin') {
    approvedByDisplay = currentUser.name;
  } else {
    const approver = users.find(u => u.id === payment.approvedBy);
    if (approver && approver.role === 'admin') approvedByDisplay = approver.name;
  }

  return (
    <Card className="p-3 sm:p-4 rounded-lg shadow-sm border-border/60" data-testid="payment-card">
      <div className="space-y-3 sm:space-y-4">
        {/* Header: Apartment / Owner (if visible) & Amount / Status */}
        {(showApartment || showOwner || showAmount || showStatus) && (
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="text-sm space-y-1 min-w-0 flex-1">
              {showApartment && (
                <p className="font-medium text-base truncate">{payer?.apartment || '-'}</p>
              )}
              {showOwner && (
                <p className="text-xs text-muted-foreground truncate">
                  {payer?.name || payment.payerId}
                </p>
              )}
            </div>
            <div className="text-right space-y-1 flex-shrink-0">
              {showAmount && (
                <p className="font-medium text-sm sm:text-base">{amountFormatted}</p>
              )}
              {showStatus && (
                <Badge
                  variant={
                    payment.status === 'approved' || payment.status === 'paid'
                      ? 'default'
                      : payment.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="capitalize text-xs px-2 py-1"
                >
                  {payment.status}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Details grid for remaining visible fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {showCategory && (
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Category:</span>
              <p className="font-medium capitalize truncate">{category}</p>
            </div>
          )}
          {showMonth && (
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Month:</span>
              <p className="font-medium truncate">{payment.monthYear}</p>
            </div>
          )}
          {showReason && payment.reason && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-muted-foreground text-xs">Reason:</span>
              <p className="font-medium text-sm break-words">{payment.reason}</p>
            </div>
          )}
          {showReceipt && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-muted-foreground text-xs">Receipt:</span>
              <div className="flex items-center gap-2">
                {payment.receiptURL ? (
                  <a
                    href={payment.receiptURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View receipt"
                    className="inline-flex items-center justify-center rounded hover:bg-muted p-2 touch-manipulation"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="sr-only">View receipt</span>
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No receipt</p>
                )}
              </div>
            </div>
          )}
          {showApprovedBy && approvedByDisplay && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-muted-foreground text-xs">Approved By:</span>
              <p className="font-medium text-sm truncate">{approvedByDisplay}</p>
            </div>
          )}
        </div>

        {/* Actions (if column toggled on) */}
        {showActions && (
          <div className="pt-3 border-t border-border/60">
            {payment.status === 'pending' ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onApprovePayment(payment.id)}
                  className="touch-manipulation h-11"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRejectPayment(payment.id)}
                  className="touch-manipulation h-11"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {payment.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 touch-manipulation h-10 px-3"
                  onClick={() => setDeleteId(payment.id)}
                  disabled={isDeleting}
                  aria-label="Delete payment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

PaymentCard.displayName = 'PaymentCard';

// Virtualized list component for mobile
const VirtualizedPaymentList = ({ 
  payments, 
  users, 
  currentUser, 
  onApprovePayment, 
  onRejectPayment, 
  onDeletePayment,
  columnVisibility,
  isDeleting,
  setDeleteId
}: {
  payments: Payment[];
  users: User[];
  currentUser: User;
  onApprovePayment: (paymentId: string) => Promise<void>;
  onRejectPayment: (paymentId: string) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  columnVisibility: VisibilityState;
  isDeleting: boolean;
  setDeleteId: (id: string | null) => void;
}) => {
  const [visiblePayments, setVisiblePayments] = React.useState<Payment[]>(payments.slice(0, 20));
  const [loadedCount, setLoadedCount] = React.useState(20);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Reset when payments change
  React.useEffect(() => {
    setVisiblePayments(payments.slice(0, 20));
    setLoadedCount(20);
  }, [payments]);

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    if (!listRef.current || loadedCount >= payments.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && loadedCount < payments.length) {
          const nextCount = Math.min(loadedCount + 20, payments.length);
          setVisiblePayments(payments.slice(0, nextCount));
          setLoadedCount(nextCount);
        }
      },
      { threshold: 1.0 }
    );

    const sentinel = listRef.current;
    observer.observe(sentinel);

    return () => observer.unobserve(sentinel);
  }, [loadedCount, payments]);

  if (payments.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No payments found.</div>;
  }

  return (
    <div className="space-y-4">
      {visiblePayments.map(payment => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          users={users}
          currentUser={currentUser}
          onApprovePayment={onApprovePayment}
          onRejectPayment={onRejectPayment}
          columnVisibility={columnVisibility}
          isDeleting={isDeleting}
          setDeleteId={setDeleteId}
        />
      ))}
      {loadedCount < payments.length && (
        <div ref={listRef} className="py-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};

export function PaymentsTable({
  payments,
  users,
  currentUser,
  onAddPayment,
  onApprovePayment,
  onRejectPayment,
  onDeletePayment,
}: PaymentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  // Default visibility: show only Apartment, Category, Amount, Status, Reason, Month
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    apartment: true,
    category: true,
    amount: true,
    status: true,
    reason: true,
    monthYear: true,
    owner: true,
    approvedBy: false,
    receiptURL: true,
    actions: false, // hidden for admin by default
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isMobile = useIsMobile();

  // Helper to get user name by ID
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  // Delete payment handler
  const handleDeletePayment = async (paymentId: string) => {
    setIsDeleting(true);
    try {
      await onDeletePayment(paymentId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Payment>[] = [
    {
      id: 'apartment',
      header: 'Apartment',
      accessorFn: row => users.find(u => u.id === (row as Payment).payerId)?.apartment || '',
      cell: ({ row }) => {
        const value = row.getValue('apartment') as string;
        return value || '';
      },
    },
    {
      accessorKey: 'receiptURL',
      header: 'Receipt',
      cell: ({ row }: { row: { original: Payment } }) => {
        const payment = row.original;
        return payment.receiptURL ? (
          <a
            href={payment.receiptURL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View receipt"
            className="inline-flex items-center justify-center rounded hover:bg-muted p-1"
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: { row: { original: Payment } }) => {
        const payment = row.original;
        const category = payment.category || (payment.expenseId ? 'expense' : 'income');
        return <span className="capitalize">{category}</span>;
      },
    },
    {
      id: 'owner',
      header: 'Owner',
      accessorFn: row => getUserName(row.payerId),
      cell: ({ row }) => {
        const value = row.getValue('owner') as string;
        return value || '';
      },
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const amount = parseFloat(row.getValue('amount'));
        const formatted = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(amount);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={
              status === 'approved' || status === 'paid'
                ? 'default'
                : status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
            }
            className="capitalize"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }: { row: { original: Payment } }) => {
        const payment = row.original;
        return payment.reason || '-';
      },
    },
    {
      accessorKey: 'approvedBy',
      header: 'Approved By',
      cell: ({ row }: { row: { original: Payment } }) => {
        const payment = row.original;
        // Show approver name if available
        if (payment.approvedByName) {
          return payment.approvedByName;
        }
        if (payment.approvedBy === currentUser.id && currentUser.role === 'admin') {
          return currentUser.name;
        }
        const approver = users.find(u => u.id === payment.approvedBy);
        if (!approver) return '';
        if (approver.role === 'admin') {
          return approver.name;
        }
        return '';
      },
    },
    {
      accessorKey: 'monthYear',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Month
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }: { row: { original: Payment } }) => {
              const payment = row.original;
              return (
                <div className="flex gap-2 justify-end">
                  {payment.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onApprovePayment(payment.id)}
                        aria-label={`Approve payment ${payment.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRejectPayment(payment.id)}
                        aria-label={`Reject payment ${payment.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteId(payment.id)}
                    disabled={isDeleting}
                    aria-label={`Delete payment ${payment.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const table = useReactTable({
    data: payments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleExportPaymentsPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Ledger Payments Report', 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

    // Prepare table data
    const headers = [
      ['Apartment', 'Owner', 'Category', 'Amount', 'Status', 'Month', 'Approved By'],
    ];
    const data: string[][] = payments.map(p => {
      const payer = users.find(u => u.id === p.payerId);
      const category = p.category || (p.expenseId ? 'expense' : 'income');
      const approvedBy =
        p.approvedBy && users.find(u => u.id === p.approvedBy)?.role === 'admin'
          ? getUserName(p.approvedBy)
          : '';

      return [
        payer?.apartment || '',
        payer ? payer.name : p.payerId,
        category,
        `Rs. ${p.amount}`,
        p.status,
        p.monthYear,
        approvedBy,
      ];
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
    doc.save(`ledger-payments-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="w-full">
      {/* Table Controls */}
      <div className="space-y-4 mb-6">
        {/* Search and Primary Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="apartment-filter" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="apartment-filter"
              placeholder="Filter by apartment..."
              value={(table.getColumn('apartment')?.getFilterValue() as string) ?? ''}
              onChange={event => table.getColumn('apartment')?.setFilterValue(event.target.value)}
              className="w-full touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Owner</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between touch-manipulation h-10">
                  {(table.getColumn('owner')?.getFilterValue() as string) || 'All Owners'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuRadioGroup
                  value={(table.getColumn('owner')?.getFilterValue() as string) ?? ''}
                  onValueChange={value =>
                    table.getColumn('owner')?.setFilterValue(value === 'all' ? null : value)
                  }
                >
                  <DropdownMenuRadioItem value="all">All Owners</DropdownMenuRadioItem>
                  {Array.from(new Set(payments.map(p => getUserName(p.payerId)))).map(owner => (
                    <DropdownMenuRadioItem key={owner} value={owner}>
                      {owner}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between touch-manipulation h-10">
                  {(table.getColumn('status')?.getFilterValue() as string) || 'All Statuses'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuRadioGroup
                  value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
                  onValueChange={value =>
                    table.getColumn('status')?.setFilterValue(value === 'all' ? null : value)
                  }
                >
                  <DropdownMenuRadioItem value="all">All Statuses</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="approved">Approved</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Column Visibility and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="touch-manipulation h-10 px-4">
                  <span className="sr-only sm:not-sr-only sm:mr-2">Columns</span>
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <AddPaymentDialog users={users} onAddPayment={onAddPayment}>
              <Button className="touch-manipulation h-10 w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Add Payment</span>
                <span className="sm:hidden ml-2">Add</span>
              </Button>
            </AddPaymentDialog>
            <Button
              onClick={handleExportPaymentsPDF}
              variant="outline"
              className="touch-manipulation h-10 w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Export PDF</span>
              <span className="sm:hidden ml-2">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout (Virtualized for performance) */}
      {isMobile && (
        <div className="block">
          <VirtualizedPaymentList
            payments={table.getRowModel().rows.map(row => row.original)}
            users={users}
            currentUser={currentUser}
            onApprovePayment={onApprovePayment}
            onRejectPayment={onRejectPayment}
            onDeletePayment={onDeletePayment}
            columnVisibility={columnVisibility}
            isDeleting={isDeleting}
            setDeleteId={setDeleteId}
          />
        </div>
      )}

      {/* Desktop Table Layout */}
      {!isMobile && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Pagination and Results Info */}
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {payments.length} payments
          {table.getFilteredRowModel().rows.length !== payments.length && (
            <span className="ml-2">
              (filtered from {payments.length} total)
            </span>
          )}
        </div>
        
        {/* Mobile-Optimized Pagination */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:justify-start sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Page</span>
              <span className="text-sm font-medium">
                {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="touch-manipulation flex-1 sm:flex-none h-10 px-4"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="touch-manipulation flex-1 sm:flex-none h-10 px-4"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog - Enhanced Mobile */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto">
            <h2 className="text-lg font-semibold mb-3">Delete Payment</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="touch-manipulation h-11 px-6 flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeletePayment(deleteId)}
                disabled={isDeleting}
                className="touch-manipulation h-11 px-6 flex-1 sm:flex-none"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}