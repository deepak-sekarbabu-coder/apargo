jest.useFakeTimers();

import { act, renderHook } from '@testing-library/react';

import { DEBOUNCE_CONFIG } from '@/lib/utils';

import { useDebounce, useDebouncedCallback } from '@/hooks/use-debounce';

describe('useDebounce', () => {

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Basic debounce functionality', () => {
    it('should debounce value updates with default delay', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Initial value should be set immediately
      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated' });
      expect(result.current).toBe('initial'); // Should still be initial

      // Advance time less than delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe('initial'); // Should still be initial

      // Advance time to complete delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('updated'); // Should now be updated
    });

    it('should use configurable delay from constants', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, DEBOUNCE_CONFIG.USER_SEARCH_DELAY),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Should not update before the configured delay
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_CONFIG.USER_SEARCH_DELAY - 50);
      });
      expect(result.current).toBe('initial');

      // Should update after the configured delay
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current).toBe('updated');
    });

    it('should reset debounce timer on rapid value changes (simulating typing)', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      // Simulate rapid typing
      rerender({ value: 'a' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: 'ab' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: 'abc' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should still be initial value as timer keeps resetting
      expect(result.current).toBe('');

      // Complete the final delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe('abc');
    });
  });

  describe('Debounce options', () => {

    it('should support trailing edge execution (default behavior)', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300, { trailing: true }),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial'); // Should not update immediately

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current).toBe('updated'); // Should update after delay
    });
  });

  describe('Request abortion and cleanup', () => {
    it('should abort previous debounce when component unmounts', () => {
      const { result, unmount } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      void result.current; // Access to trigger initial render

      // Unmount should clean up timers
      unmount();

      // No timers should be running
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should handle visibility change events (mobile Safari compatibility)', () => {
      const { result } = renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      void result.current; // Trigger initial render

      // Simulate visibility change to hidden (mobile Safari backgrounding)
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden',
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should clean up timers when hidden
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle rapid successive identical values efficiently', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: 'same' } }
      );

      // Multiple updates with same value
      for (let i = 0; i < 5; i++) {
        rerender({ value: 'same' });
      }

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('same');
    });

    it('should handle different data types', () => {
      const { result: stringResult } = renderHook(
        ({ value }: { value: string }) => useDebounce(value),
        { initialProps: { value: 'string' } }
      );

      const { result: numberResult } = renderHook(
        ({ value }: { value: number }) => useDebounce(value),
        { initialProps: { value: 42 } }
      );

      const { result: booleanResult } = renderHook(
        ({ value }: { value: boolean }) => useDebounce(value),
        { initialProps: { value: true } }
      );

      expect(stringResult.current).toBe('string');
      expect(numberResult.current).toBe(42);
      expect(booleanResult.current).toBe(true);
    });
  });
});

describe('useDebouncedCallback', () => {

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should provide cancel functionality', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 300));

    const { callback, cancel } = result.current;

    callback('test');
    cancel(); // Cancel before execution

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not have been called due to cancellation
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
