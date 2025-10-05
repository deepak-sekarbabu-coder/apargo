import type { Apartment, Expense } from '@/lib/types';

export interface ApartmentBalance {
  name: string;
  balance: number;
  owes: Record<string, number>;
  isOwed: Record<string, number>;
}

/**
 * Calculate apartment balances based on expenses
 * @param expenses - Array of expenses
 * @param apartments - Array of apartments
 * @returns Record of apartment balances
 */
export function calculateApartmentBalances(
  expenses: Expense[],
  apartments: Apartment[]
): Record<string, ApartmentBalance> {
  const balances: Record<string, ApartmentBalance> = {};

  // Initialize balances for all apartments
  apartments.forEach(apartment => {
    balances[apartment.id] = {
      name: apartment.name,
      balance: 0,
      owes: {},
      isOwed: {},
    };
  });

  // Process each expense to calculate balances
  expenses.forEach(expense => {
    const { paidByApartment, owedByApartments, perApartmentShare, paidByApartments = [] } = expense;

    // Get apartments that still owe money (haven't paid yet)
    const unpaidApartments =
      owedByApartments?.filter(apartmentId => !paidByApartments.includes(apartmentId)) || [];

    // Calculate the amount still owed to the paying apartment (only from unpaid apartments)
    const totalStillOwed = unpaidApartments.length * perApartmentShare;

    // Add to the paid apartment's balance (only the amount still owed by unpaid apartments)
    if (balances[paidByApartment]) {
      balances[paidByApartment].balance += totalStillOwed;

      // Track how much this apartment is owed by others (only unpaid apartments)
      unpaidApartments.forEach(apartmentId => {
        if (apartmentId !== paidByApartment) {
          balances[paidByApartment].isOwed[apartmentId] =
            (balances[paidByApartment].isOwed[apartmentId] || 0) + perApartmentShare;
        }
      });
    }

    // Subtract from the unpaid apartments' balances only
    unpaidApartments.forEach(apartmentId => {
      if (balances[apartmentId] && apartmentId !== paidByApartment) {
        balances[apartmentId].balance -= perApartmentShare;

        // Track how much this apartment owes to others
        balances[apartmentId].owes[paidByApartment] =
          (balances[apartmentId].owes[paidByApartment] || 0) + perApartmentShare;
      }
    });

    // For apartments that have paid their share but aren't the paying apartment,
    // their balance should be 0 for this expense (they don't owe anything)
    paidByApartments.forEach(apartmentId => {
      if (apartmentId !== paidByApartment && owedByApartments?.includes(apartmentId)) {
        // This apartment has paid their share, so they don't owe anything for this expense
        // Their balance remains unchanged (neither positive nor negative for this expense)
      }
    });
  });

  return balances;
}

/**
 * Calculate monthly expenses for a given month and year
 * @param expenses - Array of expenses
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Total amount for the month
 */
export function calculateMonthlyExpenses(expenses: Expense[], month: number, year: number): number {
  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    })
    .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
}

/**
 * Calculate unpaid bills count across all expenses
 * @param expenses - Array of expenses
 * @returns Number of unpaid bills
 */
export function calculateUnpaidBillsCount(expenses: Expense[]): number {
  return expenses.reduce((count, exp) => {
    const unpaid = (exp.owedByApartments || []).filter(
      aptId => !(exp.paidByApartments || []).includes(aptId)
    );
    return count + unpaid.length;
  }, 0);
}
