'use client';

import * as React from 'react';

import { addCategory, deleteCategory, updateCategory } from '@/lib/firestore/categories';
import { addPayment, updatePayment } from '@/lib/firestore/payments';
import { addPoll } from '@/lib/firestore/polls';
import { addUser, deleteUser, updateUser } from '@/lib/firestore/users';
import { uploadImage } from '@/lib/storage';
import type { Category, Payment, PollOption, User } from '@/lib/types';

import { useToast } from '@/hooks/use-toast';

interface UseDataHandlersProps {
  user: User | null;
  role: string;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export function useDataHandlers({
  user,
  role,
  setUsers,
  setCategories,
  setPayments,
}: UseDataHandlersProps) {
  const { toast } = useToast();

  const handleUpdateUser = React.useCallback(
    async (updatedUser: User) => {
      await updateUser(updatedUser.id, updatedUser);
      // updateAuthUser is not needed here; removed for clarity
      // If the user's apartment changed, we need to refetch data, which the useEffect will handle.
      // Otherwise, just update the state locally.
      if (updatedUser.apartment === user?.apartment) {
        setUsers(currentUsers =>
          currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
        );
      }
    },
    [user, setUsers]
  );

  const handleUpdateCategory = React.useCallback(
    async (updatedCategory: Category) => {
      await updateCategory(updatedCategory.id, updatedCategory);
      setCategories(currentCategories =>
        currentCategories.map(c => (c.id === updatedCategory.id ? updatedCategory : c))
      );
    },
    [setCategories]
  );

  const handleAddCategory = React.useCallback(
    async (newCategoryData: Omit<Category, 'id'>) => {
      const newCategory = await addCategory(newCategoryData);
      setCategories(prev => [...prev, newCategory]);
    },
    [setCategories]
  );

  const handleDeleteCategory = React.useCallback(
    async (categoryId: string) => {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast({
        title: 'Category Deleted',
        description: 'The category has been successfully removed.',
      });
    },
    [setCategories, toast]
  );

  const handleAddUser = React.useCallback(
    async (newUserData: Omit<User, 'id'>) => {
      const newUser = await addUser(newUserData);
      if (newUser.apartment === user?.apartment || role === 'admin') {
        setUsers(prev => [...prev, newUser]);
      }
    },
    [user, role, setUsers]
  );

  const handleUpdateUserFromAdmin = React.useCallback(
    async (updatedUser: User) => {
      await updateUser(updatedUser.id, updatedUser);
      setUsers(currentUsers => currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    },
    [setUsers]
  );

  const handleDeleteUser = React.useCallback(
    async (userId: string) => {
      if (user?.id === userId) {
        toast({
          title: 'Action Prohibited',
          description: 'You cannot delete your own account.',
          variant: 'destructive',
        });
        return;
      }
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: 'User Deleted',
        description: 'The user has been successfully removed.',
      });
    },
    [user, setUsers, toast]
  );

  const handleRejectUser = React.useCallback(
    async (userId: string) => {
      if (user?.id === userId) {
        toast({
          title: 'Action Prohibited',
          description: 'You cannot reject your own account.',
          variant: 'destructive',
        });
        return;
      }
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: 'User Rejected',
        description: 'The user application has been rejected and removed.',
        variant: 'destructive',
      });
    },
    [user, setUsers, toast]
  );

  const handleAddPoll = React.useCallback(
    async (data: { question: string; options: PollOption[]; expiresAt?: string }) => {
      await addPoll({
        question: data.question,
        options: data.options,
        createdBy: user?.id || '',
        expiresAt: data.expiresAt,
        isActive: true,
      });
      toast({
        title: 'Poll Created',
        description: 'Your poll has been created successfully.',
      });
    },
    [user, toast]
  );

  const handleApprovePayment = React.useCallback(
    async (paymentId: string, payments: Payment[]) => {
      // Find payment
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;
      // Set status to approved and approvedBy to admin name
      const approvedBy = user?.name || user?.email || user?.id || 'admin';
      await updatePayment(paymentId, { status: 'approved', approvedBy });
      setPayments(prev =>
        prev.map(p => (p.id === paymentId ? { ...p, status: 'approved', approvedBy } : p))
      );
      toast({
        title: 'Payment Approved',
        description: `Payment of ₹${payment.amount} approved.`,
      });
    },
    [user, setPayments, toast]
  );

  const handleRejectPayment = React.useCallback(
    async (paymentId: string, payments: Payment[]) => {
      // Find payment
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;
      await updatePayment(paymentId, { status: 'rejected' });
      setPayments(prev => prev.map(p => (p.id === paymentId ? { ...p, status: 'rejected' } : p)));
      toast({
        title: 'Payment Rejected',
        description: `Payment of ₹${payment.amount} rejected.`,
      });
    },
    [setPayments, toast]
  );

  const handleAddPayment = React.useCallback(
    async (data: {
      payeeId: string;
      amount: number;
      receiptFile?: File;
      expenseId?: string;
      monthYear: string;
      category?: 'income' | 'expense';
      reason?: string;
    }) => {
      if (!user) return;

      let receiptURL = '';
      // If a receipt file was provided, upload it to Firebase Storage
      if (data.receiptFile) {
        try {
          const path = `receipts/${Date.now()}_${data.receiptFile.name}`;
          receiptURL = await uploadImage(data.receiptFile, path);
        } catch (err) {
          console.error('Receipt upload failed:', err);
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload receipt. Please try again.',
            variant: 'destructive',
          });
          throw err;
        }
      }

      const paymentData: {
        payerId: string;
        payeeId: string;
        amount: number;
        status: 'pending' | 'approved' | 'rejected';
        monthYear: string;
        receiptURL: string;
        expenseId?: string;
        apartmentId?: string;
        category?: 'income' | 'expense';
        reason?: string;
      } = {
        payerId: user.id,
        payeeId: data.payeeId,
        amount: data.amount,
        status: 'pending',
        monthYear: data.monthYear,
        receiptURL,
        apartmentId: user.apartment,
        category: data.category || 'income',
      };

      // Only add expenseId if it is a non-empty string
      if (data.expenseId && typeof data.expenseId === 'string' && data.expenseId.trim() !== '') {
        paymentData.expenseId = data.expenseId;
      }

      // Add reason if provided
      if (data.reason && data.reason.trim() !== '') {
        paymentData.reason = data.reason;
      }

      try {
        const newPayment = await addPayment(paymentData);
        setPayments(prev => [...prev, newPayment]);
        toast({
          title: 'Payment Added',
          description: `Payment of ₹${data.amount} has been submitted for approval.`,
        });
      } catch (error) {
        console.error('Failed to add payment:', error);
        toast({
          title: 'Error',
          description: 'Failed to add payment. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [user, setPayments, toast]
  );

  return {
    handleUpdateUser,
    handleUpdateCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleAddUser,
    handleUpdateUserFromAdmin,
    handleDeleteUser,
    handleRejectUser,
    handleAddPoll,
    handleApprovePayment,
    handleRejectPayment,
    handleAddPayment,
  };
}
