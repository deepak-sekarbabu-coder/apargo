import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import React from 'react';

import type { Payment, User } from '@/lib/types';

import { AdminPaymentsTab } from '@/components/admin/payments/admin-payments-tab';

// Mock data
const mockPayments: Payment[] = [
  {
    id: 'p1',
    payerId: 'u1',
    payeeId: 'admin',
    amount: 15000,
    reason: 'Monthly maintenance fee',
    category: 'income',
    status: 'pending',
    createdAt: new Date().toISOString(),
    receiptURL: 'https://example.com/receipt1.pdf',
    monthYear: '2023-05',
  },
  {
    id: 'p2',
    payerId: 'u2',
    payeeId: 'admin',
    amount: 5000,
    reason: 'Plumbing repair',
    category: 'expense',
    status: 'pending',
    createdAt: new Date().toISOString(),
    receiptURL: 'https://example.com/receipt2.pdf',
    monthYear: '2023-05',
  },
];

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    propertyRole: 'tenant',
    apartment: 'A101',
  },
  {
    id: 'u2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    propertyRole: 'tenant',
    apartment: 'B202',
  },
];

const mockGetUserById = (id: string) => mockUsers.find(user => user.id === id);

describe('AdminPaymentsTab responsive behavior', () => {
  beforeEach(() => {
    // Mock window.innerWidth to simulate different viewports
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Default to desktop
    });
  });

  it('shows mobile layout on small screens (375px)', () => {
    // Simulate iPhone SE viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AdminPaymentsTab payments={mockPayments} getUserById={mockGetUserById} />);

    // Check that mobile layout is visible by looking for mobile-specific elements
    expect(screen.getByText('Apartment: A101')).toBeInTheDocument();
    expect(screen.getAllByText('Approve')[0]).toBeInTheDocument();

    // Check that we have mobile cards (block class) and not desktop table (hidden class)
    const mobileContainer = screen.getByText('Apartment: A101').closest('.block');
    expect(mobileContainer).toBeInTheDocument();
  });

  it('shows desktop layout on larger screens (1024px)', () => {
    // Simulate iPad viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AdminPaymentsTab payments={mockPayments} getUserById={mockGetUserById} />);

    // Check that desktop layout is visible by looking for table headers
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check that we have desktop table (block class) and not mobile cards (hidden class)
    const desktopContainer = screen.getByText('Apartment').closest('.hidden');
    expect(desktopContainer).toBeInTheDocument();
  });

  it('has appropriate touch targets on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AdminPaymentsTab payments={mockPayments} getUserById={mockGetUserById} />);

    // Check that action buttons have appropriate sizing
    const approveButtons = screen.getAllByText('Approve');
    const rejectButtons = screen.getAllByText('Reject');

    expect(approveButtons[0]).toBeInTheDocument();
    expect(rejectButtons[0]).toBeInTheDocument();

    // Check that buttons have sufficient height for touch targets
    const approveButton = approveButtons[0].closest('button');
    expect(approveButton).toHaveClass('h-11');
  });

  it('shows appropriate typography on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AdminPaymentsTab payments={mockPayments} getUserById={mockGetUserById} />);

    // Check that card titles use appropriate font sizes
    const apartmentText = screen.getByText('Apartment: A101');
    expect(apartmentText).toBeInTheDocument();
  });

  it('maintains proper spacing on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AdminPaymentsTab payments={mockPayments} getUserById={mockGetUserById} />);

    // Check that cards have proper spacing
    const card = screen.getByText('Apartment: A101').closest('.p-4');
    expect(card).toHaveClass('p-4');

    // Check that grid layout is used for details
    const detailsGrid = screen.getAllByText('Type')[0].closest('.grid');
    expect(detailsGrid).toHaveClass('grid');
    expect(detailsGrid).toHaveClass('grid-cols-2');
  });
});
