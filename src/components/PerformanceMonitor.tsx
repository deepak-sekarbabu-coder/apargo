'use client';

/**
 * Performance Monitoring Component
 * Tracks Web Vitals and provides performance insights
 */
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetric?: (metric: { name: string; value: number; rating: string }) => void;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  onMetric,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleMetric = (metric: { name: string; value: number; rating: string }) => {
      const { name, value, rating } = metric;

      setMetrics(prev => ({
        ...prev,
        [name.toLowerCase()]: value,
      }));

      // Call custom handler if provided
      onMetric?.({ name, value, rating });

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance Metric - ${name}: ${value} (${rating})`);
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // You can send to your analytics service here
        // Example: gtag('event', 'web_vitals', { metric_name: name, metric_value: value });
      }
    };

    // Collect Web Vitals
    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Show monitor in development after 2 seconds
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, [enabled, onMetric]);

  const getRating = (metricName: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      cls: { good: 0.1, poor: 0.25 },
      fid: { good: 100, poor: 300 },
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const formatValue = (metricName: string, value: number): string => {
    if (metricName === 'cls') {
      return value.toFixed(3);
    }
    return Math.round(value).toString();
  };

  const getUnit = (metricName: string): string => {
    if (metricName === 'cls') return '';
    return 'ms';
  };

  // Don't render anything if disabled or no metrics
  if (!enabled || !isVisible || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        {Object.entries(metrics).map(([name, value]) => {
          const rating = getRating(name, value);
          const formattedValue = formatValue(name, value);
          const unit = getUnit(name);

          return (
            <div key={name} className="flex justify-between items-center text-xs">
              <span className="uppercase font-mono">{name}:</span>
              <span
                className={`font-mono ${
                  rating === 'good'
                    ? 'text-green-400'
                    : rating === 'needs-improvement'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {formattedValue}
                {unit}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400">Press F12 → Lighthouse for detailed analysis</div>
      </div>
    </div>
  );
}

// Hook for programmatic access to metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const handleMetric = (metric: { name: string; value: number }) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value,
      }));
    };

    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }, []);

  return metrics;
}

// Performance utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string) => {
    if (process.env.NODE_ENV !== 'development') return { start: () => {}, end: () => {} };

    let startTime: number;

    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const duration = performance.now() - startTime;
        if (duration > 16) {
          // Slower than 60fps
          console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
      },
    };
  },

  // Mark critical user timing
  markUserTiming: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure user timing between marks
  measureUserTiming: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        const latest = entries[entries.length - 1];
        console.log(`${name}: ${latest?.duration?.toFixed(2)}ms`);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  },
};
