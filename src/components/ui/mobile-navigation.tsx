'use client';

import { Home, Menu, Search, Settings, User, X } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo, useSafeArea } from '@/hooks/use-mobile';

interface SwipeGestureResult {
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
}

// Hook for swipe gesture detection
const useSwipeGesture = (
  onSwipe?: (result: SwipeGestureResult) => void,
  threshold: number = 50,
  velocityThreshold: number = 0.3
) => {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number; time: number } | null>(
    null
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    // Determine swipe direction
    if (Math.max(absDeltaX, absDeltaY) > threshold && velocity > velocityThreshold) {
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    const result: SwipeGestureResult = {
      deltaX,
      deltaY,
      direction,
      velocity,
    };

    onSwipe?.(result);
    setTouchStart(null);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  disabled?: boolean;
}

// Horizontal tab navigation with swipe support
interface MobileTabNavigationProps {
  items: NavigationItem[];
  activeId?: string;
  onItemChange?: (item: NavigationItem) => void;
  variant?: 'tabs' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  scrollable?: boolean;
  enableSwipe?: boolean;
  className?: string;
}

export const MobileTabNavigation = React.forwardRef<HTMLDivElement, MobileTabNavigationProps>(
  (
    {
      items,
      activeId,
      onItemChange,
      variant = 'underline',
      size = 'md',
      scrollable = true,
      enableSwipe = true,
      className,
      ...props
    },
    ref
  ) => {
    const { isMobile, isTouchDevice } = useDeviceInfo();
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    // Handle swipe navigation
    const handleSwipe = React.useCallback(
      (result: SwipeGestureResult) => {
        if (!enableSwipe || !activeId) return;

        const currentIndex = items.findIndex(item => item.id === activeId);
        if (currentIndex === -1) return;

        let newIndex = currentIndex;
        if (result.direction === 'left' && currentIndex < items.length - 1) {
          newIndex = currentIndex + 1;
        } else if (result.direction === 'right' && currentIndex > 0) {
          newIndex = currentIndex - 1;
        }

        if (newIndex !== currentIndex && !items[newIndex].disabled) {
          onItemChange?.(items[newIndex]);
          // Scroll to the new item
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      },
      [enableSwipe, activeId, items, onItemChange]
    );

    const swipeHandlers = useSwipeGesture(handleSwipe);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : items.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = index < items.length - 1 ? index + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!items[index].disabled) {
            onItemChange?.(items[index]);
          }
          return;
      }

      // Skip disabled items
      while (items[newIndex]?.disabled && newIndex !== index) {
        if (newIndex < index) {
          newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
        } else {
          newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
        }
      }

      if (newIndex !== index && !items[newIndex].disabled) {
        itemRefs.current[newIndex]?.focus();
        setFocusedIndex(newIndex);
      }
    };

    const sizeClasses = {
      sm: 'text-sm px-3 py-1.5 min-h-[36px]',
      md: 'text-base px-4 py-2 min-h-[44px]',
      lg: 'text-lg px-5 py-3 min-h-[48px]',
    };

    const variantClasses = {
      tabs: 'border border-border rounded-lg bg-muted p-1',
      pills: 'bg-muted rounded-full p-1',
      underline: 'border-b border-border',
    };

    const itemVariantClasses = {
      tabs: {
        base: 'rounded-md transition-colors',
        active: 'bg-background text-foreground shadow-sm',
        inactive: 'text-muted-foreground hover:text-foreground hover:bg-background/50',
      },
      pills: {
        base: 'rounded-full transition-colors',
        active: 'bg-primary text-primary-foreground',
        inactive: 'text-muted-foreground hover:text-foreground hover:bg-background/50',
      },
      underline: {
        base: 'border-b-2 border-transparent transition-colors rounded-t-md',
        active: 'border-primary text-primary',
        inactive: 'text-muted-foreground hover:text-foreground hover:border-border',
      },
    };

    return (
      <div
        ref={ref}
        className={cn('relative', variantClasses[variant], className)}
        role="tablist"
        aria-orientation="horizontal"
        {...props}
      >
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex',
            scrollable && 'overflow-x-auto scrollbar-hide scroll-touch',
            variant === 'underline' && 'min-w-full'
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
          {...(enableSwipe && isTouchDevice ? swipeHandlers : {})}
        >
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            const isFocused = focusedIndex === index;

            return (
              <button
                key={item.id}
                ref={el => {
                  itemRefs.current[index] = el;
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={item.disabled}
                className={cn(
                  'relative flex items-center justify-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap touch-manipulation',
                  sizeClasses[size],
                  itemVariantClasses[variant].base,
                  isActive
                    ? itemVariantClasses[variant].active
                    : itemVariantClasses[variant].inactive,
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  isFocused && 'ring-2 ring-ring ring-offset-2',
                  // Enhanced touch targets for mobile
                  (isMobile || isTouchDevice) && 'min-w-[44px]'
                )}
                onClick={() => {
                  if (!item.disabled) {
                    onItemChange?.(item);
                    item.onClick?.();
                  }
                }}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                onKeyDown={e => handleKeyDown(e, index)}
                aria-label={item.badge ? `${item.label} (${item.badge})` : item.label}
              >
                {item.icon}
                <span className={cn(scrollable && 'flex-shrink-0')}>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full min-w-[16px] h-4">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
MobileTabNavigation.displayName = 'MobileTabNavigation';

// Bottom navigation component
interface MobileBottomNavigationProps {
  items: NavigationItem[];
  activeId?: string;
  onItemChange?: (item: NavigationItem) => void;
  enableHaptic?: boolean;
  className?: string;
}

export const MobileBottomNavigation = React.forwardRef<HTMLDivElement, MobileBottomNavigationProps>(
  ({ items, activeId, onItemChange, enableHaptic = true, className, ...props }, ref) => {
    const { isTouchDevice } = useDeviceInfo();
    const safeArea = useSafeArea();

    const handleItemClick = (item: NavigationItem) => {
      if (item.disabled) return;

      // Haptic feedback for supported devices
      if (enableHaptic && 'vibrate' in navigator && isTouchDevice) {
        navigator.vibrate(50);
      }

      onItemChange?.(item);
      item.onClick?.();
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border',
          'grid grid-cols-' + Math.min(items.length, 5),
          className
        )}
        style={{
          paddingBottom: `max(${safeArea.bottom}px, env(safe-area-inset-bottom, 0px))`,
        }}
        role="navigation"
        aria-label="Bottom navigation"
        {...props}
      >
        {items.map(item => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[60px] touch-manipulation transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              aria-label={item.badge ? `${item.label} (${item.badge})` : item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 text-xs font-medium bg-destructive text-destructive-foreground rounded-full min-w-[16px] h-4">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }
);
MobileBottomNavigation.displayName = 'MobileBottomNavigation';

// Sliding drawer navigation
interface MobileDrawerNavigationProps {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  onItemChange?: (item: NavigationItem) => void;
  position?: 'left' | 'right';
  enableSwipeClose?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MobileDrawerNavigation = React.forwardRef<HTMLDivElement, MobileDrawerNavigationProps>(
  (
    {
      items,
      isOpen,
      onClose,
      onItemChange,
      position = 'left',
      enableSwipeClose = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isTouchDevice } = useDeviceInfo();
    const safeArea = useSafeArea();

    // Handle swipe to close
    const handleSwipe = React.useCallback(
      (result: SwipeGestureResult) => {
        if (!enableSwipeClose) return;

        const shouldClose =
          (position === 'left' && result.direction === 'left') ||
          (position === 'right' && result.direction === 'right');

        if (shouldClose && Math.abs(result.deltaX) > 100) {
          onClose();
        }
      },
      [enableSwipeClose, position, onClose]
    );

    const swipeHandlers = useSwipeGesture(handleSwipe);

    const handleItemClick = (item: NavigationItem) => {
      if (item.disabled) return;

      onItemChange?.(item);
      item.onClick?.();
      onClose(); // Close drawer after selection
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <div
          ref={ref}
          className={cn(
            'fixed top-0 z-50 h-full w-80 max-w-[85vw] bg-background shadow-lg transform transition-transform duration-300 ease-in-out',
            position === 'left' ? 'left-0' : 'right-0',
            isOpen
              ? 'translate-x-0'
              : position === 'left'
                ? '-translate-x-full'
                : 'translate-x-full',
            className
          )}
          style={{
            paddingTop: `max(${safeArea.top}px, env(safe-area-inset-top, 0px))`,
            paddingBottom: `max(${safeArea.bottom}px, env(safe-area-inset-bottom, 0px))`,
          }}
          role="navigation"
          aria-label="Drawer navigation"
          aria-hidden={!isOpen}
          {...(enableSwipeClose && isTouchDevice ? swipeHandlers : {})}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors touch-manipulation min-h-[44px]',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'hover:bg-muted',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    aria-label={item.badge ? `${item.label} (${item.badge})` : item.label}
                  >
                    {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer content */}
          {children && <div className="border-t border-border p-4">{children}</div>}
        </div>
      </>
    );
  }
);
MobileDrawerNavigation.displayName = 'MobileDrawerNavigation';

// Example usage components
export const ExampleNavigations = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const [activeBottom, setActiveBottom] = React.useState('home');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const tabItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, badge: 2 },
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  ];

  const bottomItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { id: 'search', label: 'Search', icon: <Search className="h-5 w-5" />, badge: 5 },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8 p-4">
      {/* Tab Navigation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tab Navigation</h3>
        <MobileTabNavigation
          items={tabItems}
          activeId={activeTab}
          onItemChange={item => setActiveTab(item.id)}
          variant="underline"
          enableSwipe={true}
        />
      </div>

      {/* Bottom Navigation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Bottom Navigation</h3>
        <MobileBottomNavigation
          items={bottomItems}
          activeId={activeBottom}
          onItemChange={item => setActiveBottom(item.id)}
        />
      </div>

      {/* Drawer Navigation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Drawer Navigation</h3>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          <Menu className="h-4 w-4" />
          Open Drawer
        </button>

        <MobileDrawerNavigation
          items={tabItems}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onItemChange={item => setActiveTab(item.id)}
        />
      </div>
    </div>
  );
};
