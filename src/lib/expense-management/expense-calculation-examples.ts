/**
 * Example implementations demonstrating how to extend the expense calculation system
 * using the Open/Closed Principle with the Strategy Pattern.
 */
import type { ExpenseCalculationStrategy } from './expense-calculation-strategies';
import { registerExpenseCalculationStrategy } from './expense-calculation-strategies';
import type { Expense } from '../core/types';

/**
 * Example: Maintenance Fee Expense Strategy
 *
 * This strategy handles maintenance fees that are distributed equally among all apartments
 * regardless of who paid. Useful for building-wide expenses like elevator maintenance.
 */
export class MaintenanceFeeExpenseStrategy implements ExpenseCalculationStrategy {
  canHandle(expense: Expense): boolean {
    // This strategy handles expenses with category "maintenance" and a special flag
    return expense.categoryId === 'maintenance' && expense.description?.includes('[MAINTENANCE]');
  }

  calculateDeltas(expense: Expense) {
    const monthYear = this.getMonthYearFromDate(expense.date);
    const deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};

    // For maintenance fees, the payer gets income credit, and ALL apartments (including payer)
    // share the expense equally
    const totalApartments = expense.owedByApartments?.length || 0;
    if (totalApartments === 0) return { monthYear, deltas };

    const perApartmentCost = expense.amount / totalApartments;

    // All apartments (including payer) incur the expense
    [...(expense.owedByApartments || [])].forEach(apartmentId => {
      deltas[apartmentId] = deltas[apartmentId] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
      deltas[apartmentId].totalExpensesDelta += perApartmentCost;
    });

    // The payer gets income credit for organizing the maintenance
    const payer = expense.paidByApartment;
    deltas[payer] = deltas[payer] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
    deltas[payer].totalIncomeDelta += expense.amount;

    return { monthYear, deltas };
  }

  private getMonthYearFromDate(isoDate?: string) {
    const d = isoDate ? new Date(isoDate) : new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${y}-${m}`;
  }
}

/**
 * Example: Utility Bill Expense Strategy
 *
 * This strategy handles utility bills where the expense is prorated based on apartment size
 * rather than equal shares.
 */
export class UtilityBillExpenseStrategy implements ExpenseCalculationStrategy {
  canHandle(expense: Expense): boolean {
    // This strategy handles expenses with category "utilities"
    return expense.categoryId === 'utilities';
  }

  calculateDeltas(expense: Expense) {
    const monthYear = this.getMonthYearFromDate(expense.date);
    const deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};

    // For utilities, we might want to prorate based on apartment size
    // This is a simplified example - in reality, you'd look up apartment sizes from a database
    const apartmentSizes: Record<string, number> = {
      apt1: 800, // sq ft
      apt2: 1000,
      apt3: 1200,
    };

    const totalSize =
      expense.owedByApartments?.reduce((sum, aptId) => sum + (apartmentSizes[aptId] || 1), 0) || 1;

    expense.owedByApartments?.forEach(apartmentId => {
      const apartmentSize = apartmentSizes[apartmentId] || 1;
      const proratedAmount = (expense.amount * apartmentSize) / totalSize;

      deltas[apartmentId] = deltas[apartmentId] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
      deltas[apartmentId].totalExpensesDelta += proratedAmount;
    });

    // The payer gets income credit
    const payer = expense.paidByApartment;
    deltas[payer] = deltas[payer] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
    deltas[payer].totalIncomeDelta += expense.amount;

    return { monthYear, deltas };
  }

  private getMonthYearFromDate(isoDate?: string) {
    const d = isoDate ? new Date(isoDate) : new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${y}-${m}`;
  }
}

/**
 * Example: How to register new strategies
 *
 * Call this function during app initialization to register new expense calculation strategies.
 * This allows the system to handle new expense types without modifying the core logic.
 */
export const registerCustomExpenseStrategies = () => {
  registerExpenseCalculationStrategy(new MaintenanceFeeExpenseStrategy());
  registerExpenseCalculationStrategy(new UtilityBillExpenseStrategy());

  console.log('Custom expense calculation strategies registered');
};

/**
 * Example: How to create a completely custom strategy
 *
 * Here's how you would create a strategy for a specific business rule
 */
export class CustomBusinessExpenseStrategy implements ExpenseCalculationStrategy {
  constructor(private businessRules: { appliesTo: (expense: Expense) => boolean; calculate: (expense: Expense) => Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> }) {}

  canHandle(expense: Expense): boolean {
    // Custom logic to determine if this strategy applies
    return expense.categoryId === 'custom' && this.businessRules.appliesTo(expense);
  }

  calculateDeltas(expense: Expense) {
    // Implement custom calculation logic here
    const monthYear = this.getMonthYearFromDate(expense.date);
    const deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};

    // Custom calculation based on business rules
    // This is just an example - implement your specific logic
    const result = this.businessRules.calculate(expense);
    Object.assign(deltas, result);

    return { monthYear, deltas };
  }

  private getMonthYearFromDate(isoDate?: string) {
    const d = isoDate ? new Date(isoDate) : new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${y}-${m}`;
  }
}
