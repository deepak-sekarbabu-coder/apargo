import { ThemeProvider } from '@/context/theme-context';
import { render, screen } from '@testing-library/react';

import React from 'react';

import { ThemeSwitch } from '@/components/ui/theme-switch';

// Render within ClientRoot to provide ThemeProvider context
function renderWithProviders() {
  return render(
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>
  );
}

describe('ThemeSwitch component', () => {
  it('renders the theme switch button', () => {
    renderWithProviders();
    // Button has aria-label
    const toggleBtn = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });
});
