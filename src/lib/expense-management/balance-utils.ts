import type { Payment } from '../core/types';

export interface AggregatedSheet {
  monthYear: string;
  opening: number;
  income: number;
  expenses: number;
  closing: number;
}

// Validate that balance sheets maintain continuity between months
export function validateBalanceSheetContinuity(sheets: AggregatedSheet[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Sort sheets by monthYear
  const sortedSheets = [...sheets].sort((a, b) => a.monthYear.localeCompare(b.monthYear));

  // Check continuity between consecutive months
  for (let i = 1; i < sortedSheets.length; i++) {
    const prevSheet = sortedSheets[i - 1];
    const currentSheet = sortedSheets[i];

    // Check if current opening balance equals previous closing balance
    if (Math.abs(currentSheet.opening - prevSheet.closing) > 0.01) {
      // Allow for floating point precision issues
      errors.push(
        `Continuity error: ${currentSheet.monthYear} opening balance (${currentSheet.opening}) ` +
          `does not match ${prevSheet.monthYear} closing balance (${prevSheet.closing})`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Pure function to aggregate payments into monthly balance sheets including 'approved' and 'paid'
export function aggregateBalanceSheets(payments: Payment[]): AggregatedSheet[] {
  const incomeMap = new Map<string, number>();
  const expensesMap = new Map<string, number>();

  payments
    .filter(p => p.status === 'approved' || p.status === 'paid')
    .forEach(p => {
      const category = p.category || (p.expenseId ? 'expense' : 'income');
      const amt = p.amount || 0;
      if (category === 'expense') {
        expensesMap.set(p.monthYear, (expensesMap.get(p.monthYear) || 0) + amt);
      } else {
        incomeMap.set(p.monthYear, (incomeMap.get(p.monthYear) || 0) + amt);
      }
    });

  const transactionMonths = Array.from(
    new Set<string>([...incomeMap.keys(), ...expensesMap.keys()])
  ).sort();

  if (transactionMonths.length === 0) {
    return [];
  }

  const [startYear, startMonth] = transactionMonths[0].split('-').map(Number);
  const [endYear, endMonth] = transactionMonths[transactionMonths.length - 1]
    .split('-')
    .map(Number);

  const allMonths: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;
    for (let month = monthStart; month <= monthEnd; month++) {
      allMonths.push(`${year}-${String(month).padStart(2, '0')}`);
    }
  }

  const openingBalanceMap = new Map<string, number>();
  if (allMonths.length > 0) {
    openingBalanceMap.set(allMonths[0], 0);
  }

  for (let i = 1; i < allMonths.length; i++) {
    const prevMonth = allMonths[i - 1];
    const currentMonth = allMonths[i];

    const prevIncome = incomeMap.get(prevMonth) || 0;
    const prevExpenses = expensesMap.get(prevMonth) || 0;
    const prevOpening = openingBalanceMap.get(prevMonth) || 0;
    const prevClosing = prevOpening + prevIncome - prevExpenses;

    openingBalanceMap.set(currentMonth, prevClosing);
  }

  return allMonths.map(monthYear => {
    const opening = openingBalanceMap.get(monthYear) || 0;
    const income = incomeMap.get(monthYear) || 0;
    const expenses = expensesMap.get(monthYear) || 0;
    const closing = opening + income - expenses;

    return { monthYear, opening, income, expenses, closing };
  });
}
