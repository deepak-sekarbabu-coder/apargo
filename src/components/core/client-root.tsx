'use client';

import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import React, { useEffect } from 'react';

// Ensure mobile alert override runs early on client initialization
import '@/lib/monitoring/override-alert.client';

import { FirebaseDebugPanel } from '@/components/debug/firebase-debug-panel';
import { NotificationSystemTest } from '@/components/debug/notification-system-test';
import { PollLoginNotification } from '@/components/notifications/poll-login-notification';
import ServiceWorkerRegister from '@/components/ui/service-worker-register';
import { ToastProvider } from '@/components/ui/toast-provider';

// Create a shared QueryClient instance for the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      // cacheTime should be set on individual queries if needed; remove global cacheTime to satisfy types
      refetchOnWindowFocus: false,
    },
  },
});

type Props = {
  children: React.ReactNode;
};

// Utility to clean up browser extension attributes that cause hydration mismatches
function useBrowserExtensionCleanup() {
  useEffect(() => {
    // List of attributes commonly injected by browser extensions
    const extensionAttributes = [
      'bis_skin_checked',
      'data-new-gr-c-s-check-loaded',
      'data-gr-ext-installed',
      'data-new-gr-c-s-loaded',
      'grammarly-extension',
      'data-lt-installed',
    ];

    const cleanupAttributes = () => {
      // Find all elements with extension attributes
      extensionAttributes.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`);
        elements.forEach(element => {
          element.removeAttribute(attr);
        });
      });
    };

    // Clean up immediately after hydration
    cleanupAttributes();

    // Set up a mutation observer to clean up any dynamically added extension attributes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          const attributeName = mutation.attributeName;
          if (attributeName && extensionAttributes.includes(attributeName)) {
            target.removeAttribute(attributeName);
          }
        }
        // Also clean up any newly added nodes
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              extensionAttributes.forEach(attr => {
                if (element.hasAttribute(attr)) {
                  element.removeAttribute(attr);
                }
                // Also check child elements
                const childElements = element.querySelectorAll(`[${attr}]`);
                childElements.forEach(child => child.removeAttribute(attr));
              });
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: extensionAttributes,
    });

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);
}

export default function ClientRoot({ children }: Props) {
  // Clean up browser extension attributes to prevent hydration mismatches
  useBrowserExtensionCleanup();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
            <PollLoginNotification />
            <ServiceWorkerRegister />
            {/* Debug components - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 right-4 flex gap-2 z-50">
                <FirebaseDebugPanel />
                <NotificationSystemTest />
              </div>
            )}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
