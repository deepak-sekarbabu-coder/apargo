import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Apartment, BalanceSheet, Category, Expense, Payment, User } from '@/lib/types';

export function useApargoAppData(initialCategories: Category[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Show onboarding dialog if user is missing apartment/propertyRole
  useEffect(() => {
    if (user && (!user.apartment || !user.propertyRole)) {
      setShowApartmentDialog(true);
    }
  }, [user]);

  // Firestore subscriptions for all core data
  useEffect(() => {
    setIsLoadingData(true);
    let unsubscribeExpenses: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeCategories: (() => void) | null = null;
    let unsubscribePayments: (() => void) | null = null;
    let unsubscribeBalanceSheets: (() => void) | null = null;

    const fetchApartments = async () => {
      try {
        const allApartments = await firestore.getApartments();
        setApartments(allApartments);
        // populate react-query cache so components using useQuery get the data
        queryClient.setQueryData(['apartments'], allApartments);
      } catch (err) {
        // Ignore fetch errors here; subscription listeners will surface real-time data
        console.error('Error fetching apartments:', err);
      }
    };
    void fetchApartments();

    // Subscribe and forward updates into react-query cache + local state
    unsubscribeCategories = firestore.subscribeToCategories(cats => {
      setCategories(cats);
      queryClient.setQueryData(['categories'], cats);
    });

    if (user?.role === 'admin' || !user?.apartment) {
      unsubscribeUsers = firestore.subscribeToUsers(u => {
        setUsers(u);
        queryClient.setQueryData(['users', undefined], u);
      });

      unsubscribeExpenses = firestore.subscribeToExpenses(e => {
        setExpenses(e);
        queryClient.setQueryData(['expenses', undefined], e);
      });

      unsubscribePayments = firestore.subscribeToPayments(p => {
        setPayments(p);
        queryClient.setQueryData(['payments', undefined], p);
      });

      unsubscribeBalanceSheets = firestore.subscribeToBalanceSheets(b => {
        setBalanceSheets(b);
        queryClient.setQueryData(['balanceSheets', undefined], b);
      });
    } else {
      unsubscribeUsers = firestore.subscribeToUsers(u => {
        setUsers(u);
        queryClient.setQueryData(['users', user.apartment], u);
      }, user.apartment);

      unsubscribeExpenses = firestore.subscribeToRelevantExpenses(e => {
        setExpenses(e);
        queryClient.setQueryData(['expenses', user.apartment], e);
      }, user.apartment);

      unsubscribePayments = firestore.subscribeToPayments(p => {
        setPayments(p);
        queryClient.setQueryData(['payments', user.apartment], p);
      }, user.apartment);

      unsubscribeBalanceSheets = firestore.subscribeToBalanceSheets(b => {
        setBalanceSheets(b);
        queryClient.setQueryData(['balanceSheets', user.apartment], b);
      }, user.apartment);
    }

    setIsLoadingData(false);
    return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribePayments) unsubscribePayments();
      if (unsubscribeBalanceSheets) unsubscribeBalanceSheets();
    };
  }, [user, queryClient]);

  // FCM notification permission
  useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showApartmentDialog, setShowApartmentDialog] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaidBy, setFilterPaidBy] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [analyticsMonth, setAnalyticsMonth] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [activeExpenseTab, setActiveExpenseTab] = useState('analytics'); // Tab state for ExpenseAnalyticsView
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ...existing code for setSafeUsers, effects, filtering, analytics, etc. (to be moved from ApargoApp)

  return {
    user,
    users,
    setUsers,
    categories,
    setCategories,
    expenses,
    setExpenses,
    apartments,
    setApartments,
    payments,
    setPayments,
    balanceSheets,
    setBalanceSheets,
    isLoadingData,
    setIsLoadingData,
    showApartmentDialog,
    setShowApartmentDialog,
    expenseSearch,
    setExpenseSearch,
    filterCategory,
    setFilterCategory,
    filterPaidBy,
    setFilterPaidBy,
    filterMonth,
    setFilterMonth,
    analyticsMonth,
    setAnalyticsMonth,
    userSearch,
    setUserSearch,
    activeExpenseTab,
    setActiveExpenseTab,
    textareaRef,
    // Add more as needed
  };
}
