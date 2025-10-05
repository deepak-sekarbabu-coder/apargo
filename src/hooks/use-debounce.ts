import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce options (subset of lodash style)
 * leading: fire on the leading edge
 * trailing: fire on trailing edge (default true)
 * maxWait: ensure the callback/value updates at least once within this interval
 */
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean; // default true
  maxWait?: number; // optional upper bound
}

// Generic debounce hook returning debounced value
// Usage: const debouncedSearch = useDebounce(searchTerm, 300);
export function useDebounce<T>(value: T, delay = 300, options: DebounceOptions = {}): T {
  const { leading = false, trailing = true, maxWait } = options;
  const [debounced, setDebounced] = useState<T>(value);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    lastCallTimeRef.current = now;

    const invoke = () => {
      lastInvokeTimeRef.current = Date.now();
      setDebounced(value);
    };

    const shouldInvokeLeading = leading && lastInvokeTimeRef.current === null;
    if (shouldInvokeLeading) {
      invoke();
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        // If leading only and no trailing, skip invoke
        if (trailing) invoke();
      }, delay);
    }

    if (maxWait) {
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
      const timeSinceLastInvoke = lastInvokeTimeRef.current ? now - lastInvokeTimeRef.current : 0;
      const timeRemaining = Math.max(0, maxWait - timeSinceLastInvoke);
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (
          lastInvokeTimeRef.current === null ||
          (lastCallTimeRef.current || 0) > lastInvokeTimeRef.current
        ) {
          invoke();
        }
      }, timeRemaining);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay, leading, trailing, maxWait]);

  // Cleanup maxWait timers & visibility change (mobile Safari may freeze timers when backgrounded)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
    };
  }, []);

  return debounced;
}

// Debounced callback variant (stable reference) with options
// Generic debounced callback without using 'any' (uses unknown[] for args)
export function useDebouncedCallback<F extends (...args: unknown[]) => void>(
  fn: F,
  delay = 300,
  options: DebounceOptions = {}
) {
  const { leading = false, trailing = true, maxWait } = options;
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInvokeTimeRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<F> | null>(null);
  const lastThisRef = useRef<unknown>(null);

  const invoke = useCallback(() => {
    lastInvokeTimeRef.current = Date.now();
    if (lastArgsRef.current) {
      fnRef.current.apply(lastThisRef.current, lastArgsRef.current);
      lastArgsRef.current = null;
      lastThisRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    lastArgsRef.current = null;
    lastThisRef.current = null;
  }, []);

  const callback = useCallback(
    (...args: Parameters<F>) => {
      lastArgsRef.current = args;
      lastThisRef.current = undefined;
      const isInvokingLeading = leading && lastInvokeTimeRef.current === null;
      if (isInvokingLeading) invoke();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (trailing && lastArgsRef.current) invoke();
        }, delay);
      }

      if (maxWait) {
        if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
        const timeSinceLastInvoke = lastInvokeTimeRef.current
          ? Date.now() - lastInvokeTimeRef.current
          : 0;
        const timeRemaining = Math.max(0, maxWait - timeSinceLastInvoke);
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (lastArgsRef.current) invoke();
        }, timeRemaining);
      }
    },
    [delay, leading, trailing, maxWait, invoke]
  );

  // Cancel on unmount / visibility hidden (mobile Safari quirks)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        cancel();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      cancel();
    };
  }, [cancel]);

  return { callback, cancel } as const;
}
