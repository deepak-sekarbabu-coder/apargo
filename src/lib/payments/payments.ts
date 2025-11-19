import type { Payment } from './types';

// Compute per-document deltas for an approved payment transition.
// Returns a list of { apartmentId, monthYear, totalIncomeDelta, totalExpensesDelta } entries.
export type PaymentDelta = {
  apartmentId: string;
  monthYear: string;
  totalIncomeDelta: number; // positive to add income, negative to remove
  totalExpensesDelta: number; // positive to add expense, negative to remove
};

const isApprovedPayment = (p?: Partial<Payment>) =>
  !!p &&
  // accept different casings for status, e.g. 'Approved'
  (typeof p.status === 'string'
    ? p.status.toLowerCase() === 'approved'
    : p.status === 'approved') &&
  // Ensure we have an apartment identifier and monthYear
  !!(p.monthYear && (p.apartmentId || (p as Payment).payerId));

const paymentIsExpense = (p?: Partial<Payment>) =>
  !!p &&
  ((typeof p.category === 'string' && p.category.toLowerCase() === 'expense') || !!p.expenseId);

const paymentIsIncome = (p?: Partial<Payment>) =>
  !!p && typeof p.category === 'string' && p.category.toLowerCase() === 'income';

export function computeApprovedExpensePaymentDeltas(
  oldPayment?: Partial<Payment>,
  newPayment?: Partial<Payment>
): PaymentDelta[] {
  const deltas: PaymentDelta[] = [];

  // Helper to produce delta for a payment (positive value)
  const makeDelta = (p: Partial<Payment>, sign = 1): PaymentDelta => {
    const apt = p.apartmentId || (p as Payment).payerId!;
    const monthYear = p.monthYear!;
    const amount = Number(p.amount || 0) * sign;
    return {
      apartmentId: apt,
      monthYear,
      totalIncomeDelta: paymentIsIncome(p) ? amount : 0,
      totalExpensesDelta: paymentIsExpense(p) ? amount : 0,
    };
  };

  // If old was an approved payment, subtract its effect
  if (isApprovedPayment(oldPayment)) {
    deltas.push(makeDelta(oldPayment!, -1));
  }

  // If new is an approved payment, add its effect
  if (isApprovedPayment(newPayment)) {
    deltas.push(makeDelta(newPayment!, 1));
  }

  // When both exist and target is same doc, merge into a single entry
  if (
    deltas.length === 2 &&
    deltas[0].apartmentId === deltas[1].apartmentId &&
    deltas[0].monthYear === deltas[1].monthYear
  ) {
    const merged: PaymentDelta = {
      apartmentId: deltas[0].apartmentId,
      monthYear: deltas[0].monthYear,
      totalIncomeDelta: deltas[0].totalIncomeDelta + deltas[1].totalIncomeDelta,
      totalExpensesDelta: deltas[0].totalExpensesDelta + deltas[1].totalExpensesDelta,
    };
    return Math.abs(merged.totalIncomeDelta) + Math.abs(merged.totalExpensesDelta) > 0
      ? [merged]
      : [];
  }

  // Filter out zero-effect entries
  return deltas.filter(d => Math.abs(d.totalIncomeDelta) + Math.abs(d.totalExpensesDelta) > 0);
}
