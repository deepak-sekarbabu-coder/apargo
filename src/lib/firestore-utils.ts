import { expenseCalculationRegistry } from './expense-calculation-strategies';
import type { Expense } from './types';

// Helper: derive monthYear (YYYY-MM) from ISO date or now
export const getMonthYearFromDate = (isoDate?: string) => {
  const d = isoDate ? new Date(isoDate) : new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

// Helper: deterministic balance sheet doc id per apartment+month
export const getBalanceDocId = (apartmentId: string, monthYear: string) =>
  `${apartmentId}_${monthYear}`;

export const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  Object.keys(obj).forEach(
    key =>
      (obj as Record<string, unknown>)[key] === undefined &&
      delete (obj as Record<string, unknown>)[key]
  );
  return obj;
};

// Compute per-apartment deltas from an expense for the monthYear derived from expense.date
// Notes:
// - Only unpaid owed apartments (those not present in paidByApartments) should contribute to deltas.
// - Owing apartments increase their totalExpenses (they owe money).
// - The paying apartment increases its totalIncome by the sum of unpaid shares.

/**
 * Computes expense deltas using the appropriate strategy pattern.
 * This function is now open for extension through strategy registration.
 */
export const computeExpenseDeltas = (expense: Expense, registry = expenseCalculationRegistry) => {
  const strategy = registry.getStrategyForExpense(expense);
  return strategy.calculateDeltas(expense);
};

type DeltaCalculation = {
  oldMonth: string;
  newMonth: string;
  oldDeltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>;
  newDeltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>;
  negOldDeltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>;
  mergedDeltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>;
};

export const calculateDeltaChanges = (
  oldExpense: Expense,
  newExpense: Expense
): DeltaCalculation => {
  const { monthYear: oldMonth, deltas: oldD } = computeExpenseDeltas(oldExpense);
  const { monthYear: newMonth, deltas: newD } = computeExpenseDeltas(newExpense);

  // Apply negative of old deltas
  const negOld: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
  Object.entries(oldD).forEach(([k, v]) => {
    negOld[k] = {
      totalIncomeDelta: -v.totalIncomeDelta,
      totalExpensesDelta: -v.totalExpensesDelta,
    };
  });

  const merged: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
  if (oldMonth === newMonth) {
    // Merge negOld and newD
    Object.entries(negOld).forEach(([k, v]) => {
      merged[k] = {
        ...(merged[k] || { totalIncomeDelta: 0, totalExpensesDelta: 0 }),
        totalIncomeDelta: (merged[k]?.totalIncomeDelta || 0) + v.totalIncomeDelta,
        totalExpensesDelta: (merged[k]?.totalExpensesDelta || 0) + v.totalExpensesDelta,
      };
    });
    Object.entries(newD).forEach(([k, v]) => {
      merged[k] = {
        ...(merged[k] || { totalIncomeDelta: 0, totalExpensesDelta: 0 }),
        totalIncomeDelta: (merged[k]?.totalIncomeDelta || 0) + v.totalIncomeDelta,
        totalExpensesDelta: (merged[k]?.totalExpensesDelta || 0) + v.totalExpensesDelta,
      };
    });
  }

  return {
    oldMonth,
    newMonth,
    oldDeltas: oldD,
    newDeltas: newD,
    negOldDeltas: negOld,
    mergedDeltas: merged,
  };
};
