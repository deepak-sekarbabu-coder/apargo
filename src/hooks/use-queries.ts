import { useQuery } from '@tanstack/react-query';

// ISP-compliant: Import only what you need from specific modules
import { getApartments, subscribeToApartments } from '@/lib/firestore/apartments';
import { getUsers, getAllUsers, getUser, subscribeToUsers } from '@/lib/firestore/users';
import { getCategories, subscribeToCategories } from '@/lib/firestore/categories';
import { getExpenses, subscribeToExpenses, subscribeToRelevantExpenses, getBalanceSheets } from '@/lib/firestore/expenses';
import { getPayments, subscribeToPayments } from '@/lib/firestore/payments';
import { getVendors, subscribeToVendors } from '@/lib/firestore/vendors';
import { getMaintenanceTasks, subscribeToMaintenanceTasks } from '@/lib/firestore/maintenance-tasks';
import { getPolls, listenToPolls } from '@/lib/firestore/polls';
import { getActiveAnnouncements, listenToActiveAnnouncements } from '@/lib/firestore/announcements';
import { getFaults } from '@/lib/firestore/faults';

export function useUsers(apartment?: string, includeAll?: boolean) {
  return useQuery({
    queryKey: ['users', apartment, includeAll],
    queryFn: () => includeAll ? getAllUsers(apartment) : getUsers(apartment),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useExpenses(apartment?: string) {
  return useQuery({
    queryKey: ['expenses', apartment],
    queryFn: () => getExpenses(apartment),
    staleTime: 1000 * 30,
  });
}

export function useApartments() {
  return useQuery({
    queryKey: ['apartments'],
    queryFn: () => getApartments(),
    staleTime: 1000 * 60 * 60,
  });
}

// Add more hooks as needed (payments, balanceSheets, polls)
export function usePayments(apartment?: string) {
  return useQuery({
    queryKey: ['payments', apartment],
    queryFn: () => getPayments(apartment),
    staleTime: 1000 * 60 * 2,
  });
}

export function useBalanceSheets(apartment?: string) {
  return useQuery({
    queryKey: ['balanceSheets', apartment],
    queryFn: () => getBalanceSheets(apartment),
    staleTime: 1000 * 60 * 5,
  });
}
