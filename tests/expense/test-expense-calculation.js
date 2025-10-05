// Simple test to verify expense calculation logic
const {
  calculateExpenseAmounts,
  calculateTotalOutstanding,
} = require('../../src/lib/expense-utils.ts');

// Mock data
const apartments = [
  { id: 'T1', name: 'Apartment T1' },
  { id: 'T2', name: 'Apartment T2' },
  { id: 'T3', name: 'Apartment T3' },
  { id: 'T4', name: 'Apartment T4' },
  { id: 'T5', name: 'Apartment T5' },
  { id: 'T6', name: 'Apartment T6' },
  { id: 'T7', name: 'Apartment T7' },
];

// Test expense: T2 paid amount, divided among all apartments = amount each
// T2 owes nothing, other 6 apartments owe $100 each = $600 total outstanding
const testExpense = {
  id: '1',
  description: 'Electricity Bill',
  amount: 700,
  date: '2025-07-27T19:17:09.299Z',
  paidByApartment: 'T2',
  owedByApartments: ['T1', 'T3', 'T4', 'T5', 'T6', 'T7'],
  perApartmentShare: 100,
  categoryId: 'electricity',
  paidByApartments: [], // No one has paid yet
};

console.log('=== Testing Expense Calculation ===');
console.log('Original expense:', testExpense);

const calculation = calculateExpenseAmounts(testExpense, apartments);
console.log('\nCalculation result:', calculation);

console.log('\n=== Expected Results ===');
console.log('Original amount: $700');
console.log('Adjusted amount (outstanding): $600');
console.log('Apartments that still owe: 6');
console.log('Per apartment share: $100');

console.log('\n=== Actual Results ===');
console.log(`Original amount: $${calculation.originalAmount}`);
console.log(`Adjusted amount (outstanding): $${calculation.adjustedAmount}`);
console.log(`Apartments that still owe: ${calculation.unpaidApartments.length}`);
console.log(`Per apartment share: $${calculation.perApartmentShare}`);

// Test with some apartments having paid
const testExpenseWithPayments = {
  ...testExpense,
  paidByApartments: ['T1', 'T3'], // T1 and T3 have paid
};

console.log('\n=== Testing with Some Payments ===');
const calculationWithPayments = calculateExpenseAmounts(testExpenseWithPayments, apartments);
console.log('Expected outstanding: $400 (4 apartments × $100)');
console.log(`Actual outstanding: $${calculationWithPayments.adjustedAmount}`);
console.log(`Unpaid apartments: ${calculationWithPayments.unpaidApartments.length}`);

console.log('\n=== Test Complete ===');
