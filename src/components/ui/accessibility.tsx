'use client';

import * as React from 'react';

/**
 * Screen reader announcement component for dynamic content updates
 */
export function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
  children,
}: {
  message: string;
  priority?: 'polite' | 'assertive';
  children?: React.ReactNode;
}) {
  const [announcement, setAnnouncement] = React.useState(message);

  React.useEffect(() => {
    setAnnouncement(message);
  }, [message]);

  return (
    <>
      <div
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>
      {children}
    </>
  );
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      {children}
    </a>
  );
}

/**
 * Focus trap utility for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLElement>(null);
  const firstFocusableRef = React.useRef<HTMLElement>(null);
  const lastFocusableRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0] as HTMLElement;
      lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus first element
      firstFocusableRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Accessible button with loading state
 */
export function AccessibleButton({
  loading,
  loadingText,
  children,
  ...props
}: {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-disabled={loading || props.disabled}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText || 'Loading...'}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Accessible form field wrapper with error handling
 */
export function AccessibleField({
  id,
  label,
  error,
  required,
  description,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        id={`${id}-label`}
      >
        {label}
        {required && (
          <span className="sr-only"> (required)</span>
        )}
        {required && (
          <span aria-hidden="true" className="text-destructive ml-1">
            *
          </span>
        )}
      </label>

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-labelledby': `${id}-label`,
          'aria-describedby': [
            description ? descriptionId : undefined,
            error ? errorId : undefined,
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
        })}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
