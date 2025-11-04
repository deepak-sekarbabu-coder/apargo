import { useQuery } from '@tanstack/react-query';

import { getApartments } from '@/lib/firestore/apartments';
import { getCategories } from '@/lib/firestore/categories';
import {
  getBalanceSheets,
  getExpenses,
} from '@/lib/firestore/expenses';
import { getPayments } from '@/lib/firestore/payments';
import { getAllUsers, getUsers } from '@/lib/firestore/users';

export function useUsers(apartment?: string, includeAll?: boolean) {
  return useQuery({
    queryKey: ['users', apartment, includeAll],
    queryFn: () => (includeAll ? getAllUsers(apartment) : getUsers(apartment)),
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
