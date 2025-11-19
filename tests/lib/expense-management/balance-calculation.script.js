// Test the expense calculation logic
console.log('=== Testing Expense Calculation Logic ===');

// Mock expense data (similar to what's in the database)
const mockExpense = {
  id: '1',
  description: 'Electricity Bill',
  amount: 700,
  date: '2025-07-27T19:17:09.299Z',
  paidByApartment: 'T2',
  categoryId: 'electricity',
  // These fields might be missing in existing expenses
  owedByApartments: ['T1', 'T3', 'T4', 'T5', 'T6', 'T7'], // 6 apartments owe money
  perApartmentShare: 100, // 700 ÷ 7 = 100 per apartment
  paidByApartments: [], // No one has paid yet
};

// Mock apartments
const mockApartments = [
  { id: 'T1', name: 'Apartment T1' },
  { id: 'T2', name: 'Apartment T2' },
  { id: 'T3', name: 'Apartment T3' },
  { id: 'T4', name: 'Apartment T4' },
  { id: 'T5', name: 'Apartment T5' },
  { id: 'T6', name: 'Apartment T6' },
  { id: 'T7', name: 'Apartment T7' },
];

// Simulate the calculation
function calculateExpenseAmounts(expense, apartments) {
  const { amount, owedByApartments = [], paidByApartments = [], perApartmentShare } = expense;

  // Convert paidByApartments to a Set for faster lookups
  const paidSet = new Set(paidByApartments);

  // Get apartments that still owe money
  const unpaidApartments = owedByApartments.filter(apartmentId => !paidSet.has(apartmentId));

  // Calculate adjusted amount (excluding contributions from paid apartments)
  const adjustedAmount = unpaidApartments.length * perApartmentShare;

  return {
    originalAmount: amount,
    adjustedAmount,
    totalOutstanding: adjustedAmount,
    paidApartments: paidByApartments,
    unpaidApartments,
    perApartmentShare,
  };
}

function calculateTotalOutstanding(expenses, payingApartmentId) {
  return expenses
    .filter(expense => expense.paidByApartment === payingApartmentId)
    .reduce((total, expense) => {
      const calculation = calculateExpenseAmounts(expense, []);
      return total + calculation.totalOutstanding;
    }, 0);
}

// Test the calculation
console.log('Mock expense:', mockExpense);
const calculation = calculateExpenseAmounts(mockExpense, mockApartments);
console.log('Calculation result:', calculation);

// Test total outstanding for T2 (the paying apartment)
const totalOutstanding = calculateTotalOutstanding([mockExpense], 'T2');
console.log('Total outstanding for T2:', totalOutstanding);

console.log('\n=== Expected Results ===');
console.log('- Original amount: ₹700');
console.log('- Adjusted amount (outstanding): ₹600 (6 apartments × ₹100)');
console.log('- Should show red alert with -₹600');

console.log('\n=== Actual Results ===');
console.log(`- Original amount: ₹${calculation.originalAmount}`);
console.log(`- Adjusted amount (outstanding): ₹${calculation.adjustedAmount}`);
console.log(`- Total outstanding for T2: ₹${totalOutstanding}`);
console.log(`- Should show red alert: ${totalOutstanding > 0 ? 'YES' : 'NO'}`);

// Test with some payments made
console.log('\n=== Testing with Payments ===');
const expenseWithPayments = {
  ...mockExpense,
  paidByApartments: ['T1', 'T3'], // T1 and T3 have paid
};

const calculationWithPayments = calculateExpenseAmounts(expenseWithPayments, mockApartments);
console.log('After T1 and T3 paid:', calculationWithPayments);
console.log(`Outstanding should be: ₹400 (4 apartments × ₹100)`);
console.log(`Actual outstanding: ₹${calculationWithPayments.adjustedAmount}`);

console.log('\n=== Test Complete ===');
