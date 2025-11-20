import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import type { Apartment, BalanceSheet, Category, Expense, Payment, User } from '@/lib/core/types';
import { getApartments } from '@/lib/firestore/apartments';
import { subscribeToCategories } from '@/lib/firestore/categories';
import {
  subscribeToBalanceSheets,
  subscribeToExpenses,
  subscribeToRelevantExpenses,
} from '@/lib/firestore/expenses';
import { subscribeToPayments } from '@/lib/firestore/payments';
import { subscribeToAllUsers, subscribeToUsers } from '@/lib/firestore/users';
import { requestNotificationPermission } from '@/lib/notifications/push-notifications';

interface Subscription {
  unsubscribe: () => void;
}

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

function useDataSubscriptionManager(
  user: User | null,
  queryClient: ReturnType<typeof useQueryClient>
) {
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
      onApartments: apartments => {
        setDataStreams(prev => ({ ...prev, apartments }));
        queryClient.setQueryData(['apartments'], apartments);
      },
      onCategories: categories => {
        setDataStreams(prev => ({ ...prev, categories }));
        queryClient.setQueryData(['categories'], categories);
      },
      onUsers: users => {
        setDataStreams(prev => ({ ...prev, users }));
        const queryKey =
          user?.role === 'admin' || !user?.apartment
            ? ['users', undefined]
            : ['users', user.apartment];
        queryClient.setQueryData(queryKey, users);
      },
      onExpenses: expenses => {
        setDataStreams(prev => ({ ...prev, expenses }));
        const queryKey =
          user?.role === 'admin' || !user?.apartment
            ? ['expenses', undefined]
            : ['expenses', user.apartment];
        queryClient.setQueryData(queryKey, expenses);
      },
      onPayments: payments => {
        setDataStreams(prev => ({ ...prev, payments }));
        const queryKey =
          user?.role === 'admin' || !user?.apartment
            ? ['payments', undefined]
            : ['payments', user.apartment];
        queryClient.setQueryData(queryKey, payments);
      },
      onBalanceSheets: balanceSheets => {
        setDataStreams(prev => ({ ...prev, balanceSheets }));
        const queryKey =
          user?.role === 'admin' || !user?.apartment
            ? ['balanceSheets', undefined]
            : ['balanceSheets', user.apartment];
        queryClient.setQueryData(queryKey, balanceSheets);
      },
    };

    // Single cleanup function for all subscriptions
    const unsubscribes: (() => void)[] = [];

    // Single apartments subscription
    const apartmentsUnsubscribe = async () => {
      try {
        const apartments = await getApartments();
        handlers.onApartments(apartments);
      } catch (err) {
        console.error('Error fetching apartments:', err);
      }
    };

    // Single categories subscription
    subscribeToCategories(handlers.onCategories)
      .then(subscription => {
        unsubscribes.push(() => subscription.unsubscribe());
      })
      .catch(err => {
        console.error('Error subscribing to categories:', err);
      });

    // Conditional subscriptions based on user role/apartment
    if (user?.role === 'admin' || !user?.apartment) {
      // Admin subscriptions
      Promise.all([
        subscribeToAllUsers(handlers.onUsers),
        subscribeToExpenses(handlers.onExpenses),
        subscribeToPayments(handlers.onPayments),
        subscribeToBalanceSheets(handlers.onBalanceSheets),
      ])
        .then((subs: Subscription[]) => {
          unsubscribes.push(
            () => subs[0].unsubscribe(),
            () => subs[1].unsubscribe(),
            () => subs[2].unsubscribe(),
            () => subs[3].unsubscribe()
          );
        })
        .catch(err => {
          console.error('Error setting up admin subscriptions:', err);
        });
    } else if (user?.apartment) {
      // Regular user subscriptions
      Promise.all([
        subscribeToUsers(handlers.onUsers, user.apartment),
        subscribeToRelevantExpenses(handlers.onExpenses, user.apartment),
        subscribeToPayments(handlers.onPayments, user.apartment),
        subscribeToBalanceSheets(handlers.onBalanceSheets, user.apartment),
      ])
        .then(([usersSub, expensesSub, paymentsSub, balanceSheetsSub]) => {
          unsubscribes.push(
            () => usersSub.unsubscribe(),
            () => expensesSub.unsubscribe(),
            () => paymentsSub.unsubscribe(),
            () => balanceSheetsSub.unsubscribe()
          );
        })
        .catch(err => {
          console.error('Error setting up user subscriptions:', err);
        });
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
function useFCMNotifications(user: User | null) {
  useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);
}

// Custom hook for apartment setup dialog
function useApartmentSetupDialog(user: User | null) {
  const [showApartmentDialog, setShowApartmentDialog] = useState(false);

  useEffect(() => {
    if (user && (!user.apartment || !user.propertyRole)) {
      setShowApartmentDialog(true);
    }
  }, [user]);

  return { showApartmentDialog, setShowApartmentDialog };
}

export function useApargoAppData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Local state for data (for backward compatibility)
  const [apartments, setApartments] = useState(dataStreams.apartments);
  const [categories, setCategories] = useState(dataStreams.categories);
  const [users, setUsers] = useState(dataStreams.users);
  const [expenses, setExpenses] = useState(dataStreams.expenses);
  const [payments, setPayments] = useState(dataStreams.payments);
  const [balanceSheets, setBalanceSheets] = useState(dataStreams.balanceSheets);

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
