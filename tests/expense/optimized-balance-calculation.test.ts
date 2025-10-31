import { 
  calculateApartmentBalances, 
  calculateApartmentBalancesOptimized,
  calculateUnpaidBillsCount
} from '@/lib/balance-calculation';
import type { Expense, Apartment } from '@/lib/types';

describe('Optimized Balance Calculation Tests', () => {
  // Mock expense data
  const mockExpenses: Expense[] = [
    {
      id: '1',
      description: 'Electricity Bill',
      amount: 700,
      date: '2025-07-27T19:17:09.299Z',
      paidByApartment: 'T2',
      categoryId: 'electricity',
      owedByApartments: ['T1', 'T3', 'T4', 'T5', 'T6', 'T7'], // 6 apartments owe money
      perApartmentShare: 100, // 700 ÷ 7 = 100 per apartment
      paidByApartments: [], // No one has paid yet
      paid: false,
    },
    {
      id: '2',
      description: 'Water Bill',
      amount: 500,
      date: '2025-07-28T19:17:09.299Z',
      paidByApartment: 'T3',
      categoryId: 'water',
      owedByApartments: ['T1', 'T2', 'T4', 'T5', 'T6', 'T7'],
      perApartmentShare: 71.43, // 500 ÷ 7 ≈ 71.43 per apartment
      paidByApartments: ['T1'], // T1 has paid their share
      paid: false,
    },
    {
      id: '3',
      description: 'Internet Bill',
      amount: 1400,
      date: '2025-07-29T19:17:09.299Z',
      paidByApartment: 'T1',
      categoryId: 'internet',
      owedByApartments: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      perApartmentShare: 233.33, // 1400 ÷ 6 ≈ 233.33 per apartment
      paidByApartments: ['T2', 'T3'], // T2 and T3 have paid
      paid: false,
    }
  ];

  const mockApartments: Apartment[] = [
    { id: 'T1', name: 'Apartment T1', members: [] },
    { id: 'T2', name: 'Apartment T2', members: [] },
    { id: 'T3', name: 'Apartment T3', members: [] },
    { id: 'T4', name: 'Apartment T4', members: [] },
    { id: 'T5', name: 'Apartment T5', members: [] },
    { id: 'T6', name: 'Apartment T6', members: [] },
    { id: 'T7', name: 'Apartment T7', members: [] },
  ];

  test('original and optimized calculations should produce identical results', () => {
    const originalResult = calculateApartmentBalances(mockExpenses, mockApartments);
    const optimizedResult = calculateApartmentBalancesOptimized(mockExpenses, mockApartments);

    // Compare results apartment by apartment
    mockApartments.forEach(apartment => {
      const aptId = apartment.id;
      const original = originalResult[aptId];
      const optimized = optimizedResult[aptId];

      expect(optimized).toBeDefined();
      expect(optimized.name).toBe(original.name);
      expect(Math.round(optimized.balance * 100) / 100).toBe(Math.round(original.balance * 100) / 100);

      // Compare owes and isOwed maps
      const originalOwesKeys = Object.keys(original.owes).sort();
      const optimizedOwesKeys = Object.keys(optimized.owes).sort();
      
      expect(originalOwesKeys).toEqual(optimizedOwesKeys);
      
      originalOwesKeys.forEach(debtorId => {
        expect(Math.round((optimized.owes[debtorId] || 0) * 100) / 100).toBe(
          Math.round((original.owes[debtorId] || 0) * 100) / 100
        );
      });

      const originalIsOwedKeys = Object.keys(original.isOwed).sort();
      const optimizedIsOwedKeys = Object.keys(optimized.isOwed).sort();
      
      expect(originalIsOwedKeys).toEqual(optimizedIsOwedKeys);
      
      originalIsOwedKeys.forEach(creditorId => {
        expect(Math.round((optimized.isOwed[creditorId] || 0) * 100) / 100).toBe(
          Math.round((original.isOwed[creditorId] || 0) * 100) / 100
        );
      });
    });
  });

  test('should calculate unpaid bills count correctly', () => {
    const unpaidCount = calculateUnpaidBillsCount(mockExpenses);
    
    // Expected unpaid bills:
    // Expense 1: 6 unpaid (all apartments except T2 who paid)
    // Expense 2: 5 unpaid (all except T1 who paid, and T3 is paying)
    // Expense 3: 4 unpaid (all except T2, T3 who paid)
    // Total: 6 + 5 + 4 = 15 unpaid bills
    
    expect(unpaidCount).toBe(15);
  });

  test('should handle edge case with no expenses', () => {
    const emptyResult = calculateApartmentBalances([], mockApartments);
    
    mockApartments.forEach(apartment => {
      const result = emptyResult[apartment.id];
      expect(result.balance).toBe(0);
      expect(Object.keys(result.owes).length).toBe(0);
      expect(Object.keys(result.isOwed).length).toBe(0);
    });
  });

  test('should handle edge case with no unpaid apartments', () => {
    const paidExpenses = mockExpenses.map(expense => ({
      ...expense,
      paidByApartments: expense.owedByApartments
    }));

    const result = calculateApartmentBalances(paidExpenses, mockApartments);
    
    mockApartments.forEach(apartment => {
      const aptResult = result[apartment.id];
      expect(aptResult.balance).toBe(0);
      expect(Object.keys(aptResult.owes).length).toBe(0);
      expect(Object.keys(aptResult.isOwed).length).toBe(0);
    });
  });

  test('should handle single apartment scenario', () => {
    const singleApartment: Apartment[] = [{ id: 'T1', name: 'Apartment T1', members: [] }];
    const singleExpense: Expense[] = [{
      ...mockExpenses[0],
      paidByApartment: 'T1', // Same as the single apartment
      owedByApartments: ['T1'], // T1 owes to itself
      perApartmentShare: 700
    }];

    const result = calculateApartmentBalances(singleExpense, singleApartment);
    
    expect(result['T1'].balance).toBe(0); // No money owed to anyone when paying and owing are the same
    expect(Object.keys(result['T1'].owes).length).toBe(0);
    expect(Object.keys(result['T1'].isOwed).length).toBe(0);
  });

  test('performance comparison - optimized version should be faster for large datasets', () => {
    // Create large dataset
    const largeApartmentCount = 100;
    const largeExpensesCount = 1000;
    
    const largeApartments: Apartment[] = Array.from({ length: largeApartmentCount }, (_, i) => ({
      id: `apt-${i}`,
      name: `Apartment ${i}`,
      members: []
    }));
    
    const largeExpenses: Expense[] = Array.from({ length: largeExpensesCount }, (_, i) => ({
      id: `exp-${i}`,
      description: `Expense ${i}`,
      amount: Math.random() * 1000 + 100,
      date: new Date().toISOString(),
      paidByApartment: `apt-${Math.floor(Math.random() * largeApartmentCount)}`,
      owedByApartments: Array.from({ length: 10 }, () => `apt-${Math.floor(Math.random() * largeApartmentCount)}`),
      perApartmentShare: Math.random() * 100 + 10,
      categoryId: `category-${i % 10}`,
      paidByApartments: [],
      paid: false,
    }));

    // Measure performance of optimized version
    const startTime = performance.now();
    const optimizedResult = calculateApartmentBalancesOptimized(largeExpenses, largeApartments);
    const optimizedTime = performance.now() - startTime;

    // The optimized version should complete quickly (under 100ms for this size)
    expect(optimizedTime).toBeLessThan(100);
    expect(Object.keys(optimizedResult).length).toBe(largeApartmentCount);
  });
});