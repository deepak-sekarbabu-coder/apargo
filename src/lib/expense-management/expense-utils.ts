import type { Expense } from './types';

export interface ExpenseCalculation {
  originalAmount: number;
  adjustedAmount: number; // Amount still owed (excluding paid apartments)
  totalOutstanding: number; // Total amount still owed to the paying apartment
  paidApartments: string[];
  unpaidApartments: string[];
  perApartmentShare: number;
}

export function calculateExpenseAmounts(expense: Expense): ExpenseCalculation {
  const { amount, owedByApartments = [], paidByApartments = [], perApartmentShare } = expense;

  // Ensure amount and perApartmentShare are numbers
  const numericAmount = Number(amount) || 0;
  const numericPerApartmentShare = Number(perApartmentShare) || 0;

  // Get apartments that still owe money
  const unpaidApartments = owedByApartments.filter(
    apartmentId => !paidByApartments.includes(apartmentId)
  );

  // Calculate adjusted amount (excluding contributions from paid apartments)
  const adjustedAmount = unpaidApartments.length * numericPerApartmentShare;

  return {
    originalAmount: numericAmount,
    adjustedAmount,
    totalOutstanding: adjustedAmount,
    paidApartments: paidByApartments,
    unpaidApartments,
    perApartmentShare: numericPerApartmentShare,
  };
}

export function calculateTotalOutstanding(expenses: Expense[], payingApartmentId: string): number {
  return expenses
    .filter(expense => expense.paidByApartment === payingApartmentId)
    .reduce((total, expense) => {
      const calculation = calculateExpenseAmounts(expense);
      return total + calculation.totalOutstanding;
    }, 0);
}

export function markApartmentAsPaid(expense: Expense, apartmentId: string): Expense {
  const paidByApartments = expense.paidByApartments || [];

  if (paidByApartments.includes(apartmentId)) {
    return expense; // Already paid
  }

  return {
    ...expense,
    paidByApartments: [...paidByApartments, apartmentId],
  };
}

export function markApartmentAsUnpaid(expense: Expense, apartmentId: string): Expense {
  const paidByApartments = expense.paidByApartments || [];

  return {
    ...expense,
    paidByApartments: paidByApartments.filter(id => id !== apartmentId),
  };
}
