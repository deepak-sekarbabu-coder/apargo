import { useQuery } from '@tanstack/react-query';

import * as firestore from '@/lib/firestore';

export function useUsers(apartment?: string, includeAll?: boolean) {
  return useQuery({
    queryKey: ['users', apartment, includeAll],
    queryFn: () => includeAll ? firestore.getAllUsers(apartment) : firestore.getUsers(apartment),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => firestore.getCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useExpenses(apartment?: string) {
  return useQuery({
    queryKey: ['expenses', apartment],
    queryFn: () => firestore.getExpenses(apartment),
    staleTime: 1000 * 30,
  });
}

export function useApartments() {
  return useQuery({
    queryKey: ['apartments'],
    queryFn: () => firestore.getApartments(),
    staleTime: 1000 * 60 * 60,
  });
}

// Add more hooks as needed (payments, balanceSheets, polls)
export function usePayments(apartment?: string) {
  return useQuery({
    queryKey: ['payments', apartment],
    queryFn: () => firestore.getPayments(apartment),
    staleTime: 1000 * 60 * 2,
  });
}

export function useBalanceSheets(apartment?: string) {
  return useQuery({
    queryKey: ['balanceSheets', apartment],
    queryFn: () => firestore.getBalanceSheets(apartment),
    staleTime: 1000 * 60 * 5,
  });
}
