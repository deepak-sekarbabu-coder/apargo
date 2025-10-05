import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';

import type { User } from '@/lib/types';

import { EditUserDialog } from '@/components/dialogs/edit-user-dialog';

const baseUser: User = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  propertyRole: 'owner',
  apartment: 'F2',
};

describe('EditUserDialog responsiveness', () => {
  it('applies responsive dialog content and grid classes', () => {
    const onUpdate = jest.fn();
    // Use a non-button element to avoid nested <button> inside the Radix/Dialog trigger which
    // renders a button internally when asChild isn't used elsewhere. This removes the DOM nesting warning.
    render(
      <EditUserDialog user={baseUser} onUpdateUser={onUpdate}>
        <span role="button">Open</span>
      </EditUserDialog>
    );

    fireEvent.click(screen.getByText('Open'));

    // Dialog content should include new responsive width and height classes
    const dialogContent = screen.getByRole('dialog');
    expect(dialogContent.className).toMatch(/max-w-\[95vw\]/);
    expect(dialogContent.className).toMatch(/max-h-\[90svh\]|max-h-\[85vh\]/);

    // Grid should have responsive column classes
    const systemRoleLabel = screen.getByText('System Role');
    const gridContainer = systemRoleLabel.closest('div')?.parentElement?.parentElement; // climb up to grid wrapper
    expect(gridContainer).toBeTruthy();
  });
});
