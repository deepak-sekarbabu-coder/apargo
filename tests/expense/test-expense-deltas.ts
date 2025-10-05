import { computeExpenseDeltas } from '../../src/lib/firestore';

// Minimal stub of Expense type shape used by computeExpenseDeltas
const makeExpense = (overrides: any) => ({
  id: '1',
  description: 'Test',
  amount: 700,
  date: '2025-07-27T19:17:09.299Z',
  paidByApartment: 'T2',
  owedByApartments: ['T1', 'T3', 'T4', 'T5', 'T6', 'T7'],
  perApartmentShare: 100,
  categoryId: 'x',
  paidByApartments: [],
  ...overrides,
});

const run = () => {
  console.log('Test 1: No one has paid yet');
  const e1 = makeExpense({ paidByApartments: [] });
  const r1 = computeExpenseDeltas(e1 as any);
  console.log(r1);
  // Expect payer T2 totalIncome = 600, each unpaid owes totalExpenses = 100

  console.log('\nTest 2: Some have paid');
  const e2 = makeExpense({ paidByApartments: ['T1', 'T3'] });
  const r2 = computeExpenseDeltas(e2 as any);
  console.log(r2);
  // Expect payer T2 totalIncome = 400
};

run();
