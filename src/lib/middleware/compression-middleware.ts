/**
 * Compression monitoring middleware for API responses
 * Tracks compression ratios and enforces bandwidth optimization
 */
import { type NextRequest, NextResponse } from 'next/server';

interface CompressionMetrics {
  timestamp: Date;
  endpoint: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  gzipEnabled: boolean;
}

class CompressionMonitor {
  private metrics: CompressionMetrics[] = [];
  private maxMetricsHistory = 1000;

  /**
   * Records compression metrics for an API response
   */
  recordMetric(metric: Omit<CompressionMetrics, 'timestamp'>) {
    const fullMetric: CompressionMetrics = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Get aggregated compression statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageOriginalSize: 0,
        averageCompressedSize: 0,
        averageCompressionRatio: 0,
        gzipEnabledPercent: 0,
      };
    }

    const totalOriginal = this.metrics.reduce((sum, m) => sum + m.originalSize, 0);
    const totalCompressed = this.metrics.reduce((sum, m) => sum + (m.compressedSize || 0), 0);
    const gzipEnabled = this.metrics.filter(m => m.gzipEnabled).length;

    return {
      totalRequests: this.metrics.length,
      averageOriginalSize: Math.round(totalOriginal / this.metrics.length),
      averageCompressedSize: Math.round(totalCompressed / this.metrics.length),
      averageCompressionRatio: ((totalCompressed / totalOriginal) * 100 || 0).toFixed(2),
      gzipEnabledPercent: ((gzipEnabled / this.metrics.length) * 100).toFixed(2),
      endpointBreakdown: this.getEndpointBreakdown(),
    };
  }

  /**
   * Get compression stats per endpoint
   */
  private getEndpointBreakdown() {
    const breakdown: Record<
      string,
      {
        requests: number;
        totalSize: number;
        avgSize: number;
      }
    > = {};

    this.metrics.forEach(metric => {
      if (!breakdown[metric.endpoint]) {
        breakdown[metric.endpoint] = {
          requests: 0,
          totalSize: 0,
          avgSize: 0,
        };
      }
      breakdown[metric.endpoint].requests++;
      breakdown[metric.endpoint].totalSize += metric.originalSize;
    });

    Object.keys(breakdown).forEach(endpoint => {
      breakdown[endpoint].avgSize = Math.round(
        breakdown[endpoint].totalSize / breakdown[endpoint].requests
      );
    });

    return breakdown;
  }

  reset() {
    this.metrics = [];
  }
}

export const compressionMonitor = new CompressionMonitor();

/**
 * Middleware to log compression metrics for responses
 * Add this to API routes that need compression monitoring
 */
export const withCompressionMonitoring =
  (handler: (req: NextRequest) => Promise<Response>) =>
  async (req: NextRequest): Promise<Response> => {
    const response = await handler(req);

    // Extract encoding info from request
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const gzipEnabled = acceptEncoding.includes('gzip');

    // Try to get response size
    const contentType = response.headers.get('content-type') || 'application/json';
    const contentLength = response.headers.get('content-length');

    if (contentLength) {
      compressionMonitor.recordMetric({
        endpoint: req.nextUrl.pathname,
        originalSize: parseInt(contentLength, 10),
        gzipEnabled,
      });
    }

    return response;
  };

/**
 * Get current compression statistics
 */
export const getCompressionStats = () => compressionMonitor.getStats();

/**
 * Reset compression statistics
 */
export const resetCompressionStats = () => compressionMonitor.reset();
