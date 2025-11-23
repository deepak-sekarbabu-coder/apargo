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
import { format } from 'date-fns';
import { ArrowUpDown, Download } from 'lucide-react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

import * as React from 'react';

import type { Payment } from '@/lib/core/types';
import { aggregateBalanceSheets } from '@/lib/expense-management/balance-utils';

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

import { useIsMobile } from '@/hooks/use-mobile';

interface MonthlyBalanceSheetProps {
  payments: Payment[];
}

// Memoized Balance Sheet Card Component
const BalanceSheetCard = React.memo(
  ({ sheet }: { sheet: ReturnType<typeof aggregateBalanceSheets>[0] }) => {
    return (
      <Card className="p-4 sm:p-6 rounded-lg shadow-sm border-border/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">{sheet.monthYear}</h3>
            </div>
            <Badge
              variant={sheet.closing >= 0 ? 'default' : 'destructive'}
              className="text-sm font-medium px-3 py-1"
            >
              {sheet.closing >= 0 ? '₹+' : '₹-'}
              {Math.abs(sheet.closing)}
            </Badge>
          </div>

          {/* Responsive Grid for Balance Details */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Opening</span>
              <p className="font-medium text-base">₹{sheet.opening}</p>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Income</span>
              <p className="font-medium text-base text-green-600">₹{sheet.income}</p>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Expenses
              </span>
              <p className="font-medium text-base text-red-600">₹{sheet.expenses}</p>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Net Change
              </span>
              <p
                className={`font-medium text-base ${sheet.closing >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {sheet.closing >= 0 ? '+₹' : '-₹'}
                {Math.abs(sheet.closing)}
              </p>
            </div>
          </div>

          {/* Progress Bar for Visual Representation */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Financial Overview</span>
              <span>
                ₹{sheet.income} - ₹{sheet.expenses} = ₹{sheet.closing}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  sheet.closing >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(
                    (Math.abs(sheet.closing) /
                      (Math.abs(sheet.income) +
                        Math.abs(sheet.expenses) +
                        Math.abs(sheet.closing) +
                        1)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

BalanceSheetCard.displayName = 'BalanceSheetCard';

interface BalanceSheet {
  monthYear: string;
  opening: number;
  income: number;
  expenses: number;
  closing: number;
}

const VirtualizedBalanceSheetList = ({ sheets }: { sheets: BalanceSheet[] }) => {
  const listRef = React.useRef<List>(null);
  const sizeMap = React.useRef<{ [index: number]: number }>({});

  // Reset cache when sheets change
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [sheets]);

  const getItemSize = (index: number) => {
    return sizeMap.current[index] || 300; // Default estimate for card height
  };

  const setItemSize = (index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const sheet = sheets[index];
    const rowRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (rowRef.current) {
        setItemSize(index, rowRef.current.getBoundingClientRect().height + 16); // +16 for gap
      }
    }, [index]);

    return (
      <div style={style}>
        <div ref={rowRef} className="pb-4">
          <BalanceSheetCard sheet={sheet} />
        </div>
      </div>
    );
  };

  if (sheets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">No balance sheets available yet.</div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] w-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={sheets.length}
            itemSize={getItemSize}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export function MonthlyBalanceSheet({ payments }: MonthlyBalanceSheetProps) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // PDF export for balance sheets
  const handleExportBalanceSheetsPDF = React.useCallback(async () => {
    try {
      // Dynamically import jsPDF and autoTable to reduce bundle size
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text('Monthly Balance Sheets', 14, 22);

      // Add date
      doc.setFontSize(11);
      doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 32);

      // Calculate income and expenses from approved payments only (consistent with UI display)
      const incomeMap = new Map<string, number>();
      const expensesMap = new Map<string, number>();

      payments
        // Include both explicitly approved and paid payments in balance calculations
        .filter(p => p.status === 'approved' || p.status === 'paid')
        .forEach(p => {
          const category = p.category || (p.expenseId ? 'expense' : 'income');
          const amt = p.amount || 0;

          if (category === 'expense') {
            const current = expensesMap.get(p.monthYear) || 0;
            expensesMap.set(p.monthYear, current + amt);
          } else {
            const current = incomeMap.get(p.monthYear) || 0;
            incomeMap.set(p.monthYear, current + amt);
          }
        });

      // Get all months that have either income or expenses
      const months = new Set<string>([...incomeMap.keys(), ...expensesMap.keys()]);

      // Prepare table data
      const headers = [['Month', 'Opening', 'Income', 'Expenses', 'Closing']];
      const data: string[][] = Array.from(months)
        .sort()
        .map(monthYear => {
          const opening = 0;
          const income = incomeMap.get(monthYear) || 0;
          const expenses = expensesMap.get(monthYear) || 0;
          const closing = opening + income - expenses;
          return [
            monthYear,
            `Rs. ${opening}`,
            `Rs. ${income}`,
            `Rs. ${expenses}`,
            `Rs. ${closing}`,
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
      doc.save(`balance-sheets-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Could show a toast notification here if needed
    }
  }, [payments]);

  // aggregated view of balance sheets by month (used for UI)
  const aggregatedSheets = React.useMemo(() => aggregateBalanceSheets(payments), [payments]);

  // Define columns for React Table
  const columns: ColumnDef<BalanceSheet>[] = [
    {
      accessorKey: 'monthYear',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Month
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'opening',
      header: 'Opening',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => {
        const amount = row.getValue('opening');
        return <div>₹{amount}</div>;
      },
    },
    {
      accessorKey: 'income',
      header: 'Income',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => {
        const amount = row.getValue('income');
        return <div className="text-green-600 font-medium">₹{amount}</div>;
      },
    },
    {
      accessorKey: 'expenses',
      header: 'Expenses',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => {
        const amount = row.getValue('expenses');
        return <div className="text-red-600 font-medium">₹{amount}</div>;
      },
    },
    {
      accessorKey: 'closing',
      header: 'Closing',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => {
        const amount = row.getValue('closing');
        return (
          <Badge
            variant={amount >= 0 ? 'default' : 'destructive'}
            className="font-medium px-3 py-1"
          >
            {amount >= 0 ? '₹+' : '₹-'}
            {Math.abs(amount)}
          </Badge>
        );
      },
    },
  ];

  // Initialize React Table
  const table = useReactTable({
    data: aggregatedSheets,
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Monthly Balance Sheets</CardTitle>
            <CardDescription>Summary of balances per apartment per month.</CardDescription>
          </div>
          <Button
            onClick={handleExportBalanceSheetsPDF}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile Card Layout for Monthly Balance Sheets (Virtualized) */}
        {isMobile && (
          <VirtualizedBalanceSheetList sheets={table.getRowModel().rows.map(row => row.original)} />
        )}

        {/* Desktop Table Layout for Monthly Balance Sheets */}
        {!isMobile && (
          <div>
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
                      <TableRow key={row.id} className="hover:bg-muted/50">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center text-muted-foreground py-12"
                      >
                        <div className="space-y-2">
                          <p>No balance sheets available yet.</p>
                          <p className="text-sm">
                            Balance sheets will appear once there are payments and expenses.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Desktop Summary Stats */}
            {aggregatedSheets.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Months</p>
                  <p className="text-2xl font-bold">{aggregatedSheets.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{aggregatedSheets.reduce((sum, sheet) => sum + sheet.income, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{aggregatedSheets.reduce((sum, sheet) => sum + sheet.expenses, 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
