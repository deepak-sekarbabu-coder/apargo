'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo, useSafeArea } from '@/hooks/use-mobile';

import { VisuallyHidden } from './visually-hidden';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  /** Disable backdrop blur on mobile for better performance */
  noBlurOnMobile?: boolean;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, noBlurOnMobile = false, ...props }, ref) => {
  const { isMobile } = useDeviceInfo();

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        // Conditional backdrop blur for performance
        !noBlurOnMobile && 'backdrop-blur-sm',
        noBlurOnMobile && isMobile && 'backdrop-blur-none',
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title?: string;
  description?: string;
  /** Mobile-first design with full-screen on small devices */
  mobileFullScreen?: boolean;
  /** Enhanced touch targets */
  enhancedTouch?: boolean;
  /** Custom close button position */
  closeButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Prevent body scroll when dialog is open */
  preventScroll?: boolean;
  /** Custom max width for different screen sizes */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      title,
      description,
      mobileFullScreen = false,
      enhancedTouch = false,
      closeButtonPosition = 'top-right',
      preventScroll = true,
      maxWidth = 'lg',
      ...props
    },
    ref
  ) => {
    const titleId = React.useId();
    const descriptionId = React.useId();
    const { isMobile, isTouchDevice, orientation } = useDeviceInfo();
    const safeArea = useSafeArea();
    // Focus trap currently always enabled; state retained for future enhancements
    const [focusTrapEnabled] = React.useState(true);

    // Handle body scroll prevention (only lock scroll on mobile to keep desktop PageUp/PageDown & wheel working)
    React.useEffect(() => {
      if (preventScroll && isMobile) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [preventScroll, isMobile]);

    // Handle viewport changes for mobile
    React.useEffect(() => {
      if (isMobile) {
        const handleViewportChange = () => {
          // Update CSS custom properties for safe area
          document.documentElement.style.setProperty('--dialog-safe-top', `${safeArea.top}px`);
          document.documentElement.style.setProperty(
            '--dialog-safe-bottom',
            `${safeArea.bottom}px`
          );
        };

        handleViewportChange();
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleViewportChange);

        return () => {
          window.removeEventListener('resize', handleViewportChange);
          window.removeEventListener('orientationchange', handleViewportChange);
        };
      }
    }, [isMobile, safeArea]);

    // Enhanced keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Tab') {
        // Custom tab handling for better mobile experience
        const focusableElements = event.currentTarget.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Get responsive max width classes
    const getMaxWidthClass = () => {
      const widthMap = {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full',
      };
      return widthMap[maxWidth];
    };

    // Close button position classes
    const getCloseButtonClasses = () => {
      const positionMap = {
        'top-right': 'absolute right-4 top-4',
        'top-left': 'absolute left-4 top-4',
        'bottom-right': 'absolute right-4 bottom-4',
        'bottom-left': 'absolute left-4 bottom-4',
      };
      return positionMap[closeButtonPosition];
    };

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed z-50 grid gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            // Base positioning and sizing
            !mobileFullScreen &&
              'left-[50%] top-[50%] w-full translate-x-[-50%] translate-y-[-50%]',
            !mobileFullScreen && getMaxWidthClass(),
            // Mobile full-screen handling
            mobileFullScreen && isMobile
              ? orientation === 'portrait'
                ? 'inset-x-0 bottom-0 top-auto rounded-t-lg data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom'
                : 'inset-0 rounded-none'
              : 'left-[50%] top-[50%] w-full translate-x-[-50%] translate-y-[-50%] rounded-lg',
            // Responsive padding and styling
            isMobile ? 'p-4 m-2' : 'p-6',
            enhancedTouch && isTouchDevice && 'p-6',
            // Scroll and height handling
            'max-h-[95vh] max-h-[95dvh] overflow-y-auto',
            mobileFullScreen &&
              isMobile &&
              'max-h-[calc(100vh-var(--dialog-safe-top,0px)-var(--dialog-safe-bottom,0px))]',
            // Animations
            !mobileFullScreen &&
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            // Touch optimizations
            isTouchDevice && 'touch-manipulation',
            // Safe area padding for mobile
            mobileFullScreen &&
              isMobile &&
              'pt-[calc(1rem+var(--dialog-safe-top,0px))] pb-[calc(1rem+var(--dialog-safe-bottom,0px))]',
            className
          )}
          style={{
            // Enhanced scrolling on mobile
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          onKeyDown={focusTrapEnabled ? handleKeyDown : undefined}
          {...props}
        >
          {title && (
            <VisuallyHidden>
              <DialogTitle id={titleId}>{title}</DialogTitle>
            </VisuallyHidden>
          )}
          {description && (
            <VisuallyHidden>
              <DialogDescription id={descriptionId}>{description}</DialogDescription>
            </VisuallyHidden>
          )}
          {children}
          <DialogPrimitive.Close
            className={cn(
              'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              getCloseButtonClasses(),
              // Enhanced touch targets
              (isMobile || isTouchDevice) &&
                'min-h-[44px] min-w-[44px] flex items-center justify-center',
              enhancedTouch && 'min-h-[48px] min-w-[48px]'
            )}
            aria-label="Close dialog"
          >
            <X className={cn('h-4 w-4', (isMobile || isTouchDevice) && 'h-5 w-5')} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Center align on mobile */
  centerOnMobile?: boolean;
}

const DialogHeader = ({ className, centerOnMobile = true, ...props }: DialogHeaderProps) => {
  const { isMobile } = useDeviceInfo();

  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5',
        centerOnMobile && isMobile ? 'text-center' : 'text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
};
DialogHeader.displayName = 'DialogHeader';

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack buttons on mobile */
  stackOnMobile?: boolean;
  /** Reverse button order on mobile */
  reverseOnMobile?: boolean;
}

