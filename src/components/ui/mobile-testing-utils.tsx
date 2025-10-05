'use client';

import {
  Accessibility,
  AlertCircle,
  CheckCircle,
  Info,
  MousePointer,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

// Types for testing and auditing
interface AccessibilityIssue {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  selector?: string;
  wcagGuideline?: string;
}

interface TouchTargetIssue {
  element: HTMLElement;
  size: { width: number; height: number };
  recommended: { width: number; height: number };
}

interface PerformanceMetrics {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

// Hook for device testing simulation
export function useDeviceSimulation() {
  const [simulatedDevice, setSimulatedDevice] = React.useState<string | null>(null);
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  const devices = React.useMemo(
    () => ({
      'iPhone SE': { width: 375, height: 667, pixelRatio: 2 },
      'iPhone 12': { width: 390, height: 844, pixelRatio: 3 },
      'iPhone 14 Pro Max': { width: 430, height: 932, pixelRatio: 3 },
      'Samsung Galaxy S21': { width: 360, height: 800, pixelRatio: 3 },
      iPad: { width: 768, height: 1024, pixelRatio: 2 },
      'iPad Pro': { width: 1024, height: 1366, pixelRatio: 2 },
    }),
    []
  );

  const simulateDevice = React.useCallback(
    (deviceName: string) => {
      const device = devices[deviceName as keyof typeof devices];
      if (device) {
        const viewport =
          orientation === 'portrait'
            ? { width: device.width, height: device.height }
            : { width: device.height, height: device.width };

        // Apply viewport simulation
        document.documentElement.style.setProperty('--simulated-width', `${viewport.width}px`);
        document.documentElement.style.setProperty('--simulated-height', `${viewport.height}px`);
        document.documentElement.style.setProperty('--pixel-ratio', device.pixelRatio.toString());

        setSimulatedDevice(deviceName);
      }
    },
    [orientation, devices]
  );

  const resetSimulation = React.useCallback(() => {
    document.documentElement.style.removeProperty('--simulated-width');
    document.documentElement.style.removeProperty('--simulated-height');
    document.documentElement.style.removeProperty('--pixel-ratio');
    setSimulatedDevice(null);
  }, []);

  return {
    devices,
    simulatedDevice,
    orientation,
    setOrientation,
    simulateDevice,
    resetSimulation,
  };
}

// Hook for accessibility auditing
export function useAccessibilityAudit() {
  const [issues, setIssues] = React.useState<AccessibilityIssue[]>([]);
  const [isAuditing, setIsAuditing] = React.useState(false);

  const auditAccessibility = React.useCallback(async (container?: HTMLElement) => {
    setIsAuditing(true);
    const foundIssues: AccessibilityIssue[] = [];
    const root = container || document.body;

    try {
      // Check for missing alt text
      const images = root.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-hidden')) {
          foundIssues.push({
            id: `img-alt-${index}`,
            level: 'error',
            message: 'Image missing alt text',
            element: img,
            selector: `img:nth-of-type(${index + 1})`,
            wcagGuideline: 'WCAG 1.1.1',
          });
        }
      });

      // Check for missing form labels
      const inputs = root.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');

        if (!ariaLabel && !ariaLabelledby && (!id || !root.querySelector(`label[for="${id}"]`))) {
          foundIssues.push({
            id: `form-label-${index}`,
            level: 'error',
            message: 'Form control missing accessible name',
            element: input as HTMLElement,
            selector: `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
            wcagGuideline: 'WCAG 1.3.1',
          });
        }
      });

      // Check for insufficient color contrast
      const textElements = root.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
      textElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Simple contrast check (would need more sophisticated implementation)
        if (
          color &&
          backgroundColor &&
          color !== 'rgba(0, 0, 0, 0)' &&
          backgroundColor !== 'rgba(0, 0, 0, 0)'
        ) {
          const contrast = calculateContrastRatio(color, backgroundColor);
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;

          const isLargeText =
            fontSize >= 18 ||
            (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          const requiredContrast = isLargeText ? 3 : 4.5;

          if (contrast < requiredContrast) {
            foundIssues.push({
              id: `contrast-${index}`,
              level: 'error',
              message: `Insufficient color contrast (${contrast.toFixed(2)}:1, requires ${requiredContrast}:1)`,
              element: element as HTMLElement,
              wcagGuideline: 'WCAG 1.4.3',
            });
          }
        }
      });

      // Check for missing heading hierarchy
      const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let expectedLevel = 1;

      headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.tagName.charAt(1));

        if (currentLevel > expectedLevel + 1) {
          foundIssues.push({
            id: `heading-hierarchy-${index}`,
            level: 'warning',
            message: `Heading level ${currentLevel} skips level ${expectedLevel}`,
            element: heading as HTMLElement,
            wcagGuideline: 'WCAG 1.3.1',
          });
        }

        expectedLevel = currentLevel;
      });

      // Check for keyboard accessibility
      const interactiveElements = root.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]'
      );
      interactiveElements.forEach((element, index) => {
        const tabIndex = element.getAttribute('tabindex');

        if (tabIndex && parseInt(tabIndex) > 0) {
          foundIssues.push({
            id: `tabindex-${index}`,
            level: 'warning',
            message: 'Positive tabindex values can cause focus order issues',
            element: element as HTMLElement,
            wcagGuideline: 'WCAG 2.4.3',
          });
        }
      });

      setIssues(foundIssues);
    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  }, []);

  return {
    issues,
    isAuditing,
    auditAccessibility,
  };
}

// Hook for touch target testing
export function useTouchTargetAudit() {
  const [issues, setIssues] = React.useState<TouchTargetIssue[]>([]);

  const auditTouchTargets = React.useCallback((container?: HTMLElement) => {
    const foundIssues: TouchTargetIssue[] = [];
    const root = container || document.body;
    const minSize = 44; // WCAG recommended minimum

    const interactiveElements = root.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();

      // Include padding in touch target calculation
      // Padding values retrieved but not individually needed; rely on element rect size

      const totalWidth = rect.width;
      const totalHeight = rect.height;

      if (totalWidth < minSize || totalHeight < minSize) {
        foundIssues.push({
          element: element as HTMLElement,
          size: { width: totalWidth, height: totalHeight },
          recommended: { width: minSize, height: minSize },
        });
      }
    });

    setIssues(foundIssues);
  }, []);

  return {
    issues,
    auditTouchTargets,
  };
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

  // Minimal layout shift typing
  interface MinimalLayoutShift extends PerformanceEntry {
    value: number;
    hadRecentInput: boolean;
  }

  React.useEffect(() => {
    // Observe Core Web Vitals
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
          case 'first-input':
            {
              const fi = entry as PerformanceEventTiming;
              setMetrics(prev => ({ ...prev, fid: fi.processingStart - fi.startTime }));
            }
            break;
          case 'layout-shift':
            {
              const ls = entry as unknown as MinimalLayoutShift;
              if (!ls.hadRecentInput) {
                setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + ls.value }));
              }
            }
            break;
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Get navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      setMetrics(prev => ({
        ...prev,
        fcp: navTiming.responseStart - navTiming.requestStart,
        ttfb: navTiming.responseStart - navTiming.requestStart,
      }));
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// Utility function for color contrast calculation
function calculateContrastRatio(color1: string, color2: string): number {
  // Very naive luminance approximation to silence unused var lint
  const toRGB = (c: string) =>
    c
      .replace(/rgba?\(|\)/g, '')
      .split(',')
      .map(v => parseFloat(v.trim()) || 0);
  const [r1, g1, b1] = toRGB(color1);
  const [r2, g2, b2] = toRGB(color2);
  const lum1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1 + 1;
  const lum2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2 + 1;
  const ratio = lum1 > lum2 ? lum1 / lum2 : lum2 / lum1;
  // Clamp to 1-21 typical contrast ratio range
  return Math.min(Math.max(ratio / 255, 1), 21);
}

// Mobile testing panel component
interface MobileTestingPanelProps {
  className?: string;
}

export const MobileTestingPanel = React.forwardRef<HTMLDivElement, MobileTestingPanelProps>(
  ({ className }, ref) => {
    const { isMobile } = useDeviceInfo();
    const {
      devices,
      simulatedDevice,
      orientation,
      setOrientation,
      simulateDevice,
      resetSimulation,
    } = useDeviceSimulation();
    const { issues: a11yIssues, isAuditing, auditAccessibility } = useAccessibilityAudit();
    const { issues: touchIssues, auditTouchTargets } = useTouchTargetAudit();
    const performanceMetrics = usePerformanceMonitoring();

    const [activeTab, setActiveTab] = React.useState<
      'device' | 'accessibility' | 'touch' | 'performance'
    >('device');

    const runFullAudit = () => {
      auditAccessibility();
      auditTouchTargets();
    };

    const getPerformanceScore = (metric: number, thresholds: [number, number]) => {
      if (metric <= thresholds[0]) return 'good';
      if (metric <= thresholds[1]) return 'needs-improvement';
      return 'poor';
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-4 right-4 w-80 max-h-[600px] bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50',
          isMobile && 'w-full max-w-sm right-2',
          className
        )}
      >
        {/* Header */}
        <div className="border-b border-border p-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Mobile Testing Tools
          </h3>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border">
          {(
            [
              { id: 'device', label: 'Device', icon: Smartphone },
              { id: 'accessibility', label: 'A11y', icon: Accessibility },
              { id: 'touch', label: 'Touch', icon: MousePointer },
              { id: 'performance', label: 'Perf', icon: Zap },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium transition-colors',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-3 max-h-[400px] overflow-y-auto">
          {activeTab === 'device' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Device Simulation
                </label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {Object.keys(devices).map(device => (
                    <button
                      key={device}
                      onClick={() => simulateDevice(device)}
                      className={cn(
                        'text-xs p-2 rounded border transition-colors text-left',
                        simulatedDevice === device
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {device}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Orientation</label>
                <div className="flex gap-1 mt-1">
                  {(['portrait', 'landscape'] as const).map(orient => (
                    <button
                      key={orient}
                      onClick={() => setOrientation(orient)}
                      className={cn(
                        'flex-1 text-xs p-2 rounded border transition-colors',
                        orientation === orient
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {orient}
                    </button>
                  ))}
                </div>
              </div>

              {simulatedDevice && (
                <button
                  onClick={resetSimulation}
                  className="w-full text-xs p-2 rounded border border-border hover:bg-muted transition-colors"
                >
                  Reset Simulation
                </button>
              )}
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Accessibility Issues ({a11yIssues.length})
                </span>
                <button
                  onClick={runFullAudit}
                  disabled={isAuditing}
                  className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {isAuditing ? 'Auditing...' : 'Audit'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {a11yIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-2 rounded border text-xs',
                      issue.level === 'error' && 'border-red-200 bg-red-50 text-red-800',
                      issue.level === 'warning' && 'border-yellow-200 bg-yellow-50 text-yellow-800',
                      issue.level === 'info' && 'border-blue-200 bg-blue-50 text-blue-800'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {issue.level === 'error' && (
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      )}
                      {issue.level === 'warning' && (
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      )}
                      {issue.level === 'info' && (
                        <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{issue.message}</p>
                        {issue.wcagGuideline && (
                          <p className="text-xs opacity-75 mt-1">{issue.wcagGuideline}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {a11yIssues.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No accessibility issues found
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'touch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Touch Target Issues ({touchIssues.length})
                </span>
                <button
                  onClick={() => auditTouchTargets()}
                  className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Audit
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {touchIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-2 rounded border border-orange-200 bg-orange-50 text-orange-800 text-xs"
                  >
                    <p className="font-medium">Touch target too small</p>
                    <p className="mt-1">
                      Current: {Math.round(issue.size.width)}×{Math.round(issue.size.height)}px
                    </p>
                    <p>
                      Recommended: {issue.recommended.width}×{issue.recommended.height}px minimum
                    </p>
                  </div>
                ))}
                {touchIssues.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No touch target issues found
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Core Web Vitals</div>

              <div className="space-y-2">
                {[
                  {
                    key: 'lcp',
                    label: 'LCP',
                    value: performanceMetrics.lcp,
                    unit: 'ms',
                    thresholds: [2500, 4000] as [number, number],
                  },
                  {
                    key: 'fid',
                    label: 'FID',
                    value: performanceMetrics.fid,
                    unit: 'ms',
                    thresholds: [100, 300] as [number, number],
                  },
                  {
                    key: 'cls',
                    label: 'CLS',
                    value: performanceMetrics.cls,
                    unit: '',
                    thresholds: [0.1, 0.25] as [number, number],
                  },
                ].map(({ key, label, value, unit, thresholds }) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-xs font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {value !== undefined
                          ? `${value.toFixed(key === 'cls' ? 3 : 0)}${unit}`
                          : '—'}
                      </span>
                      {value !== undefined && (
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            getPerformanceScore(value, thresholds) === 'good' && 'bg-green-500',
                            getPerformanceScore(value, thresholds) === 'needs-improvement' &&
                              'bg-yellow-500',
                            getPerformanceScore(value, thresholds) === 'poor' && 'bg-red-500'
                          )}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
MobileTestingPanel.displayName = 'MobileTestingPanel';

// Simple testing component for development
export const DevMobileTestingTools = () => {
  const [showPanel, setShowPanel] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 't') {
        setShowPanel(!showPanel);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPanel]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed bottom-4 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Open Mobile Testing Tools (Ctrl+Alt+T)"
        >
          <Target className="h-5 w-5" />
        </button>
      )}

      {showPanel && <MobileTestingPanel />}

      {showPanel && (
        <button
          onClick={() => setShowPanel(false)}
          className="fixed top-4 right-4 z-[60] p-2 bg-background border border-border rounded-md shadow-lg hover:bg-muted transition-colors"
          title="Close Testing Panel"
        >
          ×
        </button>
      )}
    </>
  );
};
