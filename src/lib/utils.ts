import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce configuration constants
export const DEBOUNCE_CONFIG = {
  /** Default debounce delay for search filters (300ms) */
  DEFAULT_SEARCH_DELAY: 300,
  /** Debounce delay for user management search (250ms) - optimized for better responsiveness */
  USER_SEARCH_DELAY: 250,
  /** Debounce delay for vendor search (350ms) - keeping existing behavior */
  VENDOR_SEARCH_DELAY: 350,
  /** Debounce delay for expense search (300ms) */
  EXPENSE_SEARCH_DELAY: 300,
  /** Debounce delay for file search (350ms) */
  FILE_SEARCH_DELAY: 350,
  /** Maximum wait time to ensure updates don't get stuck */
  MAX_WAIT_TIME: 1200,
} as const;

// Debounce options presets for consistent behavior
export const DEBOUNCE_OPTIONS = {
  /** Standard search options with leading and trailing edge firing */
  SEARCH: {
    leading: true,
    trailing: true,
    maxWait: DEBOUNCE_CONFIG.MAX_WAIT_TIME,
  },
  /** Input-only options with just trailing edge (for better typing experience) */
  INPUT: {
    leading: false,
    trailing: true,
    maxWait: DEBOUNCE_CONFIG.MAX_WAIT_TIME,
  },
} as const;
