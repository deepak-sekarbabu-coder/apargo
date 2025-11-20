'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';

import Image from 'next/image';

import { useDeviceInfo } from '@/hooks/use-mobile';

// Mobile-optimized image component with lazy loading and intersection observer
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  priority = false,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const { devicePixelRatio } = useDeviceInfo();

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate responsive src based on device capabilities
  useEffect(() => {
    if (!isInView) return;

    // In a real implementation, you would generate responsive image URLs
    setCurrentSrc(src);
  }, [src, quality, devicePixelRatio, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          {blurDataURL && (
            <Image
              src={blurDataURL}
              alt=""
              layout="fill"
              objectFit="cover"
              className="w-full h-full object-cover filter blur-sm"
            />
          )}
        </div>
      )}

      {/* Main image */}
      <Image
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        layout="fill"
        objectFit="cover"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};

// Virtual scroll container for large lists
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  children: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  height,
  children,
  overscan = 5,
  className,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  // Generate visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      <div
        key={i}
        style={{
          height: itemHeight,
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
        }}
      >
        {children(items[i], i)}
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* Spacer for total height */}
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>{visibleItems}</div>
    </div>
  );
}

// Skeleton loader for mobile
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const MobileSkeleton: React.FC<SkeletonProps> = ({
  className,
  width = '100%',
  height = 16,
  rounded = false,
}) => {
  return (
    <div
      className={`bg-muted animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
    />
  );
};

// Lazy component wrapper
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = null,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Load content after a small delay for smooth transition
            setTimeout(() => setIsLoaded(true), 100);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? (
        <div
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {isLoaded ? children : fallback || <MobileSkeleton className="w-full h-32" />}
        </div>
      ) : (
        fallback || <MobileSkeleton className="w-full h-32" />
      )}
    </div>
  );
};

// Mobile-optimized debounce hook
export function useMobileDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Intersection observer hook optimized for mobile
export function useMobileIntersectionObserver(
  options: IntersectionObserverInit = {},
  threshold = 0.1
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Memory-efficient state management for mobile
export function useMemoryEfficientState<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const previousValue = useRef(value);

  // Only trigger re-renders if value actually changed
  const setMemoryEfficientValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const valueToSet =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(previousValue.current)
        : newValue;

    // Shallow equality check to avoid unnecessary re-renders
    if (JSON.stringify(valueToSet) !== JSON.stringify(previousValue.current)) {
      previousValue.current = valueToSet;
      setValue(valueToSet);
    }
  }, []);

  return [value, setMemoryEfficientValue] as const;
}

interface PerformanceMemory {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Mobile performance monitor
export function useMobilePerformance() {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0,
  });

  const { isMobile } = useDeviceInfo();

  useEffect(() => {
    if (!isMobile) return;

    // Monitor memory usage
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: PerformanceMemory }).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    // Monitor render performance
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Check memory usage periodically
    const memoryInterval = setInterval(checkMemoryUsage, 5000);
    checkMemoryUsage();

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, [isMobile]);

  const markRenderStart = useCallback(() => {
    performance.mark('render-start');
  }, []);

  const markRenderEnd = useCallback(() => {
    performance.mark('render-end');
    performance.measure('render', 'render-start', 'render-end');
  }, []);

  return {
    metrics,
    markRenderStart,
    markRenderEnd,
    isMobile,
  };
}

// Batch updates for better performance
export function useBatchedUpdates<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const pendingUpdates = useRef<Array<(prev: T) => T>>([]);

  const batchedSetState = useCallback((updates: Array<(prev: T) => T>) => {
    pendingUpdates.current.push(...updates);

    requestAnimationFrame(() => {
      if (pendingUpdates.current.length > 0) {
        setState(prev => {
          let newState = prev;
          pendingUpdates.current.forEach(update => {
            newState = update(newState);
          });
          pendingUpdates.current = [];
          return newState;
        });
      }
    });
  }, []);

  return [state, batchedSetState] as const;
}

// Mobile-specific event listener
export function useMobileEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  useEffect(() => {
    window.addEventListener(type, handler, options);
    return () => {
      window.removeEventListener(type, handler, options);
    };
  }, [type, handler, options]);
}

// Optimized re-render prevention
export function useOptimizedCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);

  // Update the ref only if callback changes
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}
