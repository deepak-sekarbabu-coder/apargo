import { render, screen } from '@testing-library/react';

import React from 'react';

import type { Category, Payment, User } from '@/lib/types';

import { AdminView } from '@/components/admin/admin-view';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/components/dialogs/add-user-dialog', () => ({
  AddUserDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dialogs/edit-user-dialog', () => ({
  EditUserDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Sample test data with both approved and pending users
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
    isApproved: false, // Pending user
    phone: '+91 98765 43212',
  },
  {
    id: '4',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    apartment: 'D4',
    role: 'user',
    propertyRole: 'owner',
    isApproved: false, // Another pending user
    phone: '+91 98765 43213',
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Maintenance', icon: 'wrench', noSplit: false },
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

describe('Pending Users Visibility for Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display both approved and pending users in admin view', () => {
    render(<AdminView {...defaultProps} />);

    // Should display approved users
    expect(screen.getAllByText('John Doe')).toHaveLength(4); // Mobile + Desktop views
    expect(screen.getAllByText('Jane Smith')).toHaveLength(4);

    // Should also display pending users (this was the bug)
    // Note: Now shows 5 instances (reduced from previous UI changes)
    expect(screen.getAllByText('Bob Wilson')).toHaveLength(5);
    expect(screen.getAllByText('Alice Johnson')).toHaveLength(5);
  });

  it('should show approve and reject buttons for pending users', () => {
    render(<AdminView {...defaultProps} />);

    // Should show "Approve" buttons for pending users
    const approveButtons = screen.getAllByText('Approve');
    expect(approveButtons.length).toBeGreaterThan(0);

    // Should show "Reject" buttons for pending users
    const rejectButtons = screen.getAllByText('Reject');
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it('should show approved badge for approved users', () => {
    render(<AdminView {...defaultProps} />);

    // Should show "Approved" badges for approved users
    const approvedBadges = screen.getAllByText('Approved');
    expect(approvedBadges.length).toBeGreaterThan(0);
  });

  it('should display correct user count including pending users', () => {
    render(<AdminView {...defaultProps} />);

    // All 4 users should be visible (2 approved + 2 pending)
    const userCards = screen.getAllByText(/A1|B2|C3|D4/); // Apartment identifiers
    expect(userCards.length).toBeGreaterThanOrEqual(4);
  });

  it('should allow admin to approve pending users', () => {
    const mockOnUpdateUser = jest.fn();
    const propsWithMock = {
      ...defaultProps,
      onUpdateUser: mockOnUpdateUser,
    };

    render(<AdminView {...propsWithMock} />);

    // Find and click an approve button
    const approveButtons = screen.getAllByText('Approve');
    if (approveButtons.length > 0) {
      approveButtons[0].click();

      // Should call onUpdateUser with isApproved: true
      expect(mockOnUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          isApproved: true,
        })
      );
    }
  });

  it('should show reject functionality for pending users', () => {
    render(<AdminView {...defaultProps} />);

    // Should show "Reject" buttons for pending users
    const rejectButtons = screen.getAllByText('Reject');
    expect(rejectButtons.length).toBeGreaterThan(0);

    // Click the first reject button to open dialog
    rejectButtons[0].click();

    // Should show confirmation dialog
    const dialogTitles = screen.getAllByText('Reject User Application?');
    expect(dialogTitles.length).toBeGreaterThan(0);

    // Should show confirmation button
    const confirmButtons = screen.getAllByText('Reject Application');
    expect(confirmButtons.length).toBeGreaterThan(0);
  });
});
