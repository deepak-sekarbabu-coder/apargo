import { renderHook } from '@testing-library/react';

import type { User } from '@/lib/core/types';

import { useUserFilter } from '@/hooks/use-user-filter';

// Mock logger to avoid console output during tests
jest.mock('@/lib/core/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    apartment: 'A1',
    role: 'user',
    propertyRole: 'tenant',
    isApproved: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    apartment: 'B2',
    role: 'admin',
    propertyRole: 'owner',
    isApproved: true,
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    apartment: 'C3',
    role: 'user',
    propertyRole: 'tenant',
    isApproved: false,
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    apartment: 'D4',
    role: 'user',
    propertyRole: 'owner',
    isApproved: true,
  },
];

describe('useUserFilter', () => {
  describe('Basic filtering functionality', () => {
    it('should return all users when search term is empty', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, ''));
      expect(result.current).toEqual(mockUsers);
    });

    it('should return all users when search term is null or undefined', () => {
      const { result: nullResult } = renderHook(() => useUserFilter(mockUsers, null as any));
      const { result: undefinedResult } = renderHook(() =>
        useUserFilter(mockUsers, undefined as any)
      );

      expect(nullResult.current).toEqual(mockUsers);
      expect(undefinedResult.current).toEqual(mockUsers);
    });

    it('should return all users when search term is only whitespace', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, '   '));
      expect(result.current).toEqual(mockUsers);
    });

    it('should filter users by name (case insensitive)', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, 'john'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('John Doe');
    });

    it('should filter users by email (case insensitive)', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, 'jane.smith'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].email).toBe('jane.smith@example.com');
    });

    it('should handle partial name matches', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, 'alice'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Alice Brown');
    });

    it('should handle partial email matches', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, 'example.com'));
      expect(result.current).toHaveLength(4); // All users have example.com emails
    });

    it('should be case insensitive', () => {
      const { result: upperCase } = renderHook(() => useUserFilter(mockUsers, 'JOHN'));
      const { result: lowerCase } = renderHook(() => useUserFilter(mockUsers, 'john'));
      const { result: mixedCase } = renderHook(() => useUserFilter(mockUsers, 'JoHn'));

      expect(upperCase.current).toEqual(lowerCase.current);
      expect(lowerCase.current).toEqual(mixedCase.current);
      expect(upperCase.current[0].name).toBe('John Doe');
    });

    it('should return empty array when no matches found', () => {
      const { result } = renderHook(() => useUserFilter(mockUsers, 'nonexistent'));
      expect(result.current).toEqual([]);
    });
  });

  describe('Input validation and edge cases', () => {
    it('should handle empty users array', () => {
      const { result } = renderHook(() => useUserFilter([], 'john'));
      expect(result.current).toEqual([]);
    });

    it('should handle null or undefined users array', () => {
      const { result: nullUsers } = renderHook(() => useUserFilter(null as any, 'john'));
      const { result: undefinedUsers } = renderHook(() => useUserFilter(undefined as any, 'john'));

      expect(nullUsers.current).toEqual([]);
      expect(undefinedUsers.current).toEqual([]);
    });

    it('should handle users with missing or invalid name/email fields', () => {
      const usersWithMissingFields = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: '', email: 'empty.name@example.com' }, // Empty name
        { id: '3', name: 'No Email User' }, // Missing email
        { id: '4', email: 'no.name@example.com' }, // Missing name
        { id: '5', name: null, email: null }, // Null fields
      ] as User[];

      const { result } = renderHook(() => useUserFilter(usersWithMissingFields, 'john'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('John Doe');
    });

    it('should handle users with non-string name/email fields', () => {
      const usersWithInvalidFields = [
        { id: '1', name: 'Valid User', email: 'valid@example.com' },
        { id: '2', name: 123, email: 'number.name@example.com' }, // Number name
        { id: '3', name: 'Valid Name', email: 456 }, // Number email
      ] as any;

      const { result } = renderHook(() => useUserFilter(usersWithInvalidFields, 'valid'));
      expect(result.current).toHaveLength(2);
      expect(result.current.map(u => u.name)).toEqual(
        expect.arrayContaining(['Valid User', 'Valid Name'])
      );
    });

    it('should handle malformed user objects', () => {
      const malformedUsers = [
        { id: '1', name: 'Valid User', email: 'valid@example.com' },
        null, // Null user
        'invalid user', // String instead of object
        { id: '2' }, // Missing required fields
      ] as any;

      const { result } = renderHook(() => useUserFilter(malformedUsers, 'valid'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Valid User');
    });
  });

  describe('Performance and memoization', () => {
    it('should memoize results when inputs do not change', () => {
      const { result, rerender } = renderHook(({ users, search }) => useUserFilter(users, search), {
        initialProps: { users: mockUsers, search: 'john' },
      });

      const firstResult = result.current;

      // Rerender with same props
      rerender({ users: mockUsers, search: 'john' });

      // Should return the same reference (memoized)
      expect(result.current).toBe(firstResult);
    });

    it('should recalculate when users array changes', () => {
      const { result, rerender } = renderHook(({ users, search }) => useUserFilter(users, search), {
        initialProps: { users: mockUsers, search: 'john' },
      });

      const firstResult = result.current;
      const newUsers = [
        ...mockUsers,
        { id: '5', name: 'Johnny Cash', email: 'johnny@example.com' },
      ] as User[];

      rerender({ users: newUsers, search: 'john' });

      // Should return new result (not memoized)
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toHaveLength(2); // Should include the new user
    });

    it('should recalculate when search term changes', () => {
      const { result, rerender } = renderHook(({ users, search }) => useUserFilter(users, search), {
        initialProps: { users: mockUsers, search: 'john' },
      });

      const firstResult = result.current;

      rerender({ users: mockUsers, search: 'jane' });

      // Should return new result (not memoized)
      expect(result.current).not.toBe(firstResult);
      expect(result.current[0].name).toBe('Jane Smith');
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully and return empty array', () => {
      // Mock console.error to suppress error output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a users array that will cause an error when processed
      const problematicUsers = {
        [Symbol.iterator]: () => {
          throw new Error('Iterator error');
        },
      } as any;

      const { result } = renderHook(() => useUserFilter(problematicUsers, 'test'));

      expect(result.current).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('Trimming and whitespace handling', () => {
    it('should trim search term before filtering', () => {
      const { result: withSpaces } = renderHook(() => useUserFilter(mockUsers, '  john  '));
      const { result: withoutSpaces } = renderHook(() => useUserFilter(mockUsers, 'john'));

      expect(withSpaces.current).toEqual(withoutSpaces.current);
    });

    it('should handle names and emails with extra whitespace', () => {
      const usersWithSpaces = [
        { id: '1', name: '  John Doe  ', email: '  john.doe@example.com  ' },
        { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com' },
      ] as User[];

      const { result } = renderHook(() => useUserFilter(usersWithSpaces, 'john'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('  John Doe  ');
    });
  });
});
