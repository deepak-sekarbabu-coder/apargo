'use client';

import { Keyboard, SkipForward } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

// Removed unused useDeviceInfo import

// Types for focus management
// Removed unused FocusableElement interface (was not referenced)

interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
  description: string;
  action: () => void;
  category?: string;
}

interface SkipLink {
  id: string;
  text: string;
  target: string;
  category?: string;
}

// Hook for focus trap management
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = React.useRef<HTMLElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const getFocusableElements = React.useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');

    const elements = Array.from(containerRef.current.querySelectorAll(selector));
    return elements.filter(element => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetParent !== null &&
        !htmlElement.hasAttribute('hidden') &&
        htmlElement.getAttribute('aria-hidden') !== 'true'
      );
    }) as HTMLElement[];
  }, []);

  const trapFocus = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isActive || e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  React.useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      document.addEventListener('keydown', trapFocus);
    } else {
      document.removeEventListener('keydown', trapFocus);

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isActive, trapFocus, getFocusableElements]);

  return {
    containerRef,
    getFocusableElements,
  };
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const [activeShortcuts, setActiveShortcuts] = React.useState<KeyboardShortcut[]>([]);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();

        const modifierMatches = (shortcut.modifiers || []).every(modifier => {
          switch (modifier) {
            case 'ctrl':
              return e.ctrlKey;
            case 'alt':
              return e.altKey;
            case 'shift':
              return e.shiftKey;
            case 'meta':
              return e.metaKey;
            default:
              return false;
          }
        });

        const noExtraModifiers =
          !shortcut.modifiers ||
          (shortcut.modifiers.length === 0 &&
            !e.ctrlKey &&
            !e.altKey &&
            !e.shiftKey &&
            !e.metaKey) ||
          (shortcut.modifiers.includes('ctrl') === e.ctrlKey &&
            shortcut.modifiers.includes('alt') === e.altKey &&
            shortcut.modifiers.includes('shift') === e.shiftKey &&
            shortcut.modifiers.includes('meta') === e.metaKey);

        return keyMatches && modifierMatches && noExtraModifiers;
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();

        // Add to active shortcuts for visual feedback
        setActiveShortcuts(prev => [...prev, matchingShortcut]);
        setTimeout(() => {
          setActiveShortcuts(prev => prev.filter(s => s.id !== matchingShortcut.id));
        }, 200);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);

  return { activeShortcuts };
}

// Hook for focus indicators
export function useFocusIndicators() {
  const [focusedElement, setFocusedElement] = React.useState<HTMLElement | null>(null);
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    let keyboardTimeout: NodeJS.Timeout;

    const handleKeyDown = () => {
      setIsKeyboardUser(true);
      clearTimeout(keyboardTimeout);
      keyboardTimeout = setTimeout(() => setIsKeyboardUser(false), 3000);
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    const handleFocus = (e: FocusEvent) => {
      setFocusedElement(e.target as HTMLElement);
    };

    const handleBlur = () => {
      setFocusedElement(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      clearTimeout(keyboardTimeout);
    };
  }, []);

  return {
    focusedElement,
    isKeyboardUser,
  };
}

// Skip links component
interface SkipLinksProps {
  links: SkipLink[];
  className?: string;
}

