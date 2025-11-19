import { format } from 'date-fns';

import { useEffect, useMemo, useState } from 'react';

import log from '@/lib/core/logger';
import type { Expense, User } from '@/lib/core/types';

export function useExpenseFilters(
  expenses: Expense[],
  filterCategory: string,
  filterPaidBy: string,
  filterMonth: string,
  users: User[]
) {
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // Create a mapping from user ID to apartment ID
  const userToApartmentMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(user => {
      if (user.apartment) {
        map[user.id] = user.apartment;
      }
    });
    return map;
  }, [users]);

  useEffect(() => {
    try {
      // Search filter removed as requested
      const filtered = expenses
        .filter(expense => filterCategory === 'all' || expense.categoryId === filterCategory)
        .filter(expense => {
          if (filterPaidBy === 'all') return true;
          // Map user ID to apartment ID for filtering
          const paidByApartment = userToApartmentMap[filterPaidBy];
          return paidByApartment && expense.paidByApartment === paidByApartment;
        })
        .filter(expense => {
          if (filterMonth === 'all') return true;
          try {
            if (!expense.date) return false;
            return format(new Date(expense.date), 'yyyy-MM') === filterMonth;
          } catch (error) {
            log.error('Error filtering by month:', error, expense.date);
            return false;
          }
        });
      setFilteredExpenses(filtered);
    } catch (error) {
      log.error('Error filtering expenses:', error);
      setFilteredExpenses([]);
    }
  }, [expenses, filterCategory, filterPaidBy, filterMonth, userToApartmentMap]); // Removed debouncedSearch from dependencies

  const expenseMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => {
      if (e.date) {
        try {
          months.add(format(new Date(e.date), 'yyyy-MM'));
        } catch (error) {
          log.error('Error formatting date:', error, e.date);
        }
      }
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  return { filteredExpenses, expenseMonths };
}
