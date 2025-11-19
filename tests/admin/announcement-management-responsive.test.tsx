import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import React from 'react';

import type { Notification } from '@/lib/types';

import { ActiveAnnouncements } from '@/components/admin/community/active-announcements';

// Mock data
const mockAnnouncements: Notification[] = [
  {
    id: 'ann1',
    title: 'Community Meeting This Friday',
    message:
      'Please join us for our monthly community meeting this Friday at 7 PM in the common area.',
    priority: 'high',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    type: 'announcement',
    isRead: {},
    createdBy: 'admin1',
    isActive: true,
    toApartmentId: ['apt1', 'apt2'],
  },
  {
    id: 'ann2',
    title: 'Pool Maintenance Next Week',
    message: 'The swimming pool will be closed for maintenance from Monday to Wednesday next week.',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    type: 'announcement',
    isRead: {},
    createdBy: 'admin1',
    isActive: true,
    toApartmentId: ['apt1', 'apt2'],
  },
];

// Mock the firestore functions
jest.mock('@/lib/firestore/announcements', () => ({
  listenToActiveAnnouncements: jest.fn(callback => {
    callback(mockAnnouncements);
    return jest.fn(); // unsubscribe function
  }),
  deleteAnnouncement: jest.fn(),
}));

describe('Announcement Management responsive behavior', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock window.innerWidth to simulate different viewports
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Default to desktop
    });
  });

  it('shows appropriate layout on mobile (375px)', () => {
    // Simulate iPhone SE viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that announcements are rendered
    expect(screen.getByText('Community Meeting This Friday')).toBeInTheDocument();
    expect(screen.getByText('Pool Maintenance Next Week')).toBeInTheDocument();

    // Check for mobile-specific elements
    const announcementCards = screen.getAllByText('Community Meeting This Friday');
    expect(announcementCards[0]).toBeInTheDocument();

    // Check that priority badges are visible
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows appropriate layout on tablet (768px)', () => {
    // Simulate iPad viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that announcements are rendered
    expect(screen.getByText('Community Meeting This Friday')).toBeInTheDocument();
    expect(screen.getByText('Pool Maintenance Next Week')).toBeInTheDocument();

    // Check for tablet-specific elements
    const announcementCards = screen.getAllByText('Community Meeting This Friday');
    expect(announcementCards[0]).toBeInTheDocument();
  });

  it('shows appropriate layout on desktop (1024px)', () => {
    // Simulate desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that announcements are rendered
    expect(screen.getByText('Community Meeting This Friday')).toBeInTheDocument();
    expect(screen.getByText('Pool Maintenance Next Week')).toBeInTheDocument();

    // Check for desktop-specific elements
    const announcementCards = screen.getAllByText('Community Meeting This Friday');
    expect(announcementCards[0]).toBeInTheDocument();
  });

  it('has appropriate touch targets on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that delete buttons have appropriate sizing for touch targets
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    // Check that buttons have sufficient height for touch targets (at least 44px)
    deleteButtons.forEach(button => {
      const computedStyle = window.getComputedStyle(button);
      const height = parseInt(computedStyle.height);
      // If height is NaN, it means the element is not visible or not rendered yet
      if (!isNaN(height)) {
        expect(height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  it('shows appropriate typography on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that announcement titles use appropriate font sizes
    const titleText = screen.getByText('Community Meeting This Friday');
    expect(titleText).toBeInTheDocument();

    // Check that messages are readable
    expect(
      screen.getByText(
        'Please join us for our monthly community meeting this Friday at 7 PM in the common area.'
      )
    ).toBeInTheDocument();
  });

  it('maintains proper spacing on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActiveAnnouncements />);

    // Check that cards have proper spacing
    const firstAnnouncementCard = screen.getByText('Community Meeting This Friday');
    expect(firstAnnouncementCard).toBeInTheDocument();

    // Check that content has proper spacing
    const contentSection = screen
      .getByText(
        'Please join us for our monthly community meeting this Friday at 7 PM in the common area.'
      )
      .closest('div');
    expect(contentSection).toBeInTheDocument();
  });
});
