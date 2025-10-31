'use client';

import { Menu, X } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo, useSafeArea } from '@/hooks/use-mobile';

// Enhanced mobile header with integrated navigation
interface MobileHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  showMenu?: boolean;
  onMenuClick?: () => void;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
  blur?: boolean;
}

export const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
  (
    {
      className,
      showMenu = false,
      onMenuClick,
      title,
      actions,
      sticky = true,
      blur = true,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile } = useDeviceInfo();
    const safeArea = useSafeArea();

    if (!isMobile) return null;

    return (
      <header
        ref={ref}
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-background border-b border-border',
          sticky && 'sticky top-0 z-50',
          blur && 'backdrop-blur-sm bg-background/80',
          className
        )}
        style={{
          paddingTop: `max(${safeArea.top}px, env(safe-area-inset-top, 0px))`,
        }}
        {...props}
      >
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {title}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>

        {children}
      </header>
    );
  }
);
MobileHeader.displayName = 'MobileHeader';

// Mobile-optimized sheet/drawer
interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  className?: string;
  enableSwipeClose?: boolean;
}

export const MobileSheet: React.FC<MobileSheetProps> = ({
  isOpen,
  onClose,
  side = 'left',
  children,
  className,
  enableSwipeClose = true,
}) => {
  const { isTouchDevice } = useDeviceInfo();
  const safeArea = useSafeArea();
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sideClasses = {
    left: 'left-0 border-r',
    right: 'right-0 border-l',
    bottom: 'bottom-0 border-t',
  };

  const translateClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    const shouldClose =
      (side === 'left' && direction === 'left') ||
      (side === 'right' && direction === 'right') ||
      (side === 'bottom' && direction === 'down');

    if (shouldClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className={cn(
          'fixed top-0 z-50 h-full w-80 max-w-[85vw] bg-background shadow-lg transform transition-transform duration-300 ease-out',
          side === 'bottom' && 'h-auto max-h-[85vh] w-full max-w-none left-0 right-0',
          sideClasses[side],
          translateClasses[side],
          className
        )}
        style={{
          paddingTop: `max(${safeArea.top}px, env(safe-area-inset-top, 0px))`,
          paddingBottom: `max(${safeArea.bottom}px, env(safe-area-inset-bottom, 0px))`,
        }}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={cn(
            'h-full flex flex-col',
            side === 'bottom' && 'h-auto'
          )}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {children}
        </div>
      </div>
    </>
  );
};

// Mobile-optimized list component
interface MobileListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  dense?: boolean;
  showDividers?: boolean;
}

export const MobileList = React.forwardRef<HTMLDivElement, MobileListProps>(
  ({ className, children, dense = false, showDividers = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'divide-y divide-border',
          dense ? 'divide-y-0' : '',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className={cn('px-4 py-3', dense && 'py-2')}>
            {child}
          </div>
        ))}
      </div>
    );
  }
);
MobileList.displayName = 'MobileList';

// Mobile list item
interface MobileListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  chevron?: boolean;
}

export const MobileListItem = React.forwardRef<HTMLDivElement, MobileListItemProps>(
  (
    {
      className,
      children,
      leadingIcon,
      trailingIcon,
      onClick,
      disabled = false,
      chevron = false,
      ...props
    },
    ref
  ) => {
    const { isTouchDevice } = useDeviceInfo();

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 w-full',
          onClick && !disabled && 'cursor-pointer touch-manipulation',
          onClick && !disabled && isTouchDevice && 'min-h-[48px]',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={!disabled ? onClick : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        aria-disabled={disabled}
        {...props}
      >
        {leadingIcon && (
          <div className="flex-shrink-0 text-muted-foreground">
            {leadingIcon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {children}
        </div>

        {trailingIcon && (
          <div className="flex-shrink-0">
            {trailingIcon}
          </div>
        )}

        {chevron && !trailingIcon && (
          <div className="flex-shrink-0 text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);
MobileListItem.displayName = 'MobileListItem';

// Enhanced mobile grid for cards
interface MobileCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const MobileCardGrid = React.forwardRef<HTMLDivElement, MobileCardGridProps>(
  ({ className, columns = 2, gap = 'md', children, ...props }, ref) => {
    const { isMobile, isTablet } = useDeviceInfo();

    const columnClasses = {
      mobile: isMobile ? columns : 2,
      tablet: isTablet ? Math.max(columns, 3) : columns,
    };

    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`,
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MobileCardGrid.displayName = 'MobileCardGrid';

// Mobile-optimized button group
interface MobileButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

export const MobileButtonGroup = React.forwardRef<HTMLDivElement, MobileButtonGroupProps>(
  ({ className, children, orientation = 'horizontal', fullWidth = true, ...props }, ref) => {
    const { isMobile, isTouchDevice } = useDeviceInfo();

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          fullWidth && 'w-full',
          // Mobile: stack buttons vertically for better touch targets
          isMobile && orientation === 'horizontal' && 'flex-col',
          // Ensure minimum touch target size
          isTouchDevice && 'gap-2',
          className
        )}
        role="group"
        {...props}
      >
        {React.Children.map(children, child => (
          <div
            className={cn(
              fullWidth && 'flex-1',
              // Mobile: ensure buttons take full width
              isMobile && fullWidth && 'w-full'
            )}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }
);
MobileButtonGroup.displayName = 'MobileButtonGroup';

// Hook for mobile gesture handling
export function useMobileGestures() {
  const [gestures, setGestures] = React.useState({
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null,
    swipeDistance: 0,
    isDragging: false,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    setGestures(prev => ({ ...prev, isDragging: true }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setGestures(prev => ({ ...prev, isDragging: false }));
  };

  return {
    gestures,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// Mobile-optimized modal
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const { isMobile } = useDeviceInfo();
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full w-full h-full rounded-none',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div ref={modalRef} className="flex-1 overflow-y-auto">
          <div className={cn('p-4', size !== 'full' && 'mx-auto', sizeClasses[size])}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};