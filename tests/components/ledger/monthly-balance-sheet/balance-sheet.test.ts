import { aggregateBalanceSheets, validateBalanceSheetContinuity } from '../../../../src/lib/expense-management/balance-utils';

describe('Balance Sheet Continuity', () => {
  test('should maintain continuity between consecutive months', () => {
    const payments = [
      {
        id: '1',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 10000,
        status: 'approved' as const,
        monthYear: '2023-01',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 5000,
        status: 'approved' as const,
        monthYear: '2023-01',
        category: 'expense' as const,
        apartmentId: 'apt1',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: '3',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 8000,
        status: 'approved' as const,
        monthYear: '2023-02',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-02-01T00:00:00Z',
      },
      {
        id: '4',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 3000,
        status: 'approved' as const,
        monthYear: '2023-02',
        category: 'expense' as const,
        apartmentId: 'apt1',
        createdAt: '2023-02-01T00:00:00Z',
      },
    ];

    const sheets = aggregateBalanceSheets(payments);

    // January: opening=0, income=10000, expenses=5000, closing=5000
    // February: opening=5000 (previous closing), income=8000, expenses=3000, closing=10000

    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toEqual({
      monthYear: '2023-01',
      opening: 0,
      income: 10000,
      expenses: 5000,
      closing: 5000,
    });

    expect(sheets[1]).toEqual({
      monthYear: '2023-02',
      opening: 5000,
      income: 8000,
      expenses: 3000,
      closing: 10000,
    });
  });

  test('should handle months with no transactions', () => {
    const payments = [
      {
        id: '1',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 10000,
        status: 'approved' as const,
        monthYear: '2023-01',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 5000,
        status: 'approved' as const,
        monthYear: '2023-03',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-03-01T00:00:00Z',
      },
    ];

    const sheets = aggregateBalanceSheets(payments);

    // January: opening=0, income=10000, expenses=0, closing=10000
    // February: opening=10000 (previous closing), income=0, expenses=0, closing=10000
    // March: opening=10000 (previous closing), income=5000, expenses=0, closing=15000

    expect(sheets).toHaveLength(3);
    expect(sheets[0]).toEqual({
      monthYear: '2023-01',
      opening: 0,
      income: 10000,
      expenses: 0,
      closing: 10000,
    });

    expect(sheets[1]).toEqual({
      monthYear: '2023-02',
      opening: 10000,
      income: 0,
      expenses: 0,
      closing: 10000,
    });

    expect(sheets[2]).toEqual({
      monthYear: '2023-03',
      opening: 10000,
      income: 5000,
      expenses: 0,
      closing: 15000,
    });
  });

  test('should validate balance sheet continuity', () => {
    // Valid sheets
    const validSheets = [
      {
        monthYear: '2023-01',
        opening: 0,
        income: 10000,
        expenses: 5000,
        closing: 5000,
      },
      {
        monthYear: '2023-02',
        opening: 5000,
        income: 8000,
        expenses: 3000,
        closing: 10000,
      },
    ];

    const validResult = validateBalanceSheetContinuity(validSheets);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid sheets with continuity error
    const invalidSheets = [
      {
        monthYear: '2023-01',
        opening: 0,
        income: 10000,
        expenses: 5000,
        closing: 5000,
      },
      {
        monthYear: '2023-02',
        opening: 6000, // Should be 5000 to maintain continuity
        income: 8000,
        expenses: 3000,
        closing: 11000,
      },
    ];

    const invalidResult = validateBalanceSheetContinuity(invalidSheets);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toHaveLength(1);
    expect(invalidResult.errors[0]).toContain('Continuity error');
  });

  test('should handle edge case with single month', () => {
    const payments = [
      {
        id: '1',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 10000,
        status: 'approved' as const,
        monthYear: '2023-01',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ];

    const sheets = aggregateBalanceSheets(payments);

    expect(sheets).toHaveLength(1);
    expect(sheets[0]).toEqual({
      monthYear: '2023-01',
      opening: 0,
      income: 10000,
      expenses: 0,
      closing: 10000,
    });
  });

  test('should handle months with only expenses', () => {
    const payments = [
      {
        id: '1',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 10000,
        status: 'approved' as const,
        monthYear: '2023-01',
        category: 'income' as const,
        apartmentId: 'apt1',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        payerId: 'user1',
        payeeId: 'user2',
        amount: 3000,
        status: 'approved' as const,
        monthYear: '2023-02',
        category: 'expense' as const,
        apartmentId: 'apt1',
        createdAt: '2023-02-01T00:00:00Z',
      },
    ];

    const sheets = aggregateBalanceSheets(payments);

    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toEqual({
      monthYear: '2023-01',
      opening: 0,
      income: 10000,
      expenses: 0,
      closing: 10000,
    });

    expect(sheets[1]).toEqual({
      monthYear: '2023-02',
      opening: 10000,
      income: 0,
      expenses: 3000,
      closing: 7000,
    });
  });
});
