import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';

import { ExpensesView } from '@/components/expense-management/all-expenses/expenses-view';

// Mock toast hook used inside component
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Simple mock list component
const MockExpensesList = () => <div data-testid="expenses-list" />;

describe('ExpensesView basic rendering (search removed)', () => {
  it('renders core filters and export button without search input', () => {
    // Mock createObjectURL / revokeObjectURL for jsdom environment
    const originalCreate = URL.createObjectURL as any;
    const originalRevoke = URL.revokeObjectURL as any;
    (URL as any).createObjectURL = jest.fn(() => 'blob:mock');
    (URL as any).revokeObjectURL = jest.fn();
    const props: any = {
      expenses: [],
      categories: [],
      apartments: [],
      users: [],
      filterCategory: 'all',
      setFilterCategory: jest.fn(),
      filterPaidBy: 'all',
      setFilterPaidBy: jest.fn(),
      filterMonth: 'all',
      setFilterMonth: jest.fn(),
      filteredExpenses: [],
      expenseMonths: [],
      onClearFilters: jest.fn(),
      ExpensesList: MockExpensesList,
      currentUserApartment: undefined,
      currentUserRole: 'tenant',
      onExpenseUpdate: jest.fn(),
      onExpenseDelete: jest.fn(),
    };

    render(<ExpensesView {...props} />);

    // Title
    expect(screen.getByText('All Expenses')).toBeInTheDocument();
    // Export button
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeInTheDocument();

    // Ensure no legacy search placeholder exists
    expect(screen.queryByPlaceholderText('Search expenses...')).toBeNull();

    // Trigger export to ensure handler doesn't throw
    fireEvent.click(exportBtn);
    // Expenses list placeholder present
    expect(screen.getByTestId('expenses-list')).toBeInTheDocument();

    // Restore
    if (originalCreate) (URL as any).createObjectURL = originalCreate;
    if (originalRevoke) (URL as any).revokeObjectURL = originalRevoke;
  });
});