const DialogFooter = ({
  className,
  stackOnMobile = true,
  reverseOnMobile = false,
  ...props
}: DialogFooterProps) => {
  const { isMobile } = useDeviceInfo();

  return (
    <div
      className={cn(
        'flex gap-2',
        stackOnMobile && isMobile
          ? reverseOnMobile
            ? 'flex-col-reverse'
            : 'flex-col'
          : 'flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
};
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { isMobile } = useDeviceInfo();

  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        isMobile && 'text-xl',
        className
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { isMobile } = useDeviceInfo();

  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', isMobile && 'text-base', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Enhanced mobile-friendly drawer component
interface DrawerProps extends DialogContentProps {
  /** Drawer position */
  position?: 'bottom' | 'top' | 'left' | 'right';
  /** Enable drag to close */
  dragToClose?: boolean;
  /** Custom drag threshold */
  dragThreshold?: number;
}

const Drawer = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DrawerProps>(
  (
    { position = 'bottom', dragToClose = true, dragThreshold = 100, className, children, ...props },
    ref
  ) => {
    const { isTouchDevice } = useDeviceInfo();
    const [dragY, setDragY] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const startY = React.useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!dragToClose || !isTouchDevice) return;
      startY.current = e.touches[0].clientY;
      setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (position === 'bottom' && deltaY > 0) {
        setDragY(deltaY);
      } else if (position === 'top' && deltaY < 0) {
        setDragY(Math.abs(deltaY));
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (dragY > dragThreshold) {
        // Close the drawer
        const closeButton = document.querySelector(
          '[data-state="open"] button[aria-label="Close dialog"]'
        ) as HTMLElement;
        closeButton?.click();
      }

      setDragY(0);
    };

    const getPositionClasses = () => {
      const baseClasses =
        'fixed z-50 gap-4 bg-background p-6 shadow-lg transition-all duration-200';

      switch (position) {
        case 'bottom':
          return `${baseClasses} inset-x-0 bottom-0 border-t rounded-t-lg data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom`;
        case 'top':
          return `${baseClasses} inset-x-0 top-0 border-b rounded-b-lg data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top`;
        case 'left':
          return `${baseClasses} inset-y-0 left-0 border-r rounded-r-lg data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left`;
        case 'right':
          return `${baseClasses} inset-y-0 right-0 border-l rounded-l-lg data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right`;
        default:
          return baseClasses;
      }
    };

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(getPositionClasses(), isTouchDevice && 'touch-manipulation', className)}
          style={{
            transform: isDragging
              ? `translateY(${position === 'bottom' ? dragY : -dragY}px)`
              : undefined,
            WebkitOverflowScrolling: 'touch',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...props}
        >
          {dragToClose && isTouchDevice && (
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
Drawer.displayName = 'Drawer';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Drawer,
  VisuallyHidden,
};
