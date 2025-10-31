'use client';

import { useState, useRef, useCallback } from 'react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

// Enhanced touch feedback component
interface TouchFeedbackProps extends React.HTMLAttributes<HTMLDivElement> {
  rippleColor?: string;
  disabled?: boolean;
  scale?: number;
  children: React.ReactNode;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  className,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  disabled = false,
  scale = 0.95,
  children,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { isTouchDevice } = useDeviceInfo();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);

    // Create ripple effect
    if (isTouchDevice) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const newRipple = {
        id: Date.now(),
        x,
        y,
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      timeoutRef.current = setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
  }, [disabled, isTouchDevice]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
  }, [disabled]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden select-none',
        isPressed && !disabled && `transform transition-transform duration-75`,
        isPressed && !disabled && !disabled && `scale-[${scale}]`,
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => !disabled && setIsPressed(false)}
      onMouseLeave={() => !disabled && setIsPressed(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      {...props}
    >
      {children}
      
      {/* Ripple effect */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-current opacity-20 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </div>
  );
};

// Long press handler hook
export function useLongPress(callback: () => void, delay: number = 500) {
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isTouchDevice } = useDeviceInfo();

  const start = useCallback(() => {
    if (!isTouchDevice) return;

    timeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      callback();
    }, delay);
  }, [callback, delay, isTouchDevice]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  React.useEffect(() => {
    return clear;
  }, [clear]);

  return {
    isLongPress,
    bind: {
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchMove: clear,
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
    } as const,
  };
}

// Gesture swipe hook
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [direction, setDirection] = useState<string | null>(null);
  const startTouch = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startTouch.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch.current || !isSwiping) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = touch.clientY - startTouch.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    let swipeDirection = '';

    if (Math.max(absDeltaX, absDeltaY) > threshold) {
      if (absDeltaX > absDeltaY) {
        swipeDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        swipeDirection = deltaY > 0 ? 'down' : 'up';
      }

      setDirection(swipeDirection);

      // Trigger callbacks
      switch (swipeDirection) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    setIsSwiping(false);
    startTouch.current = null;
  };

  return {
    isSwiping,
    direction,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    } as const,
  };
}

// Pinch zoom hook
export function usePinchZoom(minScale: number = 0.5, maxScale: number = 3) {
  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const startDistance = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsZooming(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      startDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const newScale = Math.max(
        minScale,
        Math.min(maxScale, (currentDistance / startDistance.current) * scale)
      );
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsZooming(false);
  };

  const reset = () => setScale(1);

  return {
    scale,
    isZooming,
    reset,
    pinchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    } as const,
  };
}

// Enhanced button with touch feedback
interface EnhancedTouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  longPressText?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const EnhancedTouchButton = React.forwardRef<HTMLButtonElement, EnhancedTouchButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      longPressText,
      loading = false,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isTouchDevice } = useDeviceInfo();
    const { isLongPress, bind: longPressBind } = useLongPress(() => {
      if (longPressText) {
        // Could show a toast or haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      onClick?.(e);
    };

    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Touch-friendly sizing
          isTouchDevice && 'min-h-[44px] px-4 py-2',
          // Variants
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'link' && 'text-primary underline-offset-4 hover:underline',
          // Sizes
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 rounded-md px-3',
          size === 'lg' && 'h-11 rounded-md px-8',
          size === 'icon' && 'h-10 w-10',
          // Loading state
          loading && 'cursor-wait opacity-70',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...longPressBind}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
EnhancedTouchButton.displayName = 'EnhancedTouchButton';

// Touch scroll container with momentum
interface TouchScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical' | 'both';
  momentum?: boolean;
  snap?: boolean;
}

export const TouchScrollContainer = React.forwardRef<HTMLDivElement, TouchScrollContainerProps>(
  (
    { className, children, direction = 'vertical', momentum = true, snap = false, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-auto',
          direction === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
          direction === 'vertical' && 'overflow-y-auto overflow-x-hidden',
          // iOS momentum scrolling
          momentum && 'scroll-momentum',
          // Snap scrolling for carousels
          snap && 'snap-x snap-mandatory overflow-x-scroll',
          // Hide scrollbars on mobile
          'scrollbar-hide',
          // Touch optimization
          'touch-pan-x touch-pan-y',
          className
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TouchScrollContainer.displayName = 'TouchScrollContainer';

// Haptic feedback utility
export function useHapticFeedback() {
  const { isTouchDevice } = useDeviceInfo();

  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [isTouchDevice]);

  const light = useCallback(() => vibrate(20), [vibrate]);
  const medium = useCallback(() => vibrate(50), [vibrate]);
  const heavy = useCallback(() => vibrate(100), [vibrate]);
  const success = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 25, 50]), [vibrate]);

  return {
    vibrate,
    light,
    medium,
    heavy,
    success,
    error,
    isSupported: isTouchDevice && 'vibrate' in navigator,
  };
}

// Orientation change handler
export function useOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void) {
  React.useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      callback(orientation);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Initial check
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [callback]);
}