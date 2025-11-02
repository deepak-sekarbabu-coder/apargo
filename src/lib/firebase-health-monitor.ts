/**
 * Firebase Connection Health Monitor
 * Monitors Firestore connection health and provides diagnostics
 */
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, limit, onSnapshot, query } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export interface ConnectionHealth {
    isConnected: boolean;
    lastSuccessfulOperation: Date | null;
    errorCount: number;
    lastError: Error | null;
    connectionType: 'websocket' | 'long-polling' | 'unknown';
}

export class FirebaseHealthMonitor {
    private static instance: FirebaseHealthMonitor;
    private health: ConnectionHealth = {
        isConnected: false,
        lastSuccessfulOperation: null,
        errorCount: 0,
        lastError: null,
        connectionType: 'unknown',
    };
    private listeners: ((health: ConnectionHealth) => void)[] = [];
    private testUnsubscribe?: () => void;
    private healthCheckInterval?: NodeJS.Timeout;
    private authUnsubscribe?: () => void;

    private constructor() {
        this.startHealthCheck();
        this.setupAuthListener();
    }

    static getInstance(): FirebaseHealthMonitor {
        if (!FirebaseHealthMonitor.instance) {
            FirebaseHealthMonitor.instance = new FirebaseHealthMonitor();
        }
        return FirebaseHealthMonitor.instance;
    }

    getHealth(): ConnectionHealth {
        return { ...this.health };
    }

    onHealthChange(callback: (health: ConnectionHealth) => void): () => void {
        this.listeners.push(callback);
        // Immediately call with current health
        callback(this.getHealth());

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private setupAuthListener(): void {
        this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User signed in, start health checks
                this.performHealthCheck();
            } else {
                // User signed out, clean up and mark as disconnected
                if (this.testUnsubscribe) {
                    this.testUnsubscribe();
                    this.testUnsubscribe = undefined;
                }
                this.updateHealth({
                    isConnected: false,
                    lastSuccessfulOperation: null,
                    errorCount: 0,
                    lastError: new Error('User signed out'),
                });
            }
        });
    }

    private startHealthCheck(): void {
        // Only run health checks in development mode
        if (process.env.NODE_ENV !== 'development') {
            this.updateHealth({
                isConnected: true,
                lastSuccessfulOperation: new Date(),
                errorCount: 0,
                lastError: null,
                connectionType: 'long-polling',
            });
            return;
        }

        // Test connection every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);

        // Initial health check (will be skipped if not authenticated)
        this.performHealthCheck();
    }

    private handleUnauthenticatedHealthCheck(): void {
        this.updateHealth({
            isConnected: false,
            lastSuccessfulOperation: null,
            errorCount: 0,
            lastError: null, // Don't show error for unauthenticated state
        });
    }

    private handleSuccessfulHealthCheck(): void {
        this.updateHealth({
            isConnected: true,
            lastSuccessfulOperation: new Date(),
            errorCount: 0,
            lastError: null,
        });

        // Test real-time listener if not already active
        if (!this.testUnsubscribe) {
            this.setupTestListener();
        }
    }

    private handleHealthCheckError(error: unknown): void {
        // Handle permission errors more gracefully
        const isPermissionError = (error as any)?.code === 'permission-denied';

        if (isPermissionError) {
            // Silently handle permission errors for unauthenticated users
            this.updateHealth({
                isConnected: false,
                errorCount: 0, // Don't count permission errors
                lastError: null, // Don't show permission errors to user
            });
        } else {
            console.error('Firebase health check failed:', error);
            this.updateHealth({
                isConnected: false,
                errorCount: this.health.errorCount + 1,
                lastError: error as Error,
            });
        }
    }

    private async performHealthCheck(): Promise<void> {
        // Skip health check if user is not authenticated
        if (!auth.currentUser) {
            this.handleUnauthenticatedHealthCheck();
            return;
        }

        try {
            // Test basic read operation on notifications collection (which authenticated user has access to)
            const testQuery = query(collection(db, 'notifications'), limit(1));
            await getDocs(testQuery);

            this.handleSuccessfulHealthCheck();
        } catch (error) {
            this.handleHealthCheckError(error);
        }
    }

    private handleTestListenerSuccess = () => {
        this.updateHealth({
            isConnected: true,
            lastSuccessfulOperation: new Date(),
            connectionType: this.detectConnectionType(),
        });
    };

    private handleTestListenerError = (error: any) => {
        const isPermissionError = error?.code === 'permission-denied';

        if (!isPermissionError) {
            console.error('Firebase test listener error:', error);
        }

        this.updateHealth({
            isConnected: false,
            errorCount: this.health.errorCount + 1,
            lastError: error,
        });

        // Clean up failed listener
        if (this.testUnsubscribe) {
            this.testUnsubscribe();
            this.testUnsubscribe = undefined;
        }
    };

    private setupTestListener(): void {
        // Skip listener setup if user is not authenticated
        if (!auth.currentUser) {
            return;
        }

        try {
            // Use notifications collection for test listener (authenticated user has access)
            const testQuery = query(collection(db, 'notifications'), limit(1));

            this.testUnsubscribe = onSnapshot(
                testQuery,
                this.handleTestListenerSuccess,
                this.handleTestListenerError
            );
        } catch (error) {
            console.error('Failed to setup test listener:', error);
            this.updateHealth({
                isConnected: false,
                errorCount: this.health.errorCount + 1,
                lastError: error as Error,
            });
        }
    }

    private detectConnectionType(): 'websocket' | 'long-polling' | 'unknown' {
        // Try to detect connection type from network requests
        // This is a best-effort detection
        if (typeof window !== 'undefined' && window.performance) {
            const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const firestoreEntries = entries.filter(entry =>
                entry.name.includes('firestore.googleapis.com')
            );

            const recentEntry = firestoreEntries[firestoreEntries.length - 1];
            if (recentEntry) {
                // Check for WebSocket characteristics
                if (recentEntry.name.includes('websocket') || recentEntry.transferSize === 0) {
                    return 'websocket';
                }
                // Long polling typically has larger transfer sizes
                if (recentEntry.transferSize > 1000) {
                    return 'long-polling';
                }
            }
        }

        return 'unknown';
    }

    private updateHealth(updates: Partial<ConnectionHealth>): void {
        this.health = { ...this.health, ...updates };
        this.notifyListeners();
    }

    private notifyListeners(): void {
        const currentHealth = this.getHealth();
        this.listeners.forEach(listener => {
            try {
                listener(currentHealth);
            } catch (error) {
                console.error('Error in health monitor listener:', error);
            }
        });
    }

    destroy(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        if (this.testUnsubscribe) {
            this.testUnsubscribe();
        }

        if (this.authUnsubscribe) {
            this.authUnsubscribe();
        }

        this.listeners = [];
    }
}