export const SkipLinks = React.forwardRef<HTMLElement, SkipLinksProps>(
  ({ links, className }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const handleSkipClick = (target: string) => {
      const element = document.querySelector(target) as HTMLElement;
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed top-0 left-0 z-[9999] bg-primary text-primary-foreground',
          !isVisible && 'sr-only',
          className
        )}
        aria-label="Skip navigation links"
      >
        <ul className="flex flex-wrap gap-2 p-2">
          {links.map(link => (
            <li key={link.id}>
              <button
                onClick={() => handleSkipClick(link.target)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                <SkipForward className="h-3 w-3" />
                {link.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
);
SkipLinks.displayName = 'SkipLinks';

// Focus indicator overlay
interface FocusIndicatorProps {
  className?: string;
}

export const FocusIndicator = React.forwardRef<HTMLDivElement, FocusIndicatorProps>(
  ({ className }, ref) => {
    const { focusedElement, isKeyboardUser } = useFocusIndicators();
    const [position, setPosition] = React.useState<DOMRect | null>(null);

    React.useEffect(() => {
      if (focusedElement && isKeyboardUser) {
        const updatePosition = () => {
          const rect = focusedElement.getBoundingClientRect();
          setPosition(rect);
        };

        updatePosition();

        const resizeObserver = new ResizeObserver(updatePosition);
        resizeObserver.observe(focusedElement);

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
          resizeObserver.disconnect();
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      } else {
        setPosition(null);
      }
    }, [focusedElement, isKeyboardUser]);

    if (!position || !isKeyboardUser) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed pointer-events-none z-[9998] border-2 border-primary rounded-md transition-all duration-150',
          className
        )}
        style={{
          top: position.top - 2,
          left: position.left - 2,
          width: position.width + 4,
          height: position.height + 4,
        }}
        aria-hidden="true"
      />
    );
  }
);
FocusIndicator.displayName = 'FocusIndicator';

// Keyboard shortcuts panel
interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const KeyboardShortcutsHelp = React.forwardRef<HTMLDivElement, KeyboardShortcutsHelpProps>(
  ({ shortcuts, isOpen, onClose, className }) => {
    const { containerRef } = useFocusTrap(isOpen);

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce(
      (groups, shortcut) => {
        const category = shortcut.category || 'General';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(shortcut);
        return groups;
      },
      {} as Record<string, KeyboardShortcut[]>
    );

    const formatShortcut = (shortcut: KeyboardShortcut) => {
      const parts = [];
      if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl');
      if (shortcut.modifiers?.includes('alt')) parts.push('Alt');
      if (shortcut.modifiers?.includes('shift')) parts.push('Shift');
      if (shortcut.modifiers?.includes('meta')) parts.push('Cmd');
      parts.push(shortcut.key.toUpperCase());
      return parts.join(' + ');
    };

    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-background border border-border rounded-lg shadow-lg overflow-hidden',
            className
          )}
          role="dialog"
          aria-labelledby="shortcuts-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close shortcuts help"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted-foreground/10 rounded border">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Escape</kbd> to
              close
            </p>
          </div>
        </div>
      </div>
    );
  }
);
KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';

// Focus management provider
interface FocusManagementProviderProps {
  children: React.ReactNode;
  skipLinks?: SkipLink[];
  shortcuts?: KeyboardShortcut[];
  enableFocusIndicator?: boolean;
  enableShortcutsHelp?: boolean;
}

export const FocusManagementProvider: React.FC<FocusManagementProviderProps> = ({
  children,
  skipLinks = [],
  shortcuts = [],
  enableFocusIndicator = true,
  enableShortcutsHelp = true,
}) => {
  const [showShortcutsHelp, setShowShortcutsHelp] = React.useState(false);

  // Add default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      id: 'show-shortcuts',
      key: '?',
      modifiers: ['shift'],
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
      category: 'General',
    },
    {
      id: 'close-shortcuts',
      key: 'Escape',
      description: 'Close shortcuts help',
      action: () => setShowShortcutsHelp(false),
      category: 'General',
    },
    ...shortcuts,
  ];

  // Use keyboard shortcuts
  useKeyboardShortcuts(defaultShortcuts);

  return (
    <>
      {/* Skip links */}
      {skipLinks.length > 0 && <SkipLinks links={skipLinks} />}

      {/* Focus indicator */}
      {enableFocusIndicator && <FocusIndicator />}

      {/* Main content */}
      {children}

      {/* Shortcuts help */}
      {enableShortcutsHelp && (
        <KeyboardShortcutsHelp
          shortcuts={defaultShortcuts}
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}
    </>
  );
};

// Utility function to create common skip links
export const createCommonSkipLinks = (): SkipLink[] => [
  {
    id: 'skip-to-main',
    text: 'Skip to main content',
    target: '#main-content',
    category: 'navigation',
  },
  {
    id: 'skip-to-nav',
    text: 'Skip to navigation',
    target: '#main-navigation',
    category: 'navigation',
  },
  {
    id: 'skip-to-footer',
    text: 'Skip to footer',
    target: '#footer',
    category: 'navigation',
  },
];

// Utility function to create common keyboard shortcuts
export const createCommonShortcuts = (): KeyboardShortcut[] => [
  {
    id: 'search',
    key: '/',
    description: 'Focus search',
    action: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLElement;
      searchInput?.focus();
    },
    category: 'Navigation',
  },
  {
    id: 'home',
    key: 'h',
    modifiers: ['alt'],
    description: 'Go to home page',
    action: () => (window.location.href = '/'),
    category: 'Navigation',
  },
];
