'use client';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';

import * as React from 'react';

import type { Apartment, Category, Expense, User } from '@/lib/core/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';

import type { ExpensesListProps } from './expenses-list';

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

interface ExpensesViewProps {
  expenses: Expense[];
  categories: Category[];
  apartments: Apartment[];
  users: User[];
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterPaidBy: string;
  setFilterPaidBy: (paidBy: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  filteredExpenses: Expense[];
  expenseMonths: string[];
  onClearFilters: () => void;
  ExpensesList: React.ComponentType<ExpensesListProps>;
  currentUserApartment: string | undefined;
  currentUserRole: string;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
}

export function ExpensesView({
  expenses,
  categories,
  apartments,
  users,
  filterCategory,
  setFilterCategory,
  filterPaidBy,
  setFilterPaidBy,
  filterMonth,
  setFilterMonth,
  filteredExpenses,
  expenseMonths,
  onClearFilters,
  ExpensesList,
  currentUserApartment,
  currentUserRole,
  onExpenseUpdate,
  onExpenseDelete,
}: ExpensesViewProps) {
  const { toast } = useToast();

  // Search-related state and effects removed as we removed the search feature

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Expenses Report', 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 32);

    // Prepare table data
    const headers = [['ID', 'Description', 'Amount', 'Date', 'Paid By', 'Category']];
    const data = expenses.map(expense => {
      const paidByApartment = expense.paidByApartment;
      const apartment = apartments.find(a => a.id === paidByApartment);
      const apartmentName = apartment?.name || paidByApartment;
      const category = categories.find(c => c.id === expense.categoryId)?.name || 'N/A';
      const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');

      return [
        expense.id,
        expense.description,
        `Rs. ${expense.amount}`,
        formattedDate,
        apartmentName,
        category,
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
    doc.save(`expenses-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    toast({
      title: 'Export Successful',
      description: 'Your expenses have been exported to PDF.',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full min-w-0">
              <CardTitle className="text-xl sm:text-2xl">All Expenses</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                A complete log of all shared expenses for your apartment.
              </CardDescription>
            </div>
            {/* Search removed as requested */}
          </div>
          <div className="grid grid-cols-1 gap-3 w-full sm:grid-cols-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      {c.icon && <CategoryIcon name={c.icon} className="h-4 w-4" />}
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaidBy} onValueChange={setFilterPaidBy}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {expenseMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {format(new Date(`${month}-02`), 'MMMM yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="whitespace-nowrap h-9"
                size="sm"
              >
                <FileDown className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </div>
            {(filterMonth !== 'all' || filterCategory !== 'all' || filterPaidBy !== 'all') && (
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="w-full sm:w-auto h-9"
                size="sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ExpensesList
          expenses={filteredExpenses}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          currentUserRole={currentUserRole}
          onExpenseUpdate={onExpenseUpdate}
          onExpenseDelete={onExpenseDelete}
        />
      </CardContent>
    </Card>
  );
}
