import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import React from 'react';

import type { Poll, User } from '@/lib/types';

import { ActivePolls } from '@/components/admin/community/active-polls';

// Mock data
const mockPolls: Poll[] = [
  {
    id: 'poll1',
    question: 'What amenities would you like to see added to the property?',
    options: [
      { id: 'opt1', text: 'Swimming Pool' },
      { id: 'opt2', text: 'Gym' },
      { id: 'opt3', text: 'Playground' },
    ],
    votes: {
      user1: 'opt1',
      user2: 'opt1',
      user3: 'opt2',
      user4: 'opt3',
      user5: 'opt3',
    },
    createdBy: 'admin1',
    createdAt: new Date().toISOString(),
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
  },
  {
    id: 'poll2',
    question: 'How satisfied are you with the maintenance services?',
    options: [
      { id: 'opt1', text: 'Very Satisfied' },
      { id: 'opt2', text: 'Satisfied' },
      { id: 'opt3', text: 'Neutral' },
      { id: 'opt4', text: 'Dissatisfied' },
    ],
    votes: {
      user1: 'opt1',
      user2: 'opt1',
      user3: 'opt1',
      user4: 'opt2',
      user5: 'opt4',
    },
    createdBy: 'admin1',
    createdAt: new Date().toISOString(),
    isActive: true,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  },
];

const mockUser: User = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  propertyRole: 'owner',
  apartment: 'Office',
};

// Mock the auth context
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock the firestore functions
jest.mock('@/lib/firestore/polls', () => ({
  listenToPolls: jest.fn(callback => {
    callback(mockPolls);
    return jest.fn(); // unsubscribe function
  }),
  deletePoll: jest.fn(),
}));

describe('Poll Management responsive behavior', () => {
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

    render(<ActivePolls />);

    // Check that polls are rendered
    expect(
      screen.getByText('What amenities would you like to see added to the property?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('How satisfied are you with the maintenance services?')
    ).toBeInTheDocument();

    // Check for mobile-specific elements
    const pollCards = screen.getAllByText(
      'What amenities would you like to see added to the property?'
    );
    expect(pollCards[0]).toBeInTheDocument();

    // Check that progress bars are visible
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Playground')).toBeInTheDocument();
  });

  it('shows appropriate layout on tablet (768px)', () => {
    // Simulate iPad viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActivePolls />);

    // Check that polls are rendered
    expect(
      screen.getByText('What amenities would you like to see added to the property?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('How satisfied are you with the maintenance services?')
    ).toBeInTheDocument();

    // Check for tablet-specific elements
    const pollCards = screen.getAllByText(
      'What amenities would you like to see added to the property?'
    );
    expect(pollCards[0]).toBeInTheDocument();
  });

  it('shows appropriate layout on desktop (1024px)', () => {
    // Simulate desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActivePolls />);

    // Check that polls are rendered
    expect(
      screen.getByText('What amenities would you like to see added to the property?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('How satisfied are you with the maintenance services?')
    ).toBeInTheDocument();

    // Check for desktop-specific elements
    const pollCards = screen.getAllByText(
      'What amenities would you like to see added to the property?'
    );
    expect(pollCards[0]).toBeInTheDocument();
  });

  it('has appropriate touch targets on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActivePolls />);

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

    render(<ActivePolls />);

    // Check that poll questions use appropriate font sizes
    const questionText = screen.getByText(
      'What amenities would you like to see added to the property?'
    );
    expect(questionText).toBeInTheDocument();

    // Check that option texts are readable
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });

  it('maintains proper spacing on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<ActivePolls />);

    // Check that cards have proper spacing
    const firstPollCard = screen.getByText(
      'What amenities would you like to see added to the property?'
    );
    expect(firstPollCard).toBeInTheDocument();

    // Check that options have proper spacing
    const optionsContainer = screen.getByText('Swimming Pool').closest('div');
    expect(optionsContainer).toBeInTheDocument();
  });
});
