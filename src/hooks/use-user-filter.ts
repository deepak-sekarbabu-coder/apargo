import { useMemo } from 'react';

import log from '@/lib/core/logger';
import type { User } from '@/lib/core/types';

/**
 * Hook for filtering users by search term (name or email)
 *
 * This hook assumes the caller has already applied debouncing to the userSearch parameter.
 * The debouncing should be handled upstream (e.g., in AdminView with useDebounce hook)
 * to avoid filtering on every keystroke and provide better performance.
 *
 * @param users Array of users to filter
 * @param userSearch Debounced search term to filter by (should be pre-debounced)
 * @returns Filtered array of users matching the search term
 */
export function useUserFilter(users: User[], userSearch: string) {
  return useMemo(() => {
    try {
      const usersArray = Array.isArray(users) ? users : [];

      // Early return for empty or invalid search
      if (!userSearch || typeof userSearch !== 'string') {
        return usersArray;
      }

      const searchTerm = String(userSearch).toLowerCase().trim();

      // Return all users if search term is empty after trimming
      if (!searchTerm) {
        return usersArray;
      }

      return usersArray.filter(user => {
        if (!user || typeof user !== 'object') {
          log.error('Invalid user object in useUserFilter', { user });
          return false;
        }

        // Safely extract and normalize user name
        const userName =
          user.name && typeof user.name === 'string' && user.name.trim()
            ? String(user.name).toLowerCase()
            : '';

        // Safely extract and normalize user email
        const userEmail =
          user.email && typeof user.email === 'string' && user.email.trim()
            ? String(user.email).toLowerCase()
            : '';

        // Also search in apartment field for better user experience
        const userApartment =
          user.apartment && typeof user.apartment === 'string' && user.apartment.trim()
            ? String(user.apartment).toLowerCase()
            : '';

        // Search in name, email, and apartment fields
        return (
          userName.includes(searchTerm) ||
          userEmail.includes(searchTerm) ||
          userApartment.includes(searchTerm)
        );
      });
    } catch (error) {
      log.error('Error in useUserFilter:', error, { users, userSearch });
      return [];
    }
  }, [users, userSearch]);
}
