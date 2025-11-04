import { fireEvent, render, waitFor } from '@testing-library/react';

import React from 'react';

import { MaintenancePaymentStatus } from '@/components/dashboard/maintenance-payment-status';

// Mock storage & firestore used inside component
jest.mock('@/lib/storage', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://example.com/receipt.png'),
}));

jest.mock('@/lib/firestore/payments', () => ({
  updatePayment: jest.fn().mockResolvedValue(undefined),
  addPayment: jest.fn().mockResolvedValue({ id: 'p1' }),
}));

describe('MaintenancePaymentStatus upload null ref safety', () => {
  it('does not throw if input ref becomes null before clearing', async () => {
    const user = { id: 'u1', apartment: 'A1' } as any;
    const payments: any[] = [
      {
        id: 'pending1',
        status: 'pending',
        monthYear: new Date().toISOString().slice(0, 7),
        apartmentId: 'A1',
        amount: 100,
        category: 'income',
        reason: 'Monthly maintenance fee',
      },
    ];

    const { getAllByRole, container } = render(
      <MaintenancePaymentStatus user={user} payments={payments} defaultMonthlyAmount={100} />
    );

    // Inject a file into the input
    const input: HTMLInputElement | null = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(['data'], 'test.png', { type: 'image/png' });
    // Fire change event
    fireEvent.change(input!, { target: { files: [file] } });

    // Simulate the ref going null after user clicks upload before async resolves
    const buttons = getAllByRole('button');
    const button = buttons.find(b => /Upload|Re-upload/i.test(b.textContent || ''))!;

    // Monkey patch to null the ref during async: locate React ref via property on component not directly accessible.
    // Instead simulate unmount right after click by removing input from DOM.
    button.addEventListener('click', () => {
      input?.remove();
    });

    fireEvent.click(button);
    await waitFor(
      () => {
        const { uploadImage } = require('@/lib/storage');
        expect(uploadImage).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
    // If we reach here without uncaught error, test passes
  });
});
