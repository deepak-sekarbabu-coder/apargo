'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme to 'light' on both server and client for consistent SSR.
  // The actual theme from localStorage will be applied in useEffect.
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // This effect runs only on the client after hydration.
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (storedTheme) {
      setThemeState(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Set initial theme based on system preference if no stored theme
      setThemeState('dark');
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Apply the theme class to the document element
    document.documentElement.classList.remove('light', 'dark'); // Remove existing classes
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]); // Re-run when theme state changes

  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
