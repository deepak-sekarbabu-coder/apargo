export const useIsMobile = jest.fn(() => false);
export const useDeviceInfo = jest.fn(() => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouchDevice: false,
  orientation: 'landscape',
  viewport: { width: 1024, height: 768 },
  devicePixelRatio: 1,
}));
export const useBreakpoint = jest.fn(() => 'lg');
export const useSafeArea = jest.fn(() => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}));
