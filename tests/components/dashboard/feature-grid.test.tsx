import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';

import { FeatureGrid } from '@/components/dashboard/feature-grid';

describe('FeatureGrid', () => {
  it('renders five feature cards for non-admin and triggers navigation event', () => {
    const handler = jest.fn();
    render(React.createElement(FeatureGrid, { onSelect: handler, isAdmin: false }));
    const labels = ['Ledger', 'Expense Mgmt', 'Fault Mgmt', 'Maintenance', 'Community'];
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ledger'));
    expect(handler).toHaveBeenCalledWith('ledger');
  });

  it('renders six feature cards including Admin for admin user', () => {
    const handler = jest.fn();
    render(React.createElement(FeatureGrid, { onSelect: handler, isAdmin: true }));
    const labels = ['Ledger', 'Expense Mgmt', 'Fault Mgmt', 'Maintenance', 'Community', 'Admin'];
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Admin'));
    expect(handler).toHaveBeenCalledWith('admin');
  });
});
