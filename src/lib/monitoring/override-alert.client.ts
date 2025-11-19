// Client-only module to gracefully replace native window.alert on mobile
// devices with the app's toast UI. This ensures any stray alert() calls
// (legacy code, third-party libs, or unexpected errors) surface as
// accessible, responsive toasts instead of blocking native dialogs.
import { toast } from '@/hooks/use-toast';

// Define a custom window type to avoid using 'any'
interface CustomWindow extends Window {
  __originalAlert?: (message?: string) => void;
}

// Guard: only run in browser
if (typeof window !== 'undefined') {
  try {
    const customWindow = window as CustomWindow;

    // Preserve original for fallback and debugging
    if (
      !('__originalAlert' in customWindow) ||
      typeof customWindow.__originalAlert !== 'function'
    ) {
      // Store original alert
      customWindow.__originalAlert = window.alert.bind(window);
    }

    // Mobile detection: keep this conservative so desktop behavior remains unchanged
    const isMobile =
      (typeof window.innerWidth === 'number' && window.innerWidth < 768) ||
      'ontouchstart' in window ||
      (navigator && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);

    if (isMobile) {
      // Replace native alert with toast-based UI message on mobile
      window.alert = (message?: string | object | null) => {
        try {
          const description =
            message === undefined || message === null
              ? ''
              : typeof message === 'string'
                ? message
                : typeof message === 'object'
                  ? JSON.stringify(message)
                  : String(message);

          toast({
            title: 'Error',
            description,
            variant: 'destructive',
          });
        } catch {
          // Fallback to original native alert if toast fails for any reason
          customWindow.__originalAlert?.(String(message));
        }
      };
    }
  } catch (err) {
    // No-op on any unexpected error to avoid breaking the app
    console.warn('override-alert: failed to initialize mobile alert override', err);
  }
}
