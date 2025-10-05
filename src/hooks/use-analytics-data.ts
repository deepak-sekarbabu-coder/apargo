import { format, subMonths } from 'date-fns';

import { useMemo } from 'react';

import type { Category, Expense } from '@/lib/types';

export function useAnalyticsData(
  expenses: Expense[],
  categories: Category[],
  analyticsMonth: string
) {
  return useMemo(() => {
    const filteredExpenses =
      analyticsMonth === 'all'
        ? expenses.filter(e => e.date && e.amount != null)
        : expenses.filter(e => {
            try {
              return (
                e.date && e.amount != null && format(new Date(e.date), 'yyyy-MM') === analyticsMonth
              );
            } catch {
              return false;
            }
          });
    const categorySpending = categories.map(category => {
      const total = filteredExpenses
        .filter(e => e.categoryId === category.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return {
        name: category.name,
        total: Math.round(total * 100) / 100,
        fill: `hsl(var(--chart-${(categories.indexOf(category) % 5) + 1}))`,
      };
    });
    const monthlySpending = Array.from({ length: 6 })
      .map((_, i) => {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const total = expenses
          .filter(e => {
            try {
              return e.date && e.amount != null && format(new Date(e.date), 'yyyy-MM') === monthKey;
            } catch {
              return false;
            }
          })
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return {
          name: format(monthDate, 'MMM yyyy'),
          total: Math.round(total * 100) / 100,
        };
      })
      .reverse();
    return { categorySpending, monthlySpending };
  }, [expenses, categories, analyticsMonth]);
}