// Diagnostic utilities
export const diagnostics = {
    // Check if QUIC is being used
    isQuicEnabled: (): boolean => {
        if (typeof window === 'undefined') return false;

        // Check for HTTP/3 or QUIC indicators
        const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries.some(entry =>
            entry.name.includes('firestore.googleapis.com') &&
            (entry as any).nextHopProtocol?.includes('h3')
        );
    },

    // Get network information
    getNetworkInfo: () => {
        if (typeof window === 'undefined' || !('navigator' in window)) {
            return { type: 'unknown', effectiveType: 'unknown' };
        }

        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

        return {
            type: connection?.type || 'unknown',
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 'unknown',
            rtt: connection?.rtt || 'unknown',
        };
    },

    // Check for proxy or corporate firewall
    detectProxyOrFirewall: async (): Promise<boolean> => {
        try {
            // Test direct connection to Firebase
            await fetch('https://firestore.googleapis.com/', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return false; // Direct connection successful
        } catch (error) {
            // Connection blocked or modified
            return true;
        }
    },

    // Collect diagnostic data
    collectDiagnosticData: async () => {
        const health = FirebaseHealthMonitor.getInstance().getHealth();
        const networkInfo = diagnostics.getNetworkInfo();
        const isQuic = diagnostics.isQuicEnabled();
        const hasProxy = await diagnostics.detectProxyOrFirewall();

        return {
            health,
            networkInfo,
            isQuic,
            hasProxy,
        };
    },

    // Format diagnostic report
    formatReport: (data: Awaited<ReturnType<typeof diagnostics.collectDiagnosticData>>): string => {
        const { health, networkInfo, isQuic, hasProxy } = data;

        return `
    },
    },

    // Generate diagnostic report
    generateReport: async (): Promise<string> => {
        const data = await diagnostics.collectDiagnosticData();
        return diagnostics.formatReport(data);
Firebase Connection Diagnostic Report
=====================================
Connection Status: ${health.isConnected ? 'Connected' : 'Disconnected'}
Last Successful Operation: ${health.lastSuccessfulOperation?.toISOString() || 'Never'}
Error Count: ${health.errorCount}
Last Error: ${health.lastError?.message || 'None'}
Connection Type: ${health.connectionType}

Network Information:
- Type: ${networkInfo.type}
- Effective Type: ${networkInfo.effectiveType}
- Downlink: ${networkInfo.downlink}
- RTT: ${networkInfo.rtt}

Protocol Information:
- QUIC/HTTP3 Detected: ${isQuic}
- Proxy/Firewall Detected: ${hasProxy}

User Agent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}
Timestamp: ${new Date().toISOString()}
    `.trim();
    },
};

// Export singleton instance
export const healthMonitor = FirebaseHealthMonitor.getInstance();