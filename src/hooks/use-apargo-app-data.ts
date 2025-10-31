import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Apartment, BalanceSheet, Category, Expense, Payment, User } from '@/lib/types';

// Custom hook for apartment data
function useApartmentsData(queryClient: ReturnType<typeof useQueryClient>) {
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const allApartments = await firestore.getApartments();
        setApartments(allApartments);
        queryClient.setQueryData(['apartments'], allApartments);
      } catch (err) {
        console.error('Error fetching apartments:', err);
      }
    };
    
    void fetchApartments();
  }, [queryClient]);

  return apartments;
}

// Custom hook for categories subscription
function useCategoriesSubscription(queryClient: ReturnType<typeof useQueryClient>) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsubscribe = firestore.subscribeToCategories(cats => {
      setCategories(cats);
      queryClient.setQueryData(['categories'], cats);
    });

    return unsubscribe;
  }, [queryClient]);

  return categories;
}

// Custom hook for users subscription
function useUsersSubscription(user: any, queryClient: ReturnType<typeof useQueryClient>) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user?.role === 'admin' || !user?.apartment) {
      // Admin or no apartment: subscribe to all users
      unsubscribe = firestore.subscribeToAllUsers(u => {
        setUsers(u);
        queryClient.setQueryData(['users', undefined], u);
      });
    } else if (user?.apartment) {
      // Regular user: subscribe to apartment users only
      unsubscribe = firestore.subscribeToUsers(u => {
        setUsers(u);
        queryClient.setQueryData(['users', user.apartment], u);
      }, user.apartment);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, queryClient]);

  return users;
}

// Custom hook for expenses subscription
function useExpensesSubscription(user: any, queryClient: ReturnType<typeof useQueryClient>) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user?.role === 'admin' || !user?.apartment) {
      // Admin or no apartment: subscribe to all expenses
      unsubscribe = firestore.subscribeToExpenses(e => {
        setExpenses(e);
        queryClient.setQueryData(['expenses', undefined], e);
      });
    } else if (user?.apartment) {
      // Regular user: subscribe to relevant expenses only
      unsubscribe = firestore.subscribeToRelevantExpenses(e => {
        setExpenses(e);
        queryClient.setQueryData(['expenses', user.apartment], e);
      }, user.apartment);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, queryClient]);

  return expenses;
}

// Custom hook for payments subscription
function usePaymentsSubscription(user: any, queryClient: ReturnType<typeof useQueryClient>) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user?.role === 'admin' || !user?.apartment) {
      // Admin or no apartment: subscribe to all payments
      unsubscribe = firestore.subscribeToPayments(p => {
        setPayments(p);
        queryClient.setQueryData(['payments', undefined], p);
      });
    } else if (user?.apartment) {
      // Regular user: subscribe to apartment payments only
      unsubscribe = firestore.subscribeToPayments(p => {
        setPayments(p);
        queryClient.setQueryData(['payments', user.apartment], p);
      }, user.apartment);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, queryClient]);

  return payments;
}

// Custom hook for balance sheets subscription
function useBalanceSheetsSubscription(user: any, queryClient: ReturnType<typeof useQueryClient>) {
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user?.role === 'admin' || !user?.apartment) {
      // Admin or no apartment: subscribe to all balance sheets
      unsubscribe = firestore.subscribeToBalanceSheets(b => {
        setBalanceSheets(b);
        queryClient.setQueryData(['balanceSheets', undefined], b);
      });
    } else if (user?.apartment) {
      // Regular user: subscribe to apartment balance sheets only
      unsubscribe = firestore.subscribeToBalanceSheets(b => {
        setBalanceSheets(b);
        queryClient.setQueryData(['balanceSheets', user.apartment], b);
      }, user.apartment);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, queryClient]);

  return balanceSheets;
}

// Custom hook for FCM notifications
function useFCMNotifications(user: any) {
  useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);
}

// Custom hook for apartment setup dialog
function useApartmentSetupDialog(user: any) {
  const [showApartmentDialog, setShowApartmentDialog] = useState(false);

  useEffect(() => {
    if (user && (!user.apartment || !user.propertyRole)) {
      setShowApartmentDialog(true);
    }
  }, [user]);

  return { showApartmentDialog, setShowApartmentDialog };
}

// Main consolidated hook
export function useApargoAppData(initialCategories: Category[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for data setters (needed by handlers)
  const [setUsersState, setUsers] = useState<User[]>([]);
  const [setCategoriesState, setCategories] = useState<Category[]>(initialCategories);
  const [setExpensesState, setExpenses] = useState<Expense[]>([]);
  const [setApartmentsState, setApartments] = useState<Apartment[]>([]);
  const [setPaymentsState, setPayments] = useState<Payment[]>([]);
  const [setBalanceSheetsState, setBalanceSheets] = useState<BalanceSheet[]>([]);

  // Use individual focused hooks
  const apartments = useApartmentsData(queryClient);
  const categories = useCategoriesSubscription(queryClient);
  const users = useUsersSubscription(user, queryClient);
  const expenses = useExpensesSubscription(user, queryClient);
  const payments = usePaymentsSubscription(user, queryClient);
  const balanceSheets = useBalanceSheetsSubscription(user, queryClient);
  
  // Use specialized hooks
  useFCMNotifications(user);
  const { showApartmentDialog, setShowApartmentDialog } = useApartmentSetupDialog(user);

  // State for UI interactions
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaidBy, setFilterPaidBy] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [analyticsMonth, setAnalyticsMonth] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [activeExpenseTab, setActiveExpenseTab] = useState('analytics');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync subscription data with local state for handlers
  useEffect(() => setUsers(users), [users]);
  useEffect(() => setCategories(categories), [categories]);
  useEffect(() => setExpenses(expenses), [expenses]);
  useEffect(() => setApartments(apartments), [apartments]);
  useEffect(() => setPayments(payments), [payments]);
  useEffect(() => setBalanceSheets(balanceSheets), [balanceSheets]);

  // Set loading to false once core data is loaded
  useEffect(() => {
    if (categories.length > 0) {
      setIsLoadingData(false);
    }
  }, [categories]);

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
  };
}
