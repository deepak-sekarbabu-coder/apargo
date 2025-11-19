import type { Apartment, Expense } from '@/lib/types';

export interface ApartmentBalance {
  name: string;
  balance: number;
  owes: Record<string, number>;
  isOwed: Record<string, number>;
}

/**
 * Calculate apartment balances based on expenses
 * Ultra-optimized version with single-pass calculations and minimal operations
 * @param expenses - Array of expenses
 * @param apartments - Array of apartments
 * @returns Record of apartment balances
 */
export function calculateApartmentBalances(
  expenses: Expense[],
  apartments: Apartment[]
): Record<string, ApartmentBalance> {
  const balances: Record<string, ApartmentBalance> = {};

  // Initialize balances for all apartments with single loop
  apartments.forEach(apartment => {
    balances[apartment.id] = {
      name: apartment.name,
      balance: 0,
      owes: {},
      isOwed: {},
    };
  });

  // Ultra-optimized single-pass through all expenses
  expenses.forEach(expense => {
    const {
      paidByApartment,
      owedByApartments = [],
      perApartmentShare,
      paidByApartments = [],
    } = expense;

    // Create unpaid apartments map in single operation using pre-computed lookup
    const paidApartmentsSet = new Set(paidByApartments);
    const unpaidApartments = owedByApartments.filter(
      apartmentId => apartmentId !== paidByApartment && !paidApartmentsSet.has(apartmentId)
    );

    // Skip if no unpaid apartments
    if (unpaidApartments.length === 0) return;

    const totalStillOwed = unpaidApartments.length * perApartmentShare;

    // Single update for paying apartment
    const payingBalance = balances[paidByApartment];
    if (payingBalance) {
      payingBalance.balance += totalStillOwed;

      // Update owed amounts for all unpaid apartments in single loop
      for (let i = 0; i < unpaidApartments.length; i++) {
        const apartmentId = unpaidApartments[i];
        if (apartmentId !== paidByApartment) {
          const currentIsOwed = payingBalance.isOwed[apartmentId] || 0;
          payingBalance.isOwed[apartmentId] = currentIsOwed + perApartmentShare;
        }
      }
    }

    // Update all unpaid apartments in single loop
    for (let i = 0; i < unpaidApartments.length; i++) {
      const apartmentId = unpaidApartments[i];
      if (apartmentId !== paidByApartment && balances[apartmentId]) {
        const aptBalance = balances[apartmentId];
        aptBalance.balance -= perApartmentShare;
        const currentOwes = aptBalance.owes[paidByApartment] || 0;
        aptBalance.owes[paidByApartment] = currentOwes + perApartmentShare;
      }
    }
  });

  return balances;
}

/**
 * Calculate monthly expenses for a given month and year
 * Optimized version with single-pass calculation
 * @param expenses - Array of expenses
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Total amount for the month
 */
export function calculateMonthlyExpenses(expenses: Expense[], month: number, year: number): number {
  let total = 0;
  const targetMonth = month;
  const targetYear = year;

  // Single pass with direct calculation
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const expenseDate = new Date(expense.date);

    // Early exit if month/year doesn't match
    if (expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear) {
      total += Number(expense.amount) || 0;
    }
  }

  return total;
}

/**
 * Calculate unpaid bills count across all expenses
 * Ultra-optimized version with minimal array operations
 * @param expenses - Array of expenses
 * @returns Number of unpaid bills
 */
export function calculateUnpaidBillsCount(expenses: Expense[]): number {
  let count = 0;

  // Single pass through all expenses
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const owedApartments = expense.owedByApartments || [];
    const paidApartments = expense.paidByApartments || [];

    // Create paid apartments set once per expense
    const paidSet = new Set(paidApartments);

    // Count unpaid apartments in single loop
    for (let j = 0; j < owedApartments.length; j++) {
      const apartmentId = owedApartments[j];
      if (!paidSet.has(apartmentId)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Alternative ultra-optimized balance calculation using minimal operations
 * Processes all expenses in single pass with aggregated debt tracking
 */
export function calculateApartmentBalancesOptimized(
  expenses: Expense[],
  apartments: Apartment[]
): Record<string, ApartmentBalance> {
  // Initialize balance tracking with Maps for O(1) lookups
  const apartmentBalances = new Map<
    string,
    {
      balance: number;
      owes: Record<string, number>;
      owedBy: Record<string, number>;
    }
  >();

  // Initialize apartments in single loop
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    apartmentBalances.set(apt.id, {
      balance: 0,
      owes: {},
      owedBy: {},
    });
  }

  // Single pass through all expenses
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const {
      paidByApartment,
      owedByApartments = [],
      perApartmentShare,
      paidByApartments = [],
    } = expense;

    // Create unpaid apartments array with minimal operations
    const paidApartmentsSet = new Set(paidByApartments);
    const unpaidApartments: string[] = [];

    for (let j = 0; j < owedByApartments.length; j++) {
      const aptId = owedByApartments[j];
      if (aptId !== paidByApartment && !paidApartmentsSet.has(aptId)) {
        unpaidApartments.push(aptId);
      }
    }

    if (unpaidApartments.length === 0) continue;

    const totalDebt = unpaidApartments.length * perApartmentShare;

    // Update paying apartment
    const payingBalance = apartmentBalances.get(paidByApartment);
    if (payingBalance) {
      payingBalance.balance += totalDebt;

      // Track individual debts owed to paying apartment
      for (let j = 0; j < unpaidApartments.length; j++) {
        const aptId = unpaidApartments[j];
        const currentOwed = payingBalance.owedBy[aptId] || 0;
        payingBalance.owedBy[aptId] = currentOwed + perApartmentShare;
      }
    }

    // Update all unpaid apartments
    for (let j = 0; j < unpaidApartments.length; j++) {
      const aptId = unpaidApartments[j];
      const aptBalance = apartmentBalances.get(aptId);
      if (aptBalance) {
        aptBalance.balance -= perApartmentShare;
        const currentOwes = aptBalance.owes[paidByApartment] || 0;
        aptBalance.owes[paidByApartment] = currentOwes + perApartmentShare;
      }
    }
  }

  // Convert back to expected format
  const result: Record<string, ApartmentBalance> = {};
  apartmentBalances.forEach((balance, apartmentId) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    result[apartmentId] = {
      name: apartment?.name || apartmentId,
      balance: balance.balance,
      owes: balance.owes,
      isOwed: balance.owedBy,
    };
  });

  return result;
}
