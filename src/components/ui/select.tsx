'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  /** Enhanced touch targets for mobile */
  enhancedTouch?: boolean;
  /** Show loading state */
  loading?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, enhancedTouch = false, loading = false, ...props }, ref) => {
  const { isMobile, isTouchDevice } = useDeviceInfo();
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        // Mobile optimizations
        (isMobile || isTouchDevice) && 'min-h-[44px] text-base touch-manipulation',
        enhancedTouch && 'min-h-[48px]',
        // Focus enhancements
        isFocused && 'ring-2 ring-ring ring-offset-2',
        // Loading state
        loading && 'cursor-wait',
        className
      )}
      style={{
        fontSize: isMobile || isTouchDevice ? '16px' : undefined, // Prevent zoom on iOS
        touchAction: 'manipulation',
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={loading || props.disabled}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => {
  const { isTouchDevice } = useDeviceInfo();

  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        isTouchDevice && 'min-h-[44px] py-2 touch-manipulation',
        className
      )}
      {...props}
    >
      <ChevronUp className={cn('h-4 w-4', isTouchDevice && 'h-5 w-5')} />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => {
  const { isTouchDevice } = useDeviceInfo();

  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        isTouchDevice && 'min-h-[44px] py-2 touch-manipulation',
        className
      )}
      {...props}
    >
      <ChevronDown className={cn('h-4 w-4', isTouchDevice && 'h-5 w-5')} />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  /** Enable touch-friendly scrolling */
  touchOptimized?: boolean;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', touchOptimized = true, ...props }, ref) => {
  const { isMobile, viewport } = useDeviceInfo();

  // Adjust max height based on viewport
  const getMaxHeight = () => {
    if (isMobile) {
      return Math.min(viewport.height * 0.6, 400); // Max 60% of viewport or 400px
    }
    return 384; // Default max-h-96 (24rem = 384px)
  };

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          // Mobile optimizations
          'max-w-[95vw] min-w-[8rem]',
          touchOptimized && 'touch-manipulation',
          // Enhanced mobile positioning
          isMobile && 'mx-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        style={{
          maxHeight: `${getMaxHeight()}px`,
          // Enhanced touch scrolling
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
        position={position}
        collisionPadding={isMobile ? 8 : 16}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  const { isMobile } = useDeviceInfo();

  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'py-1.5 pl-8 pr-2 text-sm font-semibold',
        isMobile && 'py-2 text-base',
        className
      )}
      {...props}
    />
  );
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /** Enhanced touch targets */
  enhancedTouch?: boolean;
  /** Custom keyboard shortcut */
  shortcut?: string;
}

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, enhancedTouch = false, shortcut, ...props }, ref) => {
    const { isMobile, isTouchDevice } = useDeviceInfo();
    const [isPressed, setIsPressed] = React.useState(false);

    const handleTouchStart = () => setIsPressed(true);
    const handleTouchEnd = () => setIsPressed(false);

    return (
      <SelectPrimitive.Item
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          // Mobile touch optimizations
          (isMobile || isTouchDevice) && 'min-h-[44px] py-3 text-base touch-manipulation',
          enhancedTouch && 'min-h-[48px] py-4',
          // Touch feedback
          isPressed && 'bg-accent/80',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className={cn('h-4 w-4', (isMobile || isTouchDevice) && 'h-5 w-5')} />
          </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>

        {shortcut && (
          <span className="ml-auto text-xs text-muted-foreground opacity-60">{shortcut}</span>
        )}
      </SelectPrimitive.Item>
    );
  }
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Enhanced multi-select component for mobile
interface MultiSelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  maxItems?: number;
  searchable?: boolean;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select items...',
      className,
      maxItems,
      searchable = false,
    },
    ref
  ) => {
    const { isMobile } = useDeviceInfo();
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchTerm) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm, searchable]);

    const toggleOption = (optionValue: string) => {
      const isSelected = value.includes(optionValue);
      if (isSelected) {
        onValueChange(value.filter(v => v !== optionValue));
      } else {
        if (maxItems && value.length >= maxItems) return;
        onValueChange([...value, optionValue]);
      }
    };

    const selectedLabels = options
      .filter(option => value.includes(option.value))
      .map(option => option.label);

    return (
      <div ref={ref} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isMobile && 'min-h-[44px] text-base touch-manipulation'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn('truncate', !selectedLabels.length && 'text-muted-foreground')}>
            {selectedLabels.length > 0
              ? selectedLabels.length > 2
                ? `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2} more`
                : selectedLabels.join(', ')
              : placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md',
              isMobile && 'max-h-[60vh]'
            )}
          >
            {searchable && (
              <div className="p-2 border-b">
                <input
                  type="search"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
            <div className="max-h-60 overflow-auto p-1">
              {filteredOptions.map(option => {
                const isSelected = value.includes(option.value);
                const isDisabled =
                  option.disabled || (maxItems && !isSelected && value.length >= maxItems);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && toggleOption(option.value)}
                    disabled={!!isDisabled}
                    className={cn(
                      'relative flex w-full items-center rounded-sm px-8 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none',
                      isMobile && 'min-h-[44px] py-3 text-base'
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  MultiSelect,
};
