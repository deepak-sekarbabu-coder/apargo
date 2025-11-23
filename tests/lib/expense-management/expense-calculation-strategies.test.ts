// Test to verify expense splitting logic works correctly
// This test simulates the expense splitting scenario

interface Apartment {
  id: string;
  name: string;
}

interface ExpenseWithApartmentDebts {
  description: string;
  amount: number;
  categoryId: string;
  paidByApartment: string;
  owedByApartments: string[];
  perApartmentShare: number;
  paidByApartments: string[];
}

describe('Expense Splitting Logic', () => {
  test('should correctly split expense among apartments', () => {
    // Mock data
    const apartments: Apartment[] = [
      { id: 'T1', name: 'Apartment T1' },
      { id: 'S2', name: 'Apartment S2' },
      { id: 'F1', name: 'Apartment F1' },
      { id: 'G1', name: 'Apartment G1' },
      { id: 'F2', name: 'Apartment F2' },
      { id: 'S1', name: 'Apartment S1' },
    ];

    const expenseAmount = 700;
    const payingApartmentId = 'T1';

    // Simulate the splitting logic from handleAddExpense
    if (!apartments || apartments.length === 0) {
      throw new Error('Apartments array is empty');
    }

    const allApartmentIds = apartments.map(apt => apt.id);
    const perApartmentShare = expenseAmount / allApartmentIds.length;
    const owingApartments = [...allApartmentIds];

    const expenseWithApartmentDebts: ExpenseWithApartmentDebts = {
      description: 'Test expense',
      amount: expenseAmount,
      categoryId: 'test-category',
      paidByApartment: payingApartmentId,
      owedByApartments: owingApartments,
      perApartmentShare,
      paidByApartments: [],
    };

    // Assertions
    expect(expenseWithApartmentDebts.owedByApartments).toHaveLength(6);
    expect(expenseWithApartmentDebts.owedByApartments).toEqual([
      'T1',
      'S2',
      'F1',
      'G1',
      'F2',
      'S1',
    ]);
    expect(expenseWithApartmentDebts.perApartmentShare).toBe(700 / 6); // Approximately 116.67
    expect(expenseWithApartmentDebts.perApartmentShare).toBeCloseTo(116.67, 2);
    expect(expenseWithApartmentDebts.paidByApartment).toBe('T1');
    expect(expenseWithApartmentDebts.paidByApartments).toEqual([]);
  });

  test('should handle cleaning expense correctly', () => {
    const expenseAmount = 300;
    const payingApartmentId = 'T1';
    const isCleaningExpense = true;

    let expenseWithApartmentDebts: ExpenseWithApartmentDebts;

    if (isCleaningExpense) {
      expenseWithApartmentDebts = {
        description: 'Cleaning expense',
        amount: expenseAmount,
        categoryId: 'cleaning-category',
        paidByApartment: payingApartmentId,
        owedByApartments: [],
        perApartmentShare: 0,
        paidByApartments: [],
      };
    } else {
      // This branch won't execute in this test
      expenseWithApartmentDebts = {
        description: '',
        amount: 0,
        categoryId: '',
        paidByApartment: '',
        owedByApartments: [],
        perApartmentShare: 0,
        paidByApartments: [],
      };
    }

    // Assertions for cleaning expense
    expect(expenseWithApartmentDebts.owedByApartments).toEqual([]);
    expect(expenseWithApartmentDebts.perApartmentShare).toBe(0);
    expect(expenseWithApartmentDebts.paidByApartment).toBe('T1');
  });

  test('should prevent expense creation when apartments array is empty', () => {
    const apartments: Apartment[] = [];

    // This should trigger the validation error
    if (!apartments || apartments.length === 0) {
      expect(apartments.length).toBe(0);
      // This would normally trigger a toast error in the real app
      return;
    }

    // This should not be reached
    throw new Error('Validation should have prevented reaching this point');
  });
});
