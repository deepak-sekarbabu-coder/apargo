import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import * as React from 'react';

import type { User } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddPaymentDialogProps {
  users: User[];
  onAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
    category?: 'income' | 'expense';
  }) => void;
  children: React.ReactNode;
}

export function AddPaymentDialog({ users, onAddPayment, children }: AddPaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [payeeId, setPayeeId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [receiptFile, setReceiptFile] = React.useState<File | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [expenseId, setExpenseId] = React.useState<string | undefined>(undefined);
  const [category, setCategory] = React.useState<'income' | 'expense'>('income');
  const [reason, setReason] = React.useState('');

  const selectedPayee = users.find(u => u.id === payeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeId || !amount || !selectedDate) return;

    const monthYear = format(selectedDate, 'yyyy-MM');
    const paymentData: {
      payeeId: string;
      amount: number;
      receiptFile?: File;
      monthYear: string;
      expenseId?: string;
      category?: 'income' | 'expense';
      reason?: string;
    } = {
      payeeId,
      amount: Number(amount),
      receiptFile,
      monthYear,
      category,
    };
    // Only add expenseId if it is a non-empty string
    if (expenseId && typeof expenseId === 'string' && expenseId.trim() !== '') {
      paymentData.expenseId = expenseId;
    }
    // Add reason to paymentData if the category is 'expense'
    if (category === 'expense' && reason.trim() !== '') {
      paymentData.reason = reason;
    }
    onAddPayment(paymentData);
    setOpen(false);
    setPayeeId('');
    setAmount('');
    setReceiptFile(undefined);
    setSelectedDate(undefined);
    setExpenseId(undefined);
    setCategory('income');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Category</label>
            <div role="radiogroup" aria-label="Category" className="flex gap-6">
              <label className="inline-flex items-center space-x-3 cursor-pointer touch-manipulation p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="category"
                  value="income"
                  checked={category === 'income'}
                  onChange={() => setCategory('income')}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Income</span>
              </label>
              <label className="inline-flex items-center space-x-3 cursor-pointer touch-manipulation p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="category"
                  value="expense"
                  checked={category === 'expense'}
                  onChange={() => setCategory('expense')}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Expense</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Payee</label>
            <Select value={payeeId} onValueChange={setPayeeId} required>
              <SelectTrigger className="w-full h-12 text-base touch-manipulation">
                <SelectValue placeholder="Select Payee" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id} className="py-3 text-base">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPayee && (
              <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 text-sm font-medium border border-blue-200 dark:border-blue-800">
                Apartment: <span className="font-semibold">{selectedPayee.apartment}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="h-12 text-base touch-manipulation"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Month & Year</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12 text-base touch-manipulation"
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Select month and year'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="top">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={date => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(undefined)}
                  className="h-12 px-4 touch-manipulation"
                  type="button"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Receipt (optional)</label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={e => setReceiptFile(e.target.files?.[0])}
              className="h-12 text-base touch-manipulation"
            />
            {receiptFile && (
              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-lg">
                Selected: {receiptFile.name}
              </p>
            )}
          </div>
          {category === 'expense' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Reason</label>
              <Input
                type="text"
                maxLength={100}
                placeholder="Enter reason (100 characters max)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="h-12 text-base touch-manipulation"
              />
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-2 pt-4">
            <Button
              type="submit"
              disabled={!payeeId || !amount || !selectedDate}
              className="w-full h-12 text-base font-medium touch-manipulation"
            >
              Add Payment
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setOpen(false);
                setPayeeId('');
                setAmount('');
                setReceiptFile(undefined);
                setSelectedDate(undefined);
                setExpenseId(undefined);
                setReason('');
              }}
              className="w-full h-12 text-base font-medium touch-manipulation"
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


