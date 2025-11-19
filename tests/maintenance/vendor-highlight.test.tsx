import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import React from 'react';

import { VendorList } from '@/components/maintenance/vendors/vendor-list';

const vendors = [
  { id: 'v1', name: 'Plumb Right', serviceType: 'plumbing', isActive: true },
  { id: 'v2', name: 'Spark Electric', serviceType: 'electrical', isActive: true },
] as any;

describe('VendorList highlightVendorId', () => {
  it('applies highlight animation class to newly added vendor', () => {
    const onAdd = jest.fn();
    const onEdit = jest.fn();
    render(<VendorList vendors={vendors} onAdd={onAdd} onEdit={onEdit} highlightVendorId="v2" />);
    const highlighted = screen.getByRole('button', { name: /edit vendor spark electric/i });
    expect(highlighted.className).toMatch(/animate-pulse-once/);
  });
});
