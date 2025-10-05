import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const TOUCH_BREAKPOINT = 1200;

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  viewport: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
}

// Enhanced mobile detection hook
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

// Comprehensive device information hook
export function useDeviceInfo(): DeviceInfo {
  // IMPORTANT: For hydration to match, the initial state MUST be identical on server and on the
  // very first client render. Do not read from `window` here. We'll update to real values in
  // a useEffect after hydration.
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    orientation: 'landscape',
    viewport: { width: 1920, height: 1080 },
    devicePixelRatio: 1,
  });

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDeviceInfo({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        orientation: width < height ? 'portrait' : 'landscape',
        viewport: { width, height },
        devicePixelRatio: window.devicePixelRatio || 1,
      });
    };

    // Use both resize and orientationchange events for better mobile support
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Initial update
    updateDeviceInfo();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint('xs');
      else if (width < MOBILE_BREAKPOINT) setBreakpoint('sm');
      else if (width < TABLET_BREAKPOINT) setBreakpoint('md');
      else if (width < TOUCH_BREAKPOINT) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    window.addEventListener('resize', updateBreakpoint);
    updateBreakpoint();

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for safe area insets (iOS notch support)
export function useSafeArea() {
  const [safeArea, setSafeArea] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  React.useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}
