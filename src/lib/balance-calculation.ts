import type { Apartment, Expense } from '@/lib/types';

export interface ApartmentBalance {
  name: string;
  balance: number;
  owes: Record<string, number>;
  isOwed: Record<string, number>;
}

/**
 * Calculate apartment balances based on expenses
 * Optimized version with single-pass calculations and O(1) lookups
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

  // Single-pass optimization: Process expenses with pre-computed data structures
  expenses.forEach(expense => {
    const { 
      paidByApartment, 
      owedByApartments = [], 
      perApartmentShare, 
      paidByApartments = [] 
    } = expense;

    // Pre-compute unpaid apartments set for O(1) lookups
    const unpaidApartmentsSet = new Set(
      owedByApartments
        .filter(apartmentId => apartmentId !== paidByApartment) // Exclude self-debt
        .filter(apartmentId => !paidByApartments.includes(apartmentId))
    );

    // Also exclude the paying apartment from unpaid list if they were initially in owedByApartments
    if (unpaidApartmentsSet.has(paidByApartment)) {
      unpaidApartmentsSet.delete(paidByApartment);
    }

    // Skip if no unpaid apartments
    if (unpaidApartmentsSet.size === 0) return;

    const totalStillOwed = unpaidApartmentsSet.size * perApartmentShare;

    // Single operation for the paying apartment
    if (balances[paidByApartment]) {
      balances[paidByApartment].balance += totalStillOwed;

      // Track owed amounts for the paying apartment in single loop (accumulate)
      unpaidApartmentsSet.forEach(apartmentId => {
        if (apartmentId !== paidByApartment) {
          const currentIsOwed = balances[paidByApartment].isOwed[apartmentId] || 0;
          balances[paidByApartment].isOwed[apartmentId] = currentIsOwed + perApartmentShare;
        }
      });
    }

    // Update all unpaid apartments in single loop (accumulate)
    unpaidApartmentsSet.forEach(apartmentId => {
      if (apartmentId !== paidByApartment && balances[apartmentId]) {
        balances[apartmentId].balance -= perApartmentShare;
        const currentOwes = balances[apartmentId].owes[paidByApartment] || 0;
        balances[apartmentId].owes[paidByApartment] = currentOwes + perApartmentShare;
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
 * Optimized version using Set operations for better performance
 * @param expenses - Array of expenses
 * @returns Number of unpaid bills
 */
export function calculateUnpaidBillsCount(expenses: Expense[]): number {
  return expenses.reduce((count, expense) => {
    const owedApartments = expense.owedByApartments || [];
    const paidApartments = new Set(expense.paidByApartments || []);
    
    // Count apartments that owe money but haven't paid
    const unpaidCount = owedApartments.reduce((acc, apartmentId) => {
      return acc + (paidApartments.has(apartmentId) ? 0 : 1);
    }, 0);
    
    return count + unpaidCount;
  }, 0);
}

/**
 * Alternative optimized balance calculation using aggregation approach
 * Processes all expenses in single pass with aggregated debt tracking
 */
export function calculateApartmentBalancesOptimized(
  expenses: Expense[],
  apartments: Apartment[]
): Record<string, ApartmentBalance> {
  // Initialize balance tracking
  const apartmentBalances = new Map<string, {
    balance: number;
    owesTo: Map<string, number>;
    owedBy: Map<string, number>;
  }>();

  // Initialize apartments in single loop
  apartments.forEach(apt => {
    apartmentBalances.set(apt.id, {
      balance: 0,
      owesTo: new Map(),
      owedBy: new Map(),
    });
  });

  // Single pass through all expenses
  expenses.forEach(expense => {
    const { 
      paidByApartment, 
      owedByApartments = [], 
      perApartmentShare, 
      paidByApartments = [] 
    } = expense;

    // Create unpaid apartments map for O(1) operations (exclude self-debt)
    const unpaidMap = new Map<string, boolean>();
    owedByApartments
      .filter(aptId => aptId !== paidByApartment) // Exclude self-debt
      .forEach(aptId => {
        unpaidMap.set(aptId, !paidByApartments.includes(aptId));
      });

    // Also exclude the paying apartment from unpaid list if they were initially in owedByApartments
    if (unpaidMap.has(paidByApartment)) {
      unpaidMap.delete(paidByApartment);
    }

    // Get unpaid apartments count and calculate total debt
    const unpaidApartments = Array.from(unpaidMap.entries())
      .filter(([, isUnpaid]) => isUnpaid)
      .map(([apartmentId]) => apartmentId);

    if (unpaidApartments.length === 0) return;

    const totalDebt = unpaidApartments.length * perApartmentShare;

    // Update paying apartment
    const payingBalance = apartmentBalances.get(paidByApartment);
    if (payingBalance) {
      payingBalance.balance += totalDebt;
      
      // Track individual debts owed to paying apartment (accumulate instead of overwrite)
      unpaidApartments.forEach(aptId => {
        if (aptId !== paidByApartment) {
          const currentOwed = payingBalance.owedBy.get(aptId) || 0;
          payingBalance.owedBy.set(aptId, currentOwed + perApartmentShare);
        }
      });
    }

    // Update all unpaid apartments (accumulate instead of overwrite)
    unpaidApartments.forEach(aptId => {
      const aptBalance = apartmentBalances.get(aptId);
      if (aptBalance && aptId !== paidByApartment) {
        aptBalance.balance -= perApartmentShare;
        const currentOwes = aptBalance.owesTo.get(paidByApartment) || 0;
        aptBalance.owesTo.set(paidByApartment, currentOwes + perApartmentShare);
      }
    });
  });

  // Convert back to expected format
  const result: Record<string, ApartmentBalance> = {};
  apartmentBalances.forEach((balance, apartmentId) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    result[apartmentId] = {
      name: apartment?.name || apartmentId,
      balance: balance.balance,
      owes: Object.fromEntries(balance.owesTo),
      isOwed: Object.fromEntries(balance.owedBy),
    };
  });

  return result;
}
