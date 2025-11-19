import * as React from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

import { aggregateBalanceSheets } from '@/lib/expense-management/balance-utils';
import type { Payment } from '@/lib/core/types';

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

interface MonthlyBalanceSheetProps {
    payments: Payment[];
}

export function MonthlyBalanceSheet({ payments }: MonthlyBalanceSheetProps) {
    // PDF export for balance sheets
    const handleExportBalanceSheetsPDF = React.useCallback(async () => {
        try {
            // Dynamically import jsPDF and autoTable to reduce bundle size
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
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
                    return [monthYear, `Rs. ${opening}`, `Rs. ${income}`, `Rs. ${expenses}`, `Rs. ${closing}`];
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
                {/* Mobile Card Layout for Monthly Balance Sheets (aggregated) */}
                <div className="block lg:hidden space-y-4">
                    {aggregatedSheets.map(sheet => (
                        <Card
                            key={sheet.monthYear}
                            className="p-4 sm:p-6 rounded-lg shadow-sm border-border/60"
                        >
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
                                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                            Opening
                                        </span>
                                        <p className="font-medium text-base">₹{sheet.opening}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                            Income
                                        </span>
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
                                            className={`h-2 rounded-full transition-all duration-300 ${sheet.closing >= 0 ? 'bg-green-500' : 'bg-red-500'
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
                    ))}
                    {aggregatedSheets.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No balance sheets available yet.</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Balance sheets will appear once there are payments and expenses.
                            </p>
                        </div>
                    )}
                </div>

                {/* Desktop Table Layout for Monthly Balance Sheets (aggregated) */}
                <div className="hidden lg:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-semibold">Month</TableHead>
                                <TableHead className="font-semibold">Opening</TableHead>
                                <TableHead className="font-semibold">Income</TableHead>
                                <TableHead className="font-semibold">Expenses</TableHead>
                                <TableHead className="font-semibold">Closing</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedSheets.map(sheet => (
                                <TableRow key={sheet.monthYear} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{sheet.monthYear}</TableCell>
                                    <TableCell>₹{sheet.opening}</TableCell>
                                    <TableCell className="text-green-600 font-medium">
                                        ₹{sheet.income}
                                    </TableCell>
                                    <TableCell className="text-red-600 font-medium">
                                        ₹{sheet.expenses}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={sheet.closing >= 0 ? 'default' : 'destructive'}
                                            className="font-medium px-3 py-1"
                                        >
                                            {sheet.closing >= 0 ? '₹+' : '₹-'}
                                            {Math.abs(sheet.closing)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {aggregatedSheets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
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
            </CardContent>
        </Card>
    );
}
