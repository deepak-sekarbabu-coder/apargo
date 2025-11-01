import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Apartment, BalanceSheet, Category, Expense, Payment, User } from '@/lib/types';

// Simplified subscription manager for data streams
interface DataStreams {
  apartments: Apartment[];
  categories: Category[];
  users: User[];
  expenses: Expense[];
  payments: Payment[];
  balanceSheets: BalanceSheet[];
}

interface SubscriptionHandlers {
  onApartments: (apartments: Apartment[]) => void;
  onCategories: (categories: Category[]) => void;
  onUsers: (users: User[]) => void;
  onExpenses: (expenses: Expense[]) => void;
  onPayments: (payments: Payment[]) => void;
  onBalanceSheets: (balanceSheets: BalanceSheet[]) => void;
}

function useDataSubscriptionManager(user: any, queryClient: ReturnType<typeof useQueryClient>) {
  const [dataStreams, setDataStreams] = useState<DataStreams>({
    apartments: [],
    categories: [],
    users: [],
    expenses: [],
    payments: [],
    balanceSheets: [],
  });

  useEffect(() => {
    // Single subscription manager that handles all data streams
    const handlers: SubscriptionHandlers = {
      onApartments: (apartments) => {
        setDataStreams(prev => ({ ...prev, apartments }));
        queryClient.setQueryData(['apartments'], apartments);
      },
      onCategories: (categories) => {
        setDataStreams(prev => ({ ...prev, categories }));
        queryClient.setQueryData(['categories'], categories);
      },
      onUsers: (users) => {
        setDataStreams(prev => ({ ...prev, users }));
        const queryKey = user?.role === 'admin' || !user?.apartment ? ['users', undefined] : ['users', user.apartment];
        queryClient.setQueryData(queryKey, users);
      },
      onExpenses: (expenses) => {
        setDataStreams(prev => ({ ...prev, expenses }));
        const queryKey = user?.role === 'admin' || !user?.apartment ? ['expenses', undefined] : ['expenses', user.apartment];
        queryClient.setQueryData(queryKey, expenses);
      },
      onPayments: (payments) => {
        setDataStreams(prev => ({ ...prev, payments }));
        const queryKey = user?.role === 'admin' || !user?.apartment ? ['payments', undefined] : ['payments', user.apartment];
        queryClient.setQueryData(queryKey, payments);
      },
      onBalanceSheets: (balanceSheets) => {
        setDataStreams(prev => ({ ...prev, balanceSheets }));
        const queryKey = user?.role === 'admin' || !user?.apartment ? ['balanceSheets', undefined] : ['balanceSheets', user.apartment];
        queryClient.setQueryData(queryKey, balanceSheets);
      },
    };

    // Single cleanup function for all subscriptions
    const unsubscribes: (() => void)[] = [];

    // Single apartments subscription
    const apartmentsUnsubscribe = (async () => {
      try {
        const apartments = await firestore.getApartments();
        handlers.onApartments(apartments);
      } catch (err) {
        console.error('Error fetching apartments:', err);
      }
    });
    
    // Single categories subscription
    const categoriesUnsubscribe = firestore.subscribeToCategories(handlers.onCategories);
    unsubscribes.push(categoriesUnsubscribe);

    // Conditional subscriptions based on user role/apartment
    if (user?.role === 'admin' || !user?.apartment) {
      // Admin subscriptions
      const usersUnsubscribe = firestore.subscribeToAllUsers(handlers.onUsers);
      const expensesUnsubscribe = firestore.subscribeToExpenses(handlers.onExpenses);
      const paymentsUnsubscribe = firestore.subscribeToPayments(handlers.onPayments);
      const balanceSheetsUnsubscribe = firestore.subscribeToBalanceSheets(handlers.onBalanceSheets);
      
      unsubscribes.push(usersUnsubscribe, expensesUnsubscribe, paymentsUnsubscribe, balanceSheetsUnsubscribe);
    } else if (user?.apartment) {
      // Regular user subscriptions
      const usersUnsubscribe = firestore.subscribeToUsers(handlers.onUsers, user.apartment);
      const expensesUnsubscribe = firestore.subscribeToRelevantExpenses(handlers.onExpenses, user.apartment);
      const paymentsUnsubscribe = firestore.subscribeToPayments(handlers.onPayments, user.apartment);
      const balanceSheetsUnsubscribe = firestore.subscribeToBalanceSheets(handlers.onBalanceSheets, user.apartment);
      
      unsubscribes.push(usersUnsubscribe, expensesUnsubscribe, paymentsUnsubscribe, balanceSheetsUnsubscribe);
    }

    // Initialize apartments data
    void apartmentsUnsubscribe();

    // Single cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, queryClient]);

  return dataStreams;
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

export function useApargoAppData(initialCategories: Category[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for data setters (needed by handlers)
  const [usersState, setUsers] = useState<User[]>([]);
  const [categoriesState, setCategories] = useState<Category[]>(initialCategories);
  const [expensesState, setExpenses] = useState<Expense[]>([]);
  const [apartmentsState, setApartments] = useState<Apartment[]>([]);
  const [paymentsState, setPayments] = useState<Payment[]>([]);
  const [balanceSheetsState, setBalanceSheets] = useState<BalanceSheet[]>([]);

  // Use simplified subscription manager
  const dataStreams = useDataSubscriptionManager(user, queryClient);
  
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

  // Sync subscription data with local state for handlers (single effect)
  useEffect(() => {
    const { apartments, categories, users, expenses, payments, balanceSheets } = dataStreams;
    
    setApartments(apartments);
    setCategories(categories);
    setUsers(users);
    setExpenses(expenses);
    setPayments(payments);
    setBalanceSheets(balanceSheets);

    // Set loading to false once core data is loaded
    if (categories.length > 0) {
      setIsLoadingData(false);
    }
  }, [dataStreams]);

  return {
    user,
    users: dataStreams.users,
    setUsers,
    categories: dataStreams.categories,
    setCategories,
    expenses: dataStreams.expenses,
    setExpenses,
    apartments: dataStreams.apartments,
    setApartments,
    payments: dataStreams.payments,
    setPayments,
    balanceSheets: dataStreams.balanceSheets,
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
