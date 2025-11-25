import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import React from 'react';

import type { Payment, User } from '@/lib/types';

import { PaymentsTable } from '@/components/ledger/ledger-payments/payments-table';

// Mock the use-mobile hook BEFORE importing the component that uses it
const mockUseIsMobileFn = jest.fn(() => true);
const mockUseDeviceInfoFn = jest.fn(() => ({
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isTouchDevice: true,
  orientation: 'portrait' as const,
  viewport: { width: 375, height: 812 },
  devicePixelRatio: 2,
}));
const mockUseBreakpointFn = jest.fn(() => 'sm');
const mockUseSafeAreaFn = jest.fn(() => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}));

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobileFn(),
  useDeviceInfo: () => mockUseDeviceInfoFn(),
  useBreakpoint: () => mockUseBreakpointFn(),
  useSafeArea: () => mockUseSafeAreaFn(),
}));

// Mock data
const mockPayments: Payment[] = [
  {
    id: 'payment1',
    payerId: 'user1',
    payeeId: 'admin1',
    amount: 5000,
    status: 'approved',
    monthYear: '2023-01',
    receiptURL: 'https://example.com/receipt1.pdf',
    reason: 'Monthly maintenance fee',
    approvedBy: 'admin1',
    approvedByName: 'Admin User',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'payment2',
    payerId: 'user2',
    payeeId: 'admin1',
    amount: 7500,
    status: 'pending',
    monthYear: '2023-01',
    receiptURL: 'https://example.com/receipt2.pdf',
    reason: 'Water bill payment',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'payment3',
    payerId: 'user1',
    payeeId: 'admin1',
    amount: 5000,
    status: 'rejected',
    monthYear: '2023-02',
    receiptURL: '',
    reason: 'Monthly maintenance fee',
    approvedBy: 'admin1',
    createdAt: new Date().toISOString(),
  },
];

const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    propertyRole: 'owner',
    apartment: 'A101',
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    propertyRole: 'tenant',
    apartment: 'B202',
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    propertyRole: 'owner',
    apartment: 'Office',
  },
];

const mockCurrentUser: User = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  propertyRole: 'owner',
  apartment: 'Office',
};

// Mock functions
const mockOnAddPayment = jest.fn();
const mockOnApprovePayment = jest.fn();
const mockOnRejectPayment = jest.fn();
const mockOnDeletePayment = jest.fn();

describe('PaymentsTable', () => {
  beforeEach(() => {
    // Reset mocks
    mockUseIsMobileFn.mockReset();
    mockUseDeviceInfoFn.mockReset();
    mockUseBreakpointFn.mockReset();
  });

  it('renders with desktop layout when isMobile is false', () => {
    mockUseIsMobileFn.mockReturnValue(false);
    mockUseDeviceInfoFn.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      orientation: 'portrait' as const,
      viewport: { width: 1024, height: 768 },
      devicePixelRatio: 1,
    });
    mockUseBreakpointFn.mockReturnValue('lg');

    render(
      <PaymentsTable
        payments={mockPayments}
        users={mockUsers}
        currentUser={mockCurrentUser}
        onAddPayment={mockOnAddPayment}
        onApprovePayment={mockOnApprovePayment}
        onRejectPayment={mockOnRejectPayment}
        onDeletePayment={mockOnDeletePayment}
      />
    );

    // Should show table
    expect(screen.queryByRole('table')).toBeInTheDocument();
  });

  it('renders with mobile layout when isMobile is true', () => {
    mockUseIsMobileFn.mockReturnValue(true);
    mockUseDeviceInfoFn.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouchDevice: true,
      orientation: 'portrait',
      viewport: { width: 375, height: 812 },
      devicePixelRatio: 2,
    });
    mockUseBreakpointFn.mockReturnValue('sm');

    render(
      <PaymentsTable
        payments={mockPayments}
        users={mockUsers}
        currentUser={mockCurrentUser}
        onAddPayment={mockOnAddPayment}
        onApprovePayment={mockOnApprovePayment}
        onRejectPayment={mockOnRejectPayment}
        onDeletePayment={mockOnDeletePayment}
      />
    );

    // Should show component renders without errors and displays data
    expect(screen.getByPlaceholderText('Filter by apartment...')).toBeInTheDocument();
  });

  it('displays filters', () => {
    mockUseIsMobileFn.mockReturnValue(true);
    mockUseDeviceInfoFn.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouchDevice: true,
      orientation: 'portrait',
      viewport: { width: 375, height: 812 },
      devicePixelRatio: 2,
    });
    mockUseBreakpointFn.mockReturnValue('sm');

    render(
      <PaymentsTable
        payments={mockPayments}
        users={mockUsers}
        currentUser={mockCurrentUser}
        onAddPayment={mockOnAddPayment}
        onApprovePayment={mockOnApprovePayment}
        onRejectPayment={mockOnRejectPayment}
        onDeletePayment={mockOnDeletePayment}
      />
    );

    // Check that filters are rendered
    expect(screen.getByPlaceholderText('Filter by apartment...')).toBeInTheDocument();
    expect(screen.getByText('All Owners')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('displays action buttons', () => {
    mockUseIsMobileFn.mockReturnValue(true);
    mockUseDeviceInfoFn.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouchDevice: true,
      orientation: 'portrait',
      viewport: { width: 375, height: 812 },
      devicePixelRatio: 2,
    });
    mockUseBreakpointFn.mockReturnValue('sm');

    render(
      <PaymentsTable
        payments={mockPayments}
        users={mockUsers}
        currentUser={mockCurrentUser}
        onAddPayment={mockOnAddPayment}
        onApprovePayment={mockOnApprovePayment}
        onRejectPayment={mockOnRejectPayment}
        onDeletePayment={mockOnDeletePayment}
      />
    );

    // Check that Export button is rendered
    expect(screen.queryAllByText(/Export/i).length).toBeGreaterThan(0);
  });

  it('displays payment data', () => {
    mockUseIsMobileFn.mockReturnValue(true);
    mockUseDeviceInfoFn.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouchDevice: true,
      orientation: 'portrait',
      viewport: { width: 375, height: 812 },
      devicePixelRatio: 2,
    });
    mockUseBreakpointFn.mockReturnValue('sm');

    render(
      <PaymentsTable
        payments={mockPayments}
        users={mockUsers}
        currentUser={mockCurrentUser}
        onAddPayment={mockOnAddPayment}
        onApprovePayment={mockOnApprovePayment}
        onRejectPayment={mockOnRejectPayment}
        onDeletePayment={mockOnDeletePayment}
      />
    );

    // Check that payment data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
