import type { Expense } from './types';

/**
 * Interface for expense delta calculation strategies.
 * Allows different types of expenses to have different calculation logic
 * while maintaining the same interface.
 */
export interface ExpenseCalculationStrategy {
  /**
   * Determines if this strategy can handle the given expense
   */
  canHandle(expense: Expense): boolean;

  /**
   * Calculates the delta changes for the expense
   */
  calculateDeltas(expense: Expense): {
    monthYear: string;
    deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>;
  };
}

/**
 * Default strategy for standard apartment expense calculations.
 * Handles expenses where one apartment pays and others owe shares.
 */
export class StandardExpenseCalculationStrategy implements ExpenseCalculationStrategy {
  canHandle(): boolean {
    // This strategy handles all expenses by default - it's the fallback
    return true;
  }

  calculateDeltas(expense: Expense) {
    const monthYear = this.getMonthYearFromDate(expense.date);
    const deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};

    const payer = expense.paidByApartment;
    const perShare = Number(expense.perApartmentShare) || 0;
    const owed = expense.owedByApartments || [];
    const paidByApartments = expense.paidByApartments || [];

    const unpaidOwed = this.computeUnpaidOwed(owed, paidByApartments);

    // Apply expenses to all owing apartments EXCEPT the payer
    // The payer gets income for the total amount they paid
    const owingApartmentsExcludingPayer = unpaidOwed.filter(id => id !== payer);
    this.applyExpensesToOwed(owingApartmentsExcludingPayer, perShare, deltas);

    const totalIncoming = owingApartmentsExcludingPayer.length * perShare;
    this.applyIncomeToPayer(payer, totalIncoming, deltas);

    return { monthYear, deltas };
  }

  private getMonthYearFromDate(isoDate?: string) {
    const d = isoDate ? new Date(isoDate) : new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${y}-${m}`;
  }

  private computeUnpaidOwed(owed: string[], paidByApartments: string[]): string[] {
    return owed.filter(aid => !paidByApartments.includes(aid));
  }

  private applyExpensesToOwed(
    unpaidOwed: string[],
    perShare: number,
    deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
  ) {
    unpaidOwed.forEach(aid => {
      deltas[aid] = deltas[aid] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
      deltas[aid].totalExpensesDelta += perShare;
    });
  }

  private applyIncomeToPayer(
    payer: string,
    totalIncoming: number,
    deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
  ) {
    deltas[payer] = deltas[payer] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
    deltas[payer].totalIncomeDelta += totalIncoming;
  }
}

/**
 * Registry for expense calculation strategies.
 * Allows new strategies to be registered without modifying existing code.
 */
export class ExpenseCalculationStrategyRegistry {
  private strategies: ExpenseCalculationStrategy[] = [];

  constructor() {
    // Register the default strategy
    this.registerStrategy(new StandardExpenseCalculationStrategy());
  }

  /**
   * Register a new calculation strategy
   */
  registerStrategy(strategy: ExpenseCalculationStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Find the appropriate strategy for an expense
   */
  getStrategyForExpense(expense: Expense): ExpenseCalculationStrategy {
    // Return the first strategy that can handle this expense
    // Check strategies in reverse order (most recently added first)
    const strategy = [...this.strategies].reverse().find(s => s.canHandle(expense));
    if (!strategy) {
      throw new Error(`No calculation strategy found for expense: ${expense.id}`);
    }
    return strategy;
  }

  /**
   * Get all registered strategies (for testing/debugging)
   */
  getAllStrategies(): ExpenseCalculationStrategy[] {
    return [...this.strategies];
  }
}

// Global registry instance
export const expenseCalculationRegistry = new ExpenseCalculationStrategyRegistry();

/**
 * Helper function to register new expense calculation strategies
 * This allows external modules to extend expense calculation logic
 */
export const registerExpenseCalculationStrategy = (strategy: ExpenseCalculationStrategy): void => {
  expenseCalculationRegistry.registerStrategy(strategy);
};
