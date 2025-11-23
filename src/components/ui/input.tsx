import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo as useMobileDeviceInfo } from '@/hooks/use-mobile';

interface InputProps extends React.ComponentProps<'input'> {
  /** Mobile keyboard type optimization */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  /** Enable auto-complete suggestions */
  enableAutoComplete?: boolean;
  /** Custom validation message for screen readers */
  ariaErrorMessage?: string;
  /** Custom description for complex inputs */
  ariaDescription?: string;
  /** Enhanced touch target for mobile */
  enhancedTouch?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      inputMode,
      enableAutoComplete = true,
      ariaErrorMessage,
      ariaDescription,
      enhancedTouch = false,
      ...props
    },
    ref
  ) => {
    const { isMobile, isTouchDevice } = useMobileDeviceInfo();
    const [isFocused, setIsFocused] = React.useState(false);

    // Auto-detect optimal inputMode based on type
    const getOptimalInputMode = () => {
      if (inputMode) return inputMode;

      switch (type) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'number':
          return 'numeric';
        case 'search':
          return 'search';
        case 'url':
          return 'url';
        default:
          return 'text';
      }
    };

    // Generate appropriate autocomplete value
    const getAutoComplete = () => {
      if (!enableAutoComplete) return 'off';
      if (props.autoComplete) return props.autoComplete;

      switch (type) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'password':
          return 'current-password';
        case 'search':
          return 'off'; // Disable for search to show recent searches
        default:
          return 'on';
      }
    };

    // Enhanced mobile styling
    const mobileEnhancements =
      isMobile || isTouchDevice
        ? {
            // Prevent zoom on iOS when font-size < 16px
            fontSize: '16px',
            // Enhanced touch targets
            minHeight: enhancedTouch ? '48px' : '44px',
            // Better touch feedback
            touchAction: 'manipulation',
          }
        : {};

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <input
        type={type}
        inputMode={getOptimalInputMode()}
        autoComplete={getAutoComplete()}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          // Enhanced mobile styles
          isMobile && 'min-h-[44px] text-base',
          enhancedTouch && 'min-h-[48px]',
          isTouchDevice && 'touch-manipulation',
          // Focus enhancements for accessibility
          isFocused && 'ring-2 ring-ring ring-offset-2',
          className
        )}
        style={{
          ...mobileEnhancements,
          ...(props.style || {}),
        }}
        aria-invalid={props['aria-invalid']}
        aria-describedby={ariaDescription ? `${props.id}-description` : props['aria-describedby']}
        aria-errormessage={ariaErrorMessage ? `${props.id}-error` : props['aria-errormessage']}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Enhanced search input with voice search support
const SearchInput = React.forwardRef<
  HTMLInputElement,
  InputProps & {
    onVoiceSearch?: () => void;
    showVoiceSearch?: boolean;
  }
>(({ onVoiceSearch, showVoiceSearch = false, className, ...props }, ref) => {
  const { isTouchDevice } = useMobileDeviceInfo();

  // Check if speech recognition is available
  const speechSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <div className="relative flex items-center">
      <Input
        ref={ref}
        type="search"
        inputMode="search"
        className={cn('pr-10', className)}
        {...props}
      />
      {showVoiceSearch && speechSupported && isTouchDevice && (
        <button
          type="button"
          onClick={onVoiceSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
          aria-label="Start voice search"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" x2="12" y1="18" y2="22" />
            <line x1="8" x2="16" y1="22" y2="22" />
          </svg>
        </button>
      )}
    </div>
  );
});
SearchInput.displayName = 'SearchInput';

// Enhanced textarea for mobile
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'> & {
    enhancedTouch?: boolean;
    autoResize?: boolean;
  }
>(({ className, enhancedTouch = false, autoResize = false, ...props }, ref) => {
  const { isMobile, isTouchDevice } = useMobileDeviceInfo();
  // Store textarea node without relying on a mutable ref assignment that may conflict with readonly typings.
  const [textareaNode, setTextareaNode] = React.useState<HTMLTextAreaElement | null>(null);

  // Auto-resize functionality
  React.useEffect(() => {
    if (autoResize && textareaNode) {
      const textarea = textareaNode;
      const adjustHeight = () => {
        // Use requestAnimationFrame to avoid forced reflows
        requestAnimationFrame(() => {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        });
      };
      textarea.addEventListener('input', adjustHeight);
      adjustHeight();
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [autoResize, textareaNode, props.value]);

  // Combine refs
  const combinedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node) setTextareaNode(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in (ref as object)) {
        // Cast safely for mutable refs
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    },
    [ref]
  );

  return (
    <textarea
      ref={combinedRef}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none md:text-sm',
        isMobile && 'min-h-[100px] text-base',
        enhancedTouch && 'min-h-[120px]',
        isTouchDevice && 'touch-manipulation',
        autoResize && 'resize-none overflow-hidden',
        className
      )}
      style={{
        fontSize: isMobile || isTouchDevice ? '16px' : undefined,
        touchAction: 'manipulation',
        ...(props.style || {}),
      }}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Input, SearchInput, Textarea };
