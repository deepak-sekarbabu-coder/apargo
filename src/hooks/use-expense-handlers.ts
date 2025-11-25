'use client';

import { useQueryClient } from '@tanstack/react-query';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import type { Apartment, Category, Expense, User } from '@/lib/core/types';
import { addExpense, deleteExpense } from '@/lib/firestore/expenses';

import { useToast } from '@/hooks/use-toast';

const logger = getLogger('Hook');

interface UseExpenseHandlersProps {
  user: User | null;
  apartments: Apartment[];
  categories: Category[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  apartmentsLoading: boolean;
}

export function useExpenseHandlers({
  user,
  apartments,
  categories,
  setExpenses,
  apartmentsLoading,
}: UseExpenseHandlersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCategoryById = React.useCallback(
    (id: string) => categories.find(c => c.id === id),
    [categories]
  );

  const handleAddExpense = React.useCallback(
    async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
      if (!user?.apartment) {
        toast({
          title: 'Error',
          description: 'You must belong to an apartment to add an expense',
          variant: 'destructive',
        });
        return;
      }

      // Check if apartments data is loaded
      if (!apartments || apartments.length === 0) {
        logger.warn('handleAddExpense called but apartments array is empty:', {
          apartments,
          apartmentsLoading,
        });
        toast({
          title: 'Error',
          description: 'Apartment data is still loading. Please wait a moment and try again.',
          variant: 'destructive',
        });
        return;
      }

      const payingApartmentId = user.apartment;
      const category = getCategoryById(newExpenseData.categoryId);
      const isNoSplitExpense = category?.noSplit === true;
      let expenseWithApartmentDebts: Omit<Expense, 'id' | 'date'>;
      let successMessage: string;

      if (isNoSplitExpense) {
        expenseWithApartmentDebts = {
          ...newExpenseData,
          paidByApartment: payingApartmentId,
          owedByApartments: [],
          perApartmentShare: 0,
          paidByApartments: [],
        };
        successMessage = `₹${newExpenseData.amount} ${category?.name || 'expense'} added. Only your apartment will bear this cost.`;
      } else {
        const allApartmentIds = apartments.map(apt => apt.id);
        const perApartmentShare = newExpenseData.amount / allApartmentIds.length;
        // Include all apartments in the split
        const owingApartments = [...allApartmentIds];

        expenseWithApartmentDebts = {
          ...newExpenseData,
          paidByApartment: payingApartmentId,
          owedByApartments: owingApartments,
          perApartmentShare,
          paidByApartments: [payingApartmentId], // Mark the payer as paid immediately
        };
        const totalOwedByOthers = newExpenseData.amount - perApartmentShare;
        successMessage = `₹${newExpenseData.amount} expense split among ${allApartmentIds.length} apartments. Your share of ₹${perApartmentShare.toFixed(2)} is marked as paid. You are owed ₹${totalOwedByOthers.toFixed(2)} from others.`;
      }

      try {
        // Optimistic update: Create temporary expense for immediate UI feedback
        const tempExpense: Expense = {
          ...expenseWithApartmentDebts,
          id: `temp-${Date.now()}`,
          date: new Date().toISOString(),
        };

        // Immediately update UI with temporary expense
        const updateCacheWithTemp = () => {
          queryClient.setQueryData<Expense[]>(['expenses', user.apartment], (oldExpenses = []) => {
            const all = [tempExpense, ...oldExpenses];
            return Array.from(new Map(all.map(e => [e.id, e])).values());
          });
        };

        updateCacheWithTemp();

        // Add to database
        const newExpense = await addExpense(expenseWithApartmentDebts);

        // Replace temporary expense with real one and force cache update
        setTimeout(() => {
          queryClient.setQueryData<Expense[]>(['expenses', user.apartment], (oldExpenses = []) => {
            const withoutTemp = oldExpenses.filter(e => e.id !== tempExpense.id);
            const all = [newExpense, ...withoutTemp];
            const deduped = Array.from(new Map(all.map(e => [e.id, e])).values());

            return deduped;
          });

          // Also update local state
          setExpenses(prev => {
            const withoutTemp = prev.filter(e => e.id !== tempExpense.id);
            const all = [newExpense, ...withoutTemp];
            return Array.from(new Map(all.map(e => [e.id, e])).values());
          });

          // Force invalidation to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['expenses', user.apartment] });
        }, 50);

        toast({
          title: 'Expense Added',
          description: successMessage,
        });
      } catch (error) {
        logger.error('Error adding expense:', error);

        // Remove the temporary expense from cache since the operation failed
        queryClient.setQueryData<Expense[]>(['expenses', user.apartment], (oldExpenses = []) =>
          oldExpenses.filter(e => !e.id.startsWith('temp-'))
        );

        queryClient.setQueryData<Expense[]>(['expenses'], (oldExpenses = []) =>
          oldExpenses.filter(e => !e.id.startsWith('temp-'))
        );

        // Remove from local state too
        setExpenses(prev => prev.filter(e => !e.id.startsWith('temp-')));
        toast({
          title: 'Error',
          description: 'Failed to add expense. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [user, apartments, getCategoryById, apartmentsLoading, toast, queryClient, setExpenses]
  );

  const handleDeleteExpense = React.useCallback(
    async (expenseId: string) => {
      try {
        await deleteExpense(expenseId);
        // Update the React Query cache
        queryClient.setQueryData<Expense[]>(['expenses', user?.apartment], (oldExpenses = []) =>
          oldExpenses.filter(e => e.id !== expenseId)
        );
        toast({
          title: 'Expense Deleted',
          description: 'The expense has been successfully removed.',
        });
      } catch (error) {
        logger.error('Error deleting expense:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete expense.',
          variant: 'destructive',
        });
      }
    },
    [user, queryClient, toast]
  );

  const handleExpenseUpdate = React.useCallback(
    (updatedExpense: Expense) => {
      // Update react-query cache immediately and invalidate to trigger re-render
      try {
        // Update cache with new data
        queryClient.setQueryData<Expense[]>(['expenses'], (oldExpenses = []) => {
          const updated = oldExpenses.map(exp =>
            exp.id === updatedExpense.id ? updatedExpense : exp
          );
          return Array.from(new Map(updated.map(e => [e.id, e])).values());
        });

        if (user?.apartment) {
          queryClient.setQueryData<Expense[]>(['expenses', user.apartment], (oldExpenses = []) => {
            const updated = oldExpenses.map(exp =>
              exp.id === updatedExpense.id ? updatedExpense : exp
            );
            return Array.from(new Map(updated.map(e => [e.id, e])).values());
          });
        }

        // Invalidate to ensure components re-render with fresh data
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        if (user?.apartment) {
          queryClient.invalidateQueries({ queryKey: ['expenses', user.apartment] });
        }

        // Also invalidate balance sheets as they depend on expense data
        queryClient.invalidateQueries({ queryKey: ['balanceSheets'] });
        if (user?.apartment) {
          queryClient.invalidateQueries({ queryKey: ['balanceSheets', user.apartment] });
        }
      } catch (err) {
        // Non-fatal: guard against queryClient not being initialised in some contexts
        logger.error('Failed to update react-query cache for expenses:', err);
      }
    },
    [user, queryClient]
  );

  return {
    handleAddExpense,
    handleDeleteExpense,
    handleExpenseUpdate,
    getCategoryById,
  };
}
