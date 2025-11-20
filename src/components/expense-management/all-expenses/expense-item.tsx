'use client';

import { format } from 'date-fns';
import { Receipt, Trash2, Users } from 'lucide-react';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import {
  calculateExpenseAmounts,
  markApartmentAsPaid,
  markApartmentAsUnpaid,
} from '@/lib/expense-management/expense-utils';
import { updateExpense } from '@/lib/firestore/expenses';
import type { Category, Expense, User } from '@/lib/core/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PaymentStatusButton } from '@/components/ui/payment-status-button';

import { useToast } from '@/hooks/use-toast';

interface ExpenseItemProps {
  expense: Expense;
  users: User[];
  categories?: Category[];
  currentUserApartment?: string;
  onExpenseUpdate?: (updatedExpense: Expense) => void;
  currentUserRole?: string; // 'admin' or 'user'
  onExpenseDelete?: (expenseId: string) => void;
}

export function ExpenseItem({
  expense,
  users,
  categories,
  currentUserApartment,
  onExpenseUpdate,
  currentUserRole,
  onExpenseDelete,
}: ExpenseItemProps) {
  const { toast } = useToast();
  const [loadingMap, setLoadingMap] = useState<{ [apartmentId: string]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [optimisticPaidByApartments, setOptimisticPaidByApartments] = useState<string[] | null>(null);

  // Reset optimistic state when expense prop changes
  useEffect(() => {
    setOptimisticPaidByApartments(null);
  }, [expense.id, expense.paidByApartments]);

  // Use optimistic state if available, otherwise use the expense prop
  const effectiveExpense = optimisticPaidByApartments !== null
    ? { ...expense, paidByApartments: optimisticPaidByApartments }
    : expense;

  const calculation = calculateExpenseAmounts(effectiveExpense);

  // Check if this is a no-split expense
  const category = categories?.find(c => c.id === expense.categoryId);
  const isNoSplitExpense = category?.noSplit === true;

  // Helper function to format apartment display with owner(s)
  const formatApartmentWithUsers = (apartmentId: string, showYou: boolean = false) => {
    // Use apartmentId as the apartment name
    const apartmentName = apartmentId;
    // Find owners for this apartment
    const owners = users.filter(
      user =>
        user.apartment === apartmentId &&
        (user.propertyRole === 'owner' || user.propertyRole === 'tenant')
    );
    const ownerNames = owners.map(user => user.name).join(', ');
    const youSuffix = showYou ? ' (You)' : '';
    if (ownerNames) {
      return `${apartmentName} (Owner: ${ownerNames})${youSuffix}`;
    }
    return `${apartmentName}${youSuffix}`;
  };

  const handleMarkPaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    const isPayer = currentUserApartment === expense.paidByApartment;
    const currentUser = users.find(user => user.apartment === currentUserApartment);
    const isOwnerOrTenant =
      currentUser &&
      (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');

    // Allow if: user is owner/tenant of their own apartment, or user is the payer (can mark all)
    if (!isOwnerOrTenant && !isPayer) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));

    // Optimistic update: immediately update local UI state
    const optimisticPaidApartments = markApartmentAsPaid(expense, apartmentId).paidByApartments;
    setOptimisticPaidByApartments(optimisticPaidApartments || null);

    const isUserMarkingOwnPayment = isCurrentUserPayment && !isPayer;

    // Show immediate feedback toast
    toast({
      title: 'Payment Marked',
      description: isUserMarkingOwnPayment
        ? 'Your payment has been marked as paid'
        : `${apartmentId} marked as paid`,
    });

    try {
      const updatedExpense = markApartmentAsPaid(expense, apartmentId);
      // Check if all owing apartments have now paid
      const allPaid = updatedExpense.owedByApartments?.every(id => updatedExpense.paidByApartments?.includes(id)) ?? false;
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments, paid: allPaid });

      // Update the expense with the new paid status
      const finalExpense = { ...updatedExpense, paid: allPaid };

      // Clear optimistic state and update with confirmed data
      setOptimisticPaidByApartments(null);
      onExpenseUpdate?.(finalExpense);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticPaidByApartments(null);
      onExpenseUpdate?.(expense);

      console.error('Failed to update payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };

  const handleMarkUnpaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    const isPayer = currentUserApartment === expense.paidByApartment;
    const currentUser = users.find(user => user.apartment === currentUserApartment);
    const isOwnerOrTenant =
      currentUser &&
      (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');

    // Allow if: user is owner/tenant of their own apartment, or user is the payer (can mark all)
    if (!isOwnerOrTenant && !isPayer) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));

    // Optimistic update: immediately update local UI state
    const optimisticPaidApartments = markApartmentAsUnpaid(expense, apartmentId).paidByApartments;
    setOptimisticPaidByApartments(optimisticPaidApartments || null);

    const isUserMarkingOwnPayment = isCurrentUserPayment && !isPayer;

    // Show immediate feedback toast
    toast({
      title: 'Payment Unmarked',
      description: isUserMarkingOwnPayment
        ? 'Your payment has been marked as unpaid'
        : `${apartmentId} marked as unpaid`,
    });

    try {
      const updatedExpense = markApartmentAsUnpaid(expense, apartmentId);
      // Check if all owing apartments are still paid after this change
      const allPaid = updatedExpense.owedByApartments?.every(id => updatedExpense.paidByApartments?.includes(id)) ?? false;
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments, paid: allPaid });

      // Update the expense with the new paid status
      const finalExpense = { ...updatedExpense, paid: allPaid };

      // Clear optimistic state and update with confirmed data
      setOptimisticPaidByApartments(null);
      onExpenseUpdate?.(finalExpense);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticPaidByApartments(null);
      onExpenseUpdate?.(expense);

      console.error('Failed to update payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };



  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {/* Mobile: Stack everything vertically */}
          <div className="flex items-start gap-3 min-w-0">
            {category?.icon && <CategoryIcon name={category.icon} className="mt-1 flex-shrink-0" />}
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg leading-tight pr-2">
                {expense.description}
              </CardTitle>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  {category && <span className="font-medium text-foreground">{category.name}</span>}
                  {category && <span className="text-muted-foreground">•</span>}
                  <span className="whitespace-nowrap">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </span>
                  {expense.receipt && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Receipt className="h-4 w-4 flex-shrink-0" />
                    </>
                  )}
                  {expense.paid && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="default" className="text-xs bg-green-600">
                        Paid
                      </Badge>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="break-words">
                    Paid by {formatApartmentWithUsers(expense.paidByApartment)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount and actions section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-xl sm:text-2xl font-bold">
                ₹{(Number(expense.amount) || 0).toFixed(2)}
              </div>
              {calculation.adjustedAmount !== calculation.originalAmount && (
                <div className="text-sm text-muted-foreground">
                  Outstanding:{' '}
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    ₹{(Number(calculation.adjustedAmount) || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Admin Delete Button */}
            {currentUserRole === 'admin' && onExpenseDelete && (
              <div className="flex justify-start sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete Expense"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Expense</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this expense? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          onExpenseDelete(expense.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Status Overview - Hidden for no-split expenses */}
        {!isNoSplitExpense && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                {calculation.paidApartments.length} of {expense.owedByApartments?.length || 0} paid
              </span>
            </div>
            <div className="flex justify-start sm:justify-end">
              <Badge
                variant={calculation.unpaidApartments.length === 0 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {calculation.unpaidApartments.length === 0 ? 'Fully Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        )}

        {/* Apartment Payment Status - Hidden for no-split expenses */}
        {!isNoSplitExpense && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Payment Status by Apartment</h4>
            <div className="space-y-3">
              {expense.owedByApartments?.map(apartmentId => {
                // Enable button if:
                // - current user is owner or tenant of this apartment
                // - current user apartment matches this apartment
                // - current user apartment is the payer (can toggle for all)
                const isCurrentUser = currentUserApartment === apartmentId;
                // Get current user info
                const currentUser = users.find(user => user.apartment === currentUserApartment);
                // Check if current user is owner/tenant of this specific apartment
                const isOwnerOrTenantOfThisApartment =
                  isCurrentUser &&
                  currentUser &&
                  (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');
                const isPayer = currentUserApartment === expense.paidByApartment;
                const isPaid = calculation.paidApartments.includes(apartmentId);

                return (
                  <div
                    key={apartmentId}
                    className={`flex flex-col gap-2 p-2 sm:p-3 rounded-lg border transition-all duration-300 ease-in-out ${isPaid
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                      : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                      }`}
                  >
                    {/* Apartment info row */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 transition-colors duration-300 ease-in-out ${isPaid ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'}`}
                      />
                      <span className="text-xs sm:text-sm font-medium break-words flex-1">
                        {formatApartmentWithUsers(apartmentId, isCurrentUser)}
                      </span>
                    </div>

                    {/* Amount and action row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium">
                        ₹{(Number(expense.perApartmentShare) || 0).toFixed(2)}
                      </span>

                      <div className="flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
                        {(isOwnerOrTenantOfThisApartment || isPayer) && (
                          <div className="flex gap-1">
                            <PaymentStatusButton
                              isPaid={isPaid}
                              isLoading={!!loadingMap[apartmentId]}
                              onClick={() => isPaid ? handleMarkUnpaid(apartmentId) : handleMarkPaid(apartmentId)}
                              title={isPayer ? 'Toggle payment status (Payer can mark all)' : 'Toggle payment status'}
                            />
                          </div>
                        )}
                        {!isOwnerOrTenantOfThisApartment && !isPayer && (
                          <Badge variant={isPaid ? 'default' : 'destructive'} className="text-xs">
                            {isPaid ? 'Paid' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt Dialog */}
        {expense.receipt && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                <Receipt className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                <span className="truncate">View Receipt</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] receipt-modal-content mobile-dialog-content mx-auto p-2 sm:p-6 overflow-hidden flex flex-col">
              <DialogHeader className="space-y-2 pb-2 sm:pb-4 flex-shrink-0 receipt-modal-header">
                <DialogTitle className="text-sm sm:text-lg break-words line-clamp-2">
                  Receipt - {expense.description}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Expense from {format(new Date(expense.date), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 receipt-image-container">
                <Image
                  src={expense.receipt}
                  alt="Receipt"
                  width={800}
                  height={600}
                  className="receipt-image rounded-lg border shadow-sm"
                  style={{
                    objectFit: 'contain',
                    maxHeight: 'min(calc(90vh - 150px), calc(90dvh - 150px))',
                    width: 'auto',
                    height: 'auto',
                  }}
                  unoptimized={expense.receipt.startsWith('http')}
                  priority
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
