import {
  format,
  isThisMonth,
  isThisWeek,
  isToday,
  isYesterday,
  subDays,
  subMonths,
} from 'date-fns';

import { useEffect, useMemo, useState } from 'react';

import type { Category, Expense } from '@/lib/types';

export function useAnalyticsData(
  expenses: Expense[],
  categories: Category[],
  analyticsMonth: string
) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealTime, setIsRealTime] = useState(true);

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdated(new Date());
  }, [expenses.length, categories.length]);

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
    // Enhanced real-time analytics data
    const currentMonth = format(new Date(), 'yyyy-MM');
    const today = new Date();
    const weekAgo = subDays(today, 7);
    const monthAgo = subDays(today, 30);

    // Real-time metrics
    const todayExpenses = expenses.filter(e => {
      try {
        return e.date && isToday(new Date(e.date));
      } catch {
        return false;
      }
    });

    const thisWeekExpenses = expenses.filter(e => {
      try {
        return e.date && isThisWeek(new Date(e.date));
      } catch {
        return false;
      }
    });

    const thisMonthExpenses = expenses.filter(e => {
      try {
        return e.date && isThisMonth(new Date(e.date));
      } catch {
        return false;
      }
    });

    const weeklyTotal = thisWeekExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const monthlyTotal = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const dailyAverage =
      expenses.length > 0
        ? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) /
          Math.max(
            1,
            new Set(
              expenses.map(e => {
                try {
                  return format(new Date(e.date), 'yyyy-MM-dd');
                } catch {
                  return '';
                }
              })
            ).size
          )
        : 0;

    // Trending analysis
    const recentExpenses = expenses.filter(e => {
      try {
        return e.date && new Date(e.date) >= weekAgo;
      } catch {
        return false;
      }
    });

    const previousExpenses = expenses.filter(e => {
      try {
        const date = new Date(e.date);
        return date >= subDays(weekAgo, 7) && date < weekAgo;
      } catch {
        return false;
      }
    });

    const recentTotal = recentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      categorySpending,
      monthlySpending,
      realTimeMetrics: {
        todayExpenses: todayExpenses.length,
        thisWeekTotal: weeklyTotal,
        thisMonthTotal: monthlyTotal,
        dailyAverage,
        trendData: {
          recentTotal,
          previousTotal,
          isIncreasing: recentTotal > previousTotal,
          changePercentage:
            previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0,
        },
      },
      isRealTime,
      lastUpdated,
    };
  }, [expenses, categories, analyticsMonth, lastUpdated, isRealTime]);
}
