import { act, fireEvent, render, screen } from '@testing-library/react';

import React from 'react';

import type { Category, Payment, User } from '@/lib/types';
import { DEBOUNCE_CONFIG } from '@/lib/utils';

import { AdminView } from '@/components/admin/admin-view';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin1', role: 'admin' },
  }),
}));

jest.mock('@/components/dialogs/add-user-dialog', () => ({
  AddUserDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dialogs/edit-user-dialog', () => ({
  EditUserDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Use fake timers for predictable debounce testing
jest.useFakeTimers();

// Sample test data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    apartment: 'A1',
    role: 'user',
    propertyRole: 'tenant',
    isApproved: true,
    phone: '+91 98765 43210',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    apartment: 'B2',
    role: 'admin',
    propertyRole: 'owner',
    isApproved: true,
    phone: '+91 98765 43211',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    apartment: 'C3',
    role: 'user',
    propertyRole: 'tenant',
    isApproved: false,
    phone: '+91 98765 43212',
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Maintenance', icon: 'wrench', noSplit: false },
  { id: '2', name: 'Utilities', icon: 'zap', noSplit: false },
];

const mockPayments: Payment[] = [];

// Default props for AdminView
const defaultProps = {
  users: mockUsers,
  categories: mockCategories,
  onAddUser: jest.fn(),
  onUpdateUser: jest.fn(),
  onDeleteUser: jest.fn(),
  onRejectUser: jest.fn(),
  onAddCategory: jest.fn(),
  onUpdateCategory: jest.fn(),
  onDeleteCategory: jest.fn(),
  onAddPoll: jest.fn(),
  getUserById: jest.fn(),
  payments: mockPayments,
  onApprovePayment: jest.fn(),
  onRejectPayment: jest.fn(),
};

describe('User Management Search Filter Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Debounced search functionality', () => {
    it('should debounce user search input and filter users only after delay', async () => {
      render(<AdminView {...defaultProps} />);

      // Find the search input
      const searchInput = screen.getByPlaceholderText('Search users...');
      expect(searchInput).toBeInTheDocument();

      // Type in the search input
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Users should still be displayed immediately (before debounce)
      expect(screen.getAllByText('John Doe')).toHaveLength(4); // All instances
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs

      // Advance time less than debounce delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY - 50);
      });

      // Still should show all users
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs

      // Advance time to complete debounce delay
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Now should only show filtered users
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });

    it('should reset debounce timer on rapid typing (keystroke simulation)', async () => {
      render(<AdminView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search users...');

      // Simulate rapid typing
      const searchTerms = ['j', 'jo', 'joh', 'john'];

      searchTerms.forEach(term => {
        fireEvent.change(searchInput, { target: { value: term } });

        // Advance time less than debounce delay to simulate rapid typing
        act(() => {
          jest.advanceTimersByTime(50);
        });

        // Should still show all users during rapid typing
        expect(screen.getAllByText('John Doe')).toHaveLength(4);
      });

      // Complete the debounce delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should now show only filtered users
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });

    it('should abort previous search when new input is provided', async () => {
      render(<AdminView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search users...');

      // First search term
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Advance time partially
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Second search term (should abort the first)
      fireEvent.change(searchInput, { target: { value: 'jane' } });

      // Complete full debounce delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should only show Jane Smith
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.queryAllByText('John Doe')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });

    it('should handle empty search input correctly', async () => {
      render(<AdminView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search users...') as HTMLInputElement;

      // Enter search term first
      fireEvent.change(searchInput, { target: { value: 'john' } });
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should show only John Doe
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);

      // Clear the search input
      fireEvent.change(searchInput, { target: { value: '' } });
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should show all users again
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs
    });
  });

  describe('User filtering behavior', () => {
    it('should display filtered users based on search results', () => {
      render(<AdminView {...defaultProps} />);

      // Find the search input
      const searchInput = screen.getByPlaceholderText('Search users...');

      // Type in the search input
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Advance time to complete debounce delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should display the filtered user
      expect(screen.getAllByText('John Doe')).toHaveLength(4);

      // Should not display other users
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });

    it('should display all users when search is empty', () => {
      render(<AdminView {...defaultProps} />);

      // Should display all users
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs
    });

    it('should display empty state when no users match search', () => {
      render(<AdminView {...defaultProps} />);

      // Find the search input
      const searchInput = screen.getByPlaceholderText('Search users...');

      // Type in the search input
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Advance time to complete debounce delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should not display any user cards/rows
      expect(screen.queryAllByText('John Doe')).toHaveLength(0);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });
  });

  describe('Performance optimization', () => {
    it('should not cause extra renders during typing', async () => {
      render(<AdminView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search users...');

      // Simulate multiple rapid keystrokes
      for (let i = 1; i <= 10; i++) {
        fireEvent.change(searchInput, { target: { value: `search${i}` } });
        act(() => {
          jest.advanceTimersByTime(20); // Very fast typing
        });
      }

      // Should still show all users during rapid typing
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });

      // Should now show filtered results
      expect(screen.queryAllByText('John Doe')).toHaveLength(0);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });

    it('should maintain input value during debounce delay', () => {
      const props = { ...defaultProps };

      render(<AdminView {...props} />);

      const searchInput = screen.getByPlaceholderText('Search users...') as HTMLInputElement;

      // Type in search term
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Input should immediately show the typed value
      expect(searchInput.value).toBe('john');

      // During debounce delay, input should maintain the value
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(searchInput.value).toBe('john');

      // After debounce, input should still show the value
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY);
      });
      expect(searchInput.value).toBe('john');
    });
  });

  describe('Configuration and customization', () => {
    it('should use the configured debounce delay from constants', () => {
      // This test verifies that the component uses the configuration
      expect(DEBOUNCE_CONFIG.USER_SEARCH_DELAY).toBe(250);

      render(<AdminView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search users...');

      // Type in search term
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should still show all users before configured delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY - 1);
      });
      expect(screen.getAllByText('John Doe')).toHaveLength(4);
      expect(screen.getAllByText('Jane Smith')).toHaveLength(4);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(6); // More instances due to reject dialogs

      // Should filter users exactly at configured delay
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Should now show filtered results (no users match "test")
      expect(screen.queryAllByText('John Doe')).toHaveLength(0);
      expect(screen.queryAllByText('Jane Smith')).toHaveLength(0);
      expect(screen.queryAllByText('Bob Wilson')).toHaveLength(0);
    });
  });
});
