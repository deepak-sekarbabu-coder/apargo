'use client';

import { Download, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

const logger = getLogger('Component');

// Types for PWA events
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Hook for PWA installation
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isAppInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-expect-error iOS Safari specific property
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      setIsInstalled(isAppInstalled);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error installing app:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}

// Hook for online/offline status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [connectionType, setConnectionType] = React.useState<string>('unknown');

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      // Minimal connection type (browser support varies)
      interface NavigatorConnection {
        effectiveType?: string;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      }
      const navObj = navigator as unknown as {
        connection?: NavigatorConnection;
        mozConnection?: NavigatorConnection;
        webkitConnection?: NavigatorConnection;
      };
      const connection: NavigatorConnection | undefined =
        navObj.connection || navObj.mozConnection || navObj.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    // Initial status
    updateOnlineStatus();
    updateConnectionType();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const navObj = navigator as unknown as {
      connection?: {
        addEventListener?: (t: string, l: () => void) => void;
        removeEventListener?: (t: string, l: () => void) => void;
      };
      mozConnection?: {
        addEventListener?: (t: string, l: () => void) => void;
        removeEventListener?: (t: string, l: () => void) => void;
      };
      webkitConnection?: {
        addEventListener?: (t: string, l: () => void) => void;
        removeEventListener?: (t: string, l: () => void) => void;
      };
    };
    const connection = navObj.connection || navObj.mozConnection || navObj.webkitConnection;
    connection?.addEventListener?.('change', updateConnectionType);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      connection?.removeEventListener?.('change', updateConnectionType);
    };
  }, []);

  return { isOnline, connectionType };
}

// Hook for service worker management
export function useServiceWorker() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          setIsRegistered(true);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => {
          logger.error('Service worker registration failed:', error);
        });

      // Listen for controlling worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const updateServiceWorker = async () => {
    if (registration && updateAvailable) {
      const newWorker = registration.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  };

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    updateServiceWorker,
  };
}

// Install prompt component
interface PWAInstallPromptProps {
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt = React.forwardRef<HTMLDivElement, PWAInstallPromptProps>(
  ({ className, onInstall, onDismiss }, ref) => {
    const { isInstallable, installApp } = usePWAInstall();
    const { isMobile } = useDeviceInfo();
    const [isDismissed, setIsDismissed] = React.useState(false);

    const handleInstall = async () => {
      const success = await installApp();
      if (success) {
        onInstall?.();
      }
    };

    const handleDismiss = () => {
      setIsDismissed(true);
      onDismiss?.();
    };

    if (!isInstallable || isDismissed) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-background border border-border shadow-lg p-4',
          'md:left-auto md:right-4 md:w-80',
          className
        )}
        role="dialog"
        aria-labelledby="pwa-install-title"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 id="pwa-install-title" className="font-semibold text-sm">
              Install App
            </h3>
            <p className="text-sm text-muted-foreground">
              {isMobile
                ? 'Add to your home screen for quick access and offline use.'
                : 'Install this app for a better experience with offline access.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
              >
                <Download className="h-4 w-4" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md touch-manipulation"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PWAInstallPrompt.displayName = 'PWAInstallPrompt';

// Network status indicator
interface NetworkStatusIndicatorProps {
  showConnectionType?: boolean;
  className?: string;
}

export const NetworkStatusIndicator = React.forwardRef<HTMLDivElement, NetworkStatusIndicatorProps>(
  ({ showConnectionType = false, className }, ref) => {
    const { isOnline, connectionType } = useNetworkStatus();
    const [showOfflineMessage, setShowOfflineMessage] = React.useState(false);

    React.useEffect(() => {
      if (!isOnline) {
        setShowOfflineMessage(true);
        const timer = setTimeout(() => setShowOfflineMessage(false), 5000);
        return () => clearTimeout(timer);
      }
    }, [isOnline]);

    if (isOnline && !showConnectionType) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg px-3 py-2 text-sm font-medium shadow-lg transition-all',
          isOnline
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200',
          !isOnline && showOfflineMessage ? 'translate-y-0 opacity-100' : '',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span>
            {isOnline
              ? showConnectionType
                ? `Online (${connectionType})`
                : 'Online'
              : 'You are offline'}
          </span>
        </div>
      </div>
    );
  }
);
NetworkStatusIndicator.displayName = 'NetworkStatusIndicator';

// Service worker update prompt
interface ServiceWorkerUpdatePromptProps {
  className?: string;
  onUpdate?: () => void;
}

export const ServiceWorkerUpdatePrompt = React.forwardRef<
  HTMLDivElement,
  ServiceWorkerUpdatePromptProps
>(({ className, onUpdate }, ref) => {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await updateServiceWorker();
    onUpdate?.();
  };

  if (!updateAvailable) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-blue-50 border border-blue-200 p-4',
        'md:left-auto md:right-4 md:w-80',
        className
      )}
      role="dialog"
      aria-labelledby="update-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
          <RefreshCw className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 id="update-title" className="font-semibold text-sm text-blue-900">
            App Update Available
          </h3>
          <p className="text-sm text-blue-800">
            A new version of the app is available with improvements and bug fixes.
          </p>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 touch-manipulation"
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isUpdating ? 'Updating...' : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
});
ServiceWorkerUpdatePrompt.displayName = 'ServiceWorkerUpdatePrompt';

// PWA provider component
interface PWAProviderProps {
  children: React.ReactNode;
  enableInstallPrompt?: boolean;
  enableUpdatePrompt?: boolean;
  enableNetworkIndicator?: boolean;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({
  children,
  enableInstallPrompt = true,
  enableUpdatePrompt = true,
  enableNetworkIndicator = true,
}) => {
  return (
    <>
      {children}
      {enableInstallPrompt && <PWAInstallPrompt />}
      {enableUpdatePrompt && <ServiceWorkerUpdatePrompt />}
      {enableNetworkIndicator && <NetworkStatusIndicator />}
    </>
  );
};

// Utility function to create basic service worker
export const generateServiceWorkerCode = () => {
  return `
// Basic Service Worker for PWA
const CACHE_NAME = 'app-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
};

// Utility function to create manifest.json
export const generateManifestData = (appName: string, appDescription: string) => {
  return {
    name: appName,
    short_name: appName,
    description: appDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity'],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
  };
};
